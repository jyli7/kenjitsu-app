# Kenjitsu

"Don't just read it; fight it!" Kenjitsu at https://kenjitsu.expt.sh (alias
`kenjitsu.experiment.sh`) grills you on something you have already studied, after James
Somers' essay *Kenjitsu* (2010) and Paul Halmos. It is not a summarizer or a chatbot.
You get a structured five-round match with a strict examiner.

1. **Explain it simply.** Buzzwords you lean on without unpacking are flagged and highlighted.
2. **What if it changes?** One assumption or constraint is changed. What breaks?
3. **Find the flaw.** A plausible numbered argument with exactly one bad step. Pick it and explain it.
4. **New case.** Apply the idea to a scenario the material never mentions.
5. **Rematch.** A fresh problem with the same logic as your weakest point so far.

A vague answer scoring 3–6 gets one sharp pushback inside the round. A round that needed
a pushback is capped at 8. Answers scoring below 3 get the strong answer, not a hint.
Picking the wrong flaw step caps that round at 3. The total is out of 100. To pass, you
need 70 or more **and** a won rematch (6+), which proves the gap was fixed.

Sessions start from one of the 12 seeded modules in `modules.json` (Interviews, Exams,
Courses, Books) or from any topic plus optional pasted notes (24k characters). A custom
topic costs one extra model call to write the examiner's brief and opener. Seeded modules
use a fixed opener and rubric, so their first round is instant and the same for everyone.
Each module stores ideas only, never book text.

**Thinking time** runs only while an unanswered question is on screen. A new round's
question is withheld from the API until you press *Start round*, so time spent reading
feedback, waiting for the model, and copying the question early don't count. Each
question's time is capped at 15 minutes. **Percentiles** apply to seeded modules once
five other attempts have finished. They rank on score, then time. A profile is an
anonymous `kj_uid` cookie with no account. Your record and shelf are visible only to
that browser.

**Subjects and belts.** Every fight belongs to a subject: one per learner per module, or one
per custom topic. A subject has six focuses: *the core idea* plus five angles the
examiner plans once per subject (sub-mechanisms, edge-case families, tradeoffs, common
confusions, applications; levels 1–3). Learners share a module's plan. Passing a focus
earns the next belt, White → Yellow → Orange → Green → Blue → Brown → Black. *Mastery*
is the best score on each focus, averaged over all six.

After every fight, *What's next* offers:

- **Fight your gaps** (after a failed fight): the same focus, with fresh questions aimed at
  that fight's missed points. Passing it clears the focus.
- **The next unpassed focus.**
- **Four related subjects**, linked to a seeded module where one fits.

New fights are told every earlier question on the subject, so they don't repeat. Retrying a
module's core is still the fixed-opener, ranked fight; every other fight is unranked.

The plan is written during the first fight. The next focus's opener is written as soon
as the plan exists, and a gaps opener as soon as the fight ends, so suggested fights
usually start instantly (prewritten openers live in `subjects.plan.ready`). Sessions
from before subjects existed were backfilled on startup. The pre-migration database is
kept on omarchy at `vibe-mono/data/kenjitsu/kenjitsu.before-subjects.db`.

The examiner uses OpenRouter `anthropic/claude-sonnet-5.5` (`KENJITSU_MODEL`). The key
is `KENJITSU_OPENROUTER_API_KEY`. In production, Compose falls back to the platform's
`QUIZCHAT_OPENROUTER_API_KEY`. Private rubrics and the flaw step never reach the browser before a round ends.
Malformed replies are retried once.

**Latency.** Model time is almost all output tokens (about 120 tokens/s after a ~1s first
token). Sonnet also reasons adaptively by default, which can add ~10s before the first word.
Nothing the learner clicks should wait on the model:

- **Starting a module** shows its fixed opener (served with `/api/modules`) immediately.
  The session is created in the background (`#/s/new` until it exists).
- **Custom topics** write only the title and opener up front (~4–5s). The examiner's
  brief is written in the background, then the later rounds.
- **Rounds 2–4** don't depend on any answer, so all three are written in parallel as
  soon as the session starts, behind round 1. Only planting the flaw keeps full
  reasoning (~18s); everything else uses `reasoning.effort: low`.
- **The rematch** is written speculatively once rounds 1–3 are graded, aimed at the
  weakest so far. It's rewritten only if round 4 scores lower than all of them.
- **Grading** is its own call. It streams as SSE (`POST .../answer?stream=1`): the
  score appears in ~1.5s and the feedback types in, with the full grade in ~4–5s. It
  runs in a task that outlives the HTTP stream.
- **Continue** reveals the next round in one round-trip (~5ms in the app). A *writing…*
  badge appears only while `/wait` (a long-poll that never reveals the question)
  reports it isn't ready. *Continue* writes the question inline if a background write
  failed or ran in a replaced release.
- SQLite runs WAL with `synchronous=NORMAL`, and one connection stays open for the
  process lifetime. Closing the last connection checkpoints and fsyncs, which cost
  ~150ms per save on omarchy's btrfs. `cpus: 1`, since 0.5 throttled requests by
  100ms+ while several responses streamed.
- Every API response has a `Server-Timing` header (`reveal` is broken down by phase).
- Caddy serves the answer stream without encoding and with `flush_interval -1`.

Limits: 20 sessions/day per profile, 60 model calls/hour per profile (180 per IP), and
3,000 calls/day overall (all configurable through `KENJITSU_*`).

State is SQLite at `$KENJITSU_DATA/kenjitsu.db` (`/data` in the container). Telemetry goes to the
`kenjitsu_events` table (`session_started`, `turn_graded`, `session_finished`,
`llm_call`). It records only identifiers, scores, counts and latencies, never answers,
notes or questions.

## Development

```bash
pip install -r requirements.txt            # or: uv run --with-requirements requirements.txt …
KENJITSU_DATA=./data uvicorn app:app --port 8140 --reload
python test_app.py                         # mocks the model; no key or network needed
node --check static/app.js
```

Without `KENJITSU_OPENROUTER_API_KEY`, modules and pages load but the examiner returns
503. `VIBEBOX_TELEMETRY_API_KEY`/`_URL` are optional.

## Hosting

Production runs on the vibe-mono platform (omarchy), with the public route
**Cloudflare → Caddy (do-box) → HAProxy :18140 → the active slot** (8140 or 28140).
This repository holds the app. vibe-mono holds only the hosting registration:

| vibe-mono file | What it holds |
| --- | --- |
| `docker-compose.yml` → `kenjitsu` | Build context `../kenjitsu`, data volume, env, `cpus: 1` |
| `apps/kenjitsu/deploy.sh` | Adapter: syncs this repo to omarchy, builds, rolls out |
| `infra/deploy/remote-services.json`, omarchy `infra/deploy/services.json` | Execution host, ports, `/health` |
| `infra/deploy/workspaces.json` → `kenjitsu` | do-box `/root/kenjitsu` → omarchy `~/Projects/kenjitsu` |
| `infra/Caddyfile` | `kenjitsu.expt.sh` / `kenjitsu.experiment.sh`; the answer stream unbuffered |

```bash
bash deploy.sh    # from do-box: sync, build, health-gated two-slot rollout
python3 /root/vibe-mono/scripts/remote_deploy.py kenjitsu --status
```

Live data stays at `vibe-mono/data/kenjitsu/kenjitsu.db` on omarchy (uid 10001). Never
copy a local database over it.
