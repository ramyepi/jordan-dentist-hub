
-- إضافة حقل اسم العيادة إلى جدول إعدادات النظام
ALTER TABLE public.system_settings 
ADD COLUMN clinic_name VARCHAR(255) NOT NULL DEFAULT 'عيادة الأسنان الذكية';

-- إضافة تعليق للحقل الجديد
COMMENT ON COLUMN public.system_settings.clinic_name IS 'اسم العيادة القابل للتخصيص';

-- إضافة سياسة RLS للسماح للمدير بحذف الملفات الشخصية
CREATE POLICY "Admin can delete profiles" 
  ON public.profiles 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  ));

-- إعادة إنشاء view patient_comprehensive_report لإصلاح الحسابات المالية
DROP VIEW IF EXISTS public.patient_comprehensive_report;

CREATE VIEW public.patient_comprehensive_report AS
WITH patient_stats AS (
  SELECT 
    p.id,
    p.full_name,
    p.phone,
    p.email,
    p.address,
    p.date_of_birth,
    p.medical_history,
    p.notes as patient_notes,
    p.created_at as patient_since,
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments,
    COUNT(DISTINCT CASE WHEN a.status IN ('scheduled', 'confirmed') THEN a.id END) as scheduled_appointments,
    MAX(a.scheduled_date) as last_appointment_date,
    MIN(a.scheduled_date) as first_appointment_date,
    COALESCE(SUM(a.final_total), 0) as total_treatment_cost,
    STRING_AGG(DISTINCT a.treatment_plan, '; ') as treatment_plans
  FROM public.patients p
  LEFT JOIN public.appointments a ON p.id = a.patient_id
  GROUP BY p.id, p.full_name, p.phone, p.email, p.address, p.date_of_birth, p.medical_history, p.notes, p.created_at
),
payment_stats AS (
  SELECT 
    p.patient_id,
    COALESCE(SUM(p.paid_amount), 0) as total_paid
  FROM public.payments p
  WHERE p.status IN ('paid', 'partial')
  GROUP BY p.patient_id
),
installment_stats AS (
  SELECT 
    pay.patient_id,
    COUNT(ip.id) as total_installments,
    COUNT(CASE WHEN ip.is_paid THEN 1 END) as paid_installments,
    COUNT(CASE WHEN NOT ip.is_paid THEN 1 END) as pending_installments,
    COALESCE(SUM(CASE WHEN NOT ip.is_paid THEN ip.amount END), 0) as pending_installments_amount,
    MIN(CASE WHEN NOT ip.is_paid THEN ip.due_date END) as next_installment_date
  FROM public.payments pay
  LEFT JOIN public.installment_plans ip ON pay.id = ip.payment_id
  GROUP BY pay.patient_id
)
SELECT 
  ps.*,
  COALESCE(pys.total_paid, 0) as total_paid,
  COALESCE(ps.total_treatment_cost - pys.total_paid, ps.total_treatment_cost) as outstanding_balance,
  COALESCE(ins.total_installments, 0) as total_installments,
  COALESCE(ins.pending_installments, 0) as pending_installments,
  COALESCE(ins.pending_installments_amount, 0) as pending_installments_amount,
  ins.next_installment_date
FROM patient_stats ps
LEFT JOIN payment_stats pys ON ps.id = pys.patient_id
LEFT JOIN installment_stats ins ON ps.id = ins.patient_id;
