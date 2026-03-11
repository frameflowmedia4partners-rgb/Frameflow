import "@/App.css";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";

// Pages
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import OnboardingPage from "@/pages/OnboardingPage";

// New Client Dashboard Pages
import HomeDashboard from "@/pages/HomeDashboard";
import ContentSwipePage from "@/pages/ContentSwipePage";
import BrandDNAPage from "@/pages/BrandDNAPage";
import AIChatPage from "@/pages/AIChatPage";
import ConceptPage from "@/pages/ConceptPage";
import CloneTemplatePage from "@/pages/CloneTemplatePage";
import VariationsPage from "@/pages/VariationsPage";
import PostEditorPage from "@/pages/PostEditorPage";
import LibraryPage from "@/pages/LibraryPage";
import ReelGenerationPage from "@/pages/ReelGenerationPage";
import InspoGalleryPage from "@/pages/InspoGalleryPage";
import PhotoshootPage from "@/pages/PhotoshootPage";
import CalendarPage from "@/pages/CalendarPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import InboxPage from "@/pages/InboxPage";

// Legacy Pages (keeping for compatibility)
import DashboardPage from "@/pages/DashboardPage";
import IdeasPage from "@/pages/IdeasPage";
import CreateContentPage from "@/pages/CreateContentPage";
import CreatePostPage from "@/pages/CreatePostPage";
import CreateReelPage from "@/pages/CreateReelPage";
import ContentLibraryPage from "@/pages/ContentLibraryPage";
import MediaLibraryPage from "@/pages/MediaLibraryPage";
import ProjectsPage from "@/pages/ProjectsPage";
import CampaignsPage from "@/pages/CampaignsPage";
import TemplatesPage from "@/pages/TemplatesPage";
import BrandProfilePage from "@/pages/BrandProfilePage";
import MarketingDashboard from "@/pages/MarketingDashboard";
import ContentSchedulerPage from "@/pages/ContentSchedulerPage";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import IntegrationsPage from "@/pages/IntegrationsPage";
import ContentCommandCenter from "@/pages/ContentCommandCenter";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import DataDeletionPage from "@/pages/DataDeletionPage";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminBillingPage from "@/pages/AdminBillingPage";
import AdminCreditManagement from "@/pages/AdminCreditManagement";
import SettingsPage from "@/pages/SettingsPage";

// Protected Route for authenticated users
function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If route requires admin and user is not admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is admin and trying to access client routes (not impersonating)
  if (isAdmin && !requireAdmin && !location.pathname.startsWith("/admin")) {
    // Allow admin to view client pages if impersonating
    const impersonation = localStorage.getItem("frameflow_impersonation");
    if (!impersonation) {
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
}

// Client Route - for client_user role only
function ClientRoute({ children }) {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if client needs onboarding
  if (user?.onboarding_complete === false && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

// Public Route - redirect to appropriate dashboard if already logged in
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (isAuthenticated) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    if (user?.onboarding_complete === false) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Admin Route - for super_admin role only
function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - no auth required */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/data-deletion" element={<DataDeletionPage />} />
      
      {/* Auth route */}
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />

      {/* Onboarding - for clients only */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/billing"
        element={
          <AdminRoute>
            <AdminBillingPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/clients"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/credits"
        element={
          <AdminRoute>
            <AdminCreditManagement />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/credits/:clientId"
        element={
          <AdminRoute>
            <AdminCreditManagement />
          </AdminRoute>
        }
      />

      {/* Client dashboard routes */}
      <Route
        path="/dashboard"
        element={
          <ClientRoute>
            <HomeDashboard />
          </ClientRoute>
        }
      />
      <Route
        path="/content-swipe"
        element={
          <ClientRoute>
            <ContentSwipePage />
          </ClientRoute>
        }
      />
      <Route
        path="/concept"
        element={
          <ClientRoute>
            <ConceptPage />
          </ClientRoute>
        }
      />
      <Route
        path="/dna"
        element={
          <ClientRoute>
            <BrandDNAPage />
          </ClientRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ClientRoute>
            <AIChatPage />
          </ClientRoute>
        }
      />
      <Route
        path="/ideas"
        element={
          <ClientRoute>
            <IdeasPage />
          </ClientRoute>
        }
      />
      <Route
        path="/inspo"
        element={
          <ClientRoute>
            <InspoGalleryPage />
          </ClientRoute>
        }
      />
      <Route
        path="/create"
        element={
          <ClientRoute>
            <CreateContentPage />
          </ClientRoute>
        }
      />
      <Route
        path="/create-post"
        element={
          <ClientRoute>
            <CreatePostPage />
          </ClientRoute>
        }
      />
      <Route
        path="/create-reel"
        element={
          <ClientRoute>
            <ReelGenerationPage />
          </ClientRoute>
        }
      />
      <Route
        path="/photoshoot"
        element={
          <ClientRoute>
            <PhotoshootPage />
          </ClientRoute>
        }
      />
      <Route
        path="/content"
        element={
          <ClientRoute>
            <ContentCommandCenter />
          </ClientRoute>
        }
      />
      <Route
        path="/reels"
        element={
          <ClientRoute>
            <ContentCommandCenter />
          </ClientRoute>
        }
      />
      <Route
        path="/media"
        element={
          <ClientRoute>
            <MediaLibraryPage />
          </ClientRoute>
        }
      />
      <Route
        path="/library"
        element={
          <ClientRoute>
            <LibraryPage />
          </ClientRoute>
        }
      />
      <Route
        path="/templates"
        element={
          <ClientRoute>
            <CloneTemplatePage />
          </ClientRoute>
        }
      />
      <Route
        path="/variations"
        element={
          <ClientRoute>
            <VariationsPage />
          </ClientRoute>
        }
      />
      <Route
        path="/editor"
        element={
          <ClientRoute>
            <PostEditorPage />
          </ClientRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ClientRoute>
            <ProjectsPage />
          </ClientRoute>
        }
      />
      <Route
        path="/campaigns"
        element={
          <ClientRoute>
            <CampaignsPage />
          </ClientRoute>
        }
      />
      <Route
        path="/templates"
        element={
          <ClientRoute>
            <TemplatesPage />
          </ClientRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ClientRoute>
            <CalendarPage />
          </ClientRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ClientRoute>
            <AnalyticsPage />
          </ClientRoute>
        }
      />
      <Route
        path="/inbox"
        element={
          <ClientRoute>
            <InboxPage />
          </ClientRoute>
        }
      />
      <Route
        path="/integrations"
        element={
          <ClientRoute>
            <IntegrationsPage />
          </ClientRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ClientRoute>
            <SettingsPage />
          </ClientRoute>
        }
      />
      <Route
        path="/brand"
        element={
          <ClientRoute>
            <BrandProfilePage />
          </ClientRoute>
        }
      />
      <Route
        path="/marketing"
        element={
          <ClientRoute>
            <MarketingDashboard />
          </ClientRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Toaster position="top-right" richColors closeButton />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
