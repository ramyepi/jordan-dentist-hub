import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  FileText, 
  UserCheck,
  Building,
  TrendingUp,
  DollarSign,
  BarChart3,
  Settings
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminNavigation = () => {
  const navigate = useNavigate();

  const adminActions = [
    { 
      icon: Users, 
      title: "إدارة الموظفين", 
      description: "إضافة وإدارة موظفي العيادة",
      path: "/staff-management" 
    },
    { 
      icon: Calendar, 
      title: "إدارة المواعيد", 
      description: "مراقبة جميع المواعيد",
      path: "/appointments" 
    },
    { 
      icon: UserCheck, 
      title: "إدارة المرضى", 
      description: "ملفات وسجلات المرضى",
      path: "/patients" 
    },
    { 
      icon: CreditCard, 
      title: "إدارة الدفعات", 
      description: "مراقبة المدفوعات والفواتير",
      path: "/payments" 
    },
    { 
      icon: DollarSign, 
      title: "مصروفات العيادة", 
      description: "تتبع المصاريف والتكاليف",
      path: "/expenses" 
    },
    { 
      icon: TrendingUp, 
      title: "التحليلات المالية", 
      description: "تقارير الأرباح والخسائر",
      path: "/financial-analytics" 
    },
    { 
      icon: FileText, 
      title: "التقارير", 
      description: "تقارير شاملة للعيادة",
      path: "/reports" 
    },
    { 
      icon: Settings, 
      title: "إعدادات النظام", 
      description: "إعدادات عامة ومتقدمة",
      path: "/settings" 
    }
  ];

  return (
    <Card className="shadow-medical">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-red-600" />
          إدارة العيادة الشاملة
        </CardTitle>
        <CardDescription>
          جميع أدوات الإدارة والتحكم في العيادة
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