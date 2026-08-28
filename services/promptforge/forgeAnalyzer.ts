import type {
  PromptForgeAnalysis,
  PromptForgeDomain,
  PromptForgeIntensity,
  PromptForgeQuestion,
} from '../../types.ts';
import { FORGE_STOPWORDS, forgeDomainVocabulary, getForgeDomainProfile } from './forgeLexicon.ts';

/**
 * Layer 1 — deterministic draft analysis.
 * Reads what the author already put on the page: which craft dimensions are
 * covered, which are missing, and which significant words are theirs (and
 * therefore protected by the guardian).
 */

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

export function analyzeDraft(draft: string, domain: PromptForgeDomain): PromptForgeAnalysis {
  const profile = getForgeDomainProfile(domain);
  const tokens = tokenize(draft);
  const lowered = ` ${tokens.join(' ')} `;

  const coveredDimensions: string[] = [];
  const missingDimensions: string[] = [];
  for (const dimension of profile.dimensions) {
    const covered = dimension.keywords.some((keyword) => lowered.includes(` ${keyword} `));
    if (covered) {
      coveredDimensions.push(dimension.id);
    } else if ((dimension.clauses?.length ?? 0) + (dimension.proseLines?.length ?? 0) > 0) {
      // Only report as "missing" if the engine can actually fill it.
      missingDimensions.push(dimension.id);
    }
  }

  const vocabulary = forgeDomainVocabulary(profile.dimensions);
  const coreTerms = [...new Set(tokens)]
    .filter((token) => token.length >= 4)
    .filter((token) => !FORGE_STOPWORDS.has(token))
    .filter((token) => !vocabulary.has(token))
    .filter((token) => !/^\d+$/.test(token))
    .slice(0, 24);

  return {
    wordCount: tokens.length,
    coveredDimensions,
    missingDimensions,
    coreTerms,
  };
}

/**
 * Layer 2 — the clarifying questions.
 * Always led by the preservation question (the author’s promise that the
 * forge amplifies rather than replaces), then the highest-leverage gaps.
 */
export function buildQuestions(
  analysis: PromptForgeAnalysis,
  domain: PromptForgeDomain,
  intensity: PromptForgeIntensity
): PromptForgeQuestion[] {
  const profile = getForgeDomainProfile(domain);
  const domainQuestionBudget: Record<PromptForgeIntensity, number> = {
    polish: 0,
    amplify: 2,
    overdrive: 3,
  };

  const questions: PromptForgeQuestion[] = [
    {
      id: 'preserve',
      text: 'Anything that must stay exactly as you wrote it?',
      why: 'The forge amplifies your idea — it never replaces it. Lock what matters.',
      suggestions: ['keep every detail I wrote', 'keep the subject, free the rest'],
    },
  ];

  const budget = domainQuestionBudget[intensity];
  for (const dimension of profile.dimensions) {
    if (questions.length >= budget + 1) break;
    if (!dimension.question) continue;
    if (analysis.coveredDimensions.includes(dimension.id)) continue;
    questions.push({
      id: dimension.id,
      text: dimension.question,
      why: dimension.why ?? `Fills the ${dimension.label} gap.`,
      suggestions: dimension.suggestions,
    });
  }

  return questions;
}

/** Recomputes dimension coverage on the refined text — powers honest change notes. */
export function coveredDimensionsOf(text: string, domain: PromptForgeDomain): string[] {
  return analyzeDraft(text, domain).coveredDimensions;
}
