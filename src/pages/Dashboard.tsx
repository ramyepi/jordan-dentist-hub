import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";
import AppHeader from "@/components/AppHeader";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import DoctorDashboard from "@/components/dashboards/DoctorDashboard";
import ReceptionistDashboard from "@/components/dashboards/ReceptionistDashboard";
import NurseDashboard from "@/components/dashboards/NurseDashboard";

interface Profile {
  id: string;
  full_name: string;
  role: 'doctor' | 'receptionist' | 'nurse' | 'admin';
  phone: string | null;
  is_active: boolean;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/auth");
          return;
        }

        setUser(session.user);

        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          toast({
            variant: "destructive",
            title: "خطأ",
            description: "حدث خطأ في تحميل بيانات المستخدم",
          });
        } else {
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Render role-specific dashboard based on user role
  const renderDashboard = () => {
    if (!profile) return null;
    
    switch (profile.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'receptionist':
        return <ReceptionistDashboard />;
      case 'nurse':
        return <NurseDashboard />;
      default:
        return <AdminDashboard />; // Fallback to admin dashboard
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <Stethoscope className="h-12 w-12 mx-auto mb-4 text-blue-600" />
          </div>
          <p className="text-lg font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader profile={profile} />
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;