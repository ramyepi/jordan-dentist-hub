
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Phone, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface AppointmentWithDetails {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  appointment_type: string;
  duration_minutes: number;
  notes: string | null;
  patient_name: string;
  patient_phone: string;
  doctor_name: string | null;
  doctor_id: string | null;
}

const AppointmentsCalendar = () => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
  ];

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patients (
            full_name,
            phone
          ),
          profiles:doctor_id (
            full_name
          )
        `)
        .eq("scheduled_date", selectedDate)
        .order("scheduled_time");

      if (error) throw error;

      const formattedAppointments = data?.map(appointment => ({
        id: appointment.id,
        scheduled_date: appointment.scheduled_date,
        scheduled_time: appointment.scheduled_time,
        status: appointment.status,
        appointment_type: appointment.appointment_type,
        duration_minutes: appointment.duration_minutes,
        notes: appointment.notes,
        patient_name: appointment.patients?.full_name || "غير محدد",
        patient_phone: appointment.patients?.phone || "",
        doctor_name: appointment.profiles?.full_name || "غير محدد",
        doctor_id: appointment.doctor_id
      })) || [];

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تحميل المواعيد",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-800 border-blue-300",
      confirmed: "bg-green-100 text-green-800 border-green-300",
      in_progress: "bg-yellow-100 text-yellow-800 border-yellow-300",
      completed: "bg-gray-100 text-gray-800 border-gray-300",
      cancelled: "bg-red-100 text-red-800 border-red-300"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getAppointmentForTimeSlot = (timeSlot: string) => {
    return appointments.find(apt => apt.scheduled_time === timeSlot + ":00");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">جاري تحميل التقويم...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">تقويم المواعيد</h1>
          <p className="text-muted-foreground">عرض وإدارة المواعيد اليومية</p>
        </div>
        <Button className="medical-gradient">
          <Plus className="h-4 w-4 mr-2" />
          موعد جديد
        </Button>
      </div>

      {/* اختيار التاريخ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            التاريخ المحدد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
          <p className="text-sm text-gray-600 mt-2">
            {format(new Date(selectedDate), "EEEE، d MMMM yyyy", { locale: ar })}
          </p>
        </CardContent>
      </Card>

      {/* جدول المواعيد */}
      <Card>
        <CardHeader>
          <CardTitle>جدول المواعيد</CardTitle>
          <CardDescription>
            المواعيد المجدولة لتاريخ {format(new Date(selectedDate), "d MMMM yyyy", { locale: ar })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {timeSlots.map((timeSlot) => {
              const appointment = getAppointmentForTimeSlot(timeSlot);
              
              return (
                <div
                  key={timeSlot}
                  className={`p-4 border rounded-lg transition-colors ${
                    appointment 
                      ? "bg-blue-50 border-blue-200 hover:bg-blue-100" 
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center text-sm font-medium text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        {timeSlot}
                      </div>
                      
                      {appointment ? (
                        <div className="flex items-center gap-4">
                          <Badge className={getStatusColor(appointment.status)} variant="outline">
                            {appointment.status === "scheduled" && "مجدول"}
                            {appointment.status === "confirmed" && "مؤكد"}
                            {appointment.status === "in_progress" && "جاري"}
                            {appointment.status === "completed" && "مكتمل"}
                            {appointment.status === "cancelled" && "ملغي"}
                          </Badge>
                          
                          <div className="flex items-center text-sm">
                            <User className="h-4 w-4 mr-1 text-blue-600" />
                            <span className="font-medium">{appointment.patient_name}</span>
                          </div>
                          
                          {appointment.patient_phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-1" />
                              {appointment.patient_phone}
                            </div>
                          )}
                          
                          {appointment.doctor_name && appointment.doctor_name !== "غير محدد" && (
                            <div className="text-sm text-gray-600">
                              د. {appointment.doctor_name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">متاح</span>
                      )}
                    </div>
                    
                    {appointment && (
                      <div className="text-xs text-gray-500">
                        {appointment.duration_minutes} دقيقة • {appointment.appointment_type === "regular" ? "عادي" : 
                         appointment.appointment_type === "emergency" ? "طارئ" : 
                         appointment.appointment_type === "consultation" ? "استشارة" : "علاج"}
                      </div>
                    )}
                  </div>
                  
                  {appointment?.notes && (
                    <div className="text-xs text-gray-600 mt-2 p-2 bg-white rounded border">
                      {appointment.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{appointments.length}</div>
            <div className="text-sm text-gray-600">إجمالي المواعيد</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter(apt => apt.status === "completed").length}
            </div>
            <div className="text-sm text-gray-600">مكتملة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {appointments.filter(apt => apt.status === "confirmed").length}
            </div>
            <div className="text-sm text-gray-600">مؤكدة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {appointments.filter(apt => apt.status === "cancelled").length}
            </div>
            <div className="text-sm text-gray-600">ملغية</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppointmentsCalendar;
