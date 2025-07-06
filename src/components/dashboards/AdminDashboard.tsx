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
import AdminNavigation from "@/components/navigation/AdminNavigation";

const AdminDashboard = () => {
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
              <CardTitle className="text-sm font-medium">إجمالي المواعيد</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow bg-gradient-to-r from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المرضى</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">+12 هذا الشهر</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow bg-gradient-to-r from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإيرادات الشهرية</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32,400 د.أ</div>
              <p className="text-xs text-muted-foreground">+8% من الشهر الماضي</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow bg-gradient-to-r from-orange-50 to-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">عدد الموظفين</CardTitle>
              <UserCheck className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">2 طبيب، 3 ممرضات، 3 استقبال</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <AdminNavigation />

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
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">موعد متأخر</p>
                    <p className="text-xs text-gray-600">أحمد محمد - تأخر 15 دقيقة</p>
                  </div>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">عاجل</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">فاتورة مستحقة</p>
                    <p className="text-xs text-gray-600">مريض: فاطمة علي - 350 د.أ</p>
                  </div>
                  <Badge variant="outline">متابعة</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">جهاز جديد</p>
                    <p className="text-xs text-gray-600">تم تثبيت جهاز الأشعة الجديد</p>
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
                  ملخص الأداء اليومي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">نسبة الحضور</span>
                    <span className="font-bold text-green-600">92%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">متوسط وقت الانتظار</span>
                    <span className="font-bold text-blue-600">12 دقيقة</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">رضا المرضى</span>
                    <span className="font-bold text-purple-600">4.8/5</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">كفاءة العيادة</span>
                    <Badge className="bg-green-100 text-green-800">ممتاز</Badge>
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