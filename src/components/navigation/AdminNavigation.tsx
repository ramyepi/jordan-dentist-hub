
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  FileText, 
  Settings,
  BarChart3,
  Stethoscope,
  UserPlus,
  CalendarDays,
  DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminNavigation = () => {
  const navigate = useNavigate();

  const adminActions = [
    { 
      icon: Calendar, 
      title: "إدارة المواعيد", 
      description: "عرض وإدارة جميع المواعيد",
      path: "/appointments" 
    },
    { 
      icon: CalendarDays, 
      title: "تقويم المواعيد", 
      description: "عرض المواعيد في التقويم",
      path: "/appointments-calendar" 
    },
    { 
      icon: Users, 
      title: "إدارة المرضى", 
      description: "عرض وإدارة ملفات المرضى",
      path: "/patients" 
    },
    { 
      icon: UserPlus, 
      title: "إدارة الموظفين", 
      description: "إدارة الأطباء والممرضات",
      path: "/staff" 
    },
    { 
      icon: CreditCard, 
      title: "إدارة المدفوعات", 
      description: "متابعة مدفوعات المرضى",
      path: "/payments" 
    },
    { 
      icon: DollarSign, 
      title: "محاسبة المرضى", 
      description: "تسجيل وإدارة دفعات المرضى",
      path: "/patient-payments" 
    },
    { 
      icon: FileText, 
      title: "إدارة المصروفات", 
      description: "تسجيل مصروفات العيادة",
      path: "/expenses" 
    },
    { 
      icon: BarChart3, 
      title: "التحليلات المالية", 
      description: "تقارير الأرباح والمصروفات",
      path: "/analytics" 
    },
    { 
      icon: Stethoscope, 
      title: "الخدمات العلاجية", 
      description: "إدارة الخدمات والأسعار",
      path: "/services" 
    },
    { 
      icon: Settings, 
      title: "الإعدادات العامة", 
      description: "إعدادات النظام والتفضيلات",
      path: "/system-settings" 
    }
  ];

  return (
    <Card className="shadow-medical">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-600" />
          لوحة تحكم الإدارة
        </CardTitle>
        <CardDescription>
          إدارة شاملة للعيادة والنظام
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {adminActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.path}
              className="w-full justify-start gap-3 h-auto p-4 text-right"
              variant="outline"
              onClick={() => navigate(action.path)}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1 text-right">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground">
                  {action.description}
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default AdminNavigation;
