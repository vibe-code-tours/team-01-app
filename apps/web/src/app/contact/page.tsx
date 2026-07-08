"use client";

import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Contact Us</h1>
        <p className="text-center text-base-content/70 mb-12">
          Have a question or need help? We&apos;d love to hear from you.
        </p>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            {submitted ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-2xl font-bold">Message Sent!</h3>
                <p className="text-base-content/70 mt-2">We&apos;ll get back to you within 24 hours.</p>
                <button className="btn btn-primary mt-4" onClick={() => setSubmitted(false)}>
                  Send Another
                </button>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
              >
                <div className="form-control">
                  <label className="label" htmlFor="name">
                    <span className="label-text">Name</span>
                  </label>
                  <input id="name" type="text" placeholder="Your name" className="input input-bordered w-full" required />
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="email">
                    <span className="label-text">Email</span>
                  </label>
                  <input id="email" type="email" placeholder="you@example.com" className="input input-bordered w-full" required />
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="subject">
                    <span className="label-text">Subject</span>
                  </label>
                  <select id="subject" className="select select-bordered w-full" defaultValue="">
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
                    <span className="label-text">Message</span>
                  </label>
                  <textarea id="message" className="textarea textarea-bordered h-32" placeholder="How can we help?" required />
                </div>

                <button type="submit" className="btn btn-primary w-full">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-base-content/70 text-sm">
          <p>Email: support@waterdelivery.com | Phone: (555) 123-4567</p>
          <p>Business hours: Mon–Fri, 8am–6pm</p>
        </div>
      </div>
    </section>
  );
}