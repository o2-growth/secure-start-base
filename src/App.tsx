import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Auth pages
import Login from "@/pages/auth/Login";
import ForgotPassword from "@/pages/auth/ForgotPassword";

// Protected pages
import Dashboard from "@/pages/dashboard/Dashboard";
import InternalWorkspace from "@/pages/internal/InternalWorkspace";
import FranchiseWorkspace from "@/pages/franchise/FranchiseWorkspace";
import PipelineBoard from "@/pages/pipelines/PipelineBoard";
import CardDetails from "@/pages/pipelines/CardDetails";
import NewLead from "@/pages/pipelines/NewLead";

// Admin pages
import AdminUsers from "@/pages/admin/Users";
import BusinessUnits from "@/pages/admin/BusinessUnits";
import PipelinesConfig from "@/pages/admin/PipelinesConfig";
import AutomationRules from "@/pages/admin/AutomationRules";
import Integrations from "@/pages/admin/Integrations";
import MessageTemplates from "@/pages/admin/MessageTemplates";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/internal" element={<ProtectedRoute><InternalWorkspace /></ProtectedRoute>} />
          <Route path="/franchise" element={<ProtectedRoute><FranchiseWorkspace /></ProtectedRoute>} />
          <Route path="/pipelines/:pipelineId" element={<ProtectedRoute><PipelineBoard /></ProtectedRoute>} />
          <Route path="/pipelines/:pipelineId/cards/:cardId" element={<ProtectedRoute><CardDetails /></ProtectedRoute>} />
          <Route path="/pipelines/:pipelineId/new-lead" element={<ProtectedRoute><NewLead /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/business-units" element={<ProtectedRoute requireAdmin><BusinessUnits /></ProtectedRoute>} />
          <Route path="/admin/pipelines" element={<ProtectedRoute requireAdmin><PipelinesConfig /></ProtectedRoute>} />
          <Route path="/admin/automations" element={<ProtectedRoute requireAdmin><AutomationRules /></ProtectedRoute>} />
          <Route path="/admin/integrations" element={<ProtectedRoute requireAdmin><Integrations /></ProtectedRoute>} />
          <Route path="/admin/templates" element={<ProtectedRoute requireAdmin><MessageTemplates /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
