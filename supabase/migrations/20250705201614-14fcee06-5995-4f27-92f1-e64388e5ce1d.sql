-- Add clinic expenses table
CREATE TABLE public.clinic_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL, -- 'medicine', 'equipment', 'salary', 'utilities', 'other'
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  receipt_path TEXT, -- path to receipt image in storage
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add audit logs table for tracking operations
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view'
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update profiles table with additional fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS salary DECIMAL(10,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notes TEXT;

-- Enable RLS on new tables
ALTER TABLE public.clinic_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clinic_expenses
CREATE POLICY "Admin can manage all expenses" ON public.clinic_expenses
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Staff can view expenses" ON public.clinic_expenses
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'doctor', 'receptionist')
  )
);

-- Create RLS policies for audit_logs (admin only)
CREATE POLICY "Admin can view audit logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Update existing RLS policies to be more role-specific
DROP POLICY IF EXISTS "Authenticated users can view patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can delete patients" ON public.patients;

-- Patients policies - doctors and receptionists can manage, nurses can view
CREATE POLICY "Doctors and receptionists can manage patients" ON public.patients
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'doctor', 'receptionist')
  )
);

CREATE POLICY "Nurses can view patients" ON public.patients
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'doctor', 'receptionist', 'nurse')
  )
);

-- Update appointments policies
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can delete appointments" ON public.appointments;

-- Appointments policies - role-based access
CREATE POLICY "Staff can manage appointments" ON public.appointments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'doctor', 'receptionist')
  )
);

CREATE POLICY "Doctors can view their own appointments" ON public.appointments
FOR SELECT TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'doctor'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'receptionist', 'nurse')
  )
);

-- Update payments policies to be more restrictive
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can update payments" ON public.payments;

-- Payments policies - admin and receptionist only
CREATE POLICY "Admin and receptionist can manage payments" ON public.payments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'receptionist')
  )
);

CREATE POLICY "Doctors can view payments for their appointments" ON public.payments
FOR SELECT TO authenticated
USING (
  appointment_id IN (
    SELECT id FROM public.appointments 
    WHERE appointments.doctor_id IN (
      SELECT id FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'doctor'
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'receptionist')
  )
);

-- Add triggers for new tables
CREATE TRIGGER update_clinic_expenses_updated_at 
BEFORE UPDATE ON public.clinic_expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log database operations
CREATE OR REPLACE FUNCTION public.log_operation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  )
  VALUES (
    (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to important tables
CREATE TRIGGER audit_patients_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.log_operation();

CREATE TRIGGER audit_appointments_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.log_operation();

CREATE TRIGGER audit_payments_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.log_operation();