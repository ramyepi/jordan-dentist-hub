
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  FileText, 
  Building,
  UserCheck,
  TrendingUp,
  Settings,
  CalendarDays
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
      description: "عرض وتحديث بيانات المرضى",
      path: "/patients" 
    },
    { 
      icon: UserCheck, 
      title: "إدارة الموظفين", 
      description: "إدارة حسابات الموظفين",
      path: "/staff" 
    },
    { 
      icon: CreditCard, 
      title: "المدفوعات والفواتير", 
      description: "إدارة المدفوعات والفواتير",
      path: "/payments" 
    },
    { 
      icon: Building, 
      title: "مصروفات العيادة", 
      description: "تسجيل ومتابعة المصروفات",
      path: "/expenses" 
    },
    { 
      icon: TrendingUp, 
      title: "التحليلات المالية", 
      description: "تقارير مالية وإحصائيات",
      path: "/analytics" 
    },
    { 
      icon: FileText, 
      title: "خدمات العلاج", 
      description: "إدارة خدمات وأسعار العلاج",
      path: "/services" 
    }
  ];

  return (
    <Card className="shadow-medical">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          أدوات الإدارة
        </CardTitle>
        <CardDescription>
          إدارة شاملة لجميع عمليات العيادة
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
