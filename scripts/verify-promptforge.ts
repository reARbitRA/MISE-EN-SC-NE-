/**
 * PROMPTFORGE engine smoke test.
 *
 * Exercises the full pipeline offline: analysis → questions → local forge →
 * guardian. If ARENA_API_KEY is configured (bun loads .env automatically),
 * also runs one live forge through the Arena chat endpoint.
 *
 * Usage:
 *   bun run scripts/verify-promptforge.ts
 *   node --experimental-strip-types scripts/verify-promptforge.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Minimal .env loader (bun does this natively; node does not).
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const envPath = join(projectRoot, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const { forge, promptForgeEngine } = await import('../services/promptforge/forgeEngine.ts');
const { analyzeDraft, buildQuestions } = await import('../services/promptforge/forgeAnalyzer.ts');
const { sanitizeLiveOutput } = await import('../services/promptforge/forgeComposer.ts');
import type { PromptForgeDomain, PromptForgeResult } from '../types.ts';

const printResult = (title: string, result: PromptForgeResult): void => {
  console.log(`\n── ${title} ──────────────────────────────`);
  console.log(`mode=${result.mode}  intensity=${result.intensity}`);
  console.log(`text: ${result.text}`);
  console.log(`notes: ${result.changeNotes.map((note) => note.label).join(' | ') || '(none)'}`);
  console.log(
    `guardian: preserved=[${result.guardian.preservedTerms.join(', ')}] dropped=[${result.guardian.droppedTerms.join(', ')}]`
  );
};

// 1. Analysis + questions on a rough draft.
const draft = 'a broken android nun in a flooded chapel';
const analysis = analyzeDraft(draft, 'image-prompt');
console.log('── Layer 1: analysis ─────────────────────');
console.log(`wordCount=${analysis.wordCount}`);
console.log(`covered=[${analysis.coveredDimensions.join(', ')}] missing=[${analysis.missingDimensions.join(', ')}]`);
console.log(`coreTerms=[${analysis.coreTerms.join(', ')}]`);
console.log('\n── Layer 2: questions (amplify) ──────────');
for (const question of buildQuestions(analysis, 'image-prompt', 'amplify')) {
  console.log(` • ${question.text}  [${question.suggestions.slice(0, 2).join(' / ')}…]`);
}

// 2. Local forge across the intensity ladder.
const base = { draft, domain: 'image-prompt' as PromptForgeDomain, answers: {}, questionOrder: ['preserve'] };
printResult('Layer 3: image-prompt · polish', await forge({ ...base, intensity: 'polish' }));
printResult('Layer 3: image-prompt · overdrive', await forge({ ...base, intensity: 'overdrive' }));

// 3. Answers woven in as first-class material.
printResult(
  'Layer 3: answers respected',
  await forge({
    ...base,
    intensity: 'amplify',
    questionOrder: ['preserve', 'lighting'],
    answers: { lighting: 'single candle, hard falloff' },
  })
);

// 4. Prose domain — author’s sentences stay the spine.
printResult(
  'Layer 3: character-backstory (prose)',
  await forge({
    draft: 'kaira grew up in the undercity after the corps flooded her block. she steals firmware now and trusts nobody.',
    domain: 'character-backstory',
    intensity: 'amplify',
    answers: {},
    questionOrder: ['preserve'],
  })
);

// 5. Negative prompt family assembly.
printResult(
  'Layer 3: image-negative',
  await forge({ draft: 'blurry, watermark', domain: 'image-negative', intensity: 'amplify', answers: {}, questionOrder: ['preserve'] })
);

// 6. Logline stays a single sentence.
printResult(
  'Layer 3: story-logline',
  await forge({
    draft: 'a courier who smuggles memories must deliver the one that incriminates her own mother',
    domain: 'story-logline',
    intensity: 'overdrive',
    answers: {},
    questionOrder: ['preserve'],
  })
);

// 7. Balloon text — voice preserved, punctuation normalized only.
printResult(
  'Layer 3: dialogue-bubble',
  await forge({ draft: 'you always said the city would eat me alive', domain: 'dialogue-bubble', intensity: 'overdrive', answers: {}, questionOrder: ['preserve'] })
);

// 8. Live-mode sanitizer contract.
console.log('\n── Layer 4: live output sanitizer ────────');
const sanitized = sanitizeLiveOutput('Here\'s your refined prompt:\n\n"a test clause, kept intact"\n');
console.log(`sanitized: ${JSON.stringify(sanitized)}`);

// 9. Live forge, when configured.
if (promptForgeEngine.isLive()) {
  console.log('\n── Live forge (Arena chat) ───────────────');
  try {
    const live = await forge({
      draft: 'razor-wing courier drone over the slum markets at dusk',
      domain: 'image-prompt',
      intensity: 'amplify',
      answers: { lighting: 'sodium-vapor dusk glow' },
      questionOrder: ['preserve', 'lighting'],
      seed: 2,
    });
    printResult('live result', live);
  } catch (error) {
    console.error(`live forge failed: ${error instanceof Error ? error.message : String(error)}`);
  }
} else {
  console.log('\n(live forge skipped — no ARENA_API_KEY configured)');
}

console.log('\nAll PromptForge checks completed.');
