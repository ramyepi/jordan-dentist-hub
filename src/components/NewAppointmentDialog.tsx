
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, Stethoscope } from "lucide-react";

interface Patient {
  id: string;
  full_name: string;
  phone: string;
}

interface Doctor {
  id: string;
  full_name: string;
  specialization: string | null;
}

interface NewAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NewAppointmentDialog = ({ isOpen, onClose, onSuccess }: NewAppointmentDialogProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: "",
    doctor_id: "",
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: "",
    appointment_type: "regular",
    duration_minutes: 60,
    notes: ""
  });

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
      fetchDoctors();
    }
  }, [isOpen]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, phone")
        .order("full_name");

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تحميل قائمة المرضى",
      });
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, specialization")
        .eq("role", "doctor")
        .eq("is_active", true)
        .order("full_name");

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تحميل قائمة الأطباء",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const appointmentData = {
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id || null, // جعل الطبيب اختياري
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        appointment_type: formData.appointment_type as any,
        duration_minutes: formData.duration_minutes,
        notes: formData.notes || null,
        status: "scheduled" as any
      };

      const { error } = await supabase
        .from("appointments")
        .insert([appointmentData]);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة الموعد بنجاح",
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في إضافة الموعد",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: "",
      doctor_id: "",
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: "",
      appointment_type: "regular",
      duration_minutes: 60,
      notes: ""
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            إضافة موعد جديد
          </DialogTitle>
          <DialogDescription>
            إضافة موعد جديد للمريض
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* المريض */}
            <div className="space-y-2">
              <Label htmlFor="patient_id">المريض *</Label>
              <Select 
                value={formData.patient_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, patient_id: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المريض" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{patient.full_name}</span>
                        <span className="text-sm text-gray-500">({patient.phone})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* الطبيب */}
            <div className="space-y-2">
              <Label htmlFor="doctor_id">الطبيب (اختياري)</Label>
              <Select 
                value={formData.doctor_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, doctor_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطبيب (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">بدون طبيب محدد</SelectItem>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        <span>د. {doctor.full_name}</span>
                        {doctor.specialization && (
                          <span className="text-sm text-gray-500">
                            ({doctor.specialization})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* التاريخ */}
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">التاريخ *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                required
              />
            </div>

            {/* الوقت */}
            <div className="space-y-2">
              <Label htmlFor="scheduled_time">الوقت *</Label>
              <Input
                id="scheduled_time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* نوع الموعد */}
            <div className="space-y-2">
              <Label>نوع الموعد</Label>
              <Select 
                value={formData.appointment_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, appointment_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">عادي</SelectItem>
                  <SelectItem value="emergency">طارئ</SelectItem>
                  <SelectItem value="consultation">استشارة</SelectItem>
                  <SelectItem value="treatment">علاج</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* مدة الموعد */}
            <div className="space-y-2">
              <Label htmlFor="duration">مدة الموعد (بالدقائق)</Label>
              <Select 
                value={formData.duration_minutes.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 دقيقة</SelectItem>
                  <SelectItem value="45">45 دقيقة</SelectItem>
                  <SelectItem value="60">ساعة واحدة</SelectItem>
                  <SelectItem value="90">ساعة ونصف</SelectItem>
                  <SelectItem value="120">ساعتان</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* الملاحظات */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="أي ملاحظات إضافية حول الموعد"
              rows={3}
            />
          </div>

          {/* أزرار التحكم */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 medical-gradient"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {isLoading ? "جاري الإضافة..." : "إضافة الموعد"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewAppointmentDialog;
