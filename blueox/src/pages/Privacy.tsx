import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="font-inter pt-16 sm:pt-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-orbitron text-3xl font-bold text-navy mb-10">Privacy Policy</h1>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">1. Introduction</h2>
            <p>
              This policy explains what personal information Blue OX collects when you use our website, chatbot,
              client portal, or partner portal, why we collect it, and what rights you have over it.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">2. Information we collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Contact details such as your name, email address, phone number, and WhatsApp number.</li>
              <li>Personal details such as date of birth, nationality, and country of residence.</li>
              <li>Identity and qualification documents, such as a passport, CV, certificates, and reference letters.</li>
              <li>Job and study preferences, such as target country and job category.</li>
              <li>Conversation data collected through our chatbot while you describe what you are looking for.</li>
              <li>Payment information related to any fees, handled through our payment provider.</li>
              <li>For partner agencies, your company details and the details of candidates you submit.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">3. How we use this information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Match you with relevant job or study opportunities.</li>
              <li>Review and verify the documents you or your partner agency submit.</li>
              <li>Communicate with you about your application, including by email and WhatsApp.</li>
              <li>Process payments where applicable.</li>
              <li>Keep records required for compliance with immigration and labor regulations.</li>
              <li>Improve our platform and services.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">4. Who we share information with</h2>
            <p>
              We may share your information with employers, schools, or partner agencies involved in your
              application, and with service providers who help us run the platform, such as our file storage
              provider, email provider, and payment processor. We do not sell your personal information to third
              parties.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">5. How long we keep your information</h2>
            <p>
              We keep your information for as long as needed to provide our services and to meet legal, tax, or
              compliance requirements. If you ask us to delete your information and we are not required to keep it
              for a legitimate reason, we will do so.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">6. Keeping your information secure</h2>
            <p>
              We use reasonable technical and organizational measures to protect your information, including secure
              storage for uploaded documents and access controls that limit who can view your data. No system is
              completely secure, so we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">7. Your rights</h2>
            <p>
              Depending on where you live, you may have the right to access, correct, or delete your personal
              information, or to ask us to limit how we use it. To make a request, contact us using the details
              below.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">8. Candidates submitted by a partner agency</h2>
            <p>
              If a partner agency submits your details on your behalf, you can view and update your information
              directly using the private link the agency shares with you, without needing to create an account. You
              can also contact us directly using the details below.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">9. International transfers</h2>
            <p>
              Because we work with opportunities across different countries, your information may be processed or
              stored in a country other than your own. Where this happens, we aim to keep appropriate protections in
              place.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">10. Children's privacy</h2>
            <p>
              Our services are intended for adults applying for work or study opportunities. We do not knowingly
              collect information from children.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">11. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. If we make significant changes, we will update the date
              at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="font-space font-bold text-xl text-navy mb-2">12. Contact us</h2>
            <p>
              If you have questions about this policy or want to make a request about your personal information, you
              can reach us at{' '}
              <a href="mailto:hire@blueoxjobs.eu" className="text-coral hover:underline">hire@blueoxjobs.eu</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
