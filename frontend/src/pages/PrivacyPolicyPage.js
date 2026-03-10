import { Link } from "react-router-dom";
import { MessageCircle, Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Frameflow Logo Component
function FrameflowLogo({ className = "w-10 h-10" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-gradient-pp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#logo-gradient-pp)" />
      <path d="M20 24h24M20 32h18M20 40h22" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="40" r="6" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

export default function PrivacyPolicyPage() {
  const whatsappLink = "https://wa.me/919330408074?text=" + encodeURIComponent("Hi, I have a question about Frameflow's privacy policy");

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
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Shield className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-outfit text-slate-900">Privacy Policy</h1>
              <p className="text-slate-500">Effective Date: March 10, 2026</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <h2>What Data We Collect</h2>
            <p>Frameflow collects the following types of information:</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, password (encrypted)</li>
              <li><strong>Brand Assets:</strong> Logos, sample social media posts, brand colors, fonts</li>
              <li><strong>Business Information:</strong> Business address, phone number, website URL</li>
              <li><strong>Meta/Facebook Tokens:</strong> Access tokens for Instagram and Facebook (encrypted, stored per client)</li>
              <li><strong>Content Created:</strong> Posts, reels, captions, campaigns generated on the platform</li>
              <li><strong>Usage Data:</strong> Login times, features used, session information</li>
              <li><strong>Device Information:</strong> Browser type, IP address for security purposes</li>
            </ul>

            <h2>How We Use Your Data</h2>
            <p>Your data is used to:</p>
            <ul>
              <li>Provide AI-powered content generation services</li>
              <li>Connect and publish content to your Meta platforms (Instagram & Facebook)</li>
              <li>Display analytics from Meta API on your behalf</li>
              <li>Manage your billing and subscription</li>
              <li>Provide customer support</li>
            </ul>

            <h2>Meta/Facebook Data Usage</h2>
            <ul>
              <li>Access tokens are stored encrypted in our database</li>
              <li>Tokens are used only for publishing content and retrieving analytics on your behalf</li>
              <li>We never share your Meta data with third parties</li>
              <li>You can revoke access at any time from your Settings page or directly from Meta</li>
            </ul>

            <h2>Data Sharing</h2>
            <p>
              We <strong>never sell or share</strong> personal data with third parties except:
            </p>
            <ul>
              <li><strong>Meta API:</strong> For publishing content to your connected accounts</li>
              <li><strong>Hosting Infrastructure:</strong> Secure cloud servers for data storage</li>
            </ul>

            <h2>Data Security</h2>
            <ul>
              <li>All passwords are hashed using industry-standard encryption</li>
              <li>Access tokens are encrypted before storage</li>
              <li>All data is isolated per client - clients cannot access each other's data</li>
              <li>HTTPS is enforced for all connections</li>
            </ul>

            <h2>Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your data at any time. 
              Contact us to exercise these rights.
            </p>

            <h2>Contact Us</h2>
            <p>
              For privacy-related inquiries:
            </p>
            <ul>
              <li>Email: adreej@frameflow.me</li>
              <li>WhatsApp: +91 93304 08074</li>
            </ul>
          </div>

          {/* WhatsApp Contact */}
          <div className="mt-10 p-6 bg-green-50 rounded-2xl border border-green-100">
            <h3 className="text-lg font-semibold text-green-900 mb-3">Have Questions?</h3>
            <p className="text-green-700 mb-4">Contact us on WhatsApp for any privacy-related inquiries.</p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp
            </a>
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
            <Link to="/privacy-policy" className="text-indigo-600 font-medium">Privacy Policy</Link>
            <Link to="/data-deletion" className="text-slate-600 hover:text-indigo-600">Data Deletion</Link>
            <Link to="/auth" className="text-slate-600 hover:text-indigo-600">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
