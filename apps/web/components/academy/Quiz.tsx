'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, ChevronRight, Award, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Quiz as QuizType } from '@/stores/academy-store';

interface QuizProps {
  quiz: QuizType;
  onComplete: (scorePct: number, passed: boolean) => void;
  onGetCertificate?: () => void;
}

export function Quiz({ quiz, onComplete, onGetCertificate }: QuizProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Array<{ qId: string; correct: boolean }>>(
    [],
  );
  const [finished, setFinished] = useState(false);

  const total = quiz.questions.length;
  const current = quiz.questions[currentIdx];
  const correctCount = answers.filter((a) => a.correct).length;
  const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const passed = scorePct >= quiz.passingScore;

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    const isCorrect = selected === current.correctIndex;
    setAnswers((prev) => [...prev, { qId: current.id, correct: isCorrect }]);
    setRevealed(true);
  };

  const handleNext = () => {
    if (currentIdx + 1 < total) {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      // End of quiz — compute final result from answers incl. the current
      const finalCorrect = answers.filter((a) => a.correct).length;
      const finalPct = total > 0 ? Math.round((finalCorrect / total) * 100) : 0;
      const finalPassed = finalPct >= quiz.passingScore;
      setFinished(true);
      onComplete(finalPct, finalPassed);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelected(null);
    setRevealed(false);
    setAnswers([]);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="rounded-2xl border border-border/60 bg-white dark:bg-white/5 p-6 sm:p-8 text-center">
        <div
          className={cn(
            'w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center',
            passed
              ? 'bg-gradient-to-br from-[#00B894] to-[#008a6d]'
              : 'bg-gradient-to-br from-[#E8334A] to-[#b71b2f]',
          )}
        >
          {passed ? (
            <Award size={32} className="text-white" />
          ) : (
            <XCircle size={32} className="text-white" />
          )}
        </div>
        <h3 className="font-display text-xl font-bold text-ink mb-1">
          {passed ? 'Bravo, quiz réussi !' : 'Score insuffisant'}
        </h3>
        <p className="text-sm text-ink-3 font-body mb-4">
          Vous avez obtenu <strong className="text-ink">{scorePct} %</strong>{' '}
          ({correctCount}/{total}). Score requis :{' '}
          <strong>{quiz.passingScore} %</strong>.
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Button variant="muted" size="sm" onClick={handleRestart}>
            Refaire le quiz
          </Button>
          {passed && onGetCertificate && (
            <Button variant="primary" size="sm" onClick={onGetCertificate}>
              <Sparkles size={14} />
              Obtenir l&rsquo;attestation
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-white dark:bg-white/5 p-5 sm:p-6">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-4">
        <Badge variant="violet" size="sm">
          Question {currentIdx + 1} / {total}
        </Badge>
        <span className="text-[11px] text-ink-3 font-body">
          Score requis : {quiz.passingScore} %
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-violet-pale mb-5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#3B1FA8] to-[#5535C4] transition-all duration-300"
          style={{ width: `${((currentIdx) / total) * 100}%` }}
        />
      </div>

      {/* Question */}
      <h3 className="font-display text-base font-bold text-ink leading-snug mb-4">
        {current.text}
      </h3>

      {/* Answers */}
      <div className="flex flex-col gap-2 mb-4">
        {current.answers.map((ans, idx) => {
          const isSelected = selected === idx;
          const isCorrect = idx === current.correctIndex;
          const showRightHighlight = revealed && isCorrect;
          const showWrongHighlight = revealed && isSelected && !isCorrect;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              disabled={revealed}
              aria-pressed={isSelected}
              className={cn(
                'w-full text-left rounded-xl border px-4 py-3 flex items-center gap-3 font-body text-sm transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2',
                !revealed && isSelected
                  ? 'border-[#3B1FA8] bg-[#3B1FA8]/[0.05] text-ink'
                  : !revealed
                    ? 'border-border hover:border-[#3B1FA8]/40 hover:bg-[#3B1FA8]/[0.02] text-ink-2'
                    : '',
                showRightHighlight && 'border-[#00B894] bg-[#00B894]/10 text-ink',
                showWrongHighlight && 'border-[#E8334A] bg-[#E8334A]/10 text-ink',
                revealed &&
                  !isSelected &&
                  !isCorrect &&
                  'opacity-60 border-border text-ink-3',
                'disabled:cursor-default',
              )}
            >
              <span
                className={cn(
                  'w-5 h-5 rounded-full border flex items-center justify-center shrink-0',
                  isSelected && !revealed && 'border-[#3B1FA8] bg-[#3B1FA8]',
                  showRightHighlight && 'border-[#00B894] bg-[#00B894]',
                  showWrongHighlight && 'border-[#E8334A] bg-[#E8334A]',
                  !isSelected && !revealed && 'border-border',
                )}
                aria-hidden="true"
              >
                {(isSelected && !revealed) || showRightHighlight ? (
                  <CheckCircle2 size={12} className="text-white" />
                ) : showWrongHighlight ? (
                  <XCircle size={12} className="text-white" />
                ) : null}
              </span>
              <span className="flex-1">{ans}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation reveal */}
      {revealed && (
        <div
          className={cn(
            'rounded-xl p-4 mb-4 border-l-4',
            selected === current.correctIndex
              ? 'bg-[#00B894]/[0.05] border-l-[#00B894]'
              : 'bg-[#E8334A]/[0.05] border-l-[#E8334A]',
          )}
        >
          <p className="font-body text-[13px] text-ink-2 leading-relaxed">
            <strong className="text-ink">
              {selected === current.correctIndex
                ? 'Bonne réponse.'
                : 'Réponse incorrecte.'}
            </strong>{' '}
            {current.explanation}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-ink-3 font-body">
          {correctCount} / {currentIdx + (revealed ? 1 : 0)} correctes
        </span>
        {!revealed ? (
          <Button
            variant="primary"
            size="sm"
            disabled={selected === null}
            onClick={handleSubmit}
          >
            Valider
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={handleNext}>
            {currentIdx + 1 < total ? 'Question suivante' : 'Voir le résultat'}
            <ChevronRight size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
