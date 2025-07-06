
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface NewAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NewAppointmentDialog = ({ isOpen, onClose, onSuccess }: NewAppointmentDialogProps) => {
  const [formData, setFormData] = useState({
    patient_id: "",
    doctor_id: "",
    scheduled_date: "",
    scheduled_time: "",
    appointment_type: "regular" as const,
    notes: "",
    duration_minutes: 60
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch patients
  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, phone')
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch doctors
  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, specialization')
        .eq('role', 'doctor')
        .eq('is_active', true)
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id || !formData.scheduled_date || !formData.scheduled_time) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('appointments')
        .insert([{
          patient_id: formData.patient_id,
          doctor_id: formData.doctor_id || null,
          scheduled_date: formData.scheduled_date,
          scheduled_time: formData.scheduled_time,
          appointment_type: formData.appointment_type,
          notes: formData.notes || null,
          duration_minutes: formData.duration_minutes,
          status: 'scheduled'
        }]);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الموعد بنجاح",
      });

      onSuccess();
      onClose();
      setFormData({
        patient_id: "",
        doctor_id: "",
        scheduled_date: "",
        scheduled_time: "",
        appointment_type: "regular",
        notes: "",
        duration_minutes: 60
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في إنشاء الموعد",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>موعد جديد</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient">المريض *</Label>
            <Select
              value={formData.patient_id}
              onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المريض" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name} - {patient.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doctor">الطبيب (اختياري)</Label>
            <Select
              value={formData.doctor_id}
              onValueChange={(value) => setFormData({ ...formData, doctor_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الطبيب" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.full_name}
                    {doctor.specialization && ` - ${doctor.specialization}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">التاريخ *</Label>
              <Input
                id="date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">الوقت *</Label>
              <Input
                id="time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">نوع الموعد</Label>
            <Select
              value={formData.appointment_type}
              onValueChange={(value: "regular" | "emergency" | "consultation" | "treatment") => 
                setFormData({ ...formData, appointment_type: value })
              }
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

          <div className="space-y-2">
            <Label htmlFor="duration">المدة (دقيقة)</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              max="240"
              step="15"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أي ملاحظات إضافية..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "جاري الحفظ..." : "حفظ الموعد"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewAppointmentDialog;
