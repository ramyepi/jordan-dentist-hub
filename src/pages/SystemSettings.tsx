
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Globe, Clock, Shield, Save } from "lucide-react";

interface SystemSetting {
  id: string;
  language: string;
  time_format: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const SystemSettings = () => {
  const [settings, setSettings] = useState<SystemSetting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  const [formData, setFormData] = useState({
    language: "ar",
    time_format: "24h"
  });

  useEffect(() => {
    fetchCurrentUserProfile();
    fetchSettings();
  }, []);

  const fetchCurrentUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setCurrentUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setFormData({
          language: data.language,
          time_format: data.time_format
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تحميل الإعدادات",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
      toast({
        variant: "destructive",
        title: "غير مسموح",
        description: "هذه الصفحة مخصصة للمدير فقط",
      });
      return;
    }

    setIsSaving(true);

    try {
      const settingsData = {
        language: formData.language,
        time_format: formData.time_format,
        created_by: currentUserProfile.id
      };

      let error;
      if (settings) {
        // تحديث الإعدادات الموجودة
        const result = await supabase
          .from("system_settings")
          .update(settingsData)
          .eq("id", settings.id);
        error = result.error;
      } else {
        // إنشاء إعدادات جديدة
        const result = await supabase
          .from("system_settings")
          .insert([settingsData]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "تم الحفظ",
        description: "تم حفظ الإعدادات بنجاح",
      });

      fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في حفظ الإعدادات",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">جاري تحميل الإعدادات...</div>
      </div>
    );
  }

  if (!currentUserProfile || currentUserProfile.role !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">غير مسموح</h2>
            <p className="text-gray-600">
              هذه الصفحة مخصصة للمدير فقط. يرجى التواصل مع الإدارة للحصول على الصلاحيات المناسبة.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الإعدادات العامة</h1>
          <p className="text-muted-foreground">إدارة إعدادات النظام العامة</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="medical-gradient"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* إعدادات اللغة والوقت */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                إعدادات اللغة
              </CardTitle>
              <CardDescription>
                تحديد لغة واجهة النظام الافتراضية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>لغة النظام</Label>
                <Select 
                  value={formData.language} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600">
                  اللغة المحددة ستكون اللغة الافتراضية لجميع المستخدمين الجدد
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                إعدادات الوقت
              </CardTitle>
              <CardDescription>
                تحديد نظام عرض الوقت في النظام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>نظام الوقت</Label>
                <Select 
                  value={formData.time_format} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, time_format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24 ساعة (14:30)</SelectItem>
                    <SelectItem value="12h">12 ساعة (2:30 PM)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600">
                  نظام عرض الوقت المحدد سيظهر في جميع أنحاء النظام
                </p>
              </div>
            </CardContent>
          </Card>

          {/* إعدادات متقدمة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إعدادات متقدمة
              </CardTitle>
              <CardDescription>
                إعدادات إضافية لإدارة النظام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">النسخ الاحتياطي</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    يتم إنشاء نسخة احتياطية تلقائياً كل 24 ساعة
                  </p>
                  <Button variant="outline" size="sm">
                    إنشاء نسخة احتياطية الآن
                  </Button>
                </div>

                <Separator />

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">تحديث النظام</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    آخر تحديث: منذ أسبوع واحد
                  </p>
                  <Button variant="outline" size="sm">
                    التحقق من التحديثات
                  </Button>
                </div>

                <Separator />

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">أمان النظام</h4>
                  <p className="text-sm text-green-700 mb-3">
                    النظام محمي بتشفير قوي وجدار حماية متقدم
                  </p>
                  <Button variant="outline" size="sm">
                    مراجعة إعدادات الأمان
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* معلومات النظام */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات النظام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">إصدار النظام</Label>
                <p className="text-sm text-gray-600">الإصدار 2.1.0</p>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium">آخر تحديث للإعدادات</Label>
                <p className="text-sm text-gray-600">
                  {settings ? new Date(settings.updated_at).toLocaleDateString('ar-SA') : "لم يتم التحديث بعد"}
                </p>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium">المدير الحالي</Label>
                <p className="text-sm text-gray-600">{currentUserProfile?.full_name}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إحصائيات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">إجمالي المستخدمين</span>
                <span className="text-sm font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">المرضى المسجلين</span>
                <span className="text-sm font-medium">248</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">المواعيد هذا الشهر</span>
                <span className="text-sm font-medium">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">حجم البيانات</span>
                <span className="text-sm font-medium">2.4 GB</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الدعم الفني</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <span>🔧</span>
                طلب دعم فني
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <span>📖</span>
                دليل المستخدم
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <span>💬</span>
                التواصل مع الدعم
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
