import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  FileText, 
  Stethoscope,
  ClipboardList
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DoctorNavigation = () => {
  const navigate = useNavigate();

  const doctorActions = [
    { 
      icon: Calendar, 
      title: "مواعيدي", 
      description: "عرض وإدارة مواعيدي",
      path: "/appointments" 
    },
    { 
      icon: Users, 
      title: "ملفات المرضى", 
      description: "عرض وتحديث ملفات المرضى",
      path: "/patients" 
    },
    { 
      icon: ClipboardList, 
      title: "السجلات الطبية", 
      description: "إضافة وتحديث السجلات",
      path: "/medical-records" 
    },
    { 
      icon: CreditCard, 
      title: "الدفعات", 
      description: "عرض مدفوعات المرضى",
      path: "/payments" 
    },
    { 
      icon: FileText, 
      title: "التقارير الطبية", 
      description: "تقارير حالات المرضى",
      path: "/medical-reports" 
    }
  ];

  return (
    <Card className="shadow-medical">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-blue-600" />
          أدوات الطبيب
        </CardTitle>
        <CardDescription>
          إدارة المرضى والسجلات الطبية
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {doctorActions.map((action) => {
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

export default DoctorNavigation;