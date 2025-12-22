import React from "react";
import { Button } from "@/components/ui/button";
import { AnalyticsSection } from "./sections/AnalyticsSection";
import { EasySetupSection } from "./sections/EasySetupSection";
import { FeaturesSection } from "./sections/FeaturesSection";
import { HeroBannerSection } from "./sections/HeroBannerSection";
import { OverviewSection } from "./sections/OverviewSection";
import { SecurityFeaturesSection } from "./sections/SecurityFeaturesSection";
import { ContactSection } from "./sections/ContactSection";

export const Siftly = (): JSX.Element => {
  const [selectedLanguage, setSelectedLanguage] = React.useState<"EN" | "VI">(
    "EN",
  );
  const [isHeaderVisible, setIsHeaderVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);
  const ticking = React.useRef(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Hide header when scrolling down; show when scrolling up
          if (currentScrollY > lastScrollY.current && currentScrollY > 300) {
            setIsHeaderVisible(false);
          } else if (currentScrollY < lastScrollY.current) {
            setIsHeaderVisible(true);
          }

          // Keep header visible near the top of the page
          if (currentScrollY <= 100) {
            setIsHeaderVisible(true);
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });

        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-[#001429] w-full min-h-screen relative overflow-x-hidden">
      <img
        className="hidden lg:block absolute top-[1300px] left-1/2 -translate-x-1/2 w-[800px] h-[820px] pointer-events-none"
        alt="Decor"
        src="/figmaAssets/decor.png"
      />

      <img
        className="hidden lg:block absolute top-[4080px] right-[0] w-[489px] h-[798px] pointer-events-none"
        alt="Decor"
        src="/figmaAssets/decor-1.png"
      />

      {/* <img
        className="absolute top-[5978px] left-0 w-full max-w-[1440px] h-[503px] pointer-events-none"
        alt="Decor"
        src="/figmaAssets/decor-2.png"
      /> */}

      <img
        className="absolute top-[67.5%] left-1/2 -translate-x-1/2 w-full max-w-[1440px] h-auto pointer-events-none opacity-30 lg:opacity-100"
        alt="Map"
        src="/figmaAssets/map.png"
      />

      <div className="absolute top-24 left-0 w-full h-0.5 bg-[#0d111733]" />

      <header
        className={`flex w-full max-w-[1000px] items-center justify-between fixed top-4 md:top-8 left-1/2 -translate-x-1/2 bg-transparent z-50 px-4 md:px-6 transition-all duration-400 ease-in-out ${
          isHeaderVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-[120%] opacity-0"
        }`}
      >
        <img
          className="relative w-[120px] h-auto md:w-[181px] md:h-8"
          alt="Logo"
          src="/figmaAssets/logo.png"
        />

        <div className="inline-flex items-center gap-2.5 relative">
          <Button
            variant="ghost"
            size="sm"
            className={`h-auto px-0 py-0 [font-family:'Montserrat',Helvetica] font-bold text-sm tracking-[0] leading-[normal] hover:bg-transparent ${selectedLanguage === "EN" ? "text-[#33fff9]" : "text-[#f2f2f2]"
              }`}
            onClick={() => setSelectedLanguage("EN")}
          >
            EN
          </Button>

          <div className="relative w-px h-[18px] bg-[#ffffff33]" />

          <Button
            variant="ghost"
            size="sm"
            className={`h-auto px-0 py-0 [font-family:'Montserrat',Helvetica] font-bold text-sm tracking-[0] leading-[normal] hover:bg-transparent ${selectedLanguage === "VI" ? "text-[#33fff9]" : "text-[#f2f2f2]"
              }`}
            onClick={() => setSelectedLanguage("VI")}
          >
            VI
          </Button>
        </div>
      </header>

      <main className="relative w-full">
        <HeroBannerSection />
        <div className="hidden md:flex w-full justify-center py-10">
          <img
            src="/figmaAssets/s.png"
            alt="Siftly Logo"
            className="w-full max-w-[90%] md:max-w-[700px] lg:w-[700px] h-auto object-contain mt-20 md:mt-32 lg:mt-40 mb-16 md:mb-24 lg:mb-2"
          />
        </div>
        <OverviewSection />
        <EasySetupSection />
        <AnalyticsSection />
        <SecurityFeaturesSection />
        <ContactSection />
        <FeaturesSection />
      </main>
    </div>
  );
};
