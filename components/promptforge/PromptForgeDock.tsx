import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ForgeIcon } from '../icons/ForgeIcon';
import { forge, promptForgeEngine } from '../../services/promptforge/forgeEngine';
import { getForgeDomainProfile } from '../../services/promptforge/forgeLexicon';
import type {
  PromptForgeAnalysis,
  PromptForgeDomain,
  PromptForgeIntensity,
  PromptForgeQuestion,
  PromptForgeResult,
} from '../../types';

/**
 * PROMPTFORGE dock — the hovering refinement orb.
 *
 * Wrap any authoring input with it:
 *
 *   <PromptForgeDock domain="lore-description" value={desc} onApply={setDesc}>
 *     <textarea ... />
 *   </PromptForgeDock>
 *
 * The orb fades in on hover/focus of the field and opens a panel that reads
 * the draft, asks a couple of gap-driven questions, then forges a
 * reference-grade refinement — with a guardian that proves the author’s core
 * terms survived. The engine never replaces the author’s idea and never
 * injects moralizing filler; it amplifies what is already on the page.
 */

type DockPhase = 'questions' | 'forging' | 'result' | 'error' | 'empty';

type DockCorner = 'bottom-right' | 'top-right' | 'bottom-left' | 'above-right';

interface PromptForgeDockProps {
  /** Current value of the wrapped field. */
  value: string;
  /** Receives the forged text (replace or append semantics handled by the caller’s setter). */
  onApply: (next: string) => void;
  domain: PromptForgeDomain;
  corner?: DockCorner;
  /** Extra project context (e.g. the active art style name). */
  hints?: string[];
  disabled?: boolean;
  /** Classes for the wrapper, e.g. "flex-1 min-w-0" when wrapping an input inside a flex row. */
  className?: string;
}

const CORNER_CLASSES: Record<DockCorner, string> = {
  'bottom-right': 'right-1.5 bottom-1.5',
  'top-right': 'right-1.5 top-1.5',
  'bottom-left': 'left-1.5 bottom-1.5',
  'above-right': '-top-3.5 right-2',
};

const INTENSITY_HINTS: Record<PromptForgeIntensity, string> = {
  polish: 'Touch-ups only. Your words, tightened.',
  amplify: 'Fill the missing craft dimensions around your spine.',
  overdrive: 'Every gap filled, maximum sensory specificity.',
};

const FORGING_MESSAGES = [
  'Reading your draft…',
  'Mapping craft dimensions…',
  'Checking the gaps…',
  'Forging clauses…',
  'Guarding your core terms…',
  'Final pass…',
];

const PromptForgeDock: React.FC<PromptForgeDockProps> = ({
  value,
  onApply,
  domain,
  corner = 'bottom-right',
  hints,
  disabled = false,
  className,
  children,
}) => {
  const profile = useMemo(() => getForgeDomainProfile(domain), [domain]);
  const engineLive = useMemo(() => promptForgeEngine.isLive(), []);

  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<DockPhase>('questions');
  const [intensity, setIntensity] = useState<PromptForgeIntensity>('amplify');
  const [draftSnapshot, setDraftSnapshot] = useState('');
  const [analysis, setAnalysis] = useState<PromptForgeAnalysis | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PromptForgeResult | null>(null);
  const [resultText, setResultText] = useState('');
  const [forgeSeed, setForgeSeed] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgingMessageIndex, setForgingMessageIndex] = useState(0);

  const questions: PromptForgeQuestion[] = useMemo(() => {
    if (phase !== 'questions' || !draftSnapshot) return [];
    return promptForgeEngine.prepare(draftSnapshot, domain, intensity).questions;
  }, [phase, draftSnapshot, domain, intensity]);

  const questionOrder = useMemo(() => questions.map((question) => question.id), [questions]);

  const handleOpen = useCallback(() => {
    const draft = value;
    setDraftSnapshot(draft);
    setResult(null);
    setResultText('');
    setErrorMessage('');
    setForgingMessageIndex(0);
    if (!draft.trim()) {
      setAnalysis(null);
      setPhase('empty');
    } else {
      setAnalysis(promptForgeEngine.prepare(draft, domain, intensity).analysis);
      setPhase('questions');
    }
    setOpen(true);
  }, [value, domain, intensity]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  // Close on click-outside and Escape while the panel is open.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // Rotate the forging status messages.
  useEffect(() => {
    if (phase !== 'forging') return;
    const timer = setInterval(() => {
      setForgingMessageIndex((index) => (index + 1) % FORGING_MESSAGES.length);
    }, 1100);
    return () => clearInterval(timer);
  }, [phase]);

  const runForge = useCallback(
    async (seed: number) => {
      setPhase('forging');
      setForgingMessageIndex(0);
      try {
        const forged = await forge({
          draft: draftSnapshot,
          domain,
          intensity,
          answers,
          questionOrder,
          hints,
          seed,
        });
        setResult(forged);
        setResultText(forged.text);
        setPhase('result');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'The forge misfired. Nothing was changed.');
        setPhase('error');
      }
    },
    [draftSnapshot, domain, intensity, answers, questionOrder, hints]
  );

  const handleChipSelect = (questionId: string, suggestion: string) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: previous[questionId] === suggestion ? '' : suggestion,
    }));
  };

  const handleApply = () => {
    if (!resultText.trim()) return;
    onApply(resultText.trim());
    setOpen(false);
  };

  const handleAppend = () => {
    if (!resultText.trim()) return;
    const joiner = profile.format === 'comma' ? ', ' : ' ';
    onApply(`${value.trim()}${value.trim() ? joiner : ''}${resultText.trim()}`);
    setOpen(false);
  };

  const handleReforge = () => {
    const nextSeed = forgeSeed + 1;
    setForgeSeed(nextSeed);
    void runForge(nextSeed);
  };

  const anchorSide = corner === 'bottom-left' ? 'left-0' : 'right-0';

  return (
    <div ref={containerRef} className={`relative group/forge ${className ?? ''}`}>
      {children}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        title="PROMPTFORGE — refine this draft"
        aria-label="Open PromptForge"
        className={`absolute ${CORNER_CLASSES[corner]} z-20 flex h-7 w-7 items-center justify-center rounded-md border bg-[#0A0A0F]/90 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.35)] backdrop-blur-sm transition-all duration-200 hover:border-cyan-300 hover:text-cyan-200 hover:shadow-[0_0_14px_rgba(34,211,238,0.55)] focus:opacity-100 focus:scale-100 disabled:cursor-not-allowed disabled:opacity-40 ${
          open
            ? 'scale-100 border-fuchsia-400/70 text-fuchsia-300 opacity-100'
            : 'scale-75 opacity-0 group-hover/forge:scale-100 group-hover/forge:opacity-100 group-focus-within/forge:scale-100 group-focus-within/forge:opacity-100'
        }`}
      >
        <ForgeIcon className="h-4 w-4" />
      </button>

      {open && (
        <div className={`absolute ${anchorSide} top-full z-50 mt-2 w-[min(26rem,90vw)] border-2 border-[#2E2E3A] bg-[#0A0A0F]/95 p-4 text-left shadow-[8px_8px_0px_rgba(10,10,15,0.85)] backdrop-blur-md`}>
          {/* Header */}
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#2E2E3A] pb-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <ForgeIcon className="h-3.5 w-3.5 shrink-0 text-[#FF2244]" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#00E5FF]">PROMPTFORGE</span>
              <span className="truncate font-mono text-[9px] text-[#8E8A84]">// {profile.label}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider border ${
                  engineLive
                    ? 'border-[#00E5FF]/60 bg-[#00E5FF]/10 text-[#00E5FF]'
                    : 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                }`}
                title={engineLive ? 'Arena model connected' : 'No ARENA_API_KEY — deterministic local forge'}
              >
                {engineLive ? 'live' : 'local'}
              </span>
              <button onClick={handleClose} className="font-mono text-xs text-[#8E8A84] hover:text-[#FF2244]" aria-label="Close PromptForge">
                [✕]
              </button>
            </div>
          </div>

          {phase === 'empty' && (
            <div className="py-6 text-center">
              <ForgeIcon className="mx-auto mb-2 h-7 w-7 text-[#8E8A84]" />
              <p className="font-mono text-[11px] text-[#C8C0B8]">Write a rough idea first — even three words will do.</p>
              <p className="mt-1 font-mono text-[9px] text-[#8E8A84]">The forge amplifies what exists. It never invents your premise for you.</p>
            </div>
          )}

          {phase === 'questions' && analysis && (
            <div>
              <p className="mb-3 font-mono text-[9px] text-[#8E8A84]">
                {analysis.wordCount} word{analysis.wordCount === 1 ? '' : 's'} read ·{' '}
                {analysis.missingDimensions.length > 0
                  ? `gaps detected: ${analysis.missingDimensions.join(', ')}`
                  : 'no gaps detected — the forge will tighten what is already there'}
              </p>

              {questions.map((question) => (
                <div key={question.id} className="mb-3">
                  <p className="font-mono text-[11px] leading-snug text-[#F0EBE1]">{question.text}</p>
                  <p className="mb-1.5 font-mono text-[9px] text-[#8E8A84]">{question.why}</p>
                  <div className="mb-1 flex flex-wrap gap-1">
                    {question.suggestions.map((suggestion) => {
                      const selected = answers[question.id] === suggestion;
                      return (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleChipSelect(question.id, suggestion)}
                          className={`border px-2 py-0.5 font-mono text-[9px] transition-colors ${
                            selected
                              ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF]'
                              : 'border-[#2E2E3A] text-[#C8C0B8] hover:border-[#00E5FF] hover:text-[#00E5FF]'
                          }`}
                        >
                          {suggestion}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={answers[question.id] ?? ''}
                    onChange={(event) =>
                      setAnswers((previous) => ({ ...previous, [question.id]: event.target.value }))
                    }
                    placeholder="…or write your own answer"
                    className="w-full border border-[#2E2E3A] bg-[#12121A] px-2 py-1 font-mono text-[10px] text-[#F0EBE1] focus:border-[#00E5FF] focus:outline-none"
                  />
                </div>
              ))}

              <div className="mb-3">
                <div className="grid grid-cols-3 gap-1">
                  {(['polish', 'amplify', 'overdrive'] as PromptForgeIntensity[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setIntensity(level)}
                      className={`border py-1 font-mono text-[10px] font-bold uppercase tracking-wide transition-colors ${
                        intensity === level
                          ? 'border-[#FF2244] bg-[#FF2244] text-white'
                          : 'border-[#2E2E3A] text-[#8E8A84] hover:border-[#00E5FF] hover:text-[#00E5FF]'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <p className="mt-1 font-mono text-[9px] text-[#8E8A84]">{INTENSITY_HINTS[intensity]}</p>
              </div>

              <button
                type="button"
                onClick={() => void runForge(forgeSeed)}
                className="flex w-full items-center justify-center gap-2 bg-[#FF2244] py-2 font-mono text-xs font-bold uppercase tracking-widest text-white shadow-[3px_3px_0px_#0A0A0F] transition-colors hover:bg-[#FF2244]/85"
              >
                <ForgeIcon className="h-4 w-4" />
                Forge
              </button>
              <p className="mt-1.5 text-center font-mono text-[9px] text-[#8E8A84]">Unanswered questions forge with engine-chosen defaults.</p>
            </div>
          )}

          {phase === 'forging' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <ForgeIcon className="h-8 w-8 animate-pulse text-[#00E5FF]" />
              <p className="font-mono text-xs text-[#F0EBE1]">{FORGING_MESSAGES[forgingMessageIndex]}</p>
              <p className="font-mono text-[9px] text-[#8E8A84]">Your draft is the spine — nothing gets replaced.</p>
            </div>
          )}

          {phase === 'result' && result && (
            <div>
              {result.notice && <p className="mb-2 font-mono text-[9px] text-amber-400/90">{result.notice}</p>}
              <div className="mb-2">
                <p className="mb-0.5 font-mono text-[9px] uppercase tracking-wider text-[#8E8A84]">Original</p>
                <p className="line-clamp-2 border border-[#2E2E3A] bg-[#12121A] p-2 font-mono text-[10px] leading-relaxed text-[#8E8A84]">
                  {draftSnapshot}
                </p>
              </div>
              <div className="mb-2">
                <p className="mb-0.5 font-mono text-[9px] uppercase tracking-wider text-[#00E5FF]">Forged — edit freely before applying</p>
                <textarea
                  value={resultText}
                  onChange={(event) => setResultText(event.target.value)}
                  rows={5}
                  className="w-full resize-y border border-[#00E5FF]/50 bg-[#12121A] p-2 font-mono text-[11px] leading-relaxed text-[#F0EBE1] focus:border-[#00E5FF] focus:outline-none"
                />
              </div>

              {result.changeNotes.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {result.changeNotes.map((note) => (
                    <span
                      key={note.label}
                      title={note.detail}
                      className="border border-[#00E5FF]/40 bg-[#00E5FF]/5 px-1.5 py-0.5 font-mono text-[9px] text-[#00E5FF]"
                    >
                      {note.label}
                    </span>
                  ))}
                </div>
              )}

              {result.guardian.droppedTerms.length === 0 ? (
                <p className="mb-3 font-mono text-[9px] text-emerald-400">
                  ◆ Guardian: all {result.guardian.preservedTerms.length} core terms preserved.
                </p>
              ) : (
                <p className="mb-3 font-mono text-[9px] text-amber-400">
                  ◆ Guardian: dropped “{result.guardian.droppedTerms.join('”, “')}” — edit the result to restore anything that matters.
                </p>
              )}

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!resultText.trim()}
                  className="bg-[#00E5FF] py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#0A0A0F] transition-colors hover:bg-[#00E5FF]/85 disabled:opacity-40"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={handleAppend}
                  disabled={!resultText.trim() || !value.trim()}
                  className="border border-[#00E5FF]/60 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/10 disabled:opacity-40"
                >
                  Append
                </button>
                <button
                  type="button"
                  onClick={handleReforge}
                  className="col-span-2 border border-[#2E2E3A] py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#8E8A84] transition-colors hover:border-[#FF2244] hover:text-[#FF2244]"
                >
                  ↻ Reforge (new pass)
                </button>
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div className="py-6 text-center">
              <p className="mb-2 font-mono text-[10px] text-red-400">{errorMessage}</p>
              <p className="font-mono text-[9px] text-[#8E8A84]">Your text was not modified.</p>
              <button
                type="button"
                onClick={() => void runForge(forgeSeed + 1)}
                className="mt-3 border border-[#2E2E3A] px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#C8C0B8] hover:border-[#00E5FF] hover:text-[#00E5FF]"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptForgeDock;
