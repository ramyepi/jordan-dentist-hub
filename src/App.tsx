
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SystemSettingsProvider } from "@/contexts/SystemSettingsContext";
import AdminSidebar from "@/components/AdminSidebar";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientProfile from "./pages/PatientProfile";
import PatientReports from "./pages/PatientReports";
import Appointments from "./pages/Appointments";
import AppointmentsCalendar from "./pages/AppointmentsCalendar";
import Payments from "./pages/Payments";
import PatientPayments from "./pages/PatientPayments";
import Installments from "./pages/Installments";
import Expenses from "./pages/Expenses";
import TreatmentServices from "./pages/TreatmentServices";
import StaffManagement from "./pages/StaffManagement";
import FinancialAnalytics from "./pages/FinancialAnalytics";
import SystemSettings from "./pages/SystemSettings";
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
            <div className="min-h-screen flex flex-col bg-gray-50">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/*" element={
                  <div className="flex flex-1">
                    <AdminSidebar />
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1">
                        <Routes>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/patients" element={<Patients />} />
                          <Route path="/patient/:id" element={<PatientProfile />} />
                          <Route path="/patient-reports" element={<PatientReports />} />
                          <Route path="/appointments" element={<Appointments />} />
                          <Route path="/appointments-calendar" element={<AppointmentsCalendar />} />
                          <Route path="/payments" element={<Payments />} />
                          <Route path="/patient-payments" element={<PatientPayments />} />
                          <Route path="/installments" element={<Installments />} />
                          <Route path="/expenses" element={<Expenses />} />
                          <Route path="/treatment-services" element={<TreatmentServices />} />
                          <Route path="/staff-management" element={<StaffManagement />} />
                          <Route path="/financial-analytics" element={<FinancialAnalytics />} />
                          <Route path="/system-settings" element={<SystemSettings />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </div>
                      <Footer />
                    </div>
                  </div>
                } />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </SystemSettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
