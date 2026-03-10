import { Link } from "react-router-dom";
import { MessageCircle, Trash2, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

// Frameflow Logo Component
function FrameflowLogo({ className = "w-10 h-10" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-gradient-dd" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#logo-gradient-dd)" />
      <path d="M20 24h24M20 32h18M20 40h22" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="40" r="6" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

export default function DataDeletionPage() {
  const whatsappLink = "https://wa.me/919330408074?text=" + encodeURIComponent("I want to delete my Frameflow data");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <FrameflowLogo className="w-10 h-10" />
            <span className="text-xl font-bold font-outfit text-slate-900">Frameflow</span>
          </Link>
          <Link to="/auth">
            <Button variant="outline" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-outfit text-slate-900">Request Data Deletion</h1>
              <p className="text-slate-500">We will delete all your data within 30 days of your request</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <h2>What Gets Deleted</h2>
            <p>When you request data deletion, we will permanently remove:</p>
            <ul>
              <li>Your account and login credentials</li>
              <li>All brand assets (logos, sample posts, brand DNA)</li>
              <li>Meta/Facebook access tokens</li>
              <li>All generated content (posts, reels, captions)</li>
              <li>Billing records and payment history</li>
              <li>Scraped media and content library</li>
              <li>Campaign data and analytics</li>
              <li>Scheduled posts and idea bank</li>
            </ul>

            <h2>How to Request Deletion</h2>
            <div className="bg-slate-50 rounded-xl p-6 not-prose">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Send us a message</h4>
                    <p className="text-slate-600 text-sm">Contact us via WhatsApp or email with your deletion request</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Verify your identity</h4>
                    <p className="text-slate-600 text-sm">We'll ask you to confirm your registered email address</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Deletion confirmation</h4>
                    <p className="text-slate-600 text-sm">We will confirm complete data deletion within 30 days</p>
                  </div>
                </div>
              </div>
            </div>

            <h2>Response Time</h2>
            <p>
              Your data will be deleted within <strong>30 days</strong> of your verified request, 
              as required by Meta Platform Policy.
            </p>
          </div>

          {/* Contact Options */}
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            {/* WhatsApp */}
            <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">WhatsApp (Preferred)</h3>
                  <p className="text-sm text-green-700">Fastest response</p>
                </div>
              </div>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-6 py-4 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
              >
                Request Deletion via WhatsApp
              </a>
            </div>

            {/* Email */}
            <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Email</h3>
                  <p className="text-sm text-slate-600">Alternative option</p>
                </div>
              </div>
              <a
                href="mailto:adreej@frameflow.me?subject=Data%20Deletion%20Request&body=I%20want%20to%20delete%20my%20Frameflow%20data.%20My%20registered%20email%20is%3A"
                className="block w-full text-center px-6 py-4 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-800 transition-colors"
              >
                adreej@frameflow.me
              </a>
            </div>
          </div>

          {/* Meta Compliance Note */}
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This page satisfies Meta's data deletion callback requirement 
              for apps using Facebook and Instagram APIs.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FrameflowLogo className="w-8 h-8" />
            <span className="text-slate-600">© 2026 Frameflow</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/privacy-policy" className="text-slate-600 hover:text-indigo-600">Privacy Policy</Link>
            <Link to="/data-deletion" className="text-indigo-600 font-medium">Data Deletion</Link>
            <Link to="/auth" className="text-slate-600 hover:text-indigo-600">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
