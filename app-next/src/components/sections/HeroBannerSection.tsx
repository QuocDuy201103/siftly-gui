/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Button } from "@/components/ui/button";

export const HeroBannerSection = (): JSX.Element => {
  const downloadButtons = [
    {
      icon: "/figmaAssets/apple.svg",
      iconAlt: "Apple",
      iconClass: "w-5 h-6",
      topText: "Download on the",
      topTextClass:
        "[font-family:'SF_Compact_Text-Medium',Helvetica] font-medium text-white text-[9px] tracking-[0] leading-[9px]",
      bottomText: "App Store",
      bottomTextClass:
        "[font-family:'SF_Compact_Display-Medium',Helvetica] font-medium text-white text-lg tracking-[-0.47px] leading-[18px]",
      textContainerClass: "flex flex-col w-[78px] items-start",
    },
    {
      icon: "/figmaAssets/playstore.svg",
      iconAlt: "Playstore",
      iconClass: "w-[21px] h-6",
      topText: "GET IT ON",
      topTextClass:
        "[font-family:'Product_Sans-Regular',Helvetica] font-normal text-white text-[10px] tracking-[0] leading-[normal]",
      bottomImage: "/figmaAssets/path90.svg",
      bottomImageClass: "w-[74px] h-[15px]",
      textContainerClass: "inline-flex flex-col items-start gap-[3px]",
    },
  ];

  return (
    <section className="relative w-full">
      <div className="relative w-full h-[500px] md:h-[800px] lg:h-[951px]">
        <div className="absolute top-[55px] left-1/2 -translate-x-1/2 w-[300px] h-[300px] md:w-[450px] md:h-[450px] lg:w-[610px] lg:h-[610px] bg-[#2fe5ef] rounded-[304.86px/304.81px] blur-[300px]" />

        <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-x-[71px] md:translate-x-[100px] lg:translate-x-[142px] w-[350px] h-[350px] md:w-[500px] md:h-[500px] lg:w-[696px] lg:h-[696px] bg-[#1d71c5] rounded-[347.85px/347.79px] blur-[250px]" />

        <img
          className="hidden md:block absolute w-auto h-auto max-w-[80%] md:max-w-[85%] lg:max-w-full max-h-[60%] md:max-h-[75%] lg:max-h-[95%] top-[5.47%] left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none"
          alt="Email background"
          src="/figmaAssets/Group 98.png"
        />

        <img
          className="hidden md:block absolute w-auto h-auto max-w-[80%] md:max-w-[85%] lg:max-w-full max-h-[60%] md:max-h-[75%] lg:max-h-[95%] top-[5.47%] left-1/2 -translate-x-1/2 z-0 pointer-events-none select-none"
          alt="Letter"
          src="/figmaAssets/letter.png"
        />

        <div className="absolute top-[120px] md:top-[240px] lg:top-[310px] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-4 md:gap-6 lg:gap-7 px-4">
          <div className="flex flex-col items-center gap-3 md:gap-4 w-full">
            <div className="flex flex-col items-center w-full">
              <h1 className="text-white text-3xl md:text-4xl lg:text-6xl leading-[36px] md:leading-[48px] lg:leading-[72.0px] whitespace-nowrap [font-family:'Montserrat',Helvetica] font-bold text-center tracking-[0]">
                SMART EMAIL
              </h1>

              <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-white text-base md:text-xl lg:text-2xl text-center tracking-[0] leading-[20px] md:leading-[24px] lg:leading-[28.8px] whitespace-nowrap">
                FILTERING THAT ACTUALLY WORKS
              </h2>
            </div>

            <p className="w-full max-w-[586px] px-4 md:px-0 font-undertitle font-[number:var(--undertitle-font-weight)] text-white text-[length:var(--undertitle-font-size)] text-center tracking-[var(--undertitle-letter-spacing)] leading-[var(--undertitle-line-height)] [font-style:var(--undertitle-font-style)]">
              Connect your Gmail account and let Siftly&#39;s AI intelligently
              organize, filter, and manage your emails. Save hours daily with
              automated categorization <br className="hidden md:block" />
              and smart summaries.
            </p>
          </div>

          <div className="inline-flex gap-3 md:gap-5 items-center flex-col md:flex-row">
            <div className="inline-flex items-center gap-4 md:gap-7 flex-col md:flex-row">
              {downloadButtons.map((button, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full md:w-40 h-12 flex justify-center gap-2 bg-black rounded-[100px] border border-white/10 items-center transition-all duration-300 hover:scale-105 hover:bg-gray"
                >
                  <img
                    className={button.iconClass}
                    alt={button.iconAlt}
                    src={button.icon}
                  />

                  <div className={button.textContainerClass}>
                    <div className={`mt-[-1.00px] ${button.topTextClass}`}>
                      {button.topText}
                    </div>

                    {button.bottomText ? (
                      <div className={button.bottomTextClass}>
                        {button.bottomText}
                      </div>
                    ) : (
                      <img
                        className={button.bottomImageClass}
                        alt="Path"
                        src={button.bottomImage}
                      />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
