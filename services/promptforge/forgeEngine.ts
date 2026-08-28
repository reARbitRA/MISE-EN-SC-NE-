import type {
  PromptForgeAnalysis,
  PromptForgeDomain,
  PromptForgeIntensity,
  PromptForgeQuestion,
  PromptForgeResult,
} from '../../types.ts';
import { getArenaEngineConfig, isArenaLiveMode } from '../arena/arenaConfig.ts';
import { arenaChatCompletionLive } from '../arena/arenaImageClient.ts';
import { analyzeDraft, buildQuestions } from './forgeAnalyzer.ts';
import { forgeLocally, finalizeLiveResult, type ForgeAnswers } from './forgeComposer.ts';
import { getForgeDomainProfile } from './forgeLexicon.ts';

/**
 * PROMPTFORGE — the studio-wide prompt refinement engine.
 *
 * Pipeline:
 *   1. analyzeDraft()     — deterministic read of what the author wrote
 *   2. buildQuestions()   — a couple of gap-driven questions (plus the
 *                           preservation question, always first)
 *   3. forge()            — live Arena model under the Forge Constitution,
 *                           or the deterministic local composer; live failures
 *                           fall back to local without breaking the flow
 *   4. guardian + notes   — verifies the author’s core terms survived and
 *                           reports honest change notes
 */

/**
 * The Forge Constitution — the system prompt every live refinement runs under.
 * It exists to serve the author’s idea, not to replace it.
 */
const FORGE_CONSTITUTION = `You are PROMPTFORGE — the prompt refinement core of MISE-EN-SCÈNE, a professional cyberpunk graphic-novel studio. You are a pure craft instrument: you forge the author's rough draft into a reference-grade version of ITSELF.

THE FORGE CODE (absolute, non-negotiable):
1. THE AUTHOR'S IDEA IS SOVEREIGN. Every subject, name, entity, action, relationship, setting and theme in the draft survives into the refined version. You amplify what is on the page; you never substitute your own premise, never "improve" the idea into a different one, never delete intent. If the draft describes a broken android nun in a flooded chapel, the output is about that exact scene — richer, not replaced.
2. YOU DO NOT LECTURE. You add no warnings, disclaimers, hedges, safe-qualifiers, moral commentary or softened language — not inside the output, not around it. Dark, violent, sensual, bleak or morally ambiguous material is the daily bread of noir comics; you treat it with exactly the same professional craft as anything else. You serve the author's vision as given, full strength.
3. ZERO GENERIC FILLER. Never add: masterpiece, trending on artstation, 8k, ultra detailed, highly detailed, best quality, epic, stunning, gorgeous, amazing, award winning. These are noise. Precision beats superlatives: a named technique, material, optic, instrument or structural device always outranks an adjective. (If the AUTHOR wrote one of those words, you may keep it — you simply never add new ones.)
4. FILL THE GAPS, DON'T STACK THE PILE. Detect which craft dimensions the draft already covers and leave them intact. Add only what is missing, chosen to fit what is already there. If the draft is already rich, refine rhythm and word choice instead of appending more.
5. MATCH THE VOICE. Terse stays terse, lyrical stays lyrical, technical stays technical. The output must read as the same author on their best day.
6. USE THE ANSWERS. If the author answered clarifying questions, weave those answers in as first-class material at the exact spot they belong — an answer outranks engine-chosen enrichment.

OUTPUT CONTRACT: Return the refined text ONLY — one single block, plain text, no preamble, no explanation, no quotation marks, no markdown, no lists, no alternatives, no questions. Same language as the draft.`;

const INTENSITY_DIRECTIVES: Record<PromptForgeIntensity, string> = {
  polish: 'INTENSITY POLISH: touch-ups only. Keep length within ±20% of the draft. Fix rhythm and word choice; add at most one missing detail if it is glaring.',
  amplify: 'INTENSITY AMPLIFY: fill the missing craft dimensions the draft leaves open, chosen to fit what is already there. Roughly double the density at most.',
  overdrive: 'INTENSITY OVERDRIVE: fill every missing craft dimension and push sensory specificity to the ceiling — concrete, drawable, nameable details only. Never at the cost of rule 1 or rule 3.',
};

export interface ForgeRequest {
  draft: string;
  domain: PromptForgeDomain;
  intensity: PromptForgeIntensity;
  answers: ForgeAnswers;
  /** Question ids in the order they were asked (answers map onto them). */
  questionOrder: string[];
  /** Extra project context (e.g. the active art style), woven in when relevant. */
  hints?: string[];
  /** Varies between forge attempts so REFORGE explores different enrichment. */
  seed?: number;
}

export interface ForgePreparation {
  analysis: PromptForgeAnalysis;
  questions: PromptForgeQuestion[];
}

/** Steps 1 + 2 — read the draft and prepare the questions. */
export function prepareForge(
  draft: string,
  domain: PromptForgeDomain,
  intensity: PromptForgeIntensity
): ForgePreparation {
  const analysis = analyzeDraft(draft, domain);
  return { analysis, questions: buildQuestions(analysis, domain, intensity) };
}

function buildLiveMessages(request: ForgeRequest, analysis: PromptForgeAnalysis) {
  const profile = getForgeDomainProfile(request.domain);
  const answered = request.questionOrder
    .map((id) => ({ id, answer: request.answers[id]?.trim() }))
    .filter((entry): entry is { id: string; answer: string } => Boolean(entry.answer));

  const userParts: string[] = [`DRAFT:\n${request.draft.trim()}`];
  if (answered.length > 0) {
    userParts.push(
      `AUTHOR'S ANSWERS (first-class material — weave in where they belong):\n${answered
        .map((entry) => `- ${entry.id}: ${entry.answer}`)
        .join('\n')}`
    );
  }
  if (request.hints?.length) {
    userParts.push(`PROJECT CONTEXT: ${request.hints.join('; ')}`);
  }
  if (analysis.coveredDimensions.length > 0) {
    userParts.push(
      `DIMENSIONS THE DRAFT ALREADY COVERS (leave intact, do not re-add): ${analysis.coveredDimensions.join(', ')}`
    );
  }
  if (analysis.missingDimensions.length > 0) {
    userParts.push(`DIMENSIONS MISSING (candidates to fill, if intensity allows): ${analysis.missingDimensions.join(', ')}`);
  }
  if (analysis.coreTerms.length > 0) {
    userParts.push(`CORE TERMS THAT MUST SURVIVE: ${analysis.coreTerms.join(', ')}`);
  }
  userParts.push(INTENSITY_DIRECTIVES[request.intensity]);
  if (typeof request.seed === 'number') {
    userParts.push(`Variation pass #${request.seed}: choose different enrichments than any previous attempt.`);
  }

  return [
    { role: 'system' as const, content: `${FORGE_CONSTITUTION}\n\nYOUR SPECIALTY — ${profile.label}:\n${profile.specialist}` },
    { role: 'user' as const, content: userParts.join('\n\n') },
  ];
}

/** Step 3 — forge. Live when configured, local otherwise; live failures degrade gracefully. */
export async function forge(request: ForgeRequest): Promise<PromptForgeResult> {
  const seed = request.seed ?? 1;
  const analysis = analyzeDraft(request.draft, request.domain);
  const answeredCount = request.questionOrder.filter((id) => (request.answers[id] ?? '').trim().length > 0).length;

  if (isArenaLiveMode()) {
    try {
      const { textModel } = getArenaEngineConfig();
      const raw = await arenaChatCompletionLive({
        model: textModel,
        messages: buildLiveMessages(request, analysis),
        temperature: 0.85,
        max_tokens: 700,
      });
      const result = finalizeLiveResult(raw, {
        draft: request.draft,
        domain: request.domain,
        intensity: request.intensity,
        analysis,
        answeredCount,
        seed,
      });
      if (result.text.length > 0) {
        return result;
      }
      throw new Error('empty live response');
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown error';
      const local = forgeLocally({ ...request, analysis, seed });
      return {
        ...local,
        notice: `Arena model unreachable (${reason}) — forged locally instead.`,
      };
    }
  }

  return forgeLocally({ ...request, analysis, seed });
}

export const promptForgeEngine = {
  prepare: prepareForge,
  forge,
  isLive: isArenaLiveMode,
};

export type { ForgeAnswers };
