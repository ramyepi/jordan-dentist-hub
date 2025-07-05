-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('doctor', 'receptionist', 'nurse', 'admin');

-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'nurse',
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  date_of_birth DATE,
  address TEXT,
  medical_history TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointment status enum
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');

-- Create appointment type enum
CREATE TYPE public.appointment_type AS ENUM ('regular', 'emergency', 'consultation', 'treatment');

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id),
  appointment_type appointment_type NOT NULL DEFAULT 'regular',
  status appointment_status NOT NULL DEFAULT 'scheduled',
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  notes TEXT,
  treatment_plan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment method enum
CREATE TYPE public.payment_method AS ENUM ('cash', 'cliq', 'installment');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'partial', 'cancelled');

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create installment plans table
CREATE TABLE public.installment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medical records table for storing X-ray images and documents
CREATE TABLE public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id),
  record_type TEXT NOT NULL, -- 'xray', 'document', 'image'
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT, -- path to file in Supabase storage
  file_size INTEGER,
  mime_type TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for patients (all authenticated users can manage patients)
CREATE POLICY "Authenticated users can view patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update patients" ON public.patients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete patients" ON public.patients FOR DELETE TO authenticated USING (true);

-- Create policies for appointments
CREATE POLICY "Authenticated users can view appointments" ON public.appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update appointments" ON public.appointments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete appointments" ON public.appointments FOR DELETE TO authenticated USING (true);

-- Create policies for payments
CREATE POLICY "Authenticated users can view payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update payments" ON public.payments FOR UPDATE TO authenticated USING (true);

-- Create policies for installment plans
CREATE POLICY "Authenticated users can view installment plans" ON public.installment_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage installment plans" ON public.installment_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update installment plans" ON public.installment_plans FOR UPDATE TO authenticated USING (true);

-- Create policies for medical records
CREATE POLICY "Authenticated users can view medical records" ON public.medical_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage medical records" ON public.medical_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update medical records" ON public.medical_records FOR UPDATE TO authenticated USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    'nurse'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for medical records
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-records', 'medical-records', false);

-- Create storage policies for medical records
CREATE POLICY "Authenticated users can upload medical records" ON storage.objects 
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'medical-records');

CREATE POLICY "Authenticated users can view medical records" ON storage.objects 
FOR SELECT TO authenticated USING (bucket_id = 'medical-records');

CREATE POLICY "Authenticated users can update medical records" ON storage.objects 
FOR UPDATE TO authenticated USING (bucket_id = 'medical-records');

CREATE POLICY "Authenticated users can delete medical records" ON storage.objects 
FOR DELETE TO authenticated USING (bucket_id = 'medical-records');