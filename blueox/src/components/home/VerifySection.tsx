import React from 'react';

const STEPS = [
  {
    num: '01',
    title: 'The employer exists.',
    desc: "We look it up in the official company register of its country.",
  },
  {
    num: '02',
    title: 'The contract is real.',
    desc: 'Employer name, address, salary, hours and duties, in writing, before you pay anyone.',
  },
  {
    num: '03',
    title: 'The permit route is legal.',
    desc: 'The job and your situation fit a work permit route the country actually offers.',
  },
  {
    num: '04',
    title: 'The money trail is clean.',
    desc: 'We check who is asking you for money, how much, when and where it goes.',
  },
];

const VerifySection: React.FC = () => {
  return (
    <section id="verify" className="py-16 sm:py-20 bg-white scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10">
            <div className="font-space text-sm font-semibold text-coral uppercase tracking-wide mb-3">
              How we verify
            </div>
            <h2 className="font-orbitron text-2xl sm:text-3xl md:text-4xl font-bold text-[#0755c9] mb-4">
              We don't say "verified" <span className="text-coral">lightly.</span>
            </h2>
            <p className="text-gray-600">
              Here is what we check before we call an offer real. If we can't verify it, we won't
              call it real. We'll say so.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {STEPS.map((s) => (
              <div key={s.num} className="bg-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-100">
                <div className="font-orbitron text-3xl sm:text-4xl font-black text-coral/40 mb-3">
                  {s.num}
                </div>
                <h3 className="font-space font-bold text-[#0755c9] mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-8">
            Before launch: confirm these four steps match your team's actual verification process.
          </p>
        </div>
      </div>
    </section>
  );
};

export default VerifySection;
