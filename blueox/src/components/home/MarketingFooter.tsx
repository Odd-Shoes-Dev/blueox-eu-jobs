import React from 'react';
import { WHATSAPP_LINK } from '../chatbot/conversationFlow';

const MarketingFooter: React.FC = () => {
  return (
    <footer id="contact" className="bg-gradient-to-br from-[#062d79] to-[#075bc4] text-white py-14 sm:py-16 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-10">
          <div>
            <strong className="font-orbitron text-lg">BLUE OX JOBS</strong>
            <p className="text-sm text-gray-400 mt-4 leading-relaxed">
              Blue Ox Jobs gives guidance and verification based on the information you provide and
              available public records. A red-flag report is not a definitive finding that a person
              or company is fraudulent. We can't guarantee jobs, visas or outcomes. Governments make
              immigration decisions.
            </p>
            <p className="text-sm text-gray-400 mt-4">
              Registered company details to be added before launch.
            </p>
          </div>
          <div>
            <strong className="font-orbitron text-lg">Talk to our team</strong>
            <p className="text-sm text-gray-300 mt-4">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-coral transition-colors">
                WhatsApp
              </a>
              <br />
              <a href="mailto:hire@blueoxjobs.eu" className="hover:text-coral transition-colors">
                hire@blueoxjobs.eu
              </a>
            </p>
            <p className="text-sm text-gray-400 mt-4">Privacy policy to be added before launch.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
