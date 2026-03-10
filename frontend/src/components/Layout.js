import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { 
  LayoutDashboard, Sparkles, Image, Layout as LayoutIcon, 
  Calendar, Settings, LogOut, BarChart3, Link2, Target,
  Wand2, Film, FolderKanban, MessageCircle, User, Bell
} from "lucide-react";

// Frameflow Logo Component
function FrameflowLogo({ className = "w-10 h-10" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-gradient-layout" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#logo-gradient-layout)" />
      <path d="M20 24h24M20 32h18M20 40h22" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="40" r="6" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const whatsappSupportLink = "https://wa.me/919330408074?text=" + encodeURIComponent("Hi, I need support with Frameflow");

  // Navigation items matching the spec
  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/ideas", icon: Sparkles, label: "Ideas" },
    { path: "/content", icon: Wand2, label: "Create Post" },
    { path: "/reels", icon: Film, label: "Create Reel" },
    { path: "/campaigns", icon: Target, label: "Campaigns" },
    { path: "/media", icon: Image, label: "Content Library" },
    { path: "/calendar", icon: Calendar, label: "Scheduler" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  // Admin nav items
  const adminNavItems = [
    { path: "/admin", icon: User, label: "Clients" },
    { path: "/admin/billing", icon: Target, label: "Billing" },
    { path: "/admin/stats", icon: BarChart3, label: "Stats" },
  ];

  const isAdmin = user?.role === "super_admin";
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col fixed h-full z-40">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <FrameflowLogo className="w-10 h-10" />
            <span className="text-xl font-bold font-outfit text-slate-900">Frameflow</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {isAdmin && isAdminRoute ? (
            <>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
                Admin Panel
              </div>
              {adminNavItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 ${
                    location.pathname === item.path
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
              <div className="border-t border-slate-100 my-4" />
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <LayoutDashboard className="w-5 h-5" />
                Back to Dashboard
              </button>
            </>
          ) : (
            <>
              {navItems.map((item) => (
                <button
                  key={item.path}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 ${
                    location.pathname === item.path
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}

              {isAdmin && (
                <>
                  <div className="border-t border-slate-100 my-4" />
                  <button
                    onClick={() => navigate("/admin")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-600 hover:bg-amber-50"
                  >
                    <User className="w-5 h-5" />
                    Admin Panel
                  </button>
                </>
              )}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          {/* Left - Logo (mobile) */}
          <div className="flex items-center gap-3">
            <FrameflowLogo className="w-8 h-8 lg:hidden" />
          </div>

          {/* Center - Business Name */}
          <div className="flex-1 text-center">
            <span className="text-lg font-semibold text-slate-900">
              {user?.full_name || "Welcome"}
            </span>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-3">
            {/* WhatsApp Support */}
            <a
              href={whatsappSupportLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors"
              title="WhatsApp Support"
            >
              <MessageCircle className="w-5 h-5" />
            </a>

            {/* Notifications */}
            <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors relative">
              <Bell className="w-5 h-5" />
            </button>

            {/* Profile */}
            <button 
              onClick={() => navigate("/settings")}
              className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold"
            >
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-73px)]">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-100 px-8 py-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <FrameflowLogo className="w-5 h-5" />
              <span>© 2026 Frameflow</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/privacy-policy" className="hover:text-indigo-600">Privacy Policy</a>
              <a href="/data-deletion" className="hover:text-indigo-600">Data Deletion</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating WhatsApp Button */}
      <WhatsAppFloat />
    </div>
  );
}
