
import { Calendar, Users, DollarSign, CreditCard, BarChart3, Settings, Stethoscope, UserCog, Receipt, CalendarDays, FileText } from "lucide-react";

const adminNavigation = [
  { name: "لوحة التحكم", href: "/dashboard", icon: BarChart3 },
  { name: "المرضى", href: "/patients", icon: Users },
  { name: "تقارير المرضى", href: "/patient-reports", icon: FileText },
  { name: "المواعيد", href: "/appointments", icon: Calendar },
  { name: "التقويم", href: "/appointments-calendar", icon: CalendarDays },
  { name: "المدفوعات", href: "/payments", icon: DollarSign },
  { name: "دفعات المرضى", href: "/patient-payments", icon: Receipt },
  { name: "الأقساط", href: "/installments", icon: CreditCard },
  { name: "المصاريف", href: "/expenses", icon: Receipt },
  { name: "الخدمات العلاجية", href: "/treatment-services", icon: Stethoscope },
  { name: "إدارة الموظفين", href: "/staff-management", icon: UserCog },
  { name: "التحليلات المالية", href: "/financial-analytics", icon: BarChart3 },
  { name: "إعدادات النظام", href: "/system-settings", icon: Settings },
];

export { adminNavigation };
