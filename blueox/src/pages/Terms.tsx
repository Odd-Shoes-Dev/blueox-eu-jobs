import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="font-inter pt-16 sm:pt-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-orbitron text-3xl font-bold text-navy mb-10">Terms of Use</h1>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">1. Who we are</h2>
            <p>
              Blue OX ("we", "us", "our") operates a platform that connects students and workers with job and study
              opportunities in Europe, and that allows recruitment partner agencies to submit candidates for
              processing and placement. These Terms of Use apply to anyone who uses our website, chatbot, client
              portal, or partner portal.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">2. Accepting these terms</h2>
            <p>
              By creating an account, submitting information through our chatbot, uploading documents, or using any
              part of our platform, you agree to these terms. If you do not agree, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">3. Who can use the platform</h2>
            <p>
              Our services are intended for people who are legally able to work or study abroad and for companies
              and agencies legally able to recruit and place candidates. You confirm that the information you give
              us is accurate and that you have the right to share it with us, including on behalf of a candidate you
              are submitting.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">4. What we do and do not promise</h2>
            <p>
              We help connect candidates with opportunities and guide applications, but we cannot guarantee that any
              specific job offer, school placement, visa, or work permit will be granted. Immigration and visa
              decisions are made by government authorities and employers, not by us. Any guarantee mentioned in our
              marketing refers to our own service commitment, described separately, and does not override a
              government authority's decision.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">5. Your account</h2>
            <p>
              You are responsible for keeping your login details private and for anything that happens under your
              account. Tell us right away if you think someone else has access to your account without permission.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">6. Partner agencies and candidates they submit</h2>
            <p>
              If you are a partner agency, you confirm that you have the candidate's permission to submit their
              personal details and documents to us, and that you will keep the candidate informed about what you
              share on their behalf. Candidates can also access and update their own details directly through the
              link we provide, without needing an account.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">7. Documents you upload</h2>
            <p>
              You are responsible for making sure any document you upload, such as a passport, certificate, or
              reference letter, is genuine, accurate, and belongs to you or to the candidate you are submitting on
              behalf of. Uploading false or misleading documents may result in your account being suspended and may
              be reported to the relevant authorities where required by law.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">8. Fees and payments</h2>
            <p>
              Some services may involve fees, which will be communicated to you before you are asked to pay. Payment
              terms, including any refund conditions, will be explained at the time of payment.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">9. Acceptable use</h2>
            <p>
              Please do not use the platform to submit false information, impersonate someone else, interfere with
              how the platform works, or attempt to access accounts or data that are not yours.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">10. Suspending or ending access</h2>
            <p>
              We may suspend or end a client's or partner's access to the platform if these terms are broken, if
              information provided is false, or if we reasonably believe an account is being misused.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">11. Limitation of liability</h2>
            <p>
              To the extent allowed by law, Blue OX is not liable for decisions made by third parties such as
              employers, schools, embassies, or immigration authorities, or for losses arising from information you
              provided that turned out to be inaccurate. This section will be reviewed and finalized by a lawyer.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">12. Changes to these terms</h2>
            <p>
              We may update these terms from time to time. If we make significant changes, we will update the date
              at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">13. Contact us</h2>
            <p>
              If you have questions about these terms, you can reach us at{' '}
              <a href="mailto:hire@blueoxjobs.eu" className="text-coral hover:underline">hire@blueoxjobs.eu</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
