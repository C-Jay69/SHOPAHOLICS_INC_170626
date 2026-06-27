import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQS = [
  {
    q: "Is this a real store?",
    a: "Yes. Disturbingly so. We sell real products with real prices and we'll take your real money. Welcome.",
  },
  {
    q: "How long does shipping take?",
    a: "Standard shipping is 3–7 business days. Express is 1–2 days. We ship from various warehouse locations across the US.",
  },
  {
    q: "Do you offer free shipping?",
    a: "Orders over $50 ship free. Below that it's $9.99 flat. Encouragement to buy more — you're welcome.",
  },
  {
    q: "What is your return policy?",
    a: "30-day returns, no questions asked. Well, maybe one question. But mostly no questions. Items must be in original condition.",
  },
  {
    q: "What is the ImpulseCoach™?",
    a: "It's an AI that watches your cart and asks you — gently — if you really need another gadget. You can ignore it. Most people do. That's fine.",
  },
  {
    q: "How do I track my order?",
    a: "Once shipped, you'll receive a tracking number via email. You can also view order status in your Account page.",
  },
  {
    q: "Is my payment information safe?",
    a: "100%. We use Stripe for payments — your card details never touch our servers. We just get the cha-ching notification.",
  },
  {
    q: "Can I cancel or modify my order?",
    a: "If the order hasn't shipped yet, contact us immediately at support@shopaholicsinc.store. We'll do our best.",
  },
  {
    q: "Do you ship internationally?",
    a: "Currently US, Canada, UK, Mexico, and Australia. More countries coming. Patience.",
  },
  {
    q: "How do I contact support?",
    a: "Use the Contact page or email support@shopaholicsinc.store. We respond within 24 hours on weekdays.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/3"
      >
        <span className="font-medium text-white pr-4">{q}</span>
        {open ? <ChevronUp size={18} className="text-purple-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 text-gray-400 text-sm leading-relaxed border-t border-gray-800">
          <div className="pt-4">{a}</div>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h1>
          <p className="text-gray-400">
            Answers to the questions you were too embarrassed to ask.
          </p>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
        <div className="mt-12 card p-6 text-center">
          <p className="text-gray-400 mb-3">Still confused?</p>
          <a
            href="/contact"
            className="btn-primary px-6 py-2 rounded-lg font-semibold text-sm inline-block"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
