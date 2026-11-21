import React from 'react';

interface CompletionBarProps {
  percent: number;
  /** Compact: a small inline bar for table rows. Default: a labeled bar for a full page. */
  compact?: boolean;
}

// Purely a visual progress indicator, how much of a candidate's form and
// documents is filled in. It never affects what a candidate or partner can
// actually do, see getCompletionPercent in partnerCandidatesService.ts.
const CompletionBar: React.FC<CompletionBarProps> = ({ percent, compact }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
          <div className="h-full bg-coral rounded-full" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{percent}%</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-500">Profile completion (a guide only)</span>
        <span className="text-xs font-semibold text-navy">{percent}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-coral rounded-full transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

export default CompletionBar;
