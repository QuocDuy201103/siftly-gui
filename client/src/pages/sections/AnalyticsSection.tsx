import React from "react";

const statistics = [
  {
    value: "90%",
    label: "Spam Detection Rate",
  },
  {
    value: "2.5hrs",
    label: "Daily Time Saved",
  },
  {
    value: "99.9%",
    label: "Accuracy Rate",
  },
];

export const AnalyticsSection = (): JSX.Element => {
  return (
    <section className="flex flex-col w-full items-center gap-12 md:gap-16 lg:gap-[100px] py-12 md:py-16 lg:py-20 px-4">
      <div className="flex flex-col w-full max-w-[512px] items-center gap-4 md:gap-5">
        <div className="inline-flex flex-col items-center justify-center">
          <h2 className="mt-[-1.00px] w-fit bg-[linear-gradient(90deg,rgba(51,255,249,1)_0%,rgba(39,180,222,1)_25%,rgba(22,69,181,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent] [font-family:'Montserrat',Helvetica] font-bold text-transparent text-2xl md:text-3xl lg:text-[32px] tracking-[0] leading-[normal] text-center">
            POWERFUL INSIGHTS
          </h2>

          <h2 className="w-fit [font-family:'Montserrat',Helvetica] font-bold text-white text-2xl md:text-3xl lg:text-[32px] tracking-[0] leading-[normal] text-center">
            AT YOUR FINGERTIPS
          </h2>
        </div>

        <p className="self-stretch font-undertitle font-[number:var(--undertitle-font-weight)] text-[#b2b8bf] text-[length:var(--undertitle-font-size)] text-center tracking-[var(--undertitle-letter-spacing)] leading-[var(--undertitle-line-height)] [font-style:var(--undertitle-font-style)]">
          Get detailed analytics about your email patterns, processing
          summaries, and productivity metrics.
        </p>
      </div>

      <div className="flex flex-col items-start gap-8 md:gap-10 lg:gap-[50px] w-full max-w-[1000px]">
        <div className="flex items-center justify-between gap-4 md:gap-6 lg:gap-[50px] w-full flex-col md:flex-row">
          {statistics.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col w-full md:w-[280px] lg:w-[300px] items-center gap-2 md:gap-3"
            >
              <div className="self-stretch mt-[-1.00px] [font-family:'Montserrat',Helvetica] font-bold text-white text-2xl md:text-[26px] lg:text-[28px] text-center tracking-[0] leading-7 md:leading-8 lg:leading-9">
                {stat.value}
              </div>

              <div className="self-stretch font-content-13 font-[number:var(--content-13-font-weight)] text-[#b2b8bf] text-[length:var(--content-13-font-size)] text-center tracking-[var(--content-13-letter-spacing)] leading-[var(--content-13-line-height)] [font-style:var(--content-13-font-style)]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <img
          className="w-full h-auto"
          alt="Dashboard"
          src="/figmaAssets/dashboard-1.svg"
        />
      </div>
    </section>
  );
};
