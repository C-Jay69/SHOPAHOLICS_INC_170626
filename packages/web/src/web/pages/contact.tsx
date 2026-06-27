import { useState } from "react";
import { Mail, MessageCircle, Clock, CheckCircle } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate send
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
  };

  const inputClass = "w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm";

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-gray-400">We don't have a phone number. This is the internet. Email is fine.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info */}
          <div className="space-y-4">
            <div className="card p-5">
              <Mail size={22} className="text-purple-400 mb-3" />
              <h3 className="font-semibold text-white mb-1">Email</h3>
              <p className="text-gray-400 text-sm">support@shopaholicsinc.store</p>
              <p className="text-gray-600 text-xs mt-1">For orders, returns, everything.</p>
            </div>
            <div className="card p-5">
              <MessageCircle size={22} className="text-cyan-400 mb-3" />
              <h3 className="font-semibold text-white mb-1">Live Chat</h3>
              <p className="text-gray-400 text-sm">Available on weekdays</p>
              <p className="text-gray-600 text-xs mt-1">9am–6pm EST. Maybe later if we're feeling it.</p>
            </div>
            <div className="card p-5">
              <Clock size={22} className="text-green-400 mb-3" />
              <h3 className="font-semibold text-white mb-1">Response Time</h3>
              <p className="text-gray-400 text-sm">Under 24 hours</p>
              <p className="text-gray-600 text-xs mt-1">We actually read these. Pinky promise.</p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            {sent ? (
              <div className="card p-10 flex flex-col items-center justify-center text-center h-full">
                <CheckCircle size={56} className="text-green-400 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Message sent!</h2>
                <p className="text-gray-400">
                  We got it. Someone will respond within 24 hours. Unless it's a weekend. Then Monday.
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="mt-6 text-sm text-purple-400 hover:text-purple-300"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <div className="card p-6">
                <h2 className="font-bold text-white text-xl mb-6">Send a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Name</label>
                      <input required value={form.name} onChange={set("name")} placeholder="Your Name" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Email</label>
                      <input type="email" required value={form.email} onChange={set("email")} placeholder="you@email.com" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Subject</label>
                    <select value={form.subject} onChange={set("subject")} required className={inputClass}>
                      <option value="">Select a topic...</option>
                      <option value="order">Order Issue</option>
                      <option value="return">Return / Refund</option>
                      <option value="shipping">Shipping Question</option>
                      <option value="product">Product Question</option>
                      <option value="account">Account Help</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Message</label>
                    <textarea
                      required
                      value={form.message}
                      onChange={set("message")}
                      placeholder="Tell us what's going on..."
                      rows={5}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-3 rounded-xl font-semibold disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
