import React, { useState } from 'react';
import { ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { sendCheckerReport } from '../../../services/checkerReportService';
import { MAX_SCORE } from './questions';

interface Props {
  onStart: () => void;
}

type SendState = 'idle' | 'sending' | 'sent' | 'error';

const CheckerIntro: React.FC<Props> = ({ onStart }) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sendState, setSendState] = useState<SendState>('idle');

  const handleRequestCallback = async () => {
    setSendState('sending');
    try {
      await sendCheckerReport({
        risk: 'Not assessed (skipped the questionnaire)',
        total: 0,
        maxScore: MAX_SCORE,
        route: { region: null, country: '', paid: null },
        flagged: [],
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setSendState('sent');
    } catch (err) {
      console.error('Failed to request callback:', err);
      setSendState('error');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <h2 className="font-orbitron text-2xl sm:text-3xl font-bold text-[#0755c9] mb-4">
        Is Your Job Offer Real?
      </h2>
      <p className="text-gray-600 mb-3">Answer 17 quick questions. Takes about 3 minutes. Free.</p>
      <p className="text-gray-600 mb-6">
        We'll show you the warning signs in your offer. No judgment. We don't share your answers
        with whoever sent you the offer.
      </p>
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-600 mb-8">
        Your answers create a red-flag report. This is a screening tool, not a final finding that
        an employer or person is fraudulent.
      </div>
      <button
        onClick={onStart}
        className="inline-flex items-center justify-center gap-2 bg-coral hover:bg-coral-dark text-white font-space font-semibold px-8 py-3 rounded-xl transition-all shadow-lg w-full sm:w-auto"
      >
        Start the Check
        <ArrowRight className="w-4 h-4" />
      </button>

      <div className="mt-auto pt-8 border-t border-gray-100">
        <p className="text-sm font-space font-semibold text-gray-700 mb-2">
          Don't want to answer questions? Leave your details and we'll reach out to you instead.
        </p>
        <div className="grid sm:grid-cols-2 gap-2 mb-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 font-space text-sm focus:outline-none focus:border-coral"
          />
          <input
            type="tel"
            placeholder="WhatsApp number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 font-space text-sm focus:outline-none focus:border-coral"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRequestCallback}
            disabled={(!email.trim() && !phone.trim()) || sendState === 'sending'}
            className="inline-flex items-center gap-2 bg-[#0755c9] hover:bg-[#062d79] disabled:opacity-40 disabled:cursor-not-allowed text-white font-space font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
          >
            {sendState === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
            Request a callback
          </button>
          {sendState === 'sent' && (
            <span className="text-sm text-green-600 font-space flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Sent — we'll be in touch
            </span>
          )}
          {sendState === 'error' && (
            <span className="text-sm text-red-600 font-space">Couldn't send — try again.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckerIntro;
