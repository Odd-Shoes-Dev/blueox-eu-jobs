import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CheckerQuestionDef } from './questions';
import { Answer } from './types';

interface Props {
  question: CheckerQuestionDef;
  index: number;
  total: number;
  value: Answer | undefined;
  onAnswer: (answer: Answer) => void;
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
}

const OPTIONS: Answer[] = ['Yes', 'No', 'Not sure'];

const CheckerQuestion: React.FC<Props> = ({ question, index, total, value, onAnswer, onBack, onNext, isLast }) => {
  return (
    <div className="flex-1 flex flex-col">
      <h2 className="font-orbitron text-xl sm:text-2xl font-bold text-[#0755c9] mb-2">{question.text}</h2>
      <p className="text-gray-600 mb-4">{question.detail ?? 'Choose the answer that best describes your offer.'}</p>
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-600 mb-6">
        <strong className="text-[#0755c9]">Why this matters:</strong> {question.why}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {OPTIONS.map((o) => (
          <button
            key={o}
            onClick={() => onAnswer(o)}
            className={`px-3 py-3 rounded-xl border font-space text-sm font-medium transition-colors ${
              value === o ? 'border-coral bg-coral/5 text-[#0755c9]' : 'border-gray-200 text-gray-700 hover:border-coral/50'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between mt-auto pt-2">
        <button onClick={onBack} className="text-gray-500 font-space text-sm hover:text-[#0755c9]">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!value}
          className="inline-flex items-center gap-2 bg-coral hover:bg-coral-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-space font-semibold px-6 py-3 rounded-xl transition-all"
        >
          {isLast ? 'See My Report' : 'Continue'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-4">
        Question {index + 4} of {total}
      </p>
    </div>
  );
};

export default CheckerQuestion;
