import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const securityFeatures = [
  {
    icon: "/figmaAssets/icon.svg",
    title: "End to End Encryption",
    description: "Military-grade encryption protects your emails at all times.",
  },
  {
    icon: "/figmaAssets/icon-5.svg",
    title: "Local processing",
    description: "AI analysis happens on your device whenever possible.",
  },
  {
    icon: "/figmaAssets/icon-1.svg",
    title: "Zero Data Retention",
    description: "We don't store or analyze your personal email content",
  },
];

export const SecurityFeaturesSection = (): JSX.Element => {
  return (
    <section className="flex flex-col w-full items-center gap-9 py-12">
      <div className="inline-flex flex-col items-center gap-5 relative flex-[0_0_auto]">
        <div className="inline-flex flex-col items-center justify-center relative flex-[0_0_auto]">
          <h2 className="relative w-fit mt-[-1.00px] bg-[linear-gradient(90deg,rgba(51,255,249,1)_0%,rgba(39,180,222,1)_25%,rgba(22,69,181,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent] [font-family:'Montserrat',Helvetica] font-bold text-transparent text-[32px] tracking-[0] leading-[normal]">
            YOUR PRIVACY IS SACRES
          </h2>
        </div>

        <p className="relative w-[679px] font-undertitle font-[number:var(--undertitle-font-weight)] text-[#b2b8bf] text-[length:var(--undertitle-font-size)] text-center tracking-[var(--undertitle-letter-spacing)] leading-[var(--undertitle-line-height)] [font-style:var(--undertitle-font-style)]">
          Your privacy comes first. Siftly learns from your email habits <br />
          without ever compromising your security.
        </p>
      </div>

      <div className="inline-flex items-center justify-center relative flex-[0_0_auto]">
        <div className="flex w-full max-w-[1000px] items-center relative">
          <div className="inline-flex flex-col items-start justify-center gap-8 relative flex-[0_0_auto] z-10">
            {securityFeatures.map((feature, index) => (
              <Card
                key={index}
                className="inline-flex items-start justify-center gap-5 relative flex-[0_0_auto] rounded-[20px] backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)] bg-blend-overlay shadow-blur-glass border-0"
              >
                <CardContent className="inline-flex items-start justify-center gap-5 relative flex-[0_0_auto] p-0">
                  <img
                    className="relative w-[60px] h-[60px]"
                    alt={`${feature.title} icon`}
                    src={feature.icon}
                  />

                  <div className="inline-flex flex-col items-start gap-4 relative flex-[0_0_auto]">
                    <div className="inline-flex items-center justify-center gap-2.5 pt-5 pb-0 px-0 relative flex-[0_0_auto]">
                      <h3 className="relative w-fit mt-[-1.00px] font-title-17 font-[number:var(--title-17-font-weight)] text-white text-[length:var(--title-17-font-size)] tracking-[var(--title-17-letter-spacing)] leading-[var(--title-17-line-height)] whitespace-nowrap [font-style:var(--title-17-font-style)]">
                        {feature.title}
                      </h3>
                    </div>

                    <p className="relative w-[248px] font-content-13 font-[number:var(--content-13-font-weight)] text-[#b2b8bf] text-[length:var(--content-13-font-size)] tracking-[var(--content-13-letter-spacing)] leading-[var(--content-13-line-height)] [font-style:var(--content-13-font-style)]">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <img
            className="relative w-[1240.99px] h-[1390.15px] mt-[-461.27px] mb-[-446.88px] ml-[-20.99px] mr-[-220.00px]"
            alt="Security visualization"
            src="/figmaAssets/group.png"
          />
        </div>
      </div>
    </section>
  );
};
