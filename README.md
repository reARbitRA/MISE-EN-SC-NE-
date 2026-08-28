# MISE-EN-SCÈNE // Ink & Voltage Studio

A futuristic creative studio for cyberpunk graphic-novel production: storyflow,
characters, lore, palettes, frame generation, panel assembly and soundtrack —
all in one dashboard.

**Stack:** React 19 · Vite 6 · Tailwind CSS v4 · TypeScript (strict, no `any`)

## Quick start

```bash
bun install        # or: npm install
cp .env.example .env
bun run dev        # or: npm run dev  → http://localhost:3000
```

## The Arena.ai image engine (Frame Generator)

The Frame Generator generates, refines, varies, upscales and generatively edits
images through the **Arena image engine** (`services/arena/`), which speaks the
OpenAI-compatible Images contract:

| Call | Endpoint |
|---|---|
| Generate / Refine / Variations | `POST {ARENA_API_BASE_URL}/images/generations` |
| Upscale / generative edit (image-to-image) | `POST {ARENA_API_BASE_URL}/images/generations` + `image` |
| Prompt enhancement | `POST {ARENA_API_BASE_URL}/chat/completions` |

Auth is `Authorization: Bearer <ARENA_API_KEY>`; images are requested as
`b64_json` and normalized to data URLs, so results flow straight into the app's
existing `recentFrames` / panel storage and the MainWorkspace dashboard.

### Live mode vs. local simulation

- **Live mode** activates as soon as `ARENA_API_KEY` is set in `.env`.
  `ARENA_API_BASE_URL` and the model ids are configurable, so any
  OpenAI-compatible image gateway works without code changes.
- **Simulation mode** (no key configured) renders deterministic, clearly
  badged local placeholder art on a canvas, seeded by the prompt hash — the
  entire Frame Generator flow stays usable offline. A status line under the
  Generate button always shows which mode is active.

### Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `ARENA_API_KEY` | Bearer token; presence switches live mode on | *(empty → simulation)* |
| `ARENA_API_BASE_URL` | Base URL of the image API | `https://api.arena.ai/v1` |
| `ARENA_IMAGE_MODEL` | Quality-tier model id | `arena-image-001` |
| `ARENA_IMAGE_MODEL_FAST` | Image-to-image model id (edits/upscale) | `arena-image-fast-001` |
| `ARENA_TEXT_MODEL` | Text model for prompt enhancement | `arena-text-flash` |
| `GEMINI_API_KEY` | Legacy: still powers the *text* AI helpers outside the image engine (Characters, Lore Keeper, Storyflow, Style Alchemist, Soundtrack, Panel Assembler, MainWorkspace) | *(empty)* |

Keys are inlined into the client bundle at build time (same as before). For a
public deployment, proxy the Arena calls through a small backend instead.

### Verify your configuration

```bash
bun run scripts/verify-arena-config.ts
```

Requests one real image and one prompt enhancement through the same client the
UI uses, and prints friendly diagnostics on failure.

## Architecture notes

- **Hub-and-spoke state:** all app state lives in `App.tsx`; the Frame
  Generator reports new frames up through `onImageGenerated` →
  `addRecentFrame`, exactly as before the Arena migration.
- **Engine layer:** `services/arena/` contains the typed API client
  (`arenaImageClient.ts`), configuration/model catalog (`arenaConfig.ts`),
  the local simulation renderer (`arenaSimulation.ts`) and the facade that
  picks between them (`arenaEngine.ts`). Shared contracts live in `types.ts`.
- **Graceful degradation:** every Arena failure (auth, 404, rate limit, 5xx,
  timeout, network, empty response) is surfaced as a readable message in the
  existing error panel — the app never crashes.
