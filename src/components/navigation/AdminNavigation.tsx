
import { Calendar, Users, DollarSign, CreditCard, BarChart3, Settings, Stethoscope, UserCog, Receipt, CalendarDays } from "lucide-react";

const adminNavigation = [
  { name: "لوحة التحكم", href: "/dashboard", icon: BarChart3 },
  { name: "المرضى", href: "/patients", icon: Users },
  { name: "المواعيد", href: "/appointments", icon: Calendar },
  { name: "التقويم", href: "/appointments-calendar", icon: CalendarDays },
  { name: "المدفوعات", href: "/payments", icon: DollarSign },
  { name: "الأقساط", href: "/installments", icon: CreditCard },
  { name: "المصاريف", href: "/expenses", icon: Receipt },
  { name: "الخدمات العلاجية", href: "/services", icon: Stethoscope },
  { name: "إدارة الموظفين", href: "/staff", icon: UserCog },
  { name: "التحليلات المالية", href: "/analytics", icon: BarChart3 },
  { name: "إعدادات النظام", href: "/system-settings", icon: Settings },
];

export { adminNavigation };
