import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Users, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface Appointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  appointment_type: string;
  notes: string | null;
  patient_id: string;
  doctor_id: string;
  patients: {
    full_name: string;
    phone: string;
  };
  profiles: {
    full_name: string;
  };
}

interface Patient {
  id: string;
  full_name: string;
  phone: string;
}

interface Doctor {
  id: string;
  full_name: string;
}

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatient = searchParams.get("patient");

  // Form states
  const [newAppointment, setNewAppointment] = useState({
    patient_id: preselectedPatient || "",
    doctor_id: "",
    scheduled_date: "",
    scheduled_time: "",
    duration_minutes: 60,
    appointment_type: "regular",
    notes: ""
  });

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patients(full_name, phone),
          profiles(full_name)
        `)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في تحميل المواعيد",
        });
      } else {
        setAppointments(data || []);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, phone")
        .order("full_name");

      if (error) {
        console.error("Error fetching patients:", error);
      } else {
        setPatients(data || []);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "doctor")
        .order("full_name");

      if (error) {
        console.error("Error fetching doctors:", error);
      } else {
        setDoctors(data || []);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
        const { error } = await supabase
        .from("appointments")
        .insert([{
          ...newAppointment,
          appointment_type: newAppointment.appointment_type as "regular" | "emergency" | "consultation" | "treatment",
          notes: newAppointment.notes || null
        }]);

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في حجز الموعد",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: "تم حجز الموعد بنجاح",
        });
        setIsAddDialogOpen(false);
        setNewAppointment({
          patient_id: "",
          doctor_id: "",
          scheduled_date: "",
          scheduled_time: "",
          duration_minutes: 60,
          appointment_type: "regular",
          notes: ""
        });
        fetchAppointments();
      }
    } catch (error) {
      console.error("Error adding appointment:", error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-purple-100 text-purple-800",
      cancelled: "bg-red-100 text-red-800",
      no_show: "bg-gray-100 text-gray-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusInArabic = (status: string) => {
    const statuses = {
      scheduled: "مجدول",
      confirmed: "مؤكد",
      in_progress: "جاري",
      completed: "مكتمل",
      cancelled: "ملغي",
      no_show: "لم يحضر"
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  const getTypeInArabic = (type: string) => {
    const types = {
      regular: "عادي",
      emergency: "طارئ",
      consultation: "استشارة",
      treatment: "علاج"
    };
    return types[type as keyof typeof types] || type;
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remove seconds
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-JO');
  };

  // Get appointments for selected date
  const todayAppointments = appointments.filter(apt => 
    apt.scheduled_date === format(selectedDate, "yyyy-MM-dd")
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-lg font-medium">جاري تحميل المواعيد...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/dashboard")}
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                العودة للوحة التحكم
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">إدارة المواعيد</h1>
                <p className="text-sm text-gray-600">({appointments.length} موعد)</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-1">
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                  التقويم
                </CardTitle>
                <CardDescription>
                  اختر تاريخاً لعرض المواعيد
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border shadow-sm pointer-events-auto"
                  locale={ar}
                />
                
                <div className="mt-4">
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full medical-gradient gap-2">
                        <Plus className="h-4 w-4" />
                        حجز موعد جديد
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>حجز موعد جديد</DialogTitle>
                        <DialogDescription>
                          أدخل تفاصيل الموعد الجديد
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={handleAddAppointment} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="patient_id">المريض *</Label>
                            <Select 
                              value={newAppointment.patient_id}
                              onValueChange={(value) => setNewAppointment({...newAppointment, patient_id: value})}
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
                            <Label htmlFor="doctor_id">الطبيب *</Label>
                            <Select 
                              value={newAppointment.doctor_id}
                              onValueChange={(value) => setNewAppointment({...newAppointment, doctor_id: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الطبيب" />
                              </SelectTrigger>
                              <SelectContent>
                                {doctors.map((doctor) => (
                                  <SelectItem key={doctor.id} value={doctor.id}>
                                    د. {doctor.full_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="scheduled_date">التاريخ *</Label>
                            <Input
                              id="scheduled_date"
                              type="date"
                              value={newAppointment.scheduled_date}
                              onChange={(e) => setNewAppointment({...newAppointment, scheduled_date: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="scheduled_time">الوقت *</Label>
                            <Input
                              id="scheduled_time"
                              type="time"
                              value={newAppointment.scheduled_time}
                              onChange={(e) => setNewAppointment({...newAppointment, scheduled_time: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="appointment_type">نوع الموعد</Label>
                            <Select 
                              value={newAppointment.appointment_type}
                              onValueChange={(value) => setNewAppointment({...newAppointment, appointment_type: value})}
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
                            <Label htmlFor="duration_minutes">المدة (دقيقة)</Label>
                            <Input
                              id="duration_minutes"
                              type="number"
                              min="15"
                              max="180"
                              step="15"
                              value={newAppointment.duration_minutes}
                              onChange={(e) => setNewAppointment({...newAppointment, duration_minutes: parseInt(e.target.value)})}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="notes">ملاحظات</Label>
                          <Input
                            id="notes"
                            value={newAppointment.notes}
                            onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                            placeholder="أي ملاحظات إضافية"
                          />
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <Button type="submit" className="medical-gradient flex-1">
                            حجز الموعد
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsAddDialogOpen(false)}
                            className="flex-1"
                          >
                            إلغاء
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointments List */}
          <div className="lg:col-span-2">
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle>
                  مواعيد يوم {format(selectedDate, "dd/MM/yyyy", { locale: ar })}
                </CardTitle>
                <CardDescription>
                  {todayAppointments.length} موعد في هذا اليوم
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todayAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      لا توجد مواعيد في هذا التاريخ
                    </h3>
                    <p className="text-gray-600 mb-4">
                      قم بحجز موعد جديد للمرضى
                    </p>
                    <Button 
                      onClick={() => setIsAddDialogOpen(true)}
                      className="medical-gradient gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      حجز موعد جديد
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todayAppointments.map((appointment) => (
                      <div 
                        key={appointment.id} 
                        className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{formatTime(appointment.scheduled_time)}</span>
                            </div>
                            <Badge className={getStatusColor(appointment.status)} variant="secondary">
                              {getStatusInArabic(appointment.status)}
                            </Badge>
                            <Badge variant="outline">
                              {getTypeInArabic(appointment.appointment_type)}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">
                            {appointment.duration_minutes} دقيقة
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              المريض: {appointment.patients.full_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {appointment.patients.phone}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              الطبيب: د. {appointment.profiles.full_name}
                            </p>
                          </div>
                        </div>
                        
                        {appointment.notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded">
                            <p className="text-sm text-gray-700">
                              <strong>ملاحظات:</strong> {appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Appointments;