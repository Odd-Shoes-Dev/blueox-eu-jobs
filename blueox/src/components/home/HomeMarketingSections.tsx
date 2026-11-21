import React from 'react';
import TruthSection from './TruthSection';
import ThreeQuestionsSection from './ThreeQuestionsSection';
import FindPathSection from './FindPathSection';
import VerifySection from './VerifySection';
import WhyDifferentSection from './WhyDifferentSection';
import PricingSection from './PricingSection';
import FinalCtaSection from './FinalCtaSection';
import JobOfferChecker from './checker/JobOfferChecker';
import StickyMobileCta from './StickyMobileCta';

interface Props {
  onStartChat: () => void;
}

const HomeMarketingSections: React.FC<Props> = ({ onStartChat }) => {
  return (
    <div className="font-inter">
      <TruthSection />
      <ThreeQuestionsSection />
      <FindPathSection />
      <VerifySection />
      <WhyDifferentSection />
      <PricingSection />
      <FinalCtaSection />
      <JobOfferChecker />
      <StickyMobileCta onStartChat={onStartChat} />
    </div>
  );
};

export default HomeMarketingSections;
