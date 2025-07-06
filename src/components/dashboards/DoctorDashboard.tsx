import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Users, 
  Clock,
  Stethoscope,
  ClipboardList,
  TrendingUp
} from "lucide-react";
import DoctorNavigation from "@/components/navigation/DoctorNavigation";

const DoctorDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            لوحة تحكم الطبيب
          </h2>
          <p className="text-gray-600">
            إدارة مرضاك ومواعيدك اليومية
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
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">بقي 5 مواعيد</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مرضاي</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground">مريض نشط</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">العلاجات المكتملة</CardTitle>
              <Stethoscope className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-muted-foreground">هذا الشهر</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المتابعة المطلوبة</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">مرضى يحتاجون متابعة</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Doctor Actions */}
          <DoctorNavigation />

          {/* Today's Schedule & Patient Info */}
          <div className="space-y-6">
            {/* Today's Appointments */}
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  مواعيد اليوم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">أحمد محمد</p>
                      <p className="text-sm text-gray-600">فحص دوري - حشو</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">10:00 ص</Badge>
                      <p className="text-xs text-gray-500 mt-1">جاري الآن</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">فاطمة علي</p>
                      <p className="text-sm text-gray-600">علاج جذور</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">11:30 ص</Badge>
                      <p className="text-xs text-gray-500 mt-1">التالي</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-medium">محمد خالد</p>
                      <p className="text-sm text-gray-600">تنظيف أسنان</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">2:00 م</Badge>
                      <p className="text-xs text-gray-500 mt-1">بعد الظهر</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patient Status Summary */}
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-purple-600" />
                  ملخص حالات المرضى
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">حالات جديدة</span>
                    <Badge className="bg-blue-100 text-blue-800">5</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">تحت العلاج</span>
                    <Badge className="bg-orange-100 text-orange-800">12</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">مكتملة العلاج</span>
                    <Badge className="bg-green-100 text-green-800">25</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">معدل الشفاء</span>
                    <span className="font-bold text-green-600">96%</span>
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

export default DoctorDashboard;