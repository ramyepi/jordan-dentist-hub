
-- إنشاء جدول فئات الخدمات العلاجية
CREATE TABLE public.service_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  name_en text NOT NULL,
  description text,
  color text NOT NULL DEFAULT 'bg-blue-100 text-blue-800',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- إضافة RLS للجدول الجديد
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لفئات الخدمات
CREATE POLICY "Staff can view service categories" 
  ON public.service_categories 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'doctor', 'receptionist', 'nurse')
    )
  );

CREATE POLICY "Admin and doctors can manage service categories" 
  ON public.service_categories 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'doctor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'doctor')
    )
  );

-- إضافة عمود category_id إلى جدول treatment_services
ALTER TABLE public.treatment_services 
ADD COLUMN category_id uuid REFERENCES public.service_categories(id);

-- إنشاء فئات افتراضية
INSERT INTO public.service_categories (name, name_en, description, color, created_by)
SELECT 
  'عام', 'general', 'خدمات عامة', 'bg-gray-100 text-gray-800',
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin')
UNION ALL
SELECT 
  'تنظيف وتلميع', 'cleaning', 'خدمات تنظيف وتلميع الأسنان', 'bg-blue-100 text-blue-800',
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin')
UNION ALL
SELECT 
  'حشوات', 'fillings', 'حشوات الأسنان المختلفة', 'bg-green-100 text-green-800',
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin')
UNION ALL
SELECT 
  'جراحة', 'surgery', 'العمليات الجراحية', 'bg-red-100 text-red-800',
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin')
UNION ALL
SELECT 
  'تقويم', 'orthodontics', 'خدمات تقويم الأسنان', 'bg-purple-100 text-purple-800',
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin')
UNION ALL
SELECT 
  'تجميل', 'cosmetic', 'خدمات تجميل الأسنان', 'bg-pink-100 text-pink-800',
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin');

-- تحديث الخدمات الموجودة لربطها بالفئات الجديدة
UPDATE public.treatment_services 
SET category_id = (
  SELECT id FROM public.service_categories 
  WHERE name_en = 
    CASE public.treatment_services.category
      WHEN 'general' THEN 'general'
      WHEN 'cleaning' THEN 'cleaning'
      WHEN 'fillings' THEN 'fillings'
      WHEN 'surgery' THEN 'surgery'
      WHEN 'orthodontics' THEN 'orthodontics'
      WHEN 'cosmetic' THEN 'cosmetic'
      ELSE 'general'
    END
  LIMIT 1
);

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_service_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_categories_updated_at
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW EXECUTE FUNCTION update_service_categories_updated_at();

-- إنشاء view شامل لتقارير المرضى
CREATE OR REPLACE VIEW public.patient_comprehensive_report AS
SELECT 
  p.id,
  p.full_name,
  p.phone,
  p.email,
  p.date_of_birth,
  p.address,
  p.medical_history,
  p.notes as patient_notes,
  p.created_at as patient_since,
  
  -- إحصائيات المواعيد
  COUNT(DISTINCT a.id) as total_appointments,
  COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments,
  COUNT(DISTINCT CASE WHEN a.status = 'scheduled' THEN a.id END) as scheduled_appointments,
  MAX(a.scheduled_date) as last_appointment_date,
  MIN(a.scheduled_date) as first_appointment_date,
  
  -- الخطة العلاجية الحالية
  STRING_AGG(DISTINCT a.treatment_plan, '; ') FILTER (WHERE a.treatment_plan IS NOT NULL) as treatment_plans,
  
  -- التفاصيل المالية
  COALESCE(SUM(DISTINCT a.final_total), 0) as total_treatment_cost,
  COALESCE(SUM(pay.paid_amount), 0) as total_paid,
  COALESCE(SUM(DISTINCT a.final_total), 0) - COALESCE(SUM(pay.paid_amount), 0) as outstanding_balance,
  
  -- معلومات الأقساط
  COUNT(DISTINCT inst.id) as total_installments,
  COUNT(DISTINCT CASE WHEN inst.is_paid = false THEN inst.id END) as pending_installments,
  MIN(CASE WHEN inst.is_paid = false THEN inst.due_date END) as next_installment_date,
  COALESCE(SUM(CASE WHEN inst.is_paid = false THEN inst.amount END), 0) as pending_installments_amount

FROM public.patients p
LEFT JOIN public.appointments a ON p.id = a.patient_id
LEFT JOIN public.payments pay ON a.id = pay.appointment_id
LEFT JOIN public.installment_plans inst ON pay.id = inst.payment_id
GROUP BY p.id, p.full_name, p.phone, p.email, p.date_of_birth, p.address, p.medical_history, p.notes, p.created_at;

-- منح الصلاحيات للـ view
GRANT SELECT ON public.patient_comprehensive_report TO authenticated;
