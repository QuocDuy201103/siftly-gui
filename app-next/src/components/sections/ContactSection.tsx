import React from "react";
import { apiRequest } from "@/lib/queryClient";

export const ContactSection = (): JSX.Element => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  return (
    <section className="flex flex-col w-full items-center gap-6 md:gap-8 lg:gap-9 py-8 md:py-10 lg:py-12 px-4">
      <div className="inline-flex flex-col items-center gap-4 md:gap-5 relative flex-[0_0_auto] w-full">
        <div className="inline-flex flex-col items-center justify-center relative flex-[0_0_auto]">
          <h2 className="relative w-fit mt-[-1.00px] bg-[linear-gradient(90deg,rgba(51,255,249,1)_0%,rgba(39,180,222,1)_25%,rgba(22,69,181,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent] [font-family:'Montserrat',Helvetica] font-bold text-transparent text-2xl md:text-3xl lg:text-[32px] tracking-[0] leading-[normal] text-center">
            CONTACTS US
          </h2>
        </div>

        <p className="relative w-full max-w-[679px] px-4 md:px-0 font-undertitle font-[number:var(--undertitle-font-weight)] text-[#b2b8bf] text-[length:var(--undertitle-font-size)] text-center tracking-[var(--undertitle-letter-spacing)] leading-[var(--undertitle-line-height)] [font-style:var(--undertitle-font-style)]">
          Get in touch with us. We&apos;d love to hear about your project <br className="hidden md:block" />
          and how we can help transform your business.
        </p>
      </div>

      <div className="w-full max-w-2xl relative">
        <div className="p-6 md:p-8">
          {submitSuccess ? (
            <div className="text-center py-12">
              <h3 className="text-2xl md:text-3xl font-bold text-[#33fff9] mb-4">
                Thank You!
              </h3>
              <p className="text-white text-lg mb-6">
                Your message has been sent successfully. We&apos;ll get back to you soon.
              </p>
              <button
                type="button"
                onClick={() => setSubmitSuccess(false)}
                className="py-3 px-8 rounded-3xl bg-[#33fff9] text-[#001429] text-base font-bold hover:scale-[1.05] hover:shadow-lg hover:shadow-[#33fff9]/50 transition-all duration-200 focus:outline-none focus:ring-0 focus:ring-offset-0"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form
              className="space-y-6"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                setIsSubmitting(true);
                setSubmitError(null);

                const formData = new FormData(form);
                const firstName = formData.get("firstName") as string;
                const lastName = formData.get("lastName") as string;
                const data = {
                  fullName: `${firstName} ${lastName}`.trim(),
                  email: formData.get("email") as string,
                  company: formData.get("company") as string || undefined,
                  message: formData.get("message") as string,
                  newsletter: formData.get("newsletter") === "on",
                };

                try {
                  await apiRequest("POST", "/api/contact", data);
                  // Reset form
                  form.reset();
                  setSubmitSuccess(true);
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <input
                    id="firstName"
                    name="firstName"
                    className="w-full bg-transparent border-0 border-b-[1px] border-[#999999] px-0 py-2 text-white placeholder-gray-200 focus:outline-none focus:border-[#33fff9] focus:ring-0"
                    placeholder="First name"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <input
                    id="lastName"
                    name="lastName"
                    className="w-full bg-transparent border-0 border-b-[1px] border-[#999999] px-0 py-2 text-white placeholder-gray-200 focus:outline-none focus:border-[#33fff9] focus:ring-0"
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <input
                  id="company"
                  name="company"
                  className="w-full bg-transparent border-0 border-b-[1px] border-[#999999] px-0 py-2 text-white placeholder-gray-200 focus:outline-none focus:border-[#33fff9] focus:ring-0"
                  placeholder="Company"
                />
              </div>

              <div className="flex flex-col">
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="w-full bg-transparent border-0 border-b-[1px] border-[#999999] px-0 py-2 text-white placeholder-gray-200 focus:outline-none focus:border-[#33fff9] focus:ring-0"
                  placeholder="Email"
                  required
                />
              </div>

              <div className="flex flex-col">
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full bg-transparent border-0 border-b-[1px] border-[#999999] px-0 py-2 text-white placeholder-gray-200 focus:outline-none focus:border-[#33fff9] focus:ring-0 resize-none"
                  placeholder="Tell us about your project..."
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  id="newsletter"
                  name="newsletter"
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#33fff9] bg-transparent text-[#33fff9] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="newsletter" className="text-sm text-white">
                  Subscribe to our newsletter for AI & Digital Transformation updates.
                </label>
              </div>

              {submitError && (
                <div className="text-red-400 text-sm text-center bg-red-900/30 p-3 rounded-lg border border-red-500/50">
                  {submitError}
                </div>
              )}

              <div className="flex items-center justify-center pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-20 py-3 rounded-full bg-[#33fff9] text-[#001429] text-lg font-bold hover:scale-[1.05] transition-all duration-200 focus:outline-none focus:ring-0 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "SENDING..." : "Send"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

