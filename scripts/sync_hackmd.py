#!/usr/bin/env python3
"""Two-way sync between local `wiki/*.md` files and HackMD (including Book Mode index).

Usage:
  export HACKMD_API_TOKEN="your_token_from_hackmd_settings_api"
  python3 scripts/sync_hackmd.py push   # Creates/updates all wiki notes on HackMD & prints the Book URL
  python3 scripts/sync_hackmd.py pull   # Pulls latest edits from HackMD back into local `wiki/*.md`
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

WIKI_DIR = Path(__file__).resolve().parent.parent / 'wiki'
STATE_FILE = WIKI_DIR / '.hackmd.json'
API_BASE = os.getenv('HACKMD_API_URL', 'https://api.hackmd.io/v1').rstrip('/')

PAGES = [
    ('01-vision-and-pitch.md', '01 — Vision, Mission & Pitch'),
    ('02-users-and-use-cases.md', '02 — Target Users & Representative Domains'),
    ('03-moat-and-vs-chatgpt.md', '03 — Moat & Why Not Just Use ChatGPT/Claude?'),
    ('04-product-and-learning-loop.md', '04 — Product Experience & Learning Loop'),
    ('05-platform-crowd-and-curation.md', '05 — Platform, Crowd Curation & Fight Building Blocks'),
    ('06-economics-pricing-and-data-deals.md', '06 — Unit Economics, Pricing & Frontier Lab Data Deals'),
    ('07-copyright-and-legal.md', '07 — Copyright & Legal Notes'),
    ('08-open-questions-and-changelog.md', '08 — Open Questions & Decision Log'),
]


def api_request(method: str, path: str, token: str, payload: dict | None = None):
    url = f'{API_BASE}{path}'
    data = json.dumps(payload).encode('utf-8') if payload is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'User-Agent': 'kenjitsu-wiki-sync/1.0',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode('utf-8')
            return json.loads(raw) if raw.strip() else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        raise SystemExit(f'HackMD API {method} {path} failed ({e.code}): {body}') from e


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {'notes': {}, 'book_id': None}


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2) + '\n')


def upsert_note(token: str, note_id: str | None, content: str) -> dict:
    if note_id:
        api_request('PATCH', f'/notes/{note_id}', token, {
            'content': content,
            'readPermission': 'guest',
            'writePermission': 'signed_in',
        })
        return api_request('GET', f'/notes/{note_id}', token)
    return api_request('POST', '/notes', token, {
        'content': content,
        'readPermission': 'guest',
        'writePermission': 'signed_in',
        'commentPermission': 'everyone',
    })


def push(token: str) -> None:
    state = load_state()
    links = []
    for filename, label in PAGES:
        path = WIKI_DIR / filename
        content = path.read_text()
        existing_id = state['notes'].get(filename, {}).get('id')
        info = upsert_note(token, existing_id, content)
        note_id = info['id']
        publish_link = info.get('publishLink') or f'https://hackmd.io/{note_id}'
        state['notes'][filename] = {'id': note_id, 'url': f'https://hackmd.io/{note_id}', 'publishLink': publish_link}
        links.append((label, f'https://hackmd.io/{note_id}'))
        print(f'Synced {filename} -> https://hackmd.io/{note_id}')

    # Build HackMD Book Mode index note
    book_lines = [
        '# Kenjitsu Product Wiki',
        '',
        '## Pages',
        '',
    ]
    for label, url in links:
        book_lines.append(f'- [{label}]({url})')
    book_content = '\n'.join(book_lines) + '\n'
    book_info = upsert_note(token, state.get('book_id'), book_content)
    state['book_id'] = book_info['id']
    save_state(state)
    print('\n=== HackMD Wiki Ready ===')
    print(f"Book Mode Index Note: https://hackmd.io/{book_info['id']}?both")
    print('(In HackMD, click Share -> Book Mode on the index note once to get the sidebar view!)')


def pull(token: str) -> None:
    state = load_state()
    if not state.get('notes'):
        raise SystemExit('No .hackmd.json state found. Run `push` first.')
    for filename, meta in state['notes'].items():
        info = api_request('GET', f"/notes/{meta['id']}", token)
        content = info.get('content', '')
        if content:
            (WIKI_DIR / filename).write_text(content if content.endswith('\n') else content + '\n')
            print(f'Pulled {filename} from HackMD ({meta["id"]})')


def main() -> None:
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'push'
    token = os.getenv('HACKMD_API_TOKEN', '').strip()
    if not token:
        raise SystemExit('Please set HACKMD_API_TOKEN environment variable first.')
    if cmd == 'push':
        push(token)
    elif cmd == 'pull':
        pull(token)
    else:
        raise SystemExit(f'Unknown command: {cmd}. Use `push` or `pull`.')


if __name__ == '__main__':
    main()
