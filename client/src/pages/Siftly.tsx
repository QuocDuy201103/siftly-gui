import React from "react";
import { Button } from "@/components/ui/button";
import { AnalyticsSection } from "./sections/AnalyticsSection";
import { EasySetupSection } from "./sections/EasySetupSection";
import { FeaturesSection } from "./sections/FeaturesSection";
import { HeroBannerSection } from "./sections/HeroBannerSection";
import { OverviewSection } from "./sections/OverviewSection";
import { SecurityFeaturesSection } from "./sections/SecurityFeaturesSection";
import { apiRequest } from "@/lib/queryClient";

export const Siftly = (): JSX.Element => {
  const [selectedLanguage, setSelectedLanguage] = React.useState<"EN" | "VI">(
    "EN",
  );
  const [isHeaderVisible, setIsHeaderVisible] = React.useState(true);
  const [isContactOpen, setIsContactOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
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
        className={`fixed bottom-6 right-6 z-50 transition-all duration-100 ease-in-out hover:scale-105 outline-none active:outline-none focus:outline-none ${
          isContactOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        aria-label="Contact Us"
      >
        <img
          src="/figmaAssets/contact.png"
          alt="Contact Us"
          className="w-14 h-14 md:w-16 md:h-16 object-contain"
        />
      </button>

      {/* Contact modal */}
      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-gradient-to-b from-[#31F2F4] to-[#1B67C1] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-3xl font-bold text-black">Contact Us</h3>
              <button
                type="button"
                onClick={() => setIsContactOpen(false)}
                className="border-none bg-transparent hover:opacity-80 transition-opacity duration-200"
                aria-label="Close contact form"
              >
                <img
                  src="/figmaAssets/Union.png"
                  alt="Close"
                  className="w-3 h-3 object-contain"
                />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                setSubmitError(null);

                const formData = new FormData(e.currentTarget);
                const data = {
                  fullName: formData.get("fullName") as string,
                  email: formData.get("email") as string,
                  company: formData.get("company") as string || undefined,
                  message: formData.get("message") as string,
                  newsletter: formData.get("newsletter") === "on",
                };

                try {
                  await apiRequest("POST", "/api/contact", data);
                  setIsContactOpen(false);
                  // Reset form
                  e.currentTarget.reset();
                } catch (error) {
                  setSubmitError(
                    error instanceof Error
                      ? error.message
                      : "Failed to submit form. Please try again.",
                  );
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <input
                    id="fullName"
                    name="fullName"
                    className="w-full rounded-lg bg-white px-3 py-3 text-gray-800 placeholder-gray-500 focus:outline-none"
                    placeholder="Full Name"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="w-full rounded-lg bg-white px-3 py-3 text-gray-800 placeholder-gray-500 focus:outline-none"
                    placeholder="Email"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <input
                  id="company"
                  name="company"
                  className="w-full rounded-lg bg-white px-3 py-3 text-gray-800 placeholder-gray-500 focus:outline-none"
                  placeholder="Company"
                />
              </div>

              <div className="flex flex-col">
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="w-full rounded-lg bg-white px-3 py-3 text-gray-800 placeholder-gray-500 focus:outline-none"
                  placeholder="Tell us about your project..."
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  id="newsletter"
                  name="newsletter"
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#33fff9] bg-white text-[#33fff9] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="newsletter" className="text-sm text-black">
                  Subscribe to our newsletter for AI & Digital Transformation updates
                </label>
              </div>

              {submitError && (
                <div className="text-red-500 text-sm text-center">
                  {submitError}
                </div>
              )}

              <div className="flex items-center justify-center pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-3xl bg-black text-white text-base font-bold hover:scale-[1.01] transition-transform duration-200 focus:outline-none focus:ring-0 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "SENDING..." : "SEND"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
