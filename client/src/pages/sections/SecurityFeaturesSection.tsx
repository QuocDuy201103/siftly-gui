import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const securityFeatures = [
  {
    icon: "/figmaAssets/icon.svg",
    title: "End to End Encryption",
    description:
      "Military-grade encryption protects\nyour emails at all times.",
  },
  {
    icon: "/figmaAssets/icon-5.svg",
    title: "Local processing",
    description:
      "AI analysis happens on your device\nwhenever possible.",
  },
  {
    icon: "/figmaAssets/icon-1.svg",
    title: "Zero Data Retention",
    description:
      "We don't store or analyze your\npersonal email content",
  },
];

export const SecurityFeaturesSection = (): JSX.Element => {
  return (
    <section className="flex flex-col w-full items-center gap-6 md:gap-8 lg:gap-9 py-8 md:py-10 lg:py-12 px-4">
      <div className="inline-flex flex-col items-center gap-4 md:gap-5 relative flex-[0_0_auto] w-full">
        <div className="inline-flex flex-col items-center justify-center relative flex-[0_0_auto]">
          <h2 className="relative w-fit mt-[-1.00px] bg-[linear-gradient(90deg,rgba(51,255,249,1)_0%,rgba(39,180,222,1)_25%,rgba(22,69,181,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent] [font-family:'Montserrat',Helvetica] font-bold text-transparent text-2xl md:text-3xl lg:text-[32px] tracking-[0] leading-[normal] text-center">
            YOUR PRIVACY IS SACRED
          </h2>
        </div>

        <p className="relative w-full max-w-[679px] px-4 md:px-0 font-undertitle font-[number:var(--undertitle-font-weight)] text-[#b2b8bf] text-[length:var(--undertitle-font-size)] text-center tracking-[var(--undertitle-letter-spacing)] leading-[var(--undertitle-line-height)] [font-style:var(--undertitle-font-style)]">
          Your privacy comes first. Siftly learns from your email habits <br className="hidden md:block" />
          without ever compromising your security.
        </p>
      </div>

      <div className="inline-flex items-center justify-center relative flex-[0_0_auto] w-full">
        <div className="flex w-full max-w-[1000px] items-center relative flex-col lg:flex-row gap-8 lg:gap-0">
          <div className="inline-flex flex-col items-start justify-center gap-6 md:gap-8 relative flex-[0_0_auto] z-10 w-full lg:w-auto">
            {securityFeatures.map((feature, index) => (
              <Card
                key={index}
                className="inline-flex items-start justify-center gap-4 md:gap-5 relative flex-[0_0_auto] rounded-[20px] backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)] bg-blend-overlay shadow-blur-glass border-0 w-full lg:w-auto"
              >
                <CardContent className="inline-flex items-start md:justify-center gap-4 md:gap-5 relative flex-[0_0_auto] p-4 md:p-0 w-full">
                  <img
                    className="relative w-[50px] h-[50px] md:w-[60px] md:h-[60px] flex-shrink-0"
                    alt={`${feature.title} icon`}
                    src={feature.icon}
                  />

                  <div className="inline-flex flex-col items-start gap-3 md:gap-4 relative flex-[0_0_auto] flex-1">
                    <div className="inline-flex items-center justify-center gap-2.5 pt-0 md:pt-5 pb-0 px-0 relative flex-[0_0_auto]">
                      <h3 className="relative w-fit mt-[-1.00px] font-title-17 font-[number:var(--title-17-font-weight)] text-white text-[length:var(--title-17-font-size)] tracking-[var(--title-17-letter-spacing)] leading-[var(--title-17-line-height)] whitespace-nowrap [font-style:var(--title-17-font-style)]">
                        {feature.title}
                      </h3>
                    </div>

                    <p className="relative w-full md:w-[248px] font-content-13 font-[number:var(--content-13-font-weight)] text-[#b2b8bf] text-[length:var(--content-13-font-size)] tracking-[var(--content-13-letter-spacing)] leading-[var(--content-13-line-height)] whitespace-pre-line break-words [font-style:var(--content-13-font-style)]">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <img
            className="hidden md:block relative w-full max-w-[90%] md:max-w-[500px] lg:max-w-[665px] object-contain lg:ml-auto"
            alt="Security visualization"
            src="/figmaAssets/object.png"
          />
        </div>
      </div>
    </section>
  );
};
