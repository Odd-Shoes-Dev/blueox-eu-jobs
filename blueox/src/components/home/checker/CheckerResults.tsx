import React from 'react';
import { AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { WHATSAPP_LINK } from '../../chatbot/conversationFlow';
import { AnswersState, RouteState } from './types';
import { computeTotal, isCritical, computeRiskTier, getFlaggedQuestions, RISK_MESSAGES, MAX_SCORE } from './questions';

interface Props {
  route: RouteState;
  answers: AnswersState;
  onRestart: () => void;
}

const SUPPORTED_REGIONS = ['Western Europe', 'Central Europe', 'The Balkans'];

const NEXT_STEPS = [
  'Do not send any money until checked.',
  'Ask for a written contract and registered company name.',
  'Keep all messages and documents.',
  'Our team can review the offer with you.',
];

function buildReportText(opts: {
  risk: string;
  total: number;
  route: RouteState;
  answers: AnswersState;
  flaggedIds: { id: string; text: string }[];
  regionMessage: string;
}) {
  const { risk, total, route, flaggedIds, answers, regionMessage } = opts;
  const warningLines =
    flaggedIds.length > 0
      ? flaggedIds.map((f) => `- ${f.text} (Answer: ${answers[f.id]})`).join('\n')
      : 'None selected';

  return `BLUE OX JOBS — JOB OFFER RED-FLAG REPORT
Risk: ${risk}
Score: ${total}/${MAX_SCORE}
Job region: ${route.region ?? ''}
Candidate country: ${route.country}
Already paid: ${route.paid ?? ''}

Warning signs:
${warningLines}

Next steps: Do not send money until the employer and contract are checked.
${regionMessage}

This is a red-flag check, not a definitive finding.`;
}

const CheckerResults: React.FC<Props> = ({ route, answers, onRestart }) => {
  const total = computeTotal(answers);
  const critical = isCritical(answers);
  const risk = computeRiskTier(total, critical);
  const flagged = getFlaggedQuestions(answers);
  const message = RISK_MESSAGES[risk];

  const isHigh = risk === 'High Risk' || risk === 'Very Likely a Scam';
  const isMedium = risk === 'Some Warning Signs';
  const bannerClasses = isHigh
    ? 'bg-red-50 border-red-200'
    : isMedium
    ? 'bg-amber-50 border-amber-200'
    : 'bg-green-50 border-green-200';

  const regionMessage =
    route.region && SUPPORTED_REGIONS.includes(route.region)
      ? 'We can run a full check on this offer.'
      : "We can't verify offers from this region. Use the red-flag report above, and check the employer in its country's official company register before you do anything else.";

  const handleDownload = () => {
    const text = buildReportText({
      risk,
      total,
      route,
      answers,
      flaggedIds: flagged,
      regionMessage,
    });
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blue-ox-job-offer-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const whatsappHref = `${WHATSAPP_LINK}?text=${encodeURIComponent(
    'Hello Blue Ox Jobs. I completed the Job Offer Checker and would like a full check of my offer.'
  )}`;

  return (
    <div className="flex-1 flex flex-col">
      {route.paid === 'Yes' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
          <strong className="flex items-center gap-2 text-red-700 font-space text-sm">
            <AlertTriangle className="w-4 h-4" /> You've already paid. Do this now.
          </strong>
          <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
            <li>Stop paying. Don't send more.</li>
            <li>Keep screenshots, receipts, phone numbers and account details.</li>
            <li>Contact your bank or mobile money provider today and report the transfer.</li>
            <li>Report it to the police and the consumer or labour authority in your country.</li>
          </ul>
          <strong className="block text-sm text-red-700 mt-2">
            We can't promise you'll get your money back. We can help you understand what happened.
          </strong>
        </div>
      )}

      <div className={`border rounded-xl p-5 mb-6 ${bannerClasses}`}>
        <div className="text-xs font-space font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Your job offer report · {total} / {MAX_SCORE} points
        </div>
        <h2 className="font-orbitron text-xl sm:text-2xl font-bold text-[#0755c9] mb-2">{risk}</h2>
        <p className="text-gray-700 text-sm">{message}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <h4 className="font-space font-bold text-sm text-[#0755c9] mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-coral" /> Key warning signs ({flagged.length})
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {flagged.length > 0 ? (
              flagged.map((f) => <li key={f.id}>{f.text}</li>)
            ) : (
              <li>No scored warning signs were selected.</li>
            )}
          </ul>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <h4 className="font-space font-bold text-sm text-[#0755c9] mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-coral" /> What to do next
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {NEXT_STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-600 mb-6">
        <strong className="text-[#0755c9]">Region support:</strong> {regionMessage}
      </div>

      <div className="mb-6">
        <strong className="font-space text-sm text-[#0755c9] block mb-2">
          Where should we send your result? (Optional)
        </strong>
        <div className="grid sm:grid-cols-2 gap-2 mb-2">
          <input
            type="email"
            placeholder="Email address"
            className="border border-gray-200 rounded-xl px-4 py-2.5 font-space text-sm focus:outline-none focus:border-coral"
          />
          <input
            type="tel"
            placeholder="WhatsApp number"
            className="border border-gray-200 rounded-xl px-4 py-2.5 font-space text-sm focus:outline-none focus:border-coral"
          />
        </div>
        <p className="text-xs text-gray-400">
          We use your answers to check your offer and improve our checks. We never share them with
          the sender. Privacy policy to be added before launch.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-coral hover:bg-coral-dark text-white font-space font-semibold px-6 py-3 rounded-xl transition-all shadow-lg"
        >
          Send Us the Offer for a Full Check <ArrowRight className="w-4 h-4" />
        </a>
        <button
          onClick={handleDownload}
          className="text-[#0755c9] font-space font-semibold text-sm border border-gray-200 rounded-xl px-6 py-3 hover:border-coral/50 transition-colors"
        >
          Download my report
        </button>
        <button
          onClick={onRestart}
          className="text-gray-500 font-space font-semibold text-sm border border-gray-200 rounded-xl px-6 py-3 hover:border-coral/50 transition-colors"
        >
          Start again
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-6">
        This is a red-flag check, not a definitive finding that a person or company is fraudulent.
      </p>
    </div>
  );
};

export default CheckerResults;
