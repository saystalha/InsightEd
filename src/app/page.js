import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import StatsSection from '@/components/StatsSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      {/* Fixed top navigation layout anchor layer */}
      <Navbar />
      
      {/* FIXED: Introduced 'pt-[64px]' layout boundary spacing on the parent main node.
        This offsets the fixed navbar footprint precisely, pushing your hero tag line 
        out from underneath the matte panel into plain view.
      */}
      <main id="main-content" className="pt-[64px] bg-[#141b27]">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <StatsSection />
        <CTASection />
      </main>
      
      <Footer />
    </>
  );
}