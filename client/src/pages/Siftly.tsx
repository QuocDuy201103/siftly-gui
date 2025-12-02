import React from "react";
import { Button } from "@/components/ui/button";
import { AnalyticsSection } from "./sections/AnalyticsSection";
import { EasySetupSection } from "./sections/EasySetupSection";
import { FeaturesSection } from "./sections/FeaturesSection";
import { HeroBannerSection } from "./sections/HeroBannerSection";
import { OverviewSection } from "./sections/OverviewSection";
import { SecurityFeaturesSection } from "./sections/SecurityFeaturesSection";

export const Siftly = (): JSX.Element => {
  const [selectedLanguage, setSelectedLanguage] = React.useState<"EN" | "VI">(
    "EN",
  );

  return (
    <div className="bg-[#001429] w-full min-h-screen relative overflow-x-hidden">
      <img
        className="absolute top-[1660px] left-0 w-[490px] h-[798px] pointer-events-none"
        alt="Decor"
        src="/figmaAssets/decor.png"
      />

      <img
        className="absolute top-[4080px] right-[0] w-[489px] h-[798px] pointer-events-none"
        alt="Decor"
        src="/figmaAssets/decor-1.png"
      />

      {/* <img
        className="absolute top-[5978px] left-0 w-full max-w-[1440px] h-[503px] pointer-events-none"
        alt="Decor"
        src="/figmaAssets/decor-2.png"
      /> */}

      <img
        className="absolute top-[70%] left-1/2 -translate-x-1/2 w-full max-w-[1440px] h-auto pointer-events-none"
        alt="Map"
        src="/figmaAssets/map.png"
      />

      <div className="absolute top-24 left-0 w-full h-0.5 bg-[#0d111733]" />

      <header className="flex w-full max-w-[1000px] items-center justify-between absolute top-8 left-1/2 -translate-x-1/2 bg-transparent z-50 px-4">
        <img
          className="relative w-[181px] h-8"
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
        <div className="flex w-full justify-center py-10">
          <img
            src="/figmaAssets/s.png"
            alt="Siftly Logo"
            className="w-[700px] h-auto object-contain mt-40 mb-32"
          />
        </div>
        <OverviewSection />
        <EasySetupSection />
        <AnalyticsSection />
        <SecurityFeaturesSection />
        <FeaturesSection />
      </main>
    </div>
  );
};
