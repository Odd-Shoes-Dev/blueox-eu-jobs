import React from 'react';
import TruthSection from './TruthSection';
import ThreeQuestionsSection from './ThreeQuestionsSection';
import FindPathSection from './FindPathSection';
import VerifySection from './VerifySection';
import WhyDifferentSection from './WhyDifferentSection';
import PricingSection from './PricingSection';
import FinalCtaSection from './FinalCtaSection';
import JobOfferChecker from './checker/JobOfferChecker';
import MarketingFooter from './MarketingFooter';
import StickyMobileCta from './StickyMobileCta';

const HomeMarketingSections: React.FC = () => {
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
      <MarketingFooter />
      <StickyMobileCta />
    </div>
  );
};

export default HomeMarketingSections;
