
-- إصلاح مشكلة التكرار اللا نهائي في سياسات RLS
-- أولاً، سنحذف السياسة المسببة للمشكلة
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;

-- إنشاء دالة أمان للتحقق من دور المستخدم الحالي
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- إنشاء سياسة جديدة باستخدام الدالة الآمنة
CREATE POLICY "Admin can manage all profiles" ON public.profiles
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');
