import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: "/figmaAssets/union-3.svg",
    title: "Custom Prompts",
    description:
      "Configure advanced AI prompts or use simple hints to train the filtering system.",
    background: "bg-[url(/figmaAssets/group-5-3.svg)]",
  },
  {
    icon: "/figmaAssets/union-5.svg",
    title: "Gmail Integration",
    description:
      "Seamlessly connects with your Gmail account for real-time email processing and management.",
    background: "bg-[url(/figmaAssets/group-5-3.svg)]",
  },
  {
    icon: "/figmaAssets/union-2.svg",
    title: "Smart Categorization",
    description:
      "Automatically sorts emails into custom labels and categories for better organization.",
    background: "bg-[url(/figmaAssets/group-5-1.svg)]",
  },
  {
    icon: "/figmaAssets/union-1.svg",
    title: "Smart Categorization",
    description:
      "Configure advanced AI prompts or use simple hints to train the filtering system.",
    background: "bg-[url(/figmaAssets/group-5-2.svg)]",
  },
  {
    icon: "/figmaAssets/union.svg",
    title: "Automated Processing",
    description:
      "Seamlessly connects with your Gmail account for real-time email processing and management.",
    background: "bg-[url(/figmaAssets/group-5-2.svg)]",
  },
  {
    icon: "/figmaAssets/union-6.svg",
    title: "Custom Prompts",
    description:
      "Automatically sorts emails into custom labels and categories for better organization.",
    background: "bg-[url(/figmaAssets/group-5.svg)]",
  },
];

export const OverviewSection = (): JSX.Element => {
  return (
    <section className="flex flex-col w-full items-center gap-[100px] py-20">
      <div className="flex flex-col max-w-[597px] items-center gap-5">
        <div className="flex flex-col max-w-[570px] items-center">
          <div className="inline-flex flex-col items-center">
            <h2 className="w-fit bg-[linear-gradient(90deg,rgba(51,255,249,1)_0%,rgba(39,180,222,1)_25%,rgba(22,69,181,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent] [font-family:'Montserrat',Helvetica] font-bold text-transparent text-[32px] text-center tracking-[0] leading-[normal]">
              EVERYTHING YOU NEED
            </h2>
          </div>

          <div className="inline-flex items-center gap-2.5 px-2.5 py-0">
            <h3 className="w-fit [font-family:'Montserrat',Helvetica] font-bold text-white text-[32px] tracking-[0] leading-[normal]">
              FOR EMAIL MANAGEMENT
            </h3>
          </div>
        </div>

        <p className="font-undertitle font-[number:var(--undertitle-font-weight)] text-[#b2b8bf] text-[length:var(--undertitle-font-size)] text-center tracking-[var(--undertitle-letter-spacing)] leading-[var(--undertitle-line-height)] [font-style:var(--undertitle-font-style)]">
          SIFTLY&#39;s AI-powered platform combines advanced filtering with
          intuitive controls to give you complete email mastery
        </p>
      </div>

      <div className="flex flex-col w-full max-w-[1000px] items-start gap-20">
        <div className="grid grid-cols-3 gap-[50px] w-full">
          {features.slice(0, 3).map((feature, index) => (
            <Card
              key={`feature-top-${index}`}
              className={`w-full h-[230px] ${feature.background} bg-[100%_100%] border-0`}
            >
              <CardContent className="flex flex-col items-center justify-between h-full p-0">
                <div className="flex w-full items-center justify-start pt-[22px] pl-0">
                  <img
                    className="w-auto h-6 max-w-[22.36px]"
                    alt={feature.title}
                    src={feature.icon}
                  />
                </div>

                <div className="flex w-[236px] items-center flex-col gap-4 pb-8">
                  <h4 className="w-full font-title-17 font-[number:var(--title-17-font-weight)] text-[#f2f2f2] text-[length:var(--title-17-font-size)] text-center tracking-[var(--title-17-letter-spacing)] leading-[var(--title-17-line-height)] [font-style:var(--title-17-font-style)]">
                    {feature.title}
                  </h4>

                  <p className="w-full font-content-13 font-[number:var(--content-13-font-weight)] text-[#b2b8bf] text-[length:var(--content-13-font-size)] text-center tracking-[var(--content-13-letter-spacing)] leading-[var(--content-13-line-height)] [font-style:var(--content-13-font-style)]">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-[50px] w-full">
          {features.slice(3, 6).map((feature, index) => (
            <Card
              key={`feature-bottom-${index}`}
              className={`w-full h-[230px] ${feature.background} bg-[100%_100%] border-0`}
            >
              <CardContent className="flex flex-col items-center justify-between h-full p-0">
                <div className="flex w-full items-center justify-start pt-[22px] pl-0">
                  <img
                    className="w-auto h-6 max-w-[22.36px]"
                    alt={feature.title}
                    src={feature.icon}
                  />
                </div>

                <div className="flex w-[236px] items-center flex-col gap-4 pb-8">
                  <h4 className="w-full font-title-17 font-[number:var(--title-17-font-weight)] text-[#f2f2f2] text-[length:var(--title-17-font-size)] text-center tracking-[var(--title-17-letter-spacing)] leading-[var(--title-17-line-height)] [font-style:var(--title-17-font-style)]">
                    {feature.title}
                  </h4>

                  <p className="w-full font-content-13 font-[number:var(--content-13-font-weight)] text-[#b2b8bf] text-[length:var(--content-13-font-size)] text-center tracking-[var(--content-13-letter-spacing)] leading-[var(--content-13-line-height)] [font-style:var(--content-13-font-style)]">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
