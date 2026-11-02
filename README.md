# Kenjitsu

**Don't just read it; fight it.** Kenjitsu grills you on something you have just studied,
whether a textbook chapter, a paper, interview prep or a book, until you find out whether you
actually understand it. Live at **https://kenjitsu.expt.sh**.

The name comes from James Somers' essay [*Kenjitsu*](https://jsomers.net/blog/kenjitsu)
(2010): *ken*, one's range of knowledge, and *jitsu*, a fighting art. It builds on Paul
Halmos' advice for reading mathematics: *"Ask your own questions, look for your own examples,
discover your own proofs. Is the hypothesis necessary? Is the converse true?"* Summaries and
chatbots remove the friction that makes ideas stick. Kenjitsu puts it back: a strict examiner,
a structured match, and no flattery.

- [How a fight works](#how-a-fight-works)
- [Subjects, focuses and belts](#subjects-focuses-and-belts)
- [Quick start](#quick-start)
- [Model providers](#model-providers): API keys and CLI subscriptions
- [Configuration](#configuration)
- [How it works](#how-it-works)
- [Privacy](#privacy)
- [Development](#development) · [Deployment](#deployment)

## How a fight works

Pick one of the 12 built-in modules (system design, ML, LSAT logic, Bayes, economics,
biology, calculus, books), or type any topic and optionally paste your notes. Then play
five rounds:

| # | Round | What the examiner does |
|---|---|---|
| 1 | **Explain it simply** | Asks for the core idea in plain words and why it works. Buzzwords you lean on without unpacking are flagged and highlighted in your answer. |
| 2 | **What if it changes?** | Changes one assumption, constraint or parameter and asks what breaks. |
| 3 | **Find the flaw** | Shows a plausible numbered argument with exactly one subtle error. You click the bad step and explain it. |
| 4 | **New case** | Gives you a scenario the material never mentions, where the idea decides the answer. |
| 5 | **Rematch** | Writes a fresh problem with the same logic as your weakest point so far. |

Each answer is scored 0–10 against a private rubric, with specific feedback, what a strong
answer had that yours lacked, and a model answer.

- **Pushback:** a vague answer (3–6) gets one sharp follow-up inside the round. A round that
  needed a pushback is capped at 8. Answers below 3 get the strong answer instead of a hint.
- **Flaw round:** picking the wrong step caps the round at 3.
- **Passing:** 70/100 or more, **and** a won rematch (6+), which proves the gap was fixed.

**Thinking time** counts only while an unanswered question is on screen. The next question
isn't sent to the browser until you press *Continue*, so reading feedback or waiting for the
model never counts. Module fights are **ranked**: everyone gets the same first question, and
your percentile (score, then time) appears once five others have finished. Rankings are
private to you. Your profile is an anonymous browser cookie; there are no accounts.

## Subjects, focuses and belts

Each fight belongs to a **subject**: a module, or a topic you typed. A subject has six
**focuses**: *the core idea*, plus five angles the examiner plans for that subject
(sub-mechanisms, edge cases, tradeoffs, common confusions, applications), from foundational
to advanced. Passing a focus earns the next belt:

> White → Yellow → Orange → Green → Blue → Brown → **Black**

After every fight, **Keep fighting** offers:

- **Fight your gaps**, after a failed fight: the same focus, with new questions aimed at
  exactly what you missed. Passing it clears the focus.
- **The next focus** in the subject.
- **Related fights:** four adjacent subjects, linked to a built-in module where one fits.

New fights are given every earlier question on the subject, so they find fresh angles. Each
subject has a page with its focus map, belt, mastery (your best score on each focus,
averaged) and history. Your record lists every subject.

## Quick start

```bash
git clone git@github.com:TheBuilderJR/kenjitsu.git && cd kenjitsu
pip install -r requirements.txt

# Pick at least one provider (see Model providers below), for example:
export KENJITSU_ANTHROPIC_API_KEY=sk-ant-...    # an API key, or
claude auth login                               # a Claude subscription via Claude Code, or
codex login                                     # a ChatGPT subscription via Codex CLI

KENJITSU_DATA=./data uvicorn app:app --port 8140
open http://localhost:8140
```

`GET /health` shows which providers Kenjitsu found. With none available, pages and modules
still load, but starting a fight returns 503.

## Model providers

Every examiner call (grading an answer, writing a question, planning a subject) goes
through one small interface in [`providers.py`](providers.py): *system prompt + user prompt
in, text out, streamed while it is written*. Five adapters implement it:

| Name | Uses | Auth | How it's called | Streams | Default model |
|---|---|---|---|---|---|
| `openrouter` | API key | `KENJITSU_OPENROUTER_API_KEY` | HTTPS, OpenAI-style chat completions (SSE) | Tokens | `anthropic/claude-sonnet-5.5` |
| `anthropic` | API key | `KENJITSU_ANTHROPIC_API_KEY` or `ANTHROPIC_API_KEY` | Official [`anthropic`](https://pypi.org/project/anthropic/) SDK, Messages API stream | Tokens | `claude-opus-5-5` |
| `openai` | API key | `KENJITSU_OPENAI_API_KEY` + `KENJITSU_OPENAI_MODEL` | HTTPS chat completions to `KENJITSU_OPENAI_BASE_URL` (OpenAI, or any compatible server such as vLLM or Ollama) | Tokens | none (set one) |
| `claude-cli` | Subscription | Claude Code's login (`claude auth login`), or `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token` | Runs `claude -p` as a subprocess | Tokens | the CLI's default |
| `codex-cli` | Subscription | Codex CLI's login (`codex login`, ChatGPT plan), or its API key | Runs `codex exec --json` as a subprocess | Whole message | the CLI's default |

### Choosing and chaining providers

`KENJITSU_PROVIDERS` is an ordered, comma-separated list, for example
`anthropic,claude-cli`. Kenjitsu uses the first one that is *available* (it has a key, or the
binary is on `PATH`). The first provider gets a second try if it returns something
unparseable. After that, each later provider is a fallback: it is used when an earlier one
errors, times out, refuses or keeps returning bad output. The unset default, `auto`, means
`openrouter, anthropic, openai, claude-cli, codex-cli`, skipping any that aren't configured.
So a machine with only `claude` logged in works with no configuration at all. An unknown name
fails startup, rather than failing the first fight.

**Reasoning effort.** Most calls ask for **low** effort: modern models otherwise reason for
up to ~10 s before writing anything. Only planting the flaw in round 3 runs at the provider's
default depth. Here is how each adapter expresses low effort:

| Adapter | Low effort is sent as |
|---|---|
| `openrouter` | `reasoning.effort` |
| `anthropic` | `output_config.effort` |
| `openai` | `reasoning_effort` |
| `claude-cli` | `--effort` |
| `codex-cli` | `model_reasoning_effort` |

The `anthropic` adapter also opts into server-side refusal fallbacks
(`fallbacks: "default"`), so a safety decline is retried on Anthropic's recommended model.

**CLI adapters are locked down to plain completions.** Neither CLI can touch your files or
use its own configuration. Each runs in a throwaway directory, with the prompt on stdin:

- `claude -p` runs with `--tools ""`, no setting sources, no MCP servers, no slash commands
  and no saved session.
- `codex exec` runs with a read-only sandbox, shell and web disabled, no rules, MCP servers
  or project docs, and `--ephemeral`.

Timeout: `KENJITSU_CLI_TIMEOUT` (240 s).

**Tradeoffs, measured on the same grading prompt:**

| | First text | Notes |
|---|---|---|
| API keys | ~1 s | Bills per token. Fastest, and the right choice for a hosted deployment. |
| `claude-cli` | ~5 s | CLI startup. Uses your Claude plan's limits instead of API billing. |
| `codex-cli` | ~8 s | Whole messages: grades appear at once instead of typing in. |

Since later rounds are written in the background (see below), CLI latency mostly shows up when
grading. The CLIs must be installed and logged in wherever Kenjitsu runs; the production
container has neither, so production uses an API key.

**Adding a provider** means subclassing `Provider` in `providers.py` (`model`, `available()`,
`stream()`) and adding it to `PROVIDERS`. Kenjitsu needs nothing beyond plain text out. It
parses the JSON from that text and validates every field itself.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `KENJITSU_PROVIDERS` | `auto` | Ordered provider chain (see above) |
| `KENJITSU_OPENROUTER_API_KEY` / `_MODEL` / `_BASE_URL` | none / `anthropic/claude-sonnet-5.5` / OpenRouter | `openrouter` adapter |
| `KENJITSU_ANTHROPIC_API_KEY` (or `ANTHROPIC_API_KEY`) / `KENJITSU_ANTHROPIC_MODEL` | none / `claude-opus-5-5` | `anthropic` adapter |
| `KENJITSU_OPENAI_API_KEY` / `_MODEL` / `_BASE_URL` | none / none / `https://api.openai.com/v1` | `openai` adapter |
| `KENJITSU_CLAUDE_BIN` / `KENJITSU_CLAUDE_CLI_MODEL` | `claude` / CLI default | `claude-cli` adapter (`--model`, e.g. `sonnet`) |
| `KENJITSU_CODEX_BIN` / `KENJITSU_CODEX_MODEL` | `codex` / CLI default | `codex-cli` adapter |
| `KENJITSU_CLI_TIMEOUT` | `240` | Seconds before a CLI call is killed |
| `KENJITSU_DATA` | `/data` | Directory for `kenjitsu.db` (SQLite) |
| `KENJITSU_SESSIONS_PER_DAY` | `20` | Fights each profile may start per UTC day |
| `KENJITSU_CALLS_PER_HOUR` | `60` | Model calls per profile per hour (3× that per IP) |
| `KENJITSU_CALLS_PER_DAY` | `3000` | Model calls per day across everyone |
| `VIBEBOX_TELEMETRY_API_KEY` / `_URL` | none / `https://api.telemetry.sh` | Optional anonymous events (see [Privacy](#privacy)) |

## How it works

```
app.py         FastAPI app: fights, grading, subjects, prefetching, SQLite storage
providers.py   Model adapters and the provider chain
modules.json   The 12 built-in modules: brief, fixed opener and rubric for each
static/        Single-page UI (no build step): index.html, app.js, style.css
test_app.py    Tests, with the model mocked: no key or network needed
```

**Nothing you click should wait on the model.** Time spent on a model call is mostly time
spent writing output, so Kenjitsu writes ahead:

- **Module fights** show their fixed first question immediately, while the session is
  created in the background.
- **Rounds 2–4** don't depend on your answers, so all three are written in parallel as soon
  as a fight starts.
- **The rematch** is written speculatively once rounds 1–3 are graded, aimed at your weakest
  round so far. It is rewritten only if round 4 turns out weaker still.
- **Subjects:** the plan is written during your first fight. The next focus's first question
  is written as soon as the plan exists, and a gaps fight's first question as soon as a fight
  ends. So *Keep fighting* usually starts instantly.
- **Grading** streams to the browser over SSE (`POST …/answer?stream=1`). The score appears
  first, then the feedback types in, while a seven-step indicator shows what the examiner is
  writing. Grading runs in a task that outlives the HTTP stream, so a dropped connection
  doesn't lose the result.

Questions are hidden until revealed. `GET …/wait` long-polls until the next round is
written without revealing it, and *Continue* writes the question inline if a background write
failed.

**Integrity.** Rubrics, the flaw's location and model answers never reach the browser before a
round ends. Score caps (wrong flaw step, skipped answers, pushback) are enforced in code, not
left to the model. Everything the model returns is validated field by field, and a malformed
reply is retried.

**Storage.** One SQLite file holds three tables:

- `sessions`: each fight's full state as JSON, plus columns for ranking and history.
- `subjects`: the plan and prewritten openers.
- `usage`: daily call counts.

It runs in WAL mode with `synchronous=NORMAL`, and one connection stays open for the
process's lifetime: closing the last connection forces a checkpoint and fsync on every write.

**API.** All routes are same-origin JSON, scoped to the profile cookie.

| Route | Purpose |
|---|---|
| `GET /health` | Readiness and the active providers |
| `GET /api/modules` | Built-in modules with pass rates |
| `POST /api/sessions` | Start a fight: `{module}`, `{topic, notes}` or `{subject, focus, gaps}` |
| `GET /api/sessions/{id}` | A fight's public state |
| `POST /api/sessions/{id}/reveal` | Show the next round's question and start its clock |
| `GET /api/sessions/{id}/wait` | Long-poll until the next round is written, without revealing it |
| `POST /api/sessions/{id}/answer` | Grade an answer (`?stream=1` for SSE progress) |
| `GET /api/subjects`, `GET /api/subjects/{id}` | Your subjects, and one subject's focus map, suggestions and history |
| `GET /api/me` | Your fight history and subjects |

Every response carries a `Server-Timing` header; `reveal` breaks its time down by phase.

## Privacy

- **What goes to your provider:** your answers, any notes you paste, and earlier questions on
  the subject are sent to the configured model provider. That is the only place they go.
- **Who can see your record:** fights and subjects are visible only to the browser that
  started them.
- **Telemetry** is optional. It sends identifiers, scores, counts and latencies to
  `kenjitsu_events`: `session_started`, `turn_graded`, `session_finished` and `llm_call`
  (with the provider name). It never includes answers, notes, questions or prompts.
- **Copyrighted material:** the built-in book modules contain ideas only, never the book's
  text.

## Development

```bash
pip install -r requirements.txt
python test_app.py               # 16 tests; the model and the CLIs are mocked
node --check static/app.js
ruff check .
```

When CSS or JS changes, bump the `?v=` query strings in `static/index.html`: static files
are served with long-lived immutable caching.

## Deployment

Production runs on the vibe-mono platform (omarchy). Requests flow:

> Cloudflare → Caddy (do-box) → HAProxy `:18140` → active slot (8140 or 28140)

Rollouts are health-gated and zero-downtime. This repository holds the app; vibe-mono holds
only its hosting registration:

| vibe-mono file | What it holds |
|---|---|
| `docker-compose.yml` → `kenjitsu` | Build context `../kenjitsu`, data volume, environment, `cpus: 1` |
| `apps/kenjitsu/deploy.sh` | Adapter: syncs this repo to omarchy, builds it, rolls it out |
| `infra/deploy/remote-services.json`, omarchy `infra/deploy/services.json` | Execution host, ports, `/health` |
| `infra/deploy/workspaces.json` → `kenjitsu` | do-box `/root/kenjitsu` → omarchy `~/Projects/kenjitsu` |
| `infra/Caddyfile` | `kenjitsu.expt.sh` and `kenjitsu.experiment.sh`; the answer stream unbuffered |

```bash
bash deploy.sh    # from do-box: sync, build, health-gated rollout
python3 /root/vibe-mono/scripts/remote_deploy.py kenjitsu --status
```

Production uses the `openrouter` adapter. Compose passes `KENJITSU_PROVIDERS` and the
provider keys through, falling back to the platform's `QUIZCHAT_OPENROUTER_API_KEY`. Live
data is `vibe-mono/data/kenjitsu/kenjitsu.db` on omarchy (uid 10001). Never copy a local
database over it.

## Credits

Built on James Somers' [*Kenjitsu*](https://jsomers.net/blog/kenjitsu) and Paul Halmos'
*"Don't just read it; fight it!"* The product thinking is in the Kenjitsu proposal.
