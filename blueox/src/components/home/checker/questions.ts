import { Answer, AnswersState } from './types';

export interface CheckerQuestionDef {
  id: string;
  text: string;
  detail?: string;
  points: number;
  reverse: boolean;
  critical: boolean;
  why: string;
}

export const QUESTIONS: CheckerQuestionDef[] = [
  {
    id: 'q1',
    text: 'Were you asked to pay anything before signing a contract?',
    detail: 'A fee, deposit, "processing" or "registration" charge.',
    points: 4,
    reverse: false,
    critical: true,
    why: "Real employers pay to hire you. They don't charge you for the job.",
  },
  {
    id: 'q2',
    text: 'Were you asked to pay by mobile money, crypto, gift cards, or into a personal account instead of a company bank account?',
    points: 4,
    reverse: false,
    critical: true,
    why: 'Payments to personal accounts or unusual methods are difficult to trace and recover.',
  },
  {
    id: 'q3',
    text: 'Did anyone promise or guarantee you a visa or work permit?',
    points: 4,
    reverse: false,
    critical: true,
    why: 'Only the relevant government can decide whether to issue a visa or permit.',
  },
  {
    id: 'q4',
    text: "Did the offer arrive by WhatsApp, Telegram, Facebook or TikTok from someone you didn't contact first?",
    points: 2,
    reverse: false,
    critical: false,
    why: 'Unsolicited social-media offers can hide the identity of the person contacting you.',
  },
  {
    id: 'q5',
    text: "Does the sender use a free email address (Gmail, Yahoo) or an email that doesn't match the company's website?",
    points: 2,
    reverse: false,
    critical: false,
    why: 'A genuine recruiter should be able to show a traceable connection to the employer.',
  },
  {
    id: 'q6',
    text: "Can you NOT find the employer in its country's official company register?",
    points: 3,
    reverse: false,
    critical: false,
    why: "A real employer should be a registered, traceable business in its country.",
  },
  {
    id: 'q7',
    text: 'Was there no interview, or only a short text chat?',
    points: 2,
    reverse: false,
    critical: false,
    why: 'Employers usually assess whether your experience and skills fit the role.',
  },
  {
    id: 'q8',
    text: 'Is the salary far above what this job normally pays?',
    points: 2,
    reverse: false,
    critical: false,
    why: 'Unrealistic pay can be used to make an offer feel too good to question.',
  },
  {
    id: 'q9',
    text: 'Were you offered the job without being asked for your CV, skills or qualifications?',
    points: 2,
    reverse: false,
    critical: false,
    why: 'A real hiring process normally checks whether you can do the job.',
  },
  {
    id: 'q10',
    text: 'Do you have a written contract showing employer name, address, salary, hours and duties?',
    points: 3,
    reverse: true,
    critical: false,
    why: 'You should understand the employer, pay, hours and duties in writing before committing.',
  },
  {
    id: 'q11',
    text: 'Are you being rushed? Lines like "slots are closing" or "pay today."',
    points: 2,
    reverse: false,
    critical: false,
    why: 'Pressure is often used to stop you from checking details or asking for advice.',
  },
  {
    id: 'q12',
    text: 'Were you told to keep this secret, or not to check it with anyone?',
    points: 3,
    reverse: false,
    critical: false,
    why: 'A legitimate opportunity should withstand reasonable questions and independent checks.',
  },
  {
    id: 'q13',
    text: 'Were you sent a work permit, visa or invitation letter before the employer confirmed you in writing?',
    points: 3,
    reverse: false,
    critical: false,
    why: 'Documents sent too early may be misleading or unrelated to a genuine job offer.',
  },
  {
    id: 'q14',
    text: 'Were you told you can arrive on a tourist or short-stay visa and sort out work later?',
    points: 3,
    reverse: false,
    critical: false,
    why: 'The correct permission to work must be understood before you travel.',
  },
];

export const MAX_SCORE = QUESTIONS.reduce((sum, q) => sum + q.points, 0);

export function scoreQuestion(q: CheckerQuestionDef, answer: Answer | undefined): number {
  if (!answer) return 0;
  if (q.reverse) {
    return answer === 'No' ? q.points : answer === 'Not sure' ? 1 : 0;
  }
  return answer === 'Yes' ? q.points : answer === 'Not sure' ? 1 : 0;
}

export function computeTotal(answers: AnswersState): number {
  return QUESTIONS.reduce((sum, q) => sum + scoreQuestion(q, answers[q.id]), 0);
}

export function isCritical(answers: AnswersState): boolean {
  return QUESTIONS.filter((q) => q.critical).some((q) => answers[q.id] === 'Yes');
}

export function getFlaggedQuestions(answers: AnswersState): CheckerQuestionDef[] {
  return QUESTIONS.filter((q) => scoreQuestion(q, answers[q.id]) > 0);
}

export type RiskTier = 'Very Likely a Scam' | 'High Risk' | 'Some Warning Signs' | 'Few Warning Signs';

export function computeRiskTier(total: number, critical: boolean): RiskTier {
  let risk: RiskTier = critical || total >= 10 ? 'High Risk' : total >= 4 ? 'Some Warning Signs' : 'Few Warning Signs';
  if (total >= 20) risk = 'Very Likely a Scam';
  return risk;
}

export const RISK_MESSAGES: Record<RiskTier, string> = {
  'Very Likely a Scam': 'Your offer matches the pattern of a fake job offer. Do not pay. Do not send documents.',
  'High Risk': 'This offer has serious warning signs. Do not pay any money until the employer is fully verified.',
  'Some Warning Signs': 'Not clearly fake. Not proven real. Several things need checking before you commit.',
  'Few Warning Signs': 'Nothing alarming in what you told us. That is not the same as verified.',
};
