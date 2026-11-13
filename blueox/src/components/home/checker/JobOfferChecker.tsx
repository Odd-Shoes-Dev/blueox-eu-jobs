import React, { useState } from 'react';
import CheckerAside from './CheckerAside';
import CheckerIntro from './CheckerIntro';
import CheckerRouting from './CheckerRouting';
import CheckerQuestion from './CheckerQuestion';
import CheckerResults from './CheckerResults';
import { QUESTIONS } from './questions';
import { AnswersState, RouteState, Step, Answer } from './types';

const TOTAL_STEPS = 3 + QUESTIONS.length; // 3 routing + 14 questions = 17

const INITIAL_ROUTE: RouteState = { region: null, country: '', paid: null };

function stepLabel(step: Step): string {
  if (step === 'intro') return 'Introduction';
  if (step === 'route-region' || step === 'route-country' || step === 'route-paid') return 'About the job';
  if (typeof step === 'object' && step.kind === 'question') return `Question ${step.index + 4} of ${TOTAL_STEPS}`;
  return 'Your report';
}

function stepProgress(step: Step): number {
  if (step === 'intro') return 0;
  if (step === 'route-region') return (1 / TOTAL_STEPS) * 100;
  if (step === 'route-country') return (2 / TOTAL_STEPS) * 100;
  if (step === 'route-paid') return (3 / TOTAL_STEPS) * 100;
  if (typeof step === 'object' && step.kind === 'question') return ((3 + step.index + 1) / TOTAL_STEPS) * 100;
  return 100;
}

const JobOfferChecker: React.FC = () => {
  const [step, setStep] = useState<Step>('intro');
  const [route, setRoute] = useState<RouteState>(INITIAL_ROUTE);
  const [answers, setAnswers] = useState<AnswersState>({});

  const restart = () => {
    setAnswers({});
    setRoute(INITIAL_ROUTE);
    setStep('intro');
  };

  const goToQuestion = (index: number) => {
    if (index < 0) {
      setStep('route-paid');
      return;
    }
    if (index >= QUESTIONS.length) {
      setStep('results');
      return;
    }
    setStep({ kind: 'question', index });
  };

  const renderScreen = () => {
    if (step === 'intro') {
      return <CheckerIntro onStart={() => setStep('route-region')} />;
    }
    if (step === 'route-region' || step === 'route-country' || step === 'route-paid') {
      const back = () => {
        if (step === 'route-region') setStep('intro');
        else if (step === 'route-country') setStep('route-region');
        else setStep('route-country');
      };
      const next = () => {
        if (step === 'route-region') setStep('route-country');
        else if (step === 'route-country') setStep('route-paid');
        else goToQuestion(0);
      };
      return <CheckerRouting screen={step} route={route} onChange={setRoute} onBack={back} onNext={next} />;
    }
    if (typeof step === 'object' && step.kind === 'question') {
      const q = QUESTIONS[step.index];
      const handleAnswer = (answer: Answer) => setAnswers((prev) => ({ ...prev, [q.id]: answer }));
      return (
        <CheckerQuestion
          question={q}
          index={step.index}
          total={TOTAL_STEPS}
          value={answers[q.id]}
          onAnswer={handleAnswer}
          onBack={() => goToQuestion(step.index - 1)}
          onNext={() => goToQuestion(step.index + 1)}
          isLast={step.index === QUESTIONS.length - 1}
        />
      );
    }
    return <CheckerResults route={route} answers={answers} onRestart={restart} />;
  };

  return (
    <section id="checker" className="bg-gray-50 py-16 sm:py-20 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[300px_1fr] gap-4 items-stretch">
          <CheckerAside />
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-7 flex flex-col min-h-[550px]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-orbitron text-sm font-bold text-[#0755c9]">Blue OX</span>
              <span className="text-xs font-space font-semibold text-gray-500">{stepLabel(step)}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-[#087df0] to-coral rounded-full transition-all duration-300"
                style={{ width: `${stepProgress(step)}%` }}
              />
            </div>
            {renderScreen()}
          </div>
        </div>
      </div>
    </section>
  );
};

export default JobOfferChecker;
