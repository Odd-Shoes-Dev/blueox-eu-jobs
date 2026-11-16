import React from 'react';
import { Check } from 'lucide-react';

const POINTS = ['Spot red flags', 'Know your risk', 'Get clear next steps'];

const CheckerAside: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-[#062d79] to-[#075bc4] text-white rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden min-h-[200px] lg:min-h-[550px]">
      <div>
        <h2 className="font-orbitron text-xl sm:text-2xl font-bold mb-3">Know before you go.</h2>
        <p className="text-sm text-gray-300 mb-5">
          Spot warning signs in your job offer before you send money or documents.
        </p>
        <ul className="flex flex-wrap lg:flex-col gap-3">
          {POINTS.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm font-space">
              <span className="w-5 h-5 rounded-full bg-coral flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-white" />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-gray-400 mt-6">Free · Private · About 3 minutes</p>
    </div>
  );
};

export default CheckerAside;
