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
  const [isHeaderVisible, setIsHeaderVisible] = React.useState(true);
  const [isContactOpen, setIsContactOpen] = React.useState(false);
  const lastScrollY = React.useRef(0);
  const ticking = React.useRef(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Ẩn header khi cuộn xuống, hiện khi cuộn lên
          if (currentScrollY > lastScrollY.current && currentScrollY > 300) {
            setIsHeaderVisible(false);
          } else if (currentScrollY < lastScrollY.current) {
            setIsHeaderVisible(true);
          }

          // Giữ header hiện khi ở đầu trang
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
        className="hidden lg:block absolute top-[1660px] left-0 w-[490px] h-[798px] pointer-events-none"
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
        className="absolute top-[70%] left-1/2 -translate-x-1/2 w-full max-w-[1440px] h-auto pointer-events-none opacity-30 lg:opacity-100"
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
            className="w-full max-w-[90%] md:max-w-[600px] lg:w-[700px] h-auto object-contain mt-20 md:mt-32 lg:mt-40 mb-16 md:mb-24 lg:mb-32"
          />
        </div>
        <OverviewSection />
        <EasySetupSection />
        <AnalyticsSection />
        <SecurityFeaturesSection />
        <FeaturesSection />
      </main>

      {/* Floating Contact Us button */}
      <button
        type="button"
        onClick={() => setIsContactOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-[#33fff9] px-5 py-3 text-sm font-bold text-[#001429] shadow-lg shadow-[#33fff9]/40 transition-transform duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#33fff9]"
      >
        Contact Us
      </button>

      {/* Contact modal */}
      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0c1b2e] p-6 shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Contact Us</h3>
              <button
                type="button"
                onClick={() => setIsContactOpen(false)}
                className="text-[#b2b8bf] hover:text-white transition-colors duration-200"
                aria-label="Close contact form"
              >
                ✕
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setIsContactOpen(false);
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm text-[#b2b8bf]" htmlFor="firstName">
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    className="w-full rounded-lg border border-white/10 bg-[#0a1626] px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#33fff9]"
                    required
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm text-[#b2b8bf]" htmlFor="lastName">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    className="w-full rounded-lg border border-white/10 bg-[#0a1626] px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#33fff9]"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-sm text-[#b2b8bf]" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="w-full rounded-lg border border-white/10 bg-[#0a1626] px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#33fff9]"
                  required
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-sm text-[#b2b8bf]" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-[#0a1626] px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#33fff9]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContactOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-[#b2b8bf] hover:text-white transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#33fff9] text-[#001429] text-sm font-bold hover:scale-[1.02] transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#33fff9]"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
