import React from "react";

const setupSteps = [
  {
    icon: "/figmaAssets/icon-3.svg",
    title: "Connect Your Gmail",
    description:
      "Securely connect your Gmail account with OAuth authentication. We only access what we need.",
  },
  {
    icon: "/figmaAssets/icon-4.svg",
    title: "Configure AI Prompts",
    description:
      "Set up custom prompts or use simple hints. ZenBox's AI learns your preferences and creates smart filtering rules.",
  },
  {
    icon: "/figmaAssets/icon-2.svg",
    title: "Enjoy Smart Filtering",
    description:
      "Watch as ZenBox's AI automatically processes your emails, creates summaries, and keeps you organized",
  },
];

const leftBenefits = [
  {
    content: (
      <>
        <span className="text-[#b2b8bf] leading-[var(--content-13-line-height)] font-content-13 [font-style:var(--content-13-font-style)] font-[number:var(--content-13-font-weight)] tracking-[var(--content-13-letter-spacing)] text-[length:var(--content-13-font-size)]">
          Reduce email clutter by
        </span>
        <span className="font-bold text-[#b2b8bf] text-sm leading-5">
          &nbsp;
        </span>
        <span className="font-semibold text-white text-[15px] leading-[22px]">
          90%
        </span>
      </>
    ),
  },
  {
    content: (
      <>
        <span className="text-[#b2b8bf] leading-[var(--content-13-line-height)] font-content-13 [font-style:var(--content-13-font-style)] font-[number:var(--content-13-font-weight)] tracking-[var(--content-13-letter-spacing)] text-[length:var(--content-13-font-size)]">
          Save
        </span>
        <span className="font-bold text-[#b2b8bf] text-sm leading-[0.1px]">
          &nbsp;
        </span>
        <span className="font-semibold text-white text-[15px] leading-[22px]">
          2+ hours
        </span>
        <span className="font-bold text-[#b2b8bf] text-sm leading-[0.1px]">
          &nbsp;
        </span>
        <span className="text-[#b2b8bf] leading-[var(--content-13-line-height)] font-content-13 [font-style:var(--content-13-font-style)] font-[number:var(--content-13-font-weight)] tracking-[var(--content-13-letter-spacing)] text-[length:var(--content-13-font-size)]">
          daily on <br />
          email management
        </span>
      </>
    ),
  },
  {
    content: (
      <>
        <span className="font-semibold text-white leading-[22px]">
          Never miss
        </span>
        <span className="font-semibold text-[#b2b8bf] leading-[22px]">
          &nbsp;
        </span>
        <span className="font-bold text-[#b2b8bf] text-sm leading-[0.1px]">
          {" "}
        </span>
        <span className="text-[#b2b8bf] text-[length:var(--content-13-font-size)] leading-[var(--content-13-line-height)] font-content-13 [font-style:var(--content-13-font-style)] font-[number:var(--content-13-font-weight)] tracking-[var(--content-13-letter-spacing)]">
          important emails again
        </span>
      </>
    ),
  },
];

const rightBenefits = [
  {
    content: (
      <>
        <span className="font-semibold text-white leading-[22px]">
          Automated
        </span>
        <span className="text-[#b2b8bf] text-sm leading-5">
          {" "}
          spam detection and blocking
        </span>
      </>
    ),
    hasShadow: true,
  },
  {
    content: (
      <>
        <span className="font-semibold text-white leading-[22px]">
          Custom fi
        </span>
        <span className="font-semibold text-white leading-[22px]">ltering</span>
        <span className="font-semibold text-white leading-[22px]"> rules</span>
        <span className="font-bold text-[#b2b8bf] text-sm leading-[0.1px]">
          {"  "}
        </span>
        <span className="text-[#b2b8bf] text-[length:var(--content-13-font-size)] leading-[var(--content-13-line-height)] font-content-13 [font-style:var(--content-13-font-style)] font-[number:var(--content-13-font-weight)] tracking-[var(--content-13-letter-spacing)]">
          that learn from you
        </span>
      </>
    ),
    hasShadow: false,
  },
  {
    content: (
      <>
        <span className="font-semibold text-white leading-[22px]">
          Real-time
        </span>
        <span className="font-bold text-[#b2b8bf] text-sm leading-[0.1px]">
          &nbsp;
        </span>
        <span className="text-[#b2b8bf] text-[length:var(--content-13-font-size)] leading-[var(--content-13-line-height)] font-content-13 [font-style:var(--content-13-font-style)] font-[number:var(--content-13-font-weight)] tracking-[var(--content-13-letter-spacing)]">
          processing and notifications
        </span>
      </>
    ),
    hasShadow: false,
  },
];

export const EasySetupSection = (): JSX.Element => {
  return (
    <section className="flex flex-col w-full max-w-[1000px] mx-auto items-center gap-[100px] mt-20 px-4">
      <header className="flex flex-col w-full max-w-[512px] items-center gap-5">
        <div className="inline-flex flex-col items-center justify-center">
          <h2 className="w-fit [font-family:'Montserrat',Helvetica] font-bold text-white text-[32px] tracking-[0] leading-[normal]">
            SIMPLE SETUP
          </h2>

          <h3 className="w-fit bg-[linear-gradient(90deg,rgba(51,255,249,1)_0%,rgba(39,180,222,1)_25%,rgba(22,69,181,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent] [font-family:'Montserrat',Helvetica] font-bold text-transparent text-[32px] tracking-[0] leading-[normal]">
            POWERFUL RESULTS
          </h3>
        </div>

        <p className="w-full font-undertitle font-[number:var(--undertitle-font-weight)] text-[#b2b8bf] text-[length:var(--undertitle-font-size)] text-center tracking-[var(--undertitle-letter-spacing)] leading-[var(--undertitle-line-height)] [font-style:var(--undertitle-font-style)]">
          Get started in minutes with Siftly&apos;s intuitive setup process and
          watch AI transform your email experience.
        </p>
      </header>

      <div className="flex items-center gap-6 w-full">
        {setupSteps.map((step, index) => (
          <React.Fragment key={index}>
            <article className="flex flex-col w-60 items-center gap-9">
              <img
                className="w-[66px] h-[66px]"
                alt={`${step.title} icon`}
                src={step.icon}
              />

              <div className="flex flex-col items-start w-full gap-4">
                <h4 className="w-full font-title-17 font-[number:var(--title-17-font-weight)] text-[#f2f2f2] text-[length:var(--title-17-font-size)] text-center tracking-[var(--title-17-letter-spacing)] leading-[var(--title-17-line-height)] [font-style:var(--title-17-font-style)]">
                  {step.title}
                </h4>

                <p className="w-full font-content-13 font-[number:var(--content-13-font-weight)] text-[#b2b8bf] text-[length:var(--content-13-font-size)] text-center tracking-[var(--content-13-letter-spacing)] leading-[var(--content-13-line-height)] [font-style:var(--content-13-font-style)]">
                  {step.description}
                </p>
              </div>
            </article>

            {index < setupSteps.length - 1 && (
              <img
                className="w-[91.92px] h-[91.92px] object-cover"
                alt="Arrow pointing right"
                src={
                  index === 0
                    ? "/figmaAssets/arrow-up-1.png"
                    : "/figmaAssets/arrow-up-2.png"
                }
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="relative w-full max-w-[1000px] h-[465px]">
        <div className="flex flex-col w-[260px] h-80 items-start gap-[62px] absolute top-[33px] left-0">
          {leftBenefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center justify-center gap-2.5 px-8 w-[260px] h-[70px] rounded-[100px] border border-solid border-[#ffffff4d] relative z-10"
            >
              <div className="w-fit [font-family:'Montserrat',Helvetica] font-normal text-transparent text-center tracking-[0]">
                {benefit.content}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col w-[260px] h-[322px] items-start gap-[62px] absolute top-[33px] left-[740px]">
          {rightBenefits.map((benefit, index) => (
            <div
              key={index}
              className={`flex items-center justify-center gap-2.5 px-8 w-[260px] h-[70px] rounded-[100px] border border-solid border-[#ffffff4d] relative z-10 ${benefit.hasShadow ? "shadow-[0px_4px_4px_#00000040]" : ""}`}
            >
              <div className="w-fit [font-family:'Montserrat',Helvetica] font-normal text-transparent text-center tracking-[0]">
                {benefit.content}
              </div>
            </div>
          ))}
        </div>

        <div className="absolute top-[19px] left-[calc(50.00%_-_137px)] w-[343px] h-[378px] rounded-[1000px] blur-[250px]" />

        <img
          className="absolute w-auto h-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain"
          alt="ZenBox AI email filtering visualization"
          src="/figmaAssets/Layer 2.png"
        />
      </div>
    </section>
  );
};
