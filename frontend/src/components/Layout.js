import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Bot, LayoutDashboard, FolderKanban, Sparkles, Image, Layout as LayoutIcon, History, Settings, LogOut, TrendingUp, Shield } from "lucide-react";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const isAdmin = user?.role === "admin";

  // Admin navigation items
  const adminNavItems = [
    { path: "/admin", icon: Shield, label: "Admin Dashboard", testid: "nav-admin" },
  ];

  // Regular user navigation items
  const userNavItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", testid: "nav-dashboard" },
    { path: "/ideas", icon: Sparkles, label: "Idea Engine", testid: "nav-ideas" },
    { path: "/projects", icon: FolderKanban, label: "Projects", testid: "nav-projects" },
    { path: "/create", icon: Sparkles, label: "Create Content", testid: "nav-create" },
    { path: "/marketing", icon: TrendingUp, label: "Marketing", testid: "nav-marketing" },
    { path: "/media", icon: Image, label: "Media Library", testid: "nav-media-lib" },
    { path: "/templates", icon: LayoutIcon, label: "Templates", testid: "nav-templates" },
    { path: "/calendar", icon: History, label: "Calendar", testid: "nav-calendar" },
    { path: "/history", icon: History, label: "History", testid: "nav-history" },
    { path: "/brand", icon: Settings, label: "Café Settings", testid: "nav-brand-settings" }
  ];

  // Combine nav items based on user role
  const navItems = isAdmin ? [...adminNavItems, ...userNavItems] : userNavItems;

  // If not authenticated, just render children (for public pages)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => navigate("/dashboard")}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-outfit text-xl font-bold text-slate-900">FrameFlow</span>
              <p className="text-xs text-slate-500">Café Marketing Studio</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                data-testid={item.testid}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Framey Assistant */}
        <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center animate-bounce-slow">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">Framey</span>
          </div>
          <p className="text-xs text-slate-600 mb-3">Your AI café marketing assistant is ready to help!</p>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-200">
          {user && (
            <div className="mb-3 px-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-900 truncate">{user.full_name || user.email}</p>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          )}
          <Button
            data-testid="sidebar-logout-btn"
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
