
-- إضافة حقل وصف العيادة إلى جدول إعدادات النظام
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS clinic_description TEXT DEFAULT 'نظام إدارة متكامل';
