import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Region, RouteState, YesNo } from './types';

const REGIONS: Region[] = [
  'Western Europe',
  'Central Europe',
  'The Balkans',
  'Elsewhere in Europe',
  'Outside Europe',
  'Not sure',
];

interface Props {
  screen: 'route-region' | 'route-country' | 'route-paid';
  route: RouteState;
  onChange: (route: RouteState) => void;
  onBack: () => void;
  onNext: () => void;
}

const OptionButton: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode }> = ({
  selected,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-3 rounded-xl border font-space text-sm font-medium transition-colors mb-2 ${
      selected
        ? 'border-coral bg-coral/5 text-[#0755c9]'
        : 'border-gray-200 text-gray-700 hover:border-coral/50'
    }`}
  >
    {children}
  </button>
);

const CheckerRouting: React.FC<Props> = ({ screen, route, onChange, onBack, onNext }) => {
  if (screen === 'route-region') {
    return (
      <div className="flex-1 flex flex-col">
        <h2 className="font-orbitron text-xl sm:text-2xl font-bold text-[#0755c9] mb-2">Where is the job?</h2>
        <p className="text-gray-600 mb-6">Choose the region where the job is based.</p>
        <div>
          {REGIONS.map((r) => (
            <OptionButton key={r} selected={route.region === r} onClick={() => onChange({ ...route, region: r })}>
              {r}
            </OptionButton>
          ))}
        </div>
        <div className="flex items-center justify-between mt-auto pt-6">
          <button onClick={onBack} className="text-gray-500 font-space text-sm hover:text-[#0755c9]">
            ← Back
          </button>
          <button
            onClick={onNext}
            disabled={!route.region}
            className="inline-flex items-center gap-2 bg-coral hover:bg-coral-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-space font-semibold px-6 py-3 rounded-xl transition-all"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'route-country') {
    return (
      <div className="flex-1 flex flex-col">
        <h2 className="font-orbitron text-xl sm:text-2xl font-bold text-[#0755c9] mb-2">
          What country are you in now?
        </h2>
        <p className="text-gray-600 mb-6">This helps us understand your situation. Enter your current country.</p>
        <input
          className="w-full border border-gray-200 rounded-xl px-4 py-3 font-space text-sm focus:outline-none focus:border-coral"
          placeholder="e.g. Uganda"
          value={route.country}
          onChange={(e) => onChange({ ...route, country: e.target.value })}
        />
        <div className="flex items-center justify-between mt-auto pt-6">
          <button onClick={onBack} className="text-gray-500 font-space text-sm hover:text-[#0755c9]">
            ← Back
          </button>
          <button
            onClick={onNext}
            disabled={!route.country.trim()}
            className="inline-flex items-center gap-2 bg-coral hover:bg-coral-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-space font-semibold px-6 py-3 rounded-xl transition-all"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // route-paid
  const options: YesNo[] = ['Yes', 'No'];
  return (
    <div className="flex-1 flex flex-col">
      <h2 className="font-orbitron text-xl sm:text-2xl font-bold text-[#0755c9] mb-2">
        Have you already paid anyone anything for this offer?
      </h2>
      <p className="text-gray-600 mb-6">Include deposits, registration, processing or document fees.</p>
      <div>
        {options.map((o) => (
          <OptionButton key={o} selected={route.paid === o} onClick={() => onChange({ ...route, paid: o })}>
            {o}
          </OptionButton>
        ))}
      </div>
      <div className="flex items-center justify-between mt-auto pt-6">
        <button onClick={onBack} className="text-gray-500 font-space text-sm hover:text-[#0755c9]">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!route.paid}
          className="inline-flex items-center gap-2 bg-coral hover:bg-coral-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-space font-semibold px-6 py-3 rounded-xl transition-all"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CheckerRouting;
