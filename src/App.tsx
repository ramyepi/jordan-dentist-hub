import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SystemSettingsProvider } from "@/contexts/SystemSettingsContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientProfile from "./pages/PatientProfile";
import Appointments from "./pages/Appointments";
import AppointmentsCalendar from "./pages/AppointmentsCalendar";
import PatientPayments from "./pages/PatientPayments";
import SystemSettings from "./pages/SystemSettings";
import Payments from "./pages/Payments";
import Expenses from "./pages/Expenses";
import StaffManagement from "./pages/StaffManagement";
import FinancialAnalytics from "./pages/FinancialAnalytics";
import TreatmentServices from "./pages/TreatmentServices";
import Installments from "./pages/Installments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SystemSettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/patient/:id" element={<PatientProfile />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/appointments-calendar" element={<AppointmentsCalendar />} />
              <Route path="/patient-payments" element={<PatientPayments />} />
              <Route path="/system-settings" element={<SystemSettings />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/staff" element={<StaffManagement />} />
              <Route path="/analytics" element={<FinancialAnalytics />} />
              <Route path="/services" element={<TreatmentServices />} />
              <Route path="/installments" element={<Installments />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SystemSettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
