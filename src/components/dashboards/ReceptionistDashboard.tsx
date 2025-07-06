import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Users, 
  CreditCard,
  Phone,
  UserPlus,
  CalendarPlus,
  Clock
} from "lucide-react";
import ReceptionistNavigation from "@/components/navigation/ReceptionistNavigation";

const ReceptionistDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            لوحة تحكم الاستقبال
          </h2>
          <p className="text-gray-600">
            إدارة المواعيد وخدمة المرضى
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
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">5 في الانتظار</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مرضى جدد</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المدفوعات اليوم</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,850 د.أ</div>
              <p className="text-xs text-muted-foreground">8 معاملات</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المكالمات</CardTitle>
              <Phone className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">12 حجوزات، 11 استفسار</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Receptionist Actions */}
          <ReceptionistNavigation />

          {/* Waiting List & Quick Actions */}
          <div className="space-y-6">
            {/* Today's Waiting List */}
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  قائمة الانتظار الحالية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-l-red-400">
                    <div>
                      <p className="font-medium">سارة أحمد</p>
                      <p className="text-sm text-gray-600">موعد 10:00 - متأخرة 15 دقيقة</p>
                    </div>
                    <Badge variant="secondary" className="bg-red-100 text-red-800">عاجل</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium">محمد علي</p>
                      <p className="text-sm text-gray-600">موعد 10:30 - وصل</p>
                    </div>
                    <Badge variant="outline">في الانتظار</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">فاطمة خالد</p>
                      <p className="text-sm text-gray-600">موعد 11:00 - تأكيد الحضور</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">مؤكد</Badge>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Phone className="h-4 w-4 mr-2" />
                    اتصال
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    إعادة جدولة
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Payment Processing */}
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  المدفوعات السريعة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">مدفوعات معلقة</span>
                    <Badge className="bg-orange-100 text-orange-800">4</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">أقساط مستحقة</span>
                    <Badge className="bg-red-100 text-red-800">2</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">مدفوعات اليوم</span>
                    <span className="font-bold text-green-600">1,850 د.أ</span>
                  </div>
                  <Separator />
                  <Button className="w-full" size="sm">
                    <CreditCard className="h-4 w-4 mr-2" />
                    تسجيل دفعة جديدة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;