import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import {
  Home,
  MessageCircle,
  Image as ImageIcon,
  Dna,
  Sparkles,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { section: "Workspace", items: [
    { path: "/dashboard", label: "Home", icon: Home },
    { path: "/chat", label: "Chat", icon: MessageCircle },
  ]},
  { section: "Assets", items: [
    { path: "/library", label: "Library", icon: ImageIcon },
    { path: "/dna", label: "DNA", icon: Dna },
    { path: "/inspo", label: "Inspo", icon: Sparkles },
  ]},
  { section: "Social", items: [
    { path: "/calendar", label: "Calendar", icon: Calendar },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
  ]},
];

export default function ClientLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  const Sidebar = ({ isMobileVersion = false }) => (
    <aside
      data-testid="sidebar"
      className={`
        ${isMobileVersion ? 'w-64' : collapsed ? 'w-20' : 'w-64'}
        bg-white/95 backdrop-blur-xl border-r border-slate-100 flex flex-col shadow-xl transition-all duration-300 h-full
      `}
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        {(!collapsed || isMobileVersion) && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-outfit text-xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
              Frameflow
            </span>
          </div>
        )}
        {!isMobileVersion && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        )}
        {isMobileVersion && (
          <button
            onClick={closeMobileMenu}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 overflow-y-auto">
        {navItems.map((section) => (
          <div key={section.section} className="mb-6">
            {(!collapsed || isMobileVersion) && (
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
                {section.section}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={isMobileVersion ? closeMobileMenu : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                        : "text-slate-600 hover:bg-slate-100"
                    } ${collapsed && !isMobileVersion ? "justify-center" : ""}`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {(!collapsed || isMobileVersion) && <span className="font-medium">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-100">
        <NavLink
          to="/settings"
          onClick={isMobileVersion ? closeMobileMenu : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-100"
            } ${collapsed && !isMobileVersion ? "justify-center" : ""}`
          }
        >
          <Settings className="w-5 h-5" />
          {(!collapsed || isMobileVersion) && <span className="font-medium">Settings</span>}
        </NavLink>
        
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all w-full mt-2 ${
            collapsed && !isMobileVersion ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-5 h-5" />
          {(!collapsed || isMobileVersion) && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Mobile Menu Button - visible only on small screens */}
      <button
        onClick={() => setMobileOpen(true)}
        data-testid="mobile-menu-btn"
        className="fixed top-4 left-4 z-[9999] p-3 bg-white rounded-xl shadow-lg md:hidden border border-slate-200"
      >
        <Menu className="w-6 h-6 text-slate-700" />
      </button>

      {/* Mobile Overlay + Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={closeMobileMenu}
          />
          {/* Sidebar */}
          <div className="absolute top-0 left-0 bottom-0 w-64 bg-white shadow-2xl">
            <Sidebar isMobileVersion={true} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar - hidden on mobile, visible on md+ */}
      <div className="hidden md:block">
        <Sidebar isMobileVersion={false} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        {children}
      </main>

      {/* WhatsApp Float */}
      <WhatsAppFloat />
    </div>
  );
}
