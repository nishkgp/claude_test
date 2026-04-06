'use client';

import type { Phase } from '@/types';

const PHASES: { id: Phase; label: string; description: string }[] = [
  { id: 'onboarding',          label: 'Start',            description: 'Tell us your topic' },
  { id: 'question_refinement', label: 'Question',         description: 'Refine your research question' },
  { id: 'literature_review',   label: 'Literature',       description: 'Find & evaluate sources' },
  { id: 'complete',            label: 'Done',             description: 'Session complete' },
];

const PHASE_ORDER: Phase[] = ['onboarding', 'question_refinement', 'literature_review', 'complete'];

interface Props {
  currentPhase: Phase;
}

export default function PhaseIndicator({ currentPhase }: Props) {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className="flex flex-col gap-1 py-6 px-4">
      <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
        Progress
      </p>
      {PHASES.map((phase, i) => {
        const isComplete = i < currentIndex;
        const isCurrent  = i === currentIndex;
        const isFuture   = i > currentIndex;

        return (
          <div key={phase.id} className="flex items-start gap-3">
            {/* connector line + dot column */}
            <div className="flex flex-col items-center">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                style={{
                  background: isComplete ? 'var(--student)' : isCurrent ? 'var(--accent)' : 'var(--border)',
                  color: isFuture ? 'var(--muted)' : 'white',
                }}
              >
                {isComplete ? '✓' : i + 1}
              </div>
              {i < PHASES.length - 1 && (
                <div
                  className="w-px flex-1 my-1 min-h-[24px]"
                  style={{ background: isComplete ? 'var(--student)' : 'var(--border)' }}
                />
              )}
            </div>

            {/* label */}
            <div className="pb-6">
              <p
                className="text-sm font-semibold leading-tight"
                style={{ color: isFuture ? 'var(--muted)' : 'var(--text)' }}
              >
                {phase.label}
              </p>
              {isCurrent && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--accent-lt)' }}>
                  {phase.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
