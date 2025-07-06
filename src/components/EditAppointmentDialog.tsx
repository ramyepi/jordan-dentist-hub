
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, X } from "lucide-react";

interface Appointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  appointment_type: string;
  duration_minutes: number;
  notes: string | null;
  patient_id: string;
  doctor_id: string;
}

interface Doctor {
  id: string;
  full_name: string;
  specialization: string | null;
}

interface EditAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onUpdate: () => void;
}

const EditAppointmentDialog = ({ 
  isOpen, 
  onClose, 
  appointment, 
  onUpdate 
}: EditAppointmentDialogProps) => {
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [appointmentType, setAppointmentType] = useState("regular");
  const [status, setStatus] = useState("scheduled");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [notes, setNotes] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (appointment) {
      setScheduledDate(appointment.scheduled_date);
      setScheduledTime(appointment.scheduled_time);
      setDoctorId(appointment.doctor_id);
      setAppointmentType(appointment.appointment_type);
      setStatus(appointment.status);
      setDurationMinutes(appointment.duration_minutes);
      setNotes(appointment.notes || "");
    }
  }, [appointment]);

  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
    }
  }, [isOpen]);

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
    
    if (!appointment) return;
    
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          doctor_id: doctorId,
          appointment_type: appointmentType as any,
          status: status as any,
          duration_minutes: durationMinutes,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", appointment.id);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تحديث الموعد بنجاح",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تحديث الموعد",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusInArabic = (status: string) => {
    const statuses = {
      scheduled: "مجدول",
      confirmed: "مؤكد",
      completed: "مكتمل",
      cancelled: "ملغي"
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            تعديل الموعد
          </DialogTitle>
          <DialogDescription>
            تعديل تفاصيل الموعد المحدد
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* التاريخ */}
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">التاريخ</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            </div>

            {/* الوقت */}
            <div className="space-y-2">
              <Label htmlFor="scheduled_time">الوقت</Label>
              <Input
                id="scheduled_time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* الطبيب */}
            <div className="space-y-2">
              <Label>الطبيب</Label>
              <Select value={doctorId} onValueChange={setDoctorId} required>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطبيب" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{doctor.full_name}</span>
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

            {/* نوع الموعد */}
            <div className="space-y-2">
              <Label>نوع الموعد</Label>
              <Select value={appointmentType} onValueChange={setAppointmentType}>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* حالة الموعد */}
            <div className="space-y-2">
              <Label>حالة الموعد</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">مجدول</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
              <Badge className={getStatusColor(status)} variant="secondary">
                {getStatusInArabic(status)}
              </Badge>
            </div>

            {/* مدة الموعد */}
            <div className="space-y-2">
              <Label htmlFor="duration">مدة الموعد (بالدقائق)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                max="180"
                step="15"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
              />
            </div>
          </div>

          {/* الملاحظات */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              {isLoading ? "جاري التحديث..." : "تحديث الموعد"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAppointmentDialog;
