
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
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      try {
        setError(null);
        console.log("Starting to fetch user session...");
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }
        
        if (!session) {
          console.log("No session found, redirecting to auth");
          navigate("/auth");
          return;
        }

        console.log("Session found, user ID:", session.user.id);
        setUser(session.user);

        // Wait a brief moment to ensure the database trigger has completed
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          throw profileError;
        }

        if (!profileData) {
          console.log("No profile found, creating one...");
          // If no profile exists, create one with default values
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              user_id: session.user.id,
              full_name: session.user.user_metadata?.full_name || 'مستخدم جديد',
              role: (session.user.user_metadata?.role as 'doctor' | 'receptionist' | 'nurse' | 'admin') || 'nurse',
              phone: session.user.user_metadata?.phone || null,
              specialization: session.user.user_metadata?.specialization || null
            })
            .select()
            .single();

          if (insertError) {
            console.error("Profile creation error:", insertError);
            throw insertError;
          }

          console.log("Profile created:", newProfile);
          setProfile(newProfile);
        } else {
          console.log("Profile loaded:", profileData);
          setProfile(profileData);
        }
      } catch (error: any) {
        console.error("Dashboard error:", error);
        setError(error.message || "حدث خطأ في تحميل بيانات المستخدم");
        
        // If it's an auth error, redirect to login
        if (error.message?.includes('JWT') || error.message?.includes('session')) {
          navigate("/auth");
        } else {
          toast({
            variant: "destructive",
            title: "خطأ",
            description: error.message || "حدث خطأ في تحميل بيانات المستخدم",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    getProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/auth");
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Reload profile data when auth state changes
        setIsLoading(true);
        await getProfile();
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Stethoscope className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-lg font-medium text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
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
