import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  Clock,
  TrendingUp,
  UserCheck,
  Building,
  AlertCircle
} from "lucide-react";
import { adminNavigation } from "@/components/navigation/AdminNavigation";

interface DashboardStats {
  totalAppointments: number;
  totalPatients: number;
  monthlyRevenue: number;
  staffCount: number;
  todayAppointments: number;
  pendingPayments: number;
  completedAppointments: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    totalPatients: 0,
    monthlyRevenue: 0,
    staffCount: 0,
    todayAppointments: 0,
    pendingPayments: 0,
    completedAppointments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);

      // Fetch appointments data
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id, scheduled_date, status, total_cost");

      if (appointmentsError) throw appointmentsError;

      // Fetch patients data
      const { data: patients, error: patientsError } = await supabase
        .from("patients")
        .select("id, created_at");

      if (patientsError) throw patientsError;

      // Fetch staff data
      const { data: staff, error: staffError } = await supabase
        .from("profiles")
        .select("id, role, is_active")
        .eq("is_active", true);

      if (staffError) throw staffError;

      // Fetch payments data
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("id, amount, paid_amount, status, payment_date");

      if (paymentsError) throw paymentsError;

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const todayAppointments = appointments?.filter(apt => 
        apt.scheduled_date === today
      ).length || 0;

      const completedAppointments = appointments?.filter(apt => 
        apt.status === 'completed'
      ).length || 0;

      const monthlyRevenue = payments?.filter(payment => {
        if (!payment.payment_date) return false;
        const paymentDate = new Date(payment.payment_date);
        return paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear;
      }).reduce((sum, payment) => sum + (payment.paid_amount || 0), 0) || 0;

      const pendingPayments = payments?.filter(payment => 
        payment.status === 'pending' || payment.status === 'partial'
      ).length || 0;

      const newPatientsThisMonth = patients?.filter(patient => {
        const createdDate = new Date(patient.created_at);
        return createdDate.getMonth() === currentMonth && 
               createdDate.getFullYear() === currentYear;
      }).length || 0;

      setStats({
        totalAppointments: appointments?.length || 0,
        totalPatients: patients?.length || 0,
        monthlyRevenue: monthlyRevenue,
        staffCount: staff?.length || 0,
        todayAppointments: todayAppointments,
        pendingPayments: pendingPayments,
        completedAppointments: completedAppointments,
      });

    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-blue-600" />
          </div>
          <p className="text-lg font-medium">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            لوحة تحكم المدير
          </h2>
          <p className="text-gray-600">
            نظرة شاملة على جميع عمليات العيادة والإدارة
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-medical hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مواعيد اليوم</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayAppointments}</div>
              <p className="text-xs text-muted-foreground">
                من إجمالي {stats.totalAppointments} موعد
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow bg-gradient-to-r from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المرضى</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground">مريض مسجل</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow bg-gradient-to-r from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإيرادات الشهرية</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyRevenue.toFixed(2)} د.أ</div>
              <p className="text-xs text-muted-foreground">هذا الشهر</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow bg-gradient-to-r from-orange-50 to-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">عدد الموظفين</CardTitle>
              <UserCheck className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.staffCount}</div>
              <p className="text-xs text-muted-foreground">موظف نشط</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card className="shadow-medical">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                الإجراءات السريعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 group"
                    >
                      <Icon className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                      <span className="font-medium text-gray-700 group-hover:text-blue-800">
                        {item.name}
                      </span>
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity & Alerts */}
          <div className="space-y-6">
            {/* System Alerts */}
            <Card className="shadow-medical border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  تنبيهات النظام
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.pendingPayments > 0 && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">مدفوعات معلقة</p>
                      <p className="text-xs text-gray-600">يوجد {stats.pendingPayments} دفعة معلقة</p>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">عاجل</Badge>
                  </div>
                )}

                {stats.todayAppointments > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">مواعيد اليوم</p>
                      <p className="text-xs text-gray-600">{stats.todayAppointments} موعد اليوم</p>
                    </div>
                    <Badge variant="outline">متابعة</Badge>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">العمليات مكتملة</p>
                    <p className="text-xs text-gray-600">{stats.completedAppointments} موعد مكتمل</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">مكتمل</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  ملخص الأداء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">المواعيد المكتملة</span>
                    <span className="font-bold text-green-600">
                      {stats.totalAppointments > 0 
                        ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">إجمالي المرضى</span>
                    <span className="font-bold text-blue-600">{stats.totalPatients}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">الموظفين النشطين</span>
                    <span className="font-bold text-purple-600">{stats.staffCount}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">حالة العيادة</span>
                    <Badge className="bg-green-100 text-green-800">
                      {stats.todayAppointments > 0 ? "نشطة" : "هادئة"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
