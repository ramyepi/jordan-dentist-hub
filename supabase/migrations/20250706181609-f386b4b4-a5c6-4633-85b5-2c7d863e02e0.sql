
-- إضافة جدول الإعدادات العامة للنظام
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language VARCHAR(10) NOT NULL DEFAULT 'ar',
  time_format VARCHAR(10) NOT NULL DEFAULT '24h',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) NOT NULL
);

-- تفعيل Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- السماح للمدير فقط بإدارة الإعدادات
CREATE POLICY "Admin can manage system settings" 
  ON public.system_settings 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  ));

-- السماح لجميع المستخدمين بقراءة الإعدادات
CREATE POLICY "All users can view system settings" 
  ON public.system_settings 
  FOR SELECT 
  USING (true);

-- تحديث trigger للجدول
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- جعل معرف الطبيب اختياري في جدول المواعيد
ALTER TABLE public.appointments 
ALTER COLUMN doctor_id DROP NOT NULL;
