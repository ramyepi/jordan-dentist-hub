import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  FileText, 
  Stethoscope, 
  LogOut,
  Clock,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "تم تسجيل الخروج",
        description: "نراك قريباً",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
      });
    }
  };

  const getRoleInArabic = (role: string) => {
    const roles = {
      doctor: "طبيب",
      receptionist: "موظفة استقبال", 
      nurse: "ممرضة",
      admin: "مدير"
    };
    return roles[role as keyof typeof roles] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      doctor: "bg-blue-100 text-blue-800",
      receptionist: "bg-green-100 text-green-800",
      nurse: "bg-purple-100 text-purple-800", 
      admin: "bg-red-100 text-red-800"
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Stethoscope className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">عيادة الأسنان الذكية</h1>
                <p className="text-sm text-gray-600">نظام إدارة العيادة</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {profile && (
                <div className="text-right">
                  <p className="font-medium text-gray-900">{profile.full_name}</p>
                  <Badge className={`text-xs ${getRoleBadgeColor(profile.role)}`}>
                    {getRoleInArabic(profile.role)}
                  </Badge>
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            مرحباً، {profile?.full_name}
          </h2>
          <p className="text-gray-600">
            إليك ملخص سريع عن حالة العيادة اليوم
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-medical hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مواعيد اليوم</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 من الأمس</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مرضى جدد</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإيرادات اليوم</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,400 ₪</div>
              <p className="text-xs text-muted-foreground">+15% من المتوسط</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">قائمة الانتظار</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">مرضى ينتظرون</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-medical">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                إجراءات سريعة
              </CardTitle>
              <CardDescription>
                الإجراءات الأكثر استخداماً في العيادة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start gap-3 h-12" variant="outline">
                <Calendar className="h-5 w-5" />
                حجز موعد جديد
              </Button>
              <Button className="w-full justify-start gap-3 h-12" variant="outline">
                <Users className="h-5 w-5" />
                إضافة مريض جديد
              </Button>
              <Button className="w-full justify-start gap-3 h-12" variant="outline">
                <CreditCard className="h-5 w-5" />
                تسجيل دفعة
              </Button>
              <Button className="w-full justify-start gap-3 h-12" variant="outline">
                <FileText className="h-5 w-5" />
                عرض التقارير
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-medical">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                المواعيد القادمة
              </CardTitle>
              <CardDescription>
                أقرب المواعيد المجدولة اليوم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">أحمد محمد</p>
                    <p className="text-sm text-gray-600">فحص دوري</p>
                  </div>
                  <Badge variant="outline">10:00 ص</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">فاطمة علي</p>
                    <p className="text-sm text-gray-600">علاج جذور</p>
                  </div>
                  <Badge variant="outline">11:30 ص</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="font-medium">محمد خالد</p>
                    <p className="text-sm text-gray-600">تنظيف أسنان</p>
                  </div>
                  <Badge variant="outline">2:00 م</Badge>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <Button variant="link" className="w-full">
                عرض جميع المواعيد
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;