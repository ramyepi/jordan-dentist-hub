
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import AdminSidebar from "@/components/AdminSidebar";
import Patients from "@/pages/Patients";
import AppointmentsCalendar from "@/pages/AppointmentsCalendar";
import Appointments from "@/pages/Appointments";
import SystemSettings from "@/pages/SystemSettings";
import Expenses from "@/pages/Expenses";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import StaffManagement from "@/pages/StaffManagement";
import FinancialAnalytics from "@/pages/FinancialAnalytics";
import Payments from "@/pages/Payments";
import Installments from "@/pages/Installments";
import PatientPayments from "@/pages/PatientPayments";
import PatientProfile from "@/pages/PatientProfile";
import TreatmentServices from "@/pages/TreatmentServices";
import { SystemSettingsProvider } from "@/contexts/SystemSettingsContext";
import Footer from "@/components/Footer";

function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const { toast } = useToast();

  const queryClient = new QueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setUserProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في جلب معلومات المستخدم",
        });
        return;
      }

      setUserProfile(data);
    };

    fetchProfile();
  }, [user, toast]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Failed to log out. Please try again.",
      });
    } else {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    }
  };

  return (
    <SystemSettingsProvider>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <BrowserRouter>
            <Toaster />
            {user && (
              <AppHeader 
                profile={userProfile} 
              />
            )}
            <div className="flex flex-1">
              {user && userProfile && (
                <AdminSidebar />
              )}
              <main className="flex-1 p-6 overflow-auto">
                <Routes>
                  <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
                  <Route path="/" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
                  <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
                  <Route path="/staff-management" element={user ? <StaffManagement /> : <Navigate to="/auth" />} />
                  <Route path="/patients" element={user ? <Patients /> : <Navigate to="/auth" />} />
                  <Route path="/patient-profile/:id" element={user ? <PatientProfile /> : <Navigate to="/auth" />} />
                  <Route path="/appointments" element={user ? <Appointments /> : <Navigate to="/auth" />} />
                  <Route path="/appointments-calendar" element={user ? <AppointmentsCalendar /> : <Navigate to="/auth" />} />
                  <Route path="/payments" element={user ? <Payments /> : <Navigate to="/auth" />} />
                  <Route path="/patient-payments" element={user ? <PatientPayments /> : <Navigate to="/auth" />} />
                  <Route path="/installments" element={user ? <Installments /> : <Navigate to="/auth" />} />
                  <Route path="/expenses" element={user ? <Expenses /> : <Navigate to="/auth" />} />
                  <Route path="/financial-analytics" element={user ? <FinancialAnalytics /> : <Navigate to="/auth" />} />
                  <Route path="/treatment-services" element={user ? <TreatmentServices /> : <Navigate to="/auth" />} />
                  <Route path="/system-settings" element={user ? <SystemSettings /> : <Navigate to="/auth" />} />
                </Routes>
              </main>
            </div>
            <Footer />
          </BrowserRouter>
        </div>
      </QueryClientProvider>
    </SystemSettingsProvider>
  );
}

export default App;
