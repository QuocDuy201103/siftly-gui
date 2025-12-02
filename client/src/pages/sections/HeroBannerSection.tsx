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
      <div className="relative w-full h-[951px]">
        <div className="absolute top-[55px] left-1/2 -translate-x-1/2 w-[610px] h-[610px] bg-[#2fe5ef] rounded-[304.86px/304.81px] blur-[300px]" />

        <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-x-[142px] w-[696px] h-[696px] bg-[#1d71c5] rounded-[347.85px/347.79px] blur-[250px]" />

        <img
          className="absolute w-full h-[94.53%] top-[5.47%] left-0"
          alt="Letter"
          src="/figmaAssets/letter.png"
        />

        <div className="absolute top-[290px] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-7">
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex flex-col items-center w-full">
              <h1 className="text-white text-6xl leading-[72.0px] whitespace-nowrap [font-family:'Montserrat',Helvetica] font-bold text-center tracking-[0]">
                SMART EMAIL
              </h1>

              <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-white text-2xl text-center tracking-[0] leading-[28.8px] whitespace-nowrap">
                FILTERING THAT ACTUALLY WORKS
              </h2>
            </div>

            <p className="w-[586px] font-undertitle font-[number:var(--undertitle-font-weight)] text-white text-[length:var(--undertitle-font-size)] text-center tracking-[var(--undertitle-letter-spacing)] leading-[var(--undertitle-line-height)] [font-style:var(--undertitle-font-style)]">
              Connect your Gmail account and let Siftly&#39;s AI intelligently
              organize, filter, and manage your emails. Save hours daily with
              automated categorization <br />
              and smart summaries.
            </p>
          </div>

          <div className="inline-flex gap-5 items-center">
            <div className="inline-flex items-center gap-7">
              {downloadButtons.map((button, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-40 h-10 flex justify-center gap-2 bg-black rounded-[100px] border border-solid shadow-[0px_0px_10px_#00ffff33] items-center hover:bg-black/90"
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
