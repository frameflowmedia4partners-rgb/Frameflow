import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Bot, Sparkles, Video, Image as ImageIcon, Calendar, TrendingUp, 
  Target, BarChart3, Clock, Users, CheckCircle, ArrowRight, Play, 
  Coffee, Instagram, Megaphone, Zap, Shield, Star, ChevronDown,
  MessageCircle, Loader2, Menu, X
} from "lucide-react";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "919330408074";
const WHATSAPP_BUY_MESSAGE = "Hi, I would like to purchase Frameflow for my cafe.";
const WHATSAPP_DEMO_MESSAGE = "Hi, I'd like to request a demo of Frameflow";

const getWhatsAppLink = (message) => {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      const API = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${API}/api/demo/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      if (!response.ok) throw new Error("Failed to start demo");
      
      const data = await response.json();
      login(data.token, data.user);
      toast.success("Welcome to the demo! Explore Urban Brew Café's marketing dashboard.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error("Failed to start demo. Please try again.");
    } finally {
      setDemoLoading(false);
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: "AI Content Generation",
      description: "Generate captions, hashtags, and ad copy tailored specifically for your café's brand voice."
    },
    {
      icon: ImageIcon,
      title: "Visual Content Studio",
      description: "Create stunning images and graphics for Instagram posts, stories, and ads."
    },
    {
      icon: Video,
      title: "Reel Creator",
      description: "Turn your raw footage into engaging reels with AI-suggested hooks and captions."
    },
    {
      icon: Calendar,
      title: "Content Scheduler",
      description: "Plan and schedule your entire content calendar with drag-and-drop simplicity."
    },
    {
      icon: Target,
      title: "Meta Ads Manager",
      description: "Launch and manage Facebook & Instagram ad campaigns directly from your dashboard."
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track reach, engagement, and campaign performance with beautiful visualizations."
    }
  ];

  const benefits = [
    { stat: "10x", label: "Faster Content Creation" },
    { stat: "50%", label: "More Engagement" },
    { stat: "24/7", label: "AI Marketing Assistant" },
    { stat: "100%", label: "Café-Focused" }
  ];

  const testimonials = [
    {
      quote: "Frameflow transformed how we do marketing. We went from posting randomly to having a consistent brand presence that actually drives customers through our door.",
      author: "Sarah Chen",
      role: "Owner, Morning Bloom Café",
      avatar: "SC"
    },
    {
      quote: "The AI understands café marketing like no other tool. It suggests seasonal drinks, knows when coffee lovers are online, and creates content that feels authentically us.",
      author: "Marcus Rodriguez",
      role: "Marketing Manager, Bean & Leaf",
      avatar: "MR"
    },
    {
      quote: "We used to spend hours on social media. Now Frameflow handles everything in minutes. Our Instagram engagement increased 3x in the first month.",
      author: "Emily Watson",
      role: "Co-founder, The Cozy Cup",
      avatar: "EW"
    }
  ];

  const faqs = [
    {
      question: "How is Frameflow different from other marketing tools?",
      answer: "Frameflow is built exclusively for cafés. Every template, AI suggestion, and feature is designed around café marketing - from seasonal drink promotions to cozy atmosphere content. Generic tools don't understand the café industry like we do."
    },
    {
      question: "Do I need to provide my own API keys?",
      answer: "Yes, for Meta Ads and Instagram posting, you'll connect your own business accounts via OAuth. This ensures you maintain full control and ownership of your social media presence."
    },
    {
      question: "Can I try before I buy?",
      answer: "Absolutely! Click 'Try Demo' to explore our full platform with sample data from a demo café. You can also request a personalized demo with your actual café brand."
    },
    {
      question: "How do I get started?",
      answer: "Simply request a demo or purchase through WhatsApp. Our team will set up your account with your café details, and you can start creating content immediately."
    },
    {
      question: "What kind of content can I create?",
      answer: "Everything you need for café marketing: Instagram posts, stories, reels, captions, hashtags, ad copy, promotional graphics, menu highlights, seasonal campaigns, and more."
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="font-outfit text-xl font-bold text-slate-900">Frameflow</span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">How It Works</a>
              <a href="#testimonials" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">Testimonials</a>
              <a href="#faq" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">FAQ</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button
                data-testid="nav-login-btn"
                onClick={() => navigate("/auth")}
                variant="ghost"
                className="font-medium"
              >
                Sign In
              </Button>
              <a href={getWhatsAppLink(WHATSAPP_DEMO_MESSAGE)} target="_blank" rel="noopener noreferrer">
                <Button className="rounded-full px-6 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Request Demo
                </Button>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pt-4 pb-2 space-y-4 animate-in slide-in-from-top">
              <a href="#features" className="block text-slate-600 hover:text-slate-900 py-2">Features</a>
              <a href="#how-it-works" className="block text-slate-600 hover:text-slate-900 py-2">How It Works</a>
              <a href="#testimonials" className="block text-slate-600 hover:text-slate-900 py-2">Testimonials</a>
              <a href="#faq" className="block text-slate-600 hover:text-slate-900 py-2">FAQ</a>
              <Button onClick={() => navigate("/auth")} variant="outline" className="w-full">Sign In</Button>
              <a href={getWhatsAppLink(WHATSAPP_DEMO_MESSAGE)} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full bg-indigo-600">Request Demo</Button>
              </a>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-40 left-10 w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-40 right-10 w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-medium text-sm mb-8 animate-in fade-in slide-in-from-bottom duration-500">
            <Coffee className="w-4 h-4" />
            Built exclusively for cafés & coffee shops
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-outfit text-slate-900 mb-6 leading-tight animate-in fade-in slide-in-from-bottom duration-700">
            Your AI Marketing Team,
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"> In One Dashboard</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom duration-700 delay-150">
            Generate Instagram content, schedule posts, launch Meta ads, and grow your café's social presence — all powered by AI that understands café marketing.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
            <Button
              data-testid="hero-try-demo-btn"
              onClick={handleTryDemo}
              disabled={demoLoading}
              className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-xl shadow-orange-500/30 hover:scale-105 hover:shadow-orange-500/40 transition-all duration-300"
            >
              {demoLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Loading Demo...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Try Demo Free
                </>
              )}
            </Button>
            
            <a href={getWhatsAppLink(WHATSAPP_BUY_MESSAGE)} target="_blank" rel="noopener noreferrer">
              <Button
                data-testid="hero-buy-now-btn"
                className="rounded-full px-8 py-6 text-lg bg-indigo-600 text-white font-semibold shadow-xl shadow-indigo-500/30 hover:scale-105 hover:shadow-indigo-500/40 transition-all duration-300"
              >
                <Zap className="w-5 h-5 mr-2" />
                Get Started
              </Button>
            </a>
          </div>

          <p className="text-sm text-slate-500 animate-in fade-in duration-700 delay-500">
            No credit card required • Full demo access • WhatsApp support
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold font-outfit text-white mb-2">
                  {benefit.stat}
                </div>
                <div className="text-slate-400 font-medium">{benefit.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-outfit text-slate-900 mb-6">
            Café Marketing Shouldn't Be This Hard
          </h2>
          <p className="text-lg text-slate-600 mb-12 leading-relaxed">
            You're juggling baristas, inventory, and customers. The last thing you need is to spend hours 
            figuring out Instagram algorithms, writing captions, and managing ad campaigns. 
            Generic marketing tools don't understand your latte art or seasonal specials.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Clock, title: "No Time", desc: "Running a café leaves zero time for content creation" },
              { icon: Users, title: "No Team", desc: "Can't afford a dedicated marketing person" },
              { icon: Target, title: "No Strategy", desc: "Posting randomly without a real plan" }
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-red-50 border border-red-100">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium text-sm mb-6">
            <CheckCircle className="w-4 h-4" />
            The Solution
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-outfit text-slate-900 mb-6">
            Your Complete Marketing Team in One Platform
          </h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Frameflow combines AI content generation, scheduling, ads management, and analytics 
            into one dashboard designed specifically for café owners. It's like having a social media 
            manager, copywriter, and ads specialist — all working 24/7.
          </p>
          
          <div className="inline-flex items-center gap-4 p-4 rounded-2xl bg-white shadow-xl">
            <div className="flex -space-x-3">
              {['SC', 'MR', 'EW', 'JK'].map((initials, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
              ))}
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-900">Join 500+ Café Owners</div>
              <div className="text-sm text-slate-500">Who transformed their marketing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-slate-900 mb-4">
              Everything You Need to Dominate Social Media
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From content creation to campaign analytics, Frameflow has every tool a café needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-semibold font-outfit text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-slate-50 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-slate-900 mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-lg text-slate-600">
              From signup to your first campaign — it's that simple.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Get Your Account", desc: "We set up your personalized café dashboard" },
              { step: "02", title: "Build Brand DNA", desc: "AI analyzes your café to understand your unique voice" },
              { step: "03", title: "Create Content", desc: "Generate posts, reels, and ads in seconds" },
              { step: "04", title: "Grow Your Café", desc: "Schedule, post, and watch your engagement soar" }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold font-outfit text-indigo-100 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
                {i < 3 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-4 w-8 h-8 text-indigo-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-slate-900 mb-4">
              Loved by Café Owners
            </h2>
            <p className="text-lg text-slate-600">
              See what other café owners are saying about Frameflow.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="p-8 rounded-3xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 bg-slate-50 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5 text-slate-600 animate-in slide-in-from-top duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold font-outfit text-white mb-6">
            Ready to Transform Your Café's Marketing?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join hundreds of café owners who are saving time, growing their audience, 
            and increasing revenue with Frameflow.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleTryDemo}
              disabled={demoLoading}
              className="rounded-full px-8 py-6 text-lg bg-white text-indigo-600 font-semibold shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Play className="w-5 h-5 mr-2" />
              Try Demo Free
            </Button>
            
            <a href={getWhatsAppLink(WHATSAPP_BUY_MESSAGE)} target="_blank" rel="noopener noreferrer">
              <Button
                data-testid="cta-buy-now-btn"
                className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold shadow-xl hover:scale-105 transition-all duration-300"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Buy Now via WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="font-outfit text-xl font-bold text-white">Frameflow</span>
            </div>
            
            <div className="flex items-center gap-8 text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <a href={getWhatsAppLink(WHATSAPP_DEMO_MESSAGE)} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Contact</a>
            </div>
            
            <div className="text-slate-500 text-sm">
              © 2026 Frameflow. Built for Cafés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
