
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Globe, Clock, Shield, Save, DollarSign, Calendar } from "lucide-react";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";

const SystemSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  const { settings, updateSettings, formatDateTime, formatCurrency } = useSystemSettings();

  const [formData, setFormData] = useState({
    language: "ar",
    time_format: "24h",
    timezone: "Asia/Amman",
    date_format: "dd/MM/yyyy",
    currency: "JOD",
    currency_symbol: "د.أ",
    calendar_type: "gregorian"
  });

  const timezones = [
    { value: "Asia/Amman", label: "عمان (UTC+3)" },
    { value: "Asia/Riyadh", label: "الرياض (UTC+3)" },
    { value: "Asia/Dubai", label: "دبي (UTC+4)" },
    { value: "Europe/London", label: "لندن (UTC+0)" },
    { value: "America/New_York", label: "نيويورك (UTC-5)" }
  ];

  const currencies = [
    { value: "JOD", symbol: "د.أ", label: "دينار أردني" },
    { value: "SAR", symbol: "ر.س", label: "ريال سعودي" },
    { value: "AED", symbol: "د.إ", label: "درهم إماراتي" },
    { value: "USD", symbol: "$", label: "دولار أمريكي" },
    { value: "EUR", symbol: "€", label: "يورو" }
  ];

  const dateFormats = [
    { value: "dd/MM/yyyy", label: "يوم/شهر/سنة (31/12/2024)" },
    { value: "MM/dd/yyyy", label: "شهر/يوم/سنة (12/31/2024)" },
    { value: "yyyy-MM-dd", label: "سنة-شهر-يوم (2024-12-31)" },
    { value: "dd-MM-yyyy", label: "يوم-شهر-سنة (31-12-2024)" }
  ];

  useEffect(() => {
    fetchCurrentUserProfile();
  }, []);

  useEffect(() => {
    if (settings) {
      setFormData({
        language: settings.language,
        time_format: settings.time_format,
        timezone: settings.timezone,
        date_format: settings.date_format,
        currency: settings.currency,
        currency_symbol: settings.currency_symbol,
        calendar_type: settings.calendar_type || "gregorian"
      });
    }
    setIsLoading(false);
  }, [settings]);

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
    await updateSettings(formData);
    setIsSaving(false);
  };

  const handleCurrencyChange = (currencyValue: string) => {
    const selectedCurrency = currencies.find(c => c.value === currencyValue);
    setFormData(prev => ({
      ...prev,
      currency: currencyValue,
      currency_symbol: selectedCurrency?.symbol || "د.أ"
    }));
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
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                إعدادات اللغة والمنطقة
              </CardTitle>
              <CardDescription>
                تحديد لغة واجهة النظام والمنطقة الزمنية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-2">
                  <Label>المنطقة الزمنية</Label>
                  <Select 
                    value={formData.timezone} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                إعدادات التقويم
              </CardTitle>
              <CardDescription>
                تحديد نوع التقويم المستخدم في النظام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>نوع التقويم</Label>
                <Select 
                  value={formData.calendar_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, calendar_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gregorian">التقويم الميلادي</SelectItem>
                    <SelectItem value="hijri">التقويم الهجري</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                إعدادات الوقت والتاريخ
              </CardTitle>
              <CardDescription>
                تحديد نظام عرض الوقت والتاريخ في النظام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-2">
                  <Label>تنسيق التاريخ</Label>
                  <Select 
                    value={formData.date_format} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, date_format: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dateFormats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">معاينة التنسيق</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-blue-700">الوقت الحالي: </span>
                    <span className="font-mono">{formatDateTime(new Date())}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">التاريخ فقط: </span>
                    <span className="font-mono">{formatDateTime(new Date(), false)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                إعدادات العملة
              </CardTitle>
              <CardDescription>
                تحديد العملة المستخدمة في النظام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>العملة</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={handleCurrencyChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label} ({currency.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* معاينة العملة */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">معاينة العملة</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-green-700">مثال على السعر: </span>
                    <span className="font-mono font-bold">{formatCurrency(150.75)}</span>
                  </div>
                </div>
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
                  {settings.id ? formatDateTime(new Date(), false) : "لم يتم التحديث بعد"}
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
              <CardTitle>الإعدادات الحالية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">لغة النظام</span>
                <span className="text-sm font-medium">{formData.language === 'ar' ? 'العربية' : 'English'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">نظام الوقت</span>
                <span className="text-sm font-medium">{formData.time_format === '24h' ? '24 ساعة' : '12 ساعة'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">المنطقة الزمنية</span>
                <span className="text-sm font-medium">{timezones.find(tz => tz.value === formData.timezone)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">العملة</span>
                <span className="text-sm font-medium">{formData.currency_symbol}</span>
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
