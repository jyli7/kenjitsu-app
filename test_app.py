from __future__ import annotations

import asyncio
import importlib.util
import json
import os
import re
import tempfile
import unittest
from pathlib import Path

import httpx

spec = importlib.util.spec_from_file_location('kenjitsu_app', Path(__file__).with_name('app.py'))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

FLAW = {'prompt': 'Which step is wrong?', 'rubric': 'Step 2 confuses keys.',
        'exhibit': {'title': 'A proof', 'steps': ['a', 'b', 'c']}, 'flaw_step': 2}


def question(kind):
    if kind == 'flaw':
        return FLAW
    return {'prompt': f'{kind} question', 'rubric': f'{kind} key', 'targets': 'the gap'}


def grade(score, pushback=None):
    return {'score': score, 'verdict': 'solid', 'feedback': 'Direct "and" plain.',
            'jargon': ['synergy'], 'missed': ['mechanism'], 'pushback': pushback,
            'concept': 'c', 'model_answer': 'Strong answer.'}


PLAN = {'focuses': [{'title': f'Focus {n}', 'angle': f'Angle {n}.', 'level': 1 + n % 3}
                    for n in range(1, 6)],
        'related': [{'topic': 'Something adjacent', 'why': 'Contrast.', 'module': None},
                    {'topic': 'ignored title', 'why': 'Same family.', 'module': 'cap-theorem'},
                    {'topic': 'Made up', 'why': 'x', 'module': 'not-a-module'}]}


def sse(content):
    # Split into small deltas, as OpenRouter streams them.
    chunks = [content[i:i + 7] for i in range(0, len(content), 7)]
    lines = [': OPENROUTER PROCESSING']
    lines += [f"data: {json.dumps({'choices': [{'delta': {'content': c}}]})}" for c in chunks]
    return '\n\n'.join(lines + ['data: [DONE]']) + '\n\n'


class KenjitsuTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        os.environ['KENJITSU_DATA'] = self.tmp.name
        os.environ['KENJITSU_OPENROUTER_API_KEY'] = 'test'
        os.environ.pop('VIBEBOX_TELEMETRY_API_KEY', None)
        mod.calls.clear()
        mod.prefetching.clear()
        mod.drafts.clear()
        mod.subject_tasks.clear()
        mod.locks.clear()
        mod.init_db()
        self.grades = []
        self.question_failures = 0
        self.prompts = []
        self.efforts = []

        async def handler(request):
            body = json.loads(request.content)
            self.assertTrue(body['stream'])
            prompt = body['messages'][1]['content']
            self.prompts.append(prompt)
            self.efforts.append(body.get('reasoning', {}).get('effort'))
            if 'Prepare the session' in prompt:
                reply = {'title': 'Raft leader election', 'source': 'Distributed systems',
                         'opener': question('explain')}
            elif "Write the examiner's brief" in prompt:
                reply = {'brief': 'Terms and votes.'}
            elif 'PLAN A PROGRESSION' in prompt:
                reply = PLAN
            elif match := re.search(r'TASK\nWrite round \d \((.+?)\)', prompt):
                kind = next(k for k, lab, _ in mod.ROUNDS if lab == match[1])
                reply = 'nope' if self.question_failures else question(kind)
                self.question_failures = max(0, self.question_failures - 1)
            else:
                reply = self.grades.pop(0)
            content = reply if isinstance(reply, str) else json.dumps(reply)
            return httpx.Response(200, text=sse(content),
                                  headers={'Content-Type': 'text/event-stream'})

        mod.client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        self.web = httpx.AsyncClient(transport=httpx.ASGITransport(app=mod.app),
                                     base_url='https://kenjitsu.test')

    async def settle(self):
        # Let every background write land, including any it schedules in turn.
        while mod.prefetching or mod.subject_tasks or [
                t for t in asyncio.all_tasks() if t is not asyncio.current_task()
                and not t.done() and 'prepare_custom' in repr(t.get_coro())]:
            await asyncio.sleep(0.01)

    def written(self, round_number):
        return sum(f'Write round {round_number} ' in p for p in self.prompts)

    async def asyncTearDown(self):
        await self.settle()
        mod.drafts.clear()
        await self.web.aclose()
        await mod.client.aclose()
        self.tmp.cleanup()

    async def answer(self, sid, text='because', step=None):
        response = await self.web.post(f'/api/sessions/{sid}/answer',
                                       json={'answer': text, 'step': step})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    async def reveal(self, sid):
        response = await self.web.post(f'/api/sessions/{sid}/reveal')
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    async def test_full_module_session(self):
        s = (await self.web.post('/api/sessions', json={'module': 'bayes'})).json()
        self.assertEqual(s['rounds'][0]['turns'][0]['question'], mod.MODULES['bayes']['opener'])
        self.assertNotIn('rubric', json.dumps(s))
        sid = s['id']
        # Rounds 2-4 are all written at once, in parallel, behind round 1.
        await self.settle()
        self.assertEqual([self.written(n) for n in (2, 3, 4, 5)], [1, 1, 1, 0])
        self.assertEqual(set(mod.drafts[sid]), {'perturb', 'flaw', 'apply'})

        # Round 1: vague answer gets one pushback; the round is capped at 8.
        self.grades = [grade(5, pushback='You said "it depends": on what?'), grade(10)]
        s = await self.answer(sid)
        self.assertEqual(len(s['rounds']), 1)
        self.assertEqual(s['rounds'][0]['turns'][1]['question'], 'You said "it depends": on what?')
        self.assertNotIn('model_answer', json.dumps(s))
        s = await self.answer(sid)
        self.assertNotIn('perturb', mod.drafts[sid])
        self.assertEqual(s['rounds'][0]['score'], 8)
        self.assertEqual(s['rounds'][1], {'kind': 'perturb', 'label': 'What if it changes?',
                                          'score': None, 'done': False, 'revealed': False,
                                          'ready': True, 'turns': []})
        early = await self.web.post(f'/api/sessions/{sid}/answer', json={'answer': 'x'})
        self.assertEqual(early.status_code, 409)

        self.assertEqual([self.written(n) for n in (2, 3, 4)], [1, 1, 1])
        self.assertEqual((await self.reveal(sid))['rounds'][1]['turns'][0]['question'],
                         'perturb question')
        self.grades = [grade(9)]
        s = await self.answer(sid)
        self.assertEqual(s['rounds'][1]['score'], 9)

        # Round 3: reveal waits for the background write. The wrong step is capped at 3.
        s = await self.reveal(sid)
        self.assertNotIn('flaw_step', json.dumps(s['rounds'][2]).replace('"flaw_step": null', ''))
        missing = await self.web.post(f'/api/sessions/{sid}/answer', json={'answer': 'step 1'})
        self.assertEqual(missing.status_code, 422)
        self.grades = [grade(9, pushback='ignored')]
        s = await self.answer(sid, step=1)
        self.assertEqual(s['rounds'][2]['score'], 3)
        self.assertEqual(s['rounds'][2]['flaw_step'], 2)
        # Only planting the flaw uses the model's full (slow) reasoning.
        flaw_calls = [e for p, e in zip(self.prompts, self.efforts, strict=True) if 'Write round 3' in p]
        self.assertEqual(flaw_calls, [None])
        self.assertEqual(set(self.efforts) - {None}, {'low'})
        graded = next(p for p in self.prompts if 'CURRENT ROUND: Find the flaw' in p)
        self.assertIn('Pushback is not allowed', graded)

        await self.settle()
        self.assertEqual(self.written(5), 1)  # Speculative rematch, aimed at rounds 1-3.
        await self.reveal(sid)
        self.grades = ['not json', grade(2, pushback='ignored')]  # Retried; no nudge.
        s = await self.answer(sid)
        self.assertEqual(s['rounds'][3]['score'], 2)
        # Round 4 is now the weakest, so the rematch is rewritten to aim at it.
        await self.settle()
        self.assertEqual(self.written(5), 2)
        self.assertIn('Round 4 (New case) final score 2/10', self.prompts[-1])
        await self.reveal(sid)
        self.grades = [grade(10)]
        s = await self.answer(sid)
        self.assertEqual(s['status'], 'done')
        self.assertEqual(s['result']['score'], (8 + 9 + 3 + 2 + 10) * 2)
        self.assertFalse(s['result']['passed'])
        self.assertIsNone(s['result']['percentile'])
        self.assertEqual(s['rounds'][4]['targets'], 'the gap')
        self.assertIn('mechanism', s['result']['gaps'])

        me = (await self.web.get('/api/me')).json()
        self.assertEqual((me['subjects'][0]['belt'], me['subjects'][0]['fights'],
                          me['history'][0]['score'], me['history'][0]['focus_title']),
                         ('White', 1, 64, 'The core idea'))
        stats = {m['id']: m for m in (await self.web.get('/api/modules')).json()['modules']}
        self.assertEqual((stats['bayes']['attempts'], stats['bayes']['passed']), (1, 0))

    async def test_streamed_grade_shows_progress(self):
        sid = (await self.web.post('/api/sessions', json={'module': 'bayes'})).json()['id']
        self.grades = [grade(7)]
        events = []
        async with self.web.stream('POST', f'/api/sessions/{sid}/answer?stream=1',
                                   json={'answer': 'because'}) as response:
            self.assertEqual(response.headers['content-type'].split(';')[0], 'text/event-stream')
            async for line in response.aiter_lines():
                if line.startswith('event: '):
                    kind = line[7:]
                elif line.startswith('data: '):
                    events.append((kind, json.loads(line[6:])))
        progress = [data for kind, data in events if kind == 'progress']
        self.assertEqual(progress[0]['stage'], 'reading')
        self.assertTrue(any(p.get('score') == 7 for p in progress))
        feedback = [p['feedback'] for p in progress if 'feedback' in p]
        self.assertLess(len(feedback[0]), len(feedback[-1]))
        self.assertEqual(feedback[-1], 'Direct "and" plain.')
        self.assertIn('model_answer', [p['stage'] for p in progress])
        self.assertEqual(events[-1][0], 'done')
        self.assertEqual(events[-1][1]['session']['rounds'][0]['score'], 7)

    async def test_failed_stream_reports_error_and_unlocks(self):
        sid = (await self.web.post('/api/sessions', json={'module': 'bayes'})).json()['id']
        self.grades = ['bad', 'worse']
        response = await self.web.post(f'/api/sessions/{sid}/answer?stream=1',
                                       json={'answer': 'because'})
        self.assertIn('event: retry', response.text)
        self.assertIn('event: error', response.text)
        self.grades = [grade(8)]
        s = await self.answer(sid)  # The lock was released and the answer can be resent.
        self.assertEqual(s['rounds'][0]['score'], 8)

    async def test_wait_and_reveal_recover_failed_writes(self):
        self.question_failures = 6  # Every first-wave write fails, both attempts.
        sid = (await self.web.post('/api/sessions', json={'module': 'bayes'})).json()['id']
        await self.settle()
        self.grades = [grade(8)]
        s = await self.answer(sid)
        self.assertFalse(s['rounds'][1]['ready'])
        s = (await self.web.get(f'/api/sessions/{sid}/wait')).json()  # Replans and waits.
        self.assertTrue(s['rounds'][1]['ready'])
        self.assertNotIn('question', json.dumps(s['rounds'][1]))  # Still hidden.
        s = await self.reveal(sid)
        self.assertEqual(s['rounds'][1]['turns'][0]['question'], 'perturb question')

    async def test_skip_scores_zero_and_rematch_gates_pass(self):
        sid = (await self.web.post('/api/sessions', json={'module': 'cap-theorem'})).json()['id']
        self.grades = [grade(9)]
        s = await self.answer(sid, text='')
        self.assertEqual(s['rounds'][0]['score'], 0)
        for kind in ('perturb', 'flaw', 'apply'):
            await self.reveal(sid)
            self.grades = [grade(10)]
            await self.answer(sid, step=2 if kind == 'flaw' else None)
        await self.settle()
        self.assertEqual(self.written(5), 1)  # Round 4 wasn't weaker: the speculation stands.
        s = await self.reveal(sid)
        self.assertEqual(s['rounds'][4]['turns'][0]['question'], 'retest question')
        self.grades = [grade(5)]
        s = await self.answer(sid)
        self.assertEqual(s['result']['score'], 70)
        self.assertFalse(s['result']['passed'])  # Enough points, but the rematch was lost.

    async def test_custom_topic_and_privacy(self):
        s = (await self.web.post('/api/sessions', json={'topic': 'raft', 'notes': 'my notes'})).json()
        self.assertEqual((s['module'], s['title']), ('custom', 'Raft leader election'))
        self.assertIn('my notes', self.prompts[0])
        await self.settle()  # The brief is written in the background, then rounds 2-4.
        uid = self.web.cookies.get(mod.COOKIE)
        self.assertEqual(mod.load(s['id'], uid)['brief'], 'Terms and votes.')
        self.assertIn('Terms and votes.', next(p for p in self.prompts if 'Write round 3 ' in p))
        stranger = httpx.AsyncClient(transport=httpx.ASGITransport(app=mod.app),
                                     base_url='https://kenjitsu.test')
        async with stranger:
            self.assertEqual((await stranger.get(f"/api/sessions/{s['id']}")).status_code, 404)
        empty = await self.web.post('/api/sessions', json={'topic': ''})
        self.assertEqual(empty.status_code, 422)

    async def play(self, sid, scores):
        for i, score in enumerate(scores):
            if i:
                await self.reveal(sid)
            self.grades = [grade(score)]
            s = await self.answer(sid, step=2)
        return s

    async def subject(self, subject_id, after=None):
        query = f'?after={after}' if after else ''
        response = await self.web.get(f'/api/subjects/{subject_id}{query}')
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    async def test_subject_progression(self):
        s = (await self.web.post('/api/sessions', json={'module': 'bayes'})).json()
        self.assertEqual(s['focus'], {'id': 'core', 'title': 'The core idea', 'variant': 'first'})
        subject_id = s['subject']
        s = await self.play(s['id'], [8, 2, 2, 2, 2])
        self.assertFalse(s['result']['passed'])
        await self.settle()  # Plans the subject, then prewrites the top suggestions.

        sub = await self.subject(subject_id, after=s['id'])
        self.assertEqual((sub['belt'], sub['passed'], sub['total']), ('White', 0, 6))
        self.assertEqual([f['id'] for f in sub['focuses']], ['core', 'f1', 'f2', 'f3', 'f4', 'f5'])
        self.assertEqual(sub['related'][1], {'topic': 'CAP theorem and consistency',
                                             'why': 'Same family.', 'module': 'cap-theorem'})
        self.assertIsNone(sub['related'][2]['module'])
        gaps, nxt = sub['next']
        self.assertEqual((gaps['focus'], gaps['variant'], gaps['ready']), ('core', 'gaps', True))
        self.assertIn('mechanism', gaps['reason'])
        self.assertEqual((nxt['focus'], nxt['variant'], nxt['ready']), ('f1', 'first', True))
        self.assertIsNone(sub['promotion'])
        written = len(self.prompts)

        # The gaps fight starts from its prewritten opener: no model call on the click.
        g = (await self.web.post('/api/sessions', json={
            'subject': subject_id, 'focus': 'core', 'gaps': True})).json()
        self.assertEqual(g['focus']['variant'], 'gaps')
        self.assertEqual(g['module'], 'custom')  # Unranked.
        opener_calls = [p for p in self.prompts[written:] if 'Write round 1 ' in p]
        self.assertEqual(opener_calls, [])
        await self.settle()
        later = next(p for p in self.prompts[written:] if 'Write round 3 ' in p)
        self.assertIn('FOCUS OF THIS FIGHT: The core idea.', later)
        self.assertIn('Aim squarely at the gaps', later)
        self.assertIn(mod.MODULES['bayes']['opener'][:60], later)  # Don't repeat old questions.

        g = await self.play(g['id'], [9, 9, 9, 9, 9])
        self.assertTrue(g['result']['passed'])
        await self.settle()
        sub = await self.subject(subject_id, after=g['id'])
        self.assertEqual((sub['belt'], sub['passed']), ('Yellow', 1))
        self.assertEqual(sub['promotion'], {'focus': 'core', 'belt': 'Yellow', 'from': 'White'})
        self.assertEqual([n['focus'] for n in sub['next']], ['f1', 'f2'])
        self.assertEqual(sub['xp'], round(90 / 6))
        self.assertEqual([h['variant'] for h in sub['history']], ['gaps', 'first'])

        # A focus fight is a new session in the same subject.
        f1 = (await self.web.post('/api/sessions', json={
            'subject': subject_id, 'focus': 'f1'})).json()
        self.assertEqual((f1['subject'], f1['focus']['title']), (subject_id, 'Focus 1'))
        listed = (await self.web.get('/api/subjects')).json()['subjects']
        self.assertEqual([(x['id'], x['belt']) for x in listed], [(subject_id, 'Yellow')])
        # Retrying a module's core is the ranked fight, with its fixed opener.
        again = (await self.web.post('/api/sessions', json={
            'subject': subject_id, 'focus': 'core'})).json()
        self.assertEqual((again['module'], again['focus']['variant']), ('bayes', 'again'))
        missing = await self.web.post('/api/sessions', json={'subject': subject_id,
                                                             'focus': 'f9'})
        self.assertEqual(missing.status_code, 404)

    async def test_backfill_assigns_subjects(self):
        for n, module in enumerate(('bayes', 'bayes', 'custom')):
            state = {'id': f'old{n}', 'uid': 'u', 'module': module, 'title': f'T{n}',
                     'status': 'done', 'score': 50, 'passed': False, 'thinking_ms': 1,
                     'started_at': f'2026-11-0{n + 1}', 'rounds': []}
            mod.save(state)
        with mod.closing(mod.connect()) as conn, conn:
            conn.execute('UPDATE sessions SET subject = NULL')
        mod.init_db()
        with mod.closing(mod.connect()) as conn:
            rows = conn.execute('SELECT id, subject, focus FROM sessions ORDER BY id').fetchall()
            subjects = conn.execute('SELECT module, title FROM subjects ORDER BY title').fetchall()
        self.assertEqual(rows[0]['subject'], rows[1]['subject'])
        self.assertNotEqual(rows[0]['subject'], rows[2]['subject'])
        self.assertEqual({r['focus'] for r in rows}, {'core'})
        self.assertEqual([(r['module'], r['title']) for r in subjects],
                         [('bayes', "Bayes' theorem and base rates"), ('', 'T2')])

    async def test_peek_reads_partial_grades(self):
        self.assertEqual(mod.peek('', 10), {'stage': 'reading'})
        view = mod.peek('{"score": 9, "verdict": "solid", "feedback": "Half a \\"quo', 3)
        self.assertEqual(view, {'stage': 'feedback', 'score': 3, 'verdict': 'vague',
                                'feedback': 'Half a "quo'})
        self.assertNotIn('score', mod.peek('{"score": 1', 10))  # Could still become 10.

    async def test_percentile_needs_enough_attempts(self):
        for n, (score, ms) in enumerate([(50, 1), (60, 1), (70, 9), (70, 1), (90, 1)]):
            state = {'id': f's{n}', 'uid': 'u', 'module': 'bayes', 'title': 't', 'status': 'done',
                     'score': score, 'passed': False, 'thinking_ms': ms, 'started_at': 'x'}
            mod.save(state)
        self.assertEqual(mod.standing('bayes', 70, 5, 'me'), {'percentile': 60, 'others': 5})
        self.assertEqual(mod.standing('bayes', 70, 5, 's0')['percentile'], None)
        self.assertEqual(mod.standing('custom', 70, 5, 'me')['percentile'], None)

    async def test_health_and_index(self):
        health = (await self.web.get('/health')).json()
        self.assertTrue(health['ok'] and health['examiner'])
        self.assertEqual(health['modules'], len(json.loads(
            Path(__file__).with_name('modules.json').read_text())))
        self.assertIn('Kenjitsu', (await self.web.get('/')).text)


if __name__ == '__main__':
    unittest.main()
