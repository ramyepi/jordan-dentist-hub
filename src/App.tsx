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
import SystemSettings from "@/pages/SystemSettings";
import ClinicExpenses from "@/pages/ClinicExpenses";
import ExpenseCategories from "@/pages/ExpenseCategories";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
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
                userProfile={userProfile} 
                onLogout={handleLogout}
              />
            )}
            <div className="flex flex-1">
              {user && userProfile && (
                <AdminSidebar userProfile={userProfile} />
              )}
              <main className="flex-1 p-6 overflow-auto">
                <Routes>
                  <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
                  <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
                  <Route path="/patients" element={user ? <Patients /> : <Navigate to="/login" />} />
                  <Route path="/appointments" element={user ? <AppointmentsCalendar /> : <Navigate to="/login" />} />
                  <Route path="/system-settings" element={user ? <SystemSettings /> : <Navigate to="/login" />} />
                  <Route path="/clinic-expenses" element={user ? <ClinicExpenses /> : <Navigate to="/login" />} />
                  <Route path="/expense-categories" element={user ? <ExpenseCategories /> : <Navigate to="/login" />} />
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
