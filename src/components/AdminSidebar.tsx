import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  FileText, 
  Settings, 
  UserPlus,
  TrendingUp,
  DollarSign,
  Building,
  ClipboardList,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      title: "لوحة التحكم",
      icon: BarChart3,
      path: "/dashboard",
      description: "نظرة عامة على العيادة"
    },
    {
      title: "إدارة الموظفين",
      icon: Users,
      path: "/staff-management",
      description: "إضافة وإدارة الموظفين"
    },
    {
      title: "إدارة المرضى",
      icon: UserPlus,
      path: "/patients",
      description: "قائمة وإدارة المرضى"
    },
    {
      title: "إدارة المواعيد",
      icon: Calendar,
      path: "/appointments",
      description: "جدولة ومتابعة المواعيد"
    },
    {
      title: "إدارة الدفعات",
      icon: CreditCard,
      path: "/payments",
      description: "الدفعات والفواتير"
    },
    {
      title: "مصروفات العيادة",
      icon: DollarSign,
      path: "/expenses",
      description: "تسجيل ومتابعة المصروفات"
    },
    {
      title: "التحليلات المالية",
      icon: TrendingUp,
      path: "/financial-analytics",
      description: "تقارير وتحليلات مالية"
    },
    {
      title: "التقارير",
      icon: FileText,
      path: "/reports",
      description: "تقارير شاملة"
    },
    {
      title: "إعدادات النظام",
      icon: Settings,
      path: "/settings",
      description: "إعدادات عامة"
    }
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h2 className="font-bold text-lg text-gray-900">لوحة الأدمن</h2>
            <p className="text-sm text-gray-600">إدارة شاملة للعيادة</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.path}
              variant={isActivePath(item.path) ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-12 text-right",
                isCollapsed ? "px-2" : "px-4",
                isActivePath(item.path) && "bg-blue-100 text-blue-800"
              )}
              onClick={() => navigate(item.path)}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-right">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                </div>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-center text-xs text-gray-500">
            <Building className="h-4 w-4 mx-auto mb-1" />
            <p>عيادة الأسنان الذكية</p>
            <p>نظام إدارة متكامل</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSidebar;