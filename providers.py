"""Model providers: one streaming interface over API keys and CLI subscriptions.

Every provider turns (system prompt, user prompt) into text, calling `on_text` with the text
so far as it arrives. Kenjitsu tries the configured providers in order (`KENJITSU_PROVIDERS`)
and moves to the next one when a provider fails. See README.md, "Model providers".
"""
from __future__ import annotations

import asyncio
import contextlib
import json
import os
import shutil
import signal
import tempfile
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import httpx
    OnText = Callable[[str], Awaitable[None]] | None
else:
    OnText = object
# Used when KENJITSU_PROVIDERS is unset or "auto": every configured provider, in this order.
AUTO_ORDER = ('openrouter', 'anthropic', 'openai', 'claude-cli', 'codex-cli')
CLI_TIMEOUT = float(os.getenv('KENJITSU_CLI_TIMEOUT', '240'))


class ProviderError(Exception):
    """A provider failed in a way worth trying the next provider for."""


def env(name: str, default: str = '') -> str:
    return os.getenv(name, '').strip() or default


class Provider:
    name = ''
    kind = ''  # "api" or "cli"

    @property
    def model(self) -> str:
        raise NotImplementedError

    def available(self) -> bool:
        raise NotImplementedError

    async def stream(self, system: str, prompt: str, *, max_tokens: int, effort: str | None,
                     on_text: OnText, http: httpx.AsyncClient) -> str:
        raise NotImplementedError

    def describe(self) -> dict:
        return {'name': self.name, 'kind': self.kind, 'model': self.model or 'default',
                'available': self.available()}


# --- API keys ---

class OpenAICompatible(Provider):
    """Chat Completions with SSE streaming: OpenRouter, OpenAI, or any compatible server."""
    kind = 'api'

    def __init__(self, name: str, *, prefix: str, base_url: str, default_model: str,
                 reasoning: str, extra_headers: dict | None = None):
        self.name, self.prefix, self.default_base = name, prefix, base_url
        self.default_model, self.reasoning = default_model, reasoning
        self.extra_headers = extra_headers or {}

    @property
    def key(self) -> str:
        return env(f'{self.prefix}_API_KEY')

    @property
    def model(self) -> str:
        return env(f'{self.prefix}_MODEL', self.default_model)

    @property
    def base_url(self) -> str:
        return env(f'{self.prefix}_BASE_URL', self.default_base).rstrip('/')

    def available(self) -> bool:
        return bool(self.key and self.model)

    async def stream(self, system, prompt, *, max_tokens, effort, on_text, http):
        body = {'model': self.model, 'max_tokens': max_tokens, 'stream': True,
                'messages': [{'role': 'system', 'content': system},
                             {'role': 'user', 'content': prompt}]}
        if effort and self.reasoning == 'openrouter':
            body['reasoning'] = {'effort': effort}
        elif effort and self.reasoning == 'openai':
            body['reasoning_effort'] = effort
        text = ''
        async with http.stream('POST', f'{self.base_url}/chat/completions', json=body, headers={
                'Authorization': f'Bearer {self.key}', **self.extra_headers}) as response:
            if response.status_code >= 400:
                await response.aread()
                response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.startswith('data:'):
                    continue  # Blank separators and keep-alive comments.
                data = line[5:].strip()
                if data == '[DONE]':
                    break
                chunk = json.loads(data)
                if chunk.get('error'):
                    raise ProviderError('upstream stream error')
                for choice in chunk.get('choices') or []:
                    piece = (choice.get('delta') or {}).get('content')
                    if piece:
                        text += piece
                        if on_text:
                            await on_text(text)
        return text


class AnthropicAPI(Provider):
    """The Claude API through the official SDK, with server-side refusal fallback."""
    name, kind = 'anthropic', 'api'

    def __init__(self):
        self._client = None

    @property
    def model(self) -> str:
        return env('KENJITSU_ANTHROPIC_MODEL', 'claude-opus-5-5')

    def available(self) -> bool:
        return bool(env('KENJITSU_ANTHROPIC_API_KEY') or env('ANTHROPIC_API_KEY'))

    def client(self):
        if self._client is None:
            import anthropic  # Only needed when this provider is used.
            self._client = anthropic.AsyncAnthropic(
                api_key=env('KENJITSU_ANTHROPIC_API_KEY') or env('ANTHROPIC_API_KEY'),
                max_retries=1)
        return self._client

    async def stream(self, system, prompt, *, max_tokens, effort, on_text, http):
        options = {'output_config': {'effort': effort}} if effort else {}
        text = ''
        # On a safety decline the API reruns the request on Anthropic's recommended model.
        async with self.client().beta.messages.stream(
                model=self.model, max_tokens=max_tokens, system=system,
                messages=[{'role': 'user', 'content': prompt}],
                betas=['server-side-fallback-2026-07-01'], fallbacks='default',
                **options) as stream:
            async for piece in stream.text_stream:
                text += piece
                if on_text:
                    await on_text(text)
            final = await stream.get_final_message()
        if final.stop_reason == 'refusal':
            raise ProviderError('refused')
        return text


# --- CLI subscriptions ---

async def run_cli(args: list[str], stdin: str, cwd: str, extra_env: dict, on_line) -> str:
    process = await asyncio.create_subprocess_exec(
        *args, cwd=cwd, env={**os.environ, **extra_env}, stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.DEVNULL,
        start_new_session=True, limit=16 * 1024 * 1024)

    async def drive():
        process.stdin.write(stdin.encode())
        await process.stdin.drain()
        process.stdin.close()
        result = None
        async for raw in process.stdout:
            with contextlib.suppress(ValueError):
                event = json.loads(raw)
                result = await on_line(event) or result
        await process.wait()
        return result

    try:
        result = await asyncio.wait_for(drive(), CLI_TIMEOUT)
    except BaseException:  # Timeout, cancellation, or an error the CLI reported.
        with contextlib.suppress(ProcessLookupError):
            os.killpg(process.pid, signal.SIGKILL)
        await process.wait()
        raise
    if process.returncode or result is None:
        # The CLI's own output can contain the prompt; never surface or log it.
        raise ProviderError(f'{args[0]} exited with {process.returncode}')
    return result


class ClaudeCLI(Provider):
    """`claude -p` from Claude Code, on its logged-in subscription (or CLAUDE_CODE_OAUTH_TOKEN)."""
    name, kind = 'claude-cli', 'cli'

    @property
    def binary(self) -> str:
        return env('KENJITSU_CLAUDE_BIN', 'claude')

    @property
    def model(self) -> str:
        return env('KENJITSU_CLAUDE_CLI_MODEL')

    def available(self) -> bool:
        return shutil.which(self.binary) is not None

    async def stream(self, system, prompt, *, max_tokens, effort, on_text, http):
        # A bare completion: no tools, settings, MCP servers, slash commands or saved session.
        args = [self.binary, '-p', '--output-format', 'stream-json', '--verbose',
                '--include-partial-messages', '--no-session-persistence', '--tools', '',
                '--setting-sources', '', '--strict-mcp-config', '--disable-slash-commands',
                '--system-prompt', system]
        if self.model:
            args += ['--model', self.model]
        if effort:
            args += ['--effort', effort]
        text = ''

        async def on_line(event):
            nonlocal text
            if event.get('type') == 'stream_event':
                delta = (event.get('event') or {}).get('delta') or {}
                if delta.get('type') == 'text_delta':
                    text += delta.get('text', '')
                    if on_text:
                        await on_text(text)
            elif event.get('type') == 'result':
                if event.get('is_error') or event.get('subtype') != 'success':
                    raise ProviderError('claude reported an error')
                return event.get('result') or text
            return None

        with tempfile.TemporaryDirectory(prefix='kenjitsu-claude-') as cwd:
            return await run_cli(args, prompt, cwd, {}, on_line)


class CodexCLI(Provider):
    """`codex exec` from Codex CLI, on its logged-in ChatGPT subscription or OPENAI_API_KEY."""
    name, kind = 'codex-cli', 'cli'

    @property
    def binary(self) -> str:
        return env('KENJITSU_CODEX_BIN', 'codex')

    @property
    def model(self) -> str:
        return env('KENJITSU_CODEX_MODEL')

    def available(self) -> bool:
        return shutil.which(self.binary) is not None

    async def stream(self, system, prompt, *, max_tokens, effort, on_text, http):
        with tempfile.TemporaryDirectory(prefix='kenjitsu-codex-') as cwd:
            instructions = Path(cwd) / 'instructions.txt'
            instructions.write_text(system)
            # Read-only, no shell, web, MCP, rules or project docs: a plain completion.
            args = [self.binary, 'exec', '--json', '--ignore-user-config', '--ignore-rules',
                    '--ephemeral', '--skip-git-repo-check', '--sandbox', 'read-only',
                    '-c', 'approval_policy="never"', '-c', 'web_search="disabled"',
                    '-c', 'project_doc_max_bytes=0', '-c', 'mcp_servers={}',
                    '-c', 'model_instructions_file=' + json.dumps(str(instructions)),
                    '--color', 'never', '--disable', 'shell_tool', '--disable', 'unified_exec']
            if self.model:
                args += ['--model', self.model]
            if effort:
                args += ['-c', f'model_reasoning_effort="{effort}"']
            args.append('-')
            text = ''

            async def on_line(event):
                nonlocal text
                kind = event.get('type')
                item = event.get('item') or {}
                if kind == 'item.completed' and item.get('type') == 'agent_message':
                    # Codex reports whole messages rather than token deltas.
                    text = item.get('text') or ''
                    if on_text:
                        await on_text(text)
                elif kind in ('turn.failed', 'error'):
                    raise ProviderError('codex reported an error')
                elif kind == 'turn.completed':
                    return text or None
                return None

            return await run_cli(args, prompt, cwd, {}, on_line)


PROVIDERS: dict[str, Provider] = {p.name: p for p in (
    OpenAICompatible('openrouter', prefix='KENJITSU_OPENROUTER',
                     base_url='https://openrouter.ai/api/v1',
                     default_model='anthropic/claude-sonnet-5.5', reasoning='openrouter',
                     extra_headers={'HTTP-Referer': 'https://kenjitsu.expt.sh',
                                    'X-Title': 'Kenjitsu'}),
    AnthropicAPI(),
    OpenAICompatible('openai', prefix='KENJITSU_OPENAI', base_url='https://api.openai.com/v1',
                     default_model='', reasoning='openai'),
    ClaudeCLI(),
    CodexCLI(),
)}


def configured() -> list[Provider]:
    """The provider chain, in order: KENJITSU_PROVIDERS (comma-separated), or auto."""
    names = [n.strip() for n in env('KENJITSU_PROVIDERS', 'auto').split(',') if n.strip()]
    if names == ['auto']:
        names = list(AUTO_ORDER)
    unknown = [n for n in names if n not in PROVIDERS]
    if unknown:
        raise ValueError(f"Unknown provider(s) in KENJITSU_PROVIDERS: {', '.join(unknown)}")
    return [PROVIDERS[n] for n in names]


def chain() -> list[Provider]:
    return [p for p in configured() if p.available()]
