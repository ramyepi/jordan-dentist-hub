
-- Create expense_categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-800',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add category_id column to clinic_expenses table
ALTER TABLE public.clinic_expenses 
ADD COLUMN category_id UUID REFERENCES public.expense_categories(id);

-- Add new columns to system_settings table
ALTER TABLE public.system_settings 
ADD COLUMN timezone VARCHAR(100) DEFAULT 'Asia/Amman',
ADD COLUMN date_format VARCHAR(50) DEFAULT 'dd/MM/yyyy',
ADD COLUMN currency VARCHAR(10) DEFAULT 'JOD',
ADD COLUMN currency_symbol VARCHAR(10) DEFAULT 'د.أ';

-- Enable RLS on expense_categories
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for expense_categories
CREATE POLICY "Staff can view expense categories" 
ON public.expense_categories 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'doctor', 'receptionist', 'nurse')
));

CREATE POLICY "Admin and receptionist can manage expense categories" 
ON public.expense_categories 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'receptionist')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'receptionist')
));

-- Add trigger for updated_at
CREATE TRIGGER update_expense_categories_updated_at
    BEFORE UPDATE ON public.expense_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default expense categories
INSERT INTO public.expense_categories (name, name_en, description, color, created_by) 
SELECT 
  'أدوية' as name,
  'medicine' as name_en,
  'أدوية ومستلزمات طبية' as description,
  'bg-blue-100 text-blue-800' as color,
  p.id as created_by
FROM public.profiles p 
WHERE p.role = 'admin' 
LIMIT 1;

INSERT INTO public.expense_categories (name, name_en, description, color, created_by) 
SELECT 
  'معدات' as name,
  'equipment' as name_en,
  'معدات ومستلزمات العيادة' as description,
  'bg-green-100 text-green-800' as color,
  p.id as created_by
FROM public.profiles p 
WHERE p.role = 'admin' 
LIMIT 1;

INSERT INTO public.expense_categories (name, name_en, description, color, created_by) 
SELECT 
  'رواتب' as name,
  'salary' as name_en,
  'رواتب الموظفين' as description,
  'bg-purple-100 text-purple-800' as color,
  p.id as created_by
FROM public.profiles p 
WHERE p.role = 'admin' 
LIMIT 1;

INSERT INTO public.expense_categories (name, name_en, description, color, created_by) 
SELECT 
  'خدمات' as name,
  'utilities' as name_en,
  'فواتير الخدمات العامة' as description,
  'bg-yellow-100 text-yellow-800' as color,
  p.id as created_by
FROM public.profiles p 
WHERE p.role = 'admin' 
LIMIT 1;

INSERT INTO public.expense_categories (name, name_en, description, color, created_by) 
SELECT 
  'صيانة' as name,
  'maintenance' as name_en,
  'صيانة المعدات والمبنى' as description,
  'bg-orange-100 text-orange-800' as color,
  p.id as created_by
FROM public.profiles p 
WHERE p.role = 'admin' 
LIMIT 1;

INSERT INTO public.expense_categories (name, name_en, description, color, created_by) 
SELECT 
  'أخرى' as name,
  'other' as name_en,
  'مصاريف متنوعة' as description,
  'bg-gray-100 text-gray-800' as color,
  p.id as created_by
FROM public.profiles p 
WHERE p.role = 'admin' 
LIMIT 1;
