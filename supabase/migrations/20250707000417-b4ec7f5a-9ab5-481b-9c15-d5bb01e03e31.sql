
-- إضافة حقول الخصم للمواعيد
ALTER TABLE public.appointments 
ADD COLUMN discount_percentage numeric DEFAULT 0,
ADD COLUMN discount_amount numeric DEFAULT 0,
ADD COLUMN subtotal numeric DEFAULT 0,
ADD COLUMN final_total numeric DEFAULT 0;

-- تحديث جدول appointment_services لإضافة ملاحظات
ALTER TABLE public.appointment_services 
ADD COLUMN service_notes text;

-- تحديث المواعيد الموجودة لحساب القيم الجديدة
UPDATE public.appointments 
SET subtotal = COALESCE(total_cost, 0),
    final_total = COALESCE(total_cost, 0)
WHERE subtotal IS NULL OR final_total IS NULL;

-- إنشاء دالة لإعادة حساب إجمالي الموعد
CREATE OR REPLACE FUNCTION public.recalculate_appointment_total(appointment_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    services_total numeric := 0;
    discount_amt numeric := 0;
    discount_pct numeric := 0;
    subtotal_amt numeric := 0;
    final_amt numeric := 0;
BEGIN
    -- حساب إجمالي الخدمات
    SELECT COALESCE(SUM(total_price), 0) INTO services_total
    FROM public.appointment_services
    WHERE appointment_id = appointment_id_param;
    
    -- جلب نسبة ومبلغ الخصم
    SELECT 
        COALESCE(discount_percentage, 0),
        COALESCE(discount_amount, 0)
    INTO discount_pct, discount_amt
    FROM public.appointments
    WHERE id = appointment_id_param;
    
    -- حساب المبلغ الإجمالي
    subtotal_amt := services_total;
    
    -- تطبيق الخصم (نسبة مئوية أولاً، ثم مبلغ ثابت)
    IF discount_pct > 0 THEN
        discount_amt := subtotal_amt * (discount_pct / 100);
    END IF;
    
    final_amt := subtotal_amt - discount_amt;
    
    -- تحديث الموعد
    UPDATE public.appointments
    SET 
        subtotal = subtotal_amt,
        discount_amount = discount_amt,
        final_total = final_amt,
        total_cost = final_amt,
        updated_at = now()
    WHERE id = appointment_id_param;
END;
$$;

-- إنشاء trigger لإعادة حساب المجموع تلقائياً عند تغيير الخدمات
CREATE OR REPLACE FUNCTION public.trigger_recalculate_appointment_total()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- إعادة حساب المجموع للموعد المتأثر
    PERFORM public.recalculate_appointment_total(
        COALESCE(NEW.appointment_id, OLD.appointment_id)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ربط الـ trigger بجدول appointment_services
DROP TRIGGER IF EXISTS recalculate_total_on_service_change ON public.appointment_services;
CREATE TRIGGER recalculate_total_on_service_change
    AFTER INSERT OR UPDATE OR DELETE ON public.appointment_services
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_recalculate_appointment_total();
