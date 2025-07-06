
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  ClipboardList,
  Heart,
  FileText,
  Phone,
  CalendarDays
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const NurseNavigation = () => {
  const navigate = useNavigate();

  const nurseActions = [
    { 
      icon: Calendar, 
      title: "مواعيد اليوم", 
      description: "عرض مواعيد المرضى",
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
      title: "معلومات المرضى", 
      description: "عرض ملفات المرضى",
      path: "/patients" 
    },
    { 
      icon: CreditCard, 
      title: "محاسبة المرضى", 
      description: "تسجيل وإدارة دفعات المرضى",
      path: "/patient-payments" 
    },
    { 
      icon: ClipboardList, 
      title: "المساعدة الطبية", 
      description: "تسجيل الملاحظات والمساعدة",
      path: "/medical-assistance" 
    },
    { 
      icon: Heart, 
      title: "العلامات الحيوية", 
      description: "تسجيل الضغط والحرارة",
      path: "/vital-signs" 
    },
    { 
      icon: Phone, 
      title: "التواصل مع المرضى", 
      description: "متابعة ما بعد العلاج",
      path: "/patient-communication" 
    },
    { 
      icon: FileText, 
      title: "تقارير التمريض", 
      description: "تقارير يومية وملاحظات",
      path: "/nursing-reports" 
    }
  ];

  return (
    <Card className="shadow-medical">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-purple-600" />
          مهام التمريض
        </CardTitle>
        <CardDescription>
          المساعدة الطبية ورعاية المرضى
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {nurseActions.map((action) => {
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

export default NurseNavigation;
