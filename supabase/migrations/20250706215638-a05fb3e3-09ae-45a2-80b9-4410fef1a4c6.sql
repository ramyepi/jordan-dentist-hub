
-- إضافة حقل نوع التقويم إلى جدول إعدادات النظام
ALTER TABLE public.system_settings 
ADD COLUMN calendar_type VARCHAR(20) NOT NULL DEFAULT 'gregorian';

-- إضافة تعليق للحقل الجديد
COMMENT ON COLUMN public.system_settings.calendar_type IS 'نوع التقويم: gregorian (ميلادي) أو hijri (هجري)';
