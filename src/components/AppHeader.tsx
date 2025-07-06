
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Stethoscope, 
  LogOut,
  Settings,
  Users,
  FileText,
  TrendingUp,
  DollarSign,
  ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  full_name: string;
  role: 'doctor' | 'receptionist' | 'nurse' | 'admin';
  phone: string | null;
  is_active: boolean;
}

interface AppHeaderProps {
  profile: Profile | null;
}

const AppHeader = ({ profile }: AppHeaderProps) => {
  const navigate = useNavigate();

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
    switch (role) {
      case 'doctor': return "bg-blue-100 text-blue-800";
      case 'receptionist': return "bg-green-100 text-green-800";
      case 'nurse': return "bg-purple-100 text-purple-800"; 
      case 'admin': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <header className="bg-white shadow-md border-b">
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
            {/* Admin Panel Dropdown - Only visible to admins */}
            {profile?.role === 'admin' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Settings className="h-4 w-4" />
                    لوحة الإدارة
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate("/staff-management")}>
                    <Users className="mr-2 h-4 w-4" />
                    إدارة الموظفين
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/expenses")}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    مصروفات العيادة
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/financial-analytics")}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    التحليلات المالية
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/reports")}>
                    <FileText className="mr-2 h-4 w-4" />
                    التقارير
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    إعدادات النظام
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User Profile Section */}
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
  );
};

export default AppHeader;
