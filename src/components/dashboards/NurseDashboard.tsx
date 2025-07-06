import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Users, 
  Heart,
  ClipboardList,
  Phone,
  AlertCircle,
  Thermometer
} from "lucide-react";
import NurseNavigation from "@/components/navigation/NurseNavigation";

const NurseDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            لوحة تحكم التمريض
          </h2>
          <p className="text-gray-600">
            مساعدة المرضى والدعم الطبي
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-medical hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مرضى اليوم</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">تمت مساعدتهم</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">العلامات الحيوية</CardTitle>
              <Heart className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">25</div>
              <p className="text-xs text-muted-foreground">قياس مسجل</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المتابعة الهاتفية</CardTitle>
              <Phone className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">مكالمة متابعة</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">حالات خاصة</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">تحتاج متابعة</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Nurse Actions */}
          <NurseNavigation />

          {/* Patient Care & Tasks */}
          <div className="space-y-6">
            {/* Priority Tasks */}
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  المهام ذات الأولوية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-l-red-400">
                    <div>
                      <p className="font-medium text-sm">قياس ضغط دم</p>
                      <p className="text-xs text-gray-600">أحمد محمد - مريض سكري</p>
                    </div>
                    <Badge variant="secondary" className="bg-red-100 text-red-800">عاجل</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">تحضير المريض</p>
                      <p className="text-xs text-gray-600">فاطمة علي - عملية جراحية</p>
                    </div>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">قريباً</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">متابعة هاتفية</p>
                      <p className="text-xs text-gray-600">محمد خالد - بعد العلاج</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">مجدول</Badge>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <Button className="w-full" size="sm">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  عرض جميع المهام
                </Button>
              </CardContent>
            </Card>

            {/* Vital Signs Summary */}
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-red-600" />
                  ملخص العلامات الحيوية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">Normal</div>
                      <div className="text-xs text-gray-600">ضغط الدم الطبيعي</div>
                      <div className="text-sm font-medium">15 مريض</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-lg font-bold text-yellow-600">Watch</div>
                      <div className="text-xs text-gray-600">يحتاج مراقبة</div>
                      <div className="text-sm font-medium">3 مرضى</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>متوسط الحرارة</span>
                      <span className="font-bold">37.1°C</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>متوسط النبض</span>
                      <span className="font-bold">75 bpm</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>متوسط الضغط</span>
                      <span className="font-bold">120/80</span>
                    </div>
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

export default NurseDashboard;