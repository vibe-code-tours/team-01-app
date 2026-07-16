"use client";

import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-100/60 via-blue-50/40 to-cyan-100/50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMS41IiBmaWxsPSIjMUU2MDkxIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-40"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-20 text-center">
          <span className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold mb-4 animate-fade-in">Contact Us</span>
          <h1 className="text-3xl md:text-5xl font-bold mt-3 mb-4 animate-fade-in-up">Get in <span className="text-cyan-600">Touch</span></h1>
          <p className="text-base-content/60 max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            Have a question or need help? We&apos;d love to hear from you.
          </p>
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,15 1440,30 L1440,60 L0,60 Z" className="fill-base-100"/>
        </svg>
      </section>

      {/* Contact form + info */}
      <section className="py-20 px-4 bg-base-200/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left - Form */}
            <div>
              <span className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">Send Message</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-6">How Can We <span className="text-cyan-600">Help</span>?</h2>

              {submitted ? (
                <div className="text-center py-12 animate-scale-in">
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                  <p className="text-base-content/60 mb-6">We&apos;ll get back to you within 24 hours.</p>
                  <button className="btn btn-primary" onClick={() => setSubmitted(false)}>
                    Send Another
                  </button>
                </div>
              ) : (
                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitted(true);
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="form-control">
                      <label className="label" htmlFor="name">
                        <span className="label-text font-medium">Name</span>
                      </label>
                      <input id="name" type="text" placeholder="Your name" className="input w-full bg-base-100" required />
                    </div>
                    <div className="form-control">
                      <label className="label" htmlFor="email">
                        <span className="label-text font-medium">Email</span>
                      </label>
                      <input id="email" type="email" placeholder="you@example.com" className="input w-full bg-base-100" required />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label" htmlFor="subject">
                      <span className="label-text font-medium">Subject</span>
                    </label>
                    <select id="subject" className="select w-full bg-base-100" defaultValue="">
                      <option value="" disabled>Choose a subject</option>
                      <option>General Inquiry</option>
                      <option>Delivery Issue</option>
                      <option>Billing Question</option>
                      <option>Partnership</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label" htmlFor="message">
                      <span className="label-text font-medium">Message</span>
                    </label>
                    <textarea id="message" className="textarea h-32 bg-base-100 w-full" placeholder="How can we help?" required />
                  </div>

                  <button type="submit" className="btn btn-primary px-8">
                    Send Message
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </form>
              )}
            </div>

            {/* Right - Contact info cards */}
            <div className="space-y-4">
              <div className="bg-base-100 rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div className="text-sm font-semibold">Email</div>
                <div className="text-sm text-base-content/50">support@waterdelivery.com</div>
              </div>
              <div className="bg-base-100 rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div className="text-sm font-semibold">Phone</div>
                <div className="text-sm text-base-content/50">(555) 123-4567</div>
              </div>
              <div className="bg-base-100 rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div className="text-sm font-semibold">Hours</div>
                <div className="text-sm text-base-content/50">Mon&ndash;Fri, 8am&ndash;6pm</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}