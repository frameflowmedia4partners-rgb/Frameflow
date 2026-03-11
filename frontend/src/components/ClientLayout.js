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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
        } bg-white/80 backdrop-blur-xl border-r border-slate-100 flex flex-col transition-all duration-300`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-outfit text-xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                Frameflow
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 overflow-y-auto">
          {navItems.map((section) => (
            <div key={section.section} className="mb-6">
              {!collapsed && (
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
                  {section.section}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                          : "text-slate-600 hover:bg-slate-100"
                      } ${collapsed ? "justify-center" : ""}`
                    }
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="font-medium">{item.label}</span>}
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
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-100"
              } ${collapsed ? "justify-center" : ""}`
            }
          >
            <Settings className="w-5 h-5" />
            {!collapsed && <span className="font-medium">Settings</span>}
          </NavLink>
          
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all w-full mt-2 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* WhatsApp Float */}
      <WhatsAppFloat />
    </div>
  );
}
