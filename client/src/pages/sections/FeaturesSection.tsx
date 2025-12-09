import React from "react";
import { Button } from "@/components/ui/button";

const appStoreButtons = [
  {
    icon: "/figmaAssets/apple.svg",
    iconAlt: "Apple",
    iconWidth: "w-5",
    iconHeight: "h-6",
    topText: "Download on the",
    topTextClass:
      "[font-family:'SF_Compact_Text-Medium',Helvetica] font-medium text-white text-[9px] tracking-[0] leading-[9px]",
    bottomText: "App Store",
    bottomTextClass:
      "[font-family:'SF_Compact_Display-Medium',Helvetica] font-medium text-white text-lg tracking-[-0.47px] leading-[18px]",
    bottomTextType: "text",
  },
  {
    icon: "/figmaAssets/playstore.svg",
    iconAlt: "Playstore",
    iconWidth: "w-[21px]",
    iconHeight: "h-6",
    topText: "GET IT ON",
    topTextClass:
      "[font-family:'Product_Sans-Regular',Helvetica] font-normal text-white text-[10px] tracking-[0] leading-[normal]",
    bottomText: "/figmaAssets/path90.svg",
    bottomTextClass: "w-[74px] h-[15px]",
    bottomTextType: "image",
  },
];

const features = [
  {
    icon: "/figmaAssets/union.svg",
    iconAlt: "Union",
    iconClass: "w-[22px] h-[22px]",
    textParts: [
      { text: "24/7", className: "font-semibold text-white" },
      { text: " Support", className: "font-semibold text-[#b2b8bf]" },
    ],
  },
  {
    icon: "/figmaAssets/group-25.png",
    iconAlt: "Group",
    iconClass: "w-[22px] h-[22px]",
    textParts: [
      { text: "Free ", className: "font-semibold text-[#b2b8bf]" },
      { text: "14-day", className: "font-semibold text-white" },
      { text: " Trial", className: "font-semibold text-[#b2b8bf]" },
    ],
  },
  {
    icon: "/figmaAssets/frame-67.svg",
    iconAlt: "Frame",
    iconClass: "w-[22px]",
    textParts: [
      { text: "Bank-level", className: "font-semibold text-white" },
      { text: " Security", className: "font-semibold text-[#b2b8bf]" },
    ],
  },
];

export const FeaturesSection = (): JSX.Element => {
  return (
    <section className="relative inline-flex flex-col items-center gap-8 md:gap-12 lg:gap-[68px] w-full pt-12 md:pt-16 lg:pt-20 pb-16 md:pb-24 lg:pb-32 overflow-hidden px-4">
      <img
        className="absolute bottom-0 left-0 w-auto h-[200px] md:h-[300px] lg:h-[400px] pointer-events-none opacity-60 mix-blend-screen"
        alt="Decor"
        src="/figmaAssets/decor-2.png"
      />
      <div className="relative z-10 inline-flex flex-col items-center gap-6 md:gap-8 lg:gap-10 flex-[0_0_auto] w-full">
        <div className="flex flex-col items-center gap-4 md:gap-5 w-full flex-[0_0_auto]">
          <div className="inline-flex flex-col items-center justify-center flex-[0_0_auto]">
            <h2 className="w-fit mt-[-1.00px] bg-[linear-gradient(90deg,rgba(51,255,249,1)_0%,rgba(39,180,222,1)_25%,rgba(22,69,181,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent] [font-family:'Montserrat',Helvetica] font-bold text-transparent text-2xl md:text-3xl lg:text-[32px] tracking-[0] leading-[normal] text-center">
              TRANSFORM YOUR EMAIL
            </h2>

            <h2 className="w-fit [font-family:'Montserrat',Helvetica] font-bold text-white text-2xl md:text-3xl lg:text-[32px] tracking-[0] leading-[normal] text-center">
              EXPERIENCE TODAY
            </h2>
          </div>

          <p className="w-full max-w-[534px] px-4 md:px-0 font-content-13 font-[number:var(--content-13-font-weight)] text-[#b2b8bf] text-[length:var(--content-13-font-size)] text-center tracking-[var(--content-13-letter-spacing)] leading-[var(--content-13-line-height)] [font-style:var(--content-13-font-style)]">
            Join thousands of users who have revolutionized their email
            management with Siftly&apos;s AI-powered filtering
          </p>
        </div>

        <div className="inline-flex flex-col items-center justify-center gap-4 md:gap-6 flex-[0_0_auto] w-full">
          <div className="inline-flex items-center gap-3 md:gap-5 flex-[0_0_auto] flex-col md:flex-row">
            <div className="inline-flex items-center gap-4 md:gap-7 flex-[0_0_auto] flex-col md:flex-row">
              {appStoreButtons.map((button, index) => (
                <Button
                  key={index}
                  className="w-full md:w-40 h-12 flex justify-center gap-2 bg-black rounded-[100px] border border-white/10 items-center transition-all duration-300 hover:scale-105 hover:bg-gray"
                >
                  <img
                    className={`${button.iconWidth} ${button.iconHeight}`}
                    alt={button.iconAlt}
                    src={button.icon}
                  />

                  <div
                    className={
                      button.bottomTextType === "text"
                        ? "flex flex-col w-[78px] items-start"
                        : "inline-flex flex-col items-start gap-[3px] flex-[0_0_auto]"
                    }
                  >
                    <div className={`mt-[-1.00px] ${button.topTextClass}`}>
                      {button.topText}
                    </div>

                    {button.bottomTextType === "text" ? (
                      <div className={button.bottomTextClass}>
                        {button.bottomText}
                      </div>
                    ) : (
                      <img
                        className={button.bottomTextClass}
                        alt="Path"
                        src={button.bottomText}
                      />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <a
            href="#"
            className="w-fit p-3 [font-family:'Montserrat',Helvetica] font-bold text-[#33fef9] text-[13px] tracking-[0] leading-5 underline whitespace-nowrap transform transition-all duration-400ms ease-in-out scale-95 hover:scale-105 hover:text-[#33fef9]/80 hover:border-white/30 hover:bg-white"
          >
            View Privacy Policy
          </a>
        </div>
      </div>

      <div className="inline-flex items-start gap-4 md:gap-5 lg:gap-6 flex-[0_0_auto] flex-col md:flex-row px-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex w-full md:w-auto md:min-w-[180px] lg:w-[200px] items-center justify-center gap-3"
          >
            <img
              className={feature.iconClass}
              alt={feature.iconAlt}
              src={feature.icon}
            />

            <div className="w-fit [font-family:'Montserrat',Helvetica] font-normal text-transparent text-xs tracking-[0] leading-5 whitespace-nowrap">
              {feature.textParts.map((part, partIndex) => (
                <span key={partIndex} className={part.className}>
                  {part.text}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
