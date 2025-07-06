
-- إنشاء جدول الخدمات العلاجية مع الأسعار
CREATE TABLE public.treatment_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 30,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول ربط الخدمات بالمواعيد
CREATE TABLE public.appointment_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.treatment_services(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول الملخص المالي لكل مريض
CREATE TABLE public.patient_financial_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE UNIQUE,
  total_appointments INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  total_pending NUMERIC NOT NULL DEFAULT 0,
  last_payment_date DATE,
  last_appointment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة عمود التكلفة الإجمالية لجدول المواعيد
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0;

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment_id ON public.appointment_services(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_services_service_id ON public.appointment_services(service_id);
CREATE INDEX IF NOT EXISTS idx_patient_financial_summary_patient_id ON public.patient_financial_summary(patient_id);

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.treatment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_financial_summary ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للخدمات العلاجية
CREATE POLICY "Authenticated users can view treatment services" 
  ON public.treatment_services 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Admin and doctors can manage treatment services" 
  ON public.treatment_services 
  FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'doctor')
  ));

-- سياسات RLS لخدمات المواعيد
CREATE POLICY "Staff can view appointment services" 
  ON public.appointment_services 
  FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'doctor', 'receptionist', 'nurse')
  ));

CREATE POLICY "Staff can manage appointment services" 
  ON public.appointment_services 
  FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'doctor', 'receptionist')
  ));

-- سياسات RLS للملخص المالي
CREATE POLICY "Staff can view patient financial summary" 
  ON public.patient_financial_summary 
  FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'doctor', 'receptionist')
  ));

CREATE POLICY "Admin and receptionist can manage patient financial summary" 
  ON public.patient_financial_summary 
  FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'receptionist')
  ));

-- إنشاء دالة لتحديث الملخص المالي تلقائياً
CREATE OR REPLACE FUNCTION public.update_patient_financial_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث أو إنشاء الملخص المالي للمريض
  INSERT INTO public.patient_financial_summary (
    patient_id,
    total_appointments,
    total_amount,
    total_paid,
    total_pending,
    last_payment_date,
    last_appointment_date
  )
  SELECT 
    p.id as patient_id,
    COUNT(DISTINCT a.id) as total_appointments,
    COALESCE(SUM(DISTINCT a.total_cost), 0) as total_amount,
    COALESCE(SUM(pay.paid_amount), 0) as total_paid,
    COALESCE(SUM(DISTINCT a.total_cost), 0) - COALESCE(SUM(pay.paid_amount), 0) as total_pending,
    MAX(pay.payment_date) as last_payment_date,
    MAX(a.scheduled_date) as last_appointment_date
  FROM public.patients p
  LEFT JOIN public.appointments a ON p.id = a.patient_id
  LEFT JOIN public.payments pay ON a.id = pay.appointment_id
  WHERE p.id = COALESCE(NEW.patient_id, OLD.patient_id)
  GROUP BY p.id
  ON CONFLICT (patient_id) 
  DO UPDATE SET
    total_appointments = EXCLUDED.total_appointments,
    total_amount = EXCLUDED.total_amount,
    total_paid = EXCLUDED.total_paid,
    total_pending = EXCLUDED.total_pending,
    last_payment_date = EXCLUDED.last_payment_date,
    last_appointment_date = EXCLUDED.last_appointment_date,
    updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء المشغلات لتحديث الملخص المالي تلقائياً
CREATE TRIGGER update_patient_summary_on_appointment
  AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_patient_financial_summary();

CREATE TRIGGER update_patient_summary_on_payment
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_patient_financial_summary();

-- إدراج بعض الخدمات العلاجية الأساسية
INSERT INTO public.treatment_services (name, description, price, duration_minutes, category) VALUES
('كشف طبي عام', 'فحص طبي شامل وتشخيص أولي', 25.00, 30, 'consultation'),
('جلسة علاج طبيعي', 'جلسة علاج طبيعي متخصصة', 30.00, 45, 'physiotherapy'),
('حقنة عضلية', 'حقن الأدوية في العضل', 10.00, 15, 'injection'),
('تخطيط قلب', 'فحص كهربائية القلب', 20.00, 20, 'diagnostic'),
('تحليل دم شامل', 'فحص مخبري للدم', 15.00, 10, 'laboratory'),
('أشعة سينية', 'تصوير بالأشعة السينية', 35.00, 15, 'radiology'),
('استشارة تخصصية', 'استشارة طبية متخصصة', 40.00, 45, 'consultation');

-- تحديث الجدول triggers للتحديث التلقائي
CREATE TRIGGER update_treatment_services_updated_at
  BEFORE UPDATE ON public.treatment_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_financial_summary_updated_at
  BEFORE UPDATE ON public.patient_financial_summary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
