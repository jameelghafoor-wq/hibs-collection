import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { brand } from "@/config/brand";
import { Reveal } from "@/components/reveal";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — NOIR ÉLIXIR" },
      {
        name: "description",
        content:
          "Contact the NOIR ÉLIXIR perfume house — customer care, wholesale and press enquiries.",
      },
      { property: "og:title", content: "Contact — NOIR ÉLIXIR" },
      {
        property: "og:description",
        content: "Contact the house — customer care, wholesale and press enquiries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const mailto = `mailto:${brand.contact.email}?subject=${encodeURIComponent(
    `Enquiry from ${name || "the website"}`,
  )}&body=${encodeURIComponent(`${message}\n\n— ${name} (${email})`)}`;

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-32 sm:pt-40">
      <Reveal>
        <p className="micro-label text-gold">Contact</p>
        <h1 className="headline mt-4 text-4xl text-ivory sm:text-5xl">
          Get in <span className="gold-gradient-text">Touch</span>
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-smoke sm:text-base">
          Questions about an order, a fragrance, or a collaboration — we read every message.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <Reveal>
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <Mail className="mt-1 size-5 shrink-0 text-gold" />
              <div>
                <p className="micro-label text-[0.625rem] text-smoke">Email</p>
                <p className="mt-1.5 text-ivory">{brand.contact.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="mt-1 size-5 shrink-0 text-gold" />
              <div>
                <p className="micro-label text-[0.625rem] text-smoke">Phone</p>
                <p className="mt-1.5 text-ivory">{brand.contact.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="mt-1 size-5 shrink-0 text-gold" />
              <div>
                <p className="micro-label text-[0.625rem] text-smoke">Studio</p>
                <p className="mt-1.5 text-ivory">{brand.contact.address}</p>
                <p className="mt-1 text-sm text-smoke">{brand.contact.hours}</p>
              </div>
            </div>
            <p className="text-xs text-smoke/60">
              Contact details are demo placeholders until the store owner replaces them with real
              information.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <form action={mailto} method="get" className="border border-border bg-card p-7 sm:p-9">
            <div className="grid gap-6 sm:grid-cols-2">
              <label>
                <span className="micro-label text-[0.625rem] text-smoke">Your name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  className="mt-2 w-full border border-input bg-noir/60 px-4 py-3 text-sm text-ivory focus:border-gold focus:outline-none"
                />
              </label>
              <label>
                <span className="micro-label text-[0.625rem] text-smoke">Your email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                  className="mt-2 w-full border border-input bg-noir/60 px-4 py-3 text-sm text-ivory focus:border-gold focus:outline-none"
                />
              </label>
            </div>
            <label className="mt-6 block">
              <span className="micro-label text-[0.625rem] text-smoke">Message</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                maxLength={1500}
                className="mt-2 w-full border border-input bg-noir/60 px-4 py-3 text-sm text-ivory focus:border-gold focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="mt-8 inline-flex w-full items-center justify-center gap-2.5 bg-gold py-4 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-soft"
            >
              <Send className="size-4" />
              Send Message
            </button>
            <p className="mt-4 text-center text-xs text-smoke/70">
              This opens your email app with the message ready to send.
            </p>
          </form>
        </Reveal>
      </div>
    </div>
  );
}
