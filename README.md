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

## PROMPTFORGE — the studio-wide prompt refiner

Every authoring field in the app — frame prompts, negative prompts, edit
instructions, character visuals & backstories, lore descriptions & secrets,
scene synthesis ideas, palette themes, score briefs, dialogue scenes, balloon
text, and the story logline — carries a **hovering forge orb** that fades in
when the field is hovered or focused.

Click it and the engine:

1. **Reads your draft** — a deterministic analyzer maps which craft dimensions
   you already covered and which are missing, and extracts your core terms.
2. **Asks a couple of questions** — gap-driven, with one-click suggestion
   chips, always led by *"anything that must stay exactly as you wrote it?"*.
3. **Forges** — under the *Forge Constitution* (live Arena model) or the
   deterministic local composer, at your chosen intensity
   (Polish / Amplify / Overdrive).
4. **Guards the result** — the guardian verifies every significant word of
   yours survived and the review panel shows honest change notes before you
   Apply, Append, or Reforge.

### The Forge Code

The engine is built to **amplify your idea, never replace it**:

- Your subjects, names, entities and themes are the spine — they survive
  verbatim, in order.
- It never adds warnings, disclaimers, hedges or moral commentary, and never
  softens dark or morally ambiguous material — it is a craft instrument
  serving an adult fiction studio, not a lecturer.
- Zero generic filler: no "masterpiece / 8k / highly detailed" padding — only
  specific, nameable craft vocabulary (optics, lighting rigs, materials,
  instrumentation, narrative structure).
- It fills *gaps*, it doesn't stack filler on what you already wrote; answers
  you give outrank anything the engine would have chosen.
- Live failures degrade gracefully to the local composer without breaking
  your flow (a notice is shown).

Engine: `services/promptforge/` (`forgeLexicon.ts` craft vocabulary,
`forgeAnalyzer.ts` analysis + questions, `forgeComposer.ts` local forge +
guardian, `forgeEngine.ts` the Constitution + live orchestration). UI:
`components/promptforge/PromptForgeDock.tsx`.

```bash
bun run scripts/verify-promptforge.ts   # engine smoke test (offline + live when configured)
```

## Verify your Arena configuration

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
