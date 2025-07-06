import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  Phone,
  UserPlus,
  CalendarPlus,
  CalendarDays,
  DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ReceptionistNavigation = () => {
  const navigate = useNavigate();

  const receptionistActions = [
    { 
      icon: CalendarPlus, 
      title: "حجز موعد جديد", 
      description: "إضافة مواعيد للمرضى",
      path: "/appointments?action=new" 
    },
    { 
      icon: UserPlus, 
      title: "تسجيل مريض جديد", 
      description: "إضافة مريض جديد للنظام",
      path: "/patients?action=new" 
    },
    { 
      icon: Calendar, 
      title: "إدارة المواعيد", 
      description: "عرض وتعديل المواعيد",
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
      title: "قائمة المرضى", 
      description: "عرض وتحديث بيانات المرضى",
      path: "/patients" 
    },
    { 
      icon: CreditCard, 
      title: "المدفوعات", 
      description: "تسجيل ومتابعة المدفوعات",
      path: "/payments" 
    },
    { 
      icon: DollarSign, 
      title: "محاسبة المرضى", 
      description: "تسجيل وإدارة دفعات المرضى",
      path: "/patient-payments" 
    },
    { 
      icon: Phone, 
      title: "المتابعة الهاتفية", 
      description: "متابعة المرضى والمواعيد",
      path: "/follow-up" 
    }
  ];

  return (
    <Card className="shadow-medical">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-green-600" />
          مهام الاستقبال
        </CardTitle>
        <CardDescription>
          إدارة المواعيد وخدمة المرضى
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {receptionistActions.map((action) => {
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

export default ReceptionistNavigation;
