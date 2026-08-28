import type {
  PromptForgeAnalysis,
  PromptForgeChangeNote,
  PromptForgeDomain,
  PromptForgeGuardian,
  PromptForgeIntensity,
  PromptForgeResult,
} from '../../types.ts';
import { getForgeDomainProfile, type ForgeDimension } from './forgeLexicon.ts';
import { coveredDimensionsOf } from './forgeAnalyzer.ts';

/**
 * Layer 3 (local) + Layer 4 — the offline forge, the guardian and the
 * honest change notes. Pure string work: deterministic, testable, and it
 * never throws.
 */

function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const normalizeClause = (clause: string): string => clause.trim().replace(/\s+/g, ' ');
const clauseKey = (clause: string): string => normalizeClause(clause).toLowerCase().replace(/[^a-z0-9 ]/g, '');

function dedupeClauses(clauses: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const clause of clauses) {
    const key = clauseKey(clause);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(normalizeClause(clause));
  }
  return result;
}

/** Enrichment budget per intensity (how many gaps the local forge fills). */
const ENRICHMENT_BUDGET: Record<PromptForgeIntensity, number> = {
  polish: 0,
  amplify: 2,
  overdrive: 4,
};

function pickEnrichmentClauses(
  dimensions: ForgeDimension[],
  analysis: PromptForgeAnalysis,
  intensity: PromptForgeIntensity,
  seed: number
): { dimension: ForgeDimension; clause: string; proseLine: string }[] {
  const budget = ENRICHMENT_BUDGET[intensity];
  if (budget <= 0) return [];
  const rng = mulberry32(hashString(analysis.coreTerms.join('|')) ^ seed);
  const missing = dimensions.filter(
    (dimension) =>
      analysis.missingDimensions.includes(dimension.id) &&
      ((dimension.clauses?.length ?? 0) > 0 || (dimension.proseLines?.length ?? 0) > 0)
  );
  const picks: { dimension: ForgeDimension; clause: string; proseLine: string }[] = [];
  for (const dimension of missing) {
    if (picks.length >= budget) break;
    const clauses = dimension.clauses ?? [];
    const proseLines = dimension.proseLines ?? [];
    picks.push({
      dimension,
      clause: clauses.length > 0 ? clauses[Math.floor(rng() * clauses.length)] : '',
      proseLine: proseLines.length > 0 ? proseLines[Math.floor(rng() * proseLines.length)] : '',
    });
  }
  return picks;
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

const ensureSentence = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?…]$/.test(capitalized) ? capitalized : `${capitalized}.`;
};

function normalizeBubbleText(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?…—,]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

/** Answers collected from the questions phase, keyed by question id. */
export type ForgeAnswers = Record<string, string>;

function answerClauses(answers: ForgeAnswers, questionOrder: string[]): string[] {
  return questionOrder
    .map((id) => (answers[id] ?? '').trim())
    .filter((answer) => answer.length > 0 && answer !== 'keep every detail I wrote');
}

const SINGULAR_VERB_MAP: Record<string, string> = {
  want: 'wants',
  need: 'needs',
  have: 'has',
  refuse: 'refuses',
  preach: 'preaches',
  keep: 'keeps',
  know: 'knows',
  say: 'says',
  get: 'gets',
  go: 'goes',
  do: 'does',
};

/**
 * Aligns the pronouns of engine-composed prose lines with the author’s own
 * usage, including third-person-singular verb agreement.
 */
function harmonizePronouns(line: string, draft: string): string {
  const lowered = draft.toLowerCase();
  const usesShe = /\b(she|her|hers)\b/.test(lowered);
  const usesHe = /\b(he|him|his)\b/.test(lowered);
  let result = line;
  if (usesShe && !usesHe) {
    result = result
      .replace(/\bthey\b/g, 'she')
      .replace(/\bthem\b/g, 'her')
      .replace(/\btheir\b/g, 'her')
      .replace(/\bthemselves\b/g, 'herself');
  } else if (usesHe && !usesShe) {
    result = result
      .replace(/\bthey\b/g, 'he')
      .replace(/\bthem\b/g, 'him')
      .replace(/\btheir\b/g, 'his')
      .replace(/\bthemselves\b/g, 'himself');
  } else {
    return result;
  }
  return result.replace(
    /\b(she|he) (want|need|have|refuse|preach|keep|know|say|get|go|do)\b/g,
    (_match: string, pronoun: string, verb: string) => `${pronoun} ${SINGULAR_VERB_MAP[verb] ?? verb}`
  );
}

export interface LocalForgeInput {
  draft: string;
  domain: PromptForgeDomain;
  intensity: PromptForgeIntensity;
  answers: ForgeAnswers;
  questionOrder: string[];
  analysis: PromptForgeAnalysis;
  hints?: string[];
  seed: number;
}

/** The local forge — deterministic assembly around the author’s own words. */
export function forgeLocally(input: LocalForgeInput): PromptForgeResult {
  const { draft, domain, intensity, answers, questionOrder, analysis, hints, seed } = input;
  const profile = getForgeDomainProfile(domain);
  const rng = mulberry32(hashString(draft) ^ seed);
  const usableAnswers = answerClauses(answers, questionOrder);
  // A dimension the author already answered is satisfied — never re-filled by the engine.
  const answeredDimensions = new Set(
    questionOrder.filter((id) => (answers[id] ?? '').trim().length > 0)
  );
  const enrichments = pickEnrichmentClauses(profile.dimensions, analysis, intensity, seed).filter(
    (enrichment) => !answeredDimensions.has(enrichment.dimension.id)
  );
  const hintClauses = (hints ?? []).filter((hint) => !draft.toLowerCase().includes(hint.toLowerCase()));

  let text: string;
  if (profile.format === 'comma' || profile.format === 'bubble') {
    if (profile.format === 'bubble') {
      // Balloon text is voice — the local forge only normalizes punctuation.
      text = normalizeBubbleText(draft);
    } else {
      const originalClauses = draft.split(/[,\n]+/).map(normalizeClause).filter(Boolean);
      const clauses = dedupeClauses([
        ...originalClauses,
        ...usableAnswers,
        ...enrichments.map((enrichment) => enrichment.clause),
        ...hintClauses,
      ]);
      text = clauses.join(', ');
    }
  } else if (profile.format === 'logline') {
    const base = draft.trim().replace(/[.!?…]+$/, '');
    const additions = [...usableAnswers, ...enrichments.map((enrichment) => harmonizePronouns(enrichment.proseLine, draft))]
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => part !== base);
    text = additions.length ? `${base} — ${additions.join(' — ')}.` : `${base}.`;
  } else {
    // Prose: keep the author’s sentences untouched, then append.
    const sentences = splitSentences(draft).map((sentence) =>
      sentence.charAt(0).toUpperCase() + sentence.slice(1)
    );
    const answerSentences = usableAnswers.map(ensureSentence);
    const proseAdditions = enrichments
      .map((enrichment) => harmonizePronouns(enrichment.proseLine, draft))
      .filter((line) => line.length > 0);
    const hintSentence = hintClauses.length ? ensureSentence(hintClauses.join(', ')) : '';
    text = [...sentences, ...answerSentences, ...proseAdditions, hintSentence].filter(Boolean).join(' ');
  }

  return {
    text,
    mode: 'local',
    intensity,
    changeNotes: deriveChangeNotes(draft, text, domain, enrichments.map((e) => e.dimension.label), usableAnswers.length),
    guardian: guardianCheck(draft, text, analysis),
  };
}

/** Layer 4 — the guardian: did every significant author word survive? */
export function guardianCheck(original: string, refined: string, analysis: PromptForgeAnalysis): PromptForgeGuardian {
  const refinedLower = ` ${refined.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ')} `;
  const preservedTerms: string[] = [];
  const droppedTerms: string[] = [];
  for (const term of analysis.coreTerms) {
    const stem = term.endsWith('y') ? term.slice(0, -1) : term;
    const variants = [term, `${term}s`, `${term}es`, term.replace(/s$/, ''), `${stem}ies`, `${stem}i`];
    const present = variants.some((variant) => variant.length >= 3 && refinedLower.includes(` ${variant} `));
    if (present) preservedTerms.push(term);
    else droppedTerms.push(term);
  }
  return { preservedTerms, droppedTerms };
}

/** Honest change notes derived from real coverage deltas — no theatre. */
export function deriveChangeNotes(
  original: string,
  refined: string,
  domain: PromptForgeDomain,
  addedDimensionLabels: string[],
  answeredCount: number
): PromptForgeChangeNote[] {
  const notes: PromptForgeChangeNote[] = [];
  const before = new Set(coveredDimensionsOf(original, domain));
  const after = coveredDimensionsOf(refined, domain);
  const profile = getForgeDomainProfile(domain);

  for (const dimension of profile.dimensions) {
    if (!before.has(dimension.id) && after.includes(dimension.id)) {
      notes.push({ label: `+ ${dimension.label}`, detail: `Filled a gap the draft left open.` });
    }
  }
  if (addedDimensionLabels.length > 0 && notes.length === 0) {
    for (const label of addedDimensionLabels) {
      notes.push({ label: `+ ${label}`, detail: 'Engine-chosen enrichment.' });
    }
  }
  if (answeredCount > 0) {
    notes.push({ label: `+ your answers`, detail: `${answeredCount} answer${answeredCount > 1 ? 's' : ''} woven in as first-class material.` });
  }
  if (original.trim() !== refined.trim()) {
    notes.push({ label: '◆ voice preserved', detail: 'Your clauses and sentences stay, in order, as the spine.' });
  }
  return notes;
}

/** Strips the conversational wrapping some models insist on adding. */
export function sanitizeLiveOutput(raw: string): string {
  let text = raw.trim();
  // Drop a leading assistant-ism line ("Here's your refined prompt:", "Sure! ...").
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length > 1) {
    const first = lines[0].toLowerCase();
    if (/^(here('|’)s|sure|certainly|of course|okay|refined prompt|prompt:|output:|sure thing)/.test(first)) {
      lines.shift();
    }
    text = lines.join('\n');
  }
  // Strip wrapping quotes or code fences.
  text = text.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
  if (/^["“'](.|\n)+["”']$/.test(text)) {
    text = text.slice(1, -1).trim();
  }
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

/** Wraps a live model result with guardian + change notes. */
export function finalizeLiveResult(
  raw: string,
  input: { draft: string; domain: PromptForgeDomain; intensity: PromptForgeIntensity; analysis: PromptForgeAnalysis; answeredCount: number; seed: number }
): PromptForgeResult {
  const text = sanitizeLiveOutput(raw);
  return {
    text,
    mode: 'live',
    intensity: input.intensity,
    changeNotes: deriveChangeNotes(input.draft, text, input.domain, [], input.answeredCount),
    guardian: guardianCheck(input.draft, text, input.analysis),
  };
}
