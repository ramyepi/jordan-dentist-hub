
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, User, Stethoscope } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ar } from "date-fns/locale";

interface CalendarAppointment {
  id: string;
  patient_name: string;
  doctor_name: string;
  scheduled_date: string;
  scheduled_time: string;
  appointment_type: string;
  status: string;
  duration_minutes: number;
}

const AppointmentsCalendar = () => {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      
      const { data: appointmentsData, error } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          appointment_type,
          status,
          duration_minutes,
          patient:patients!appointments_patient_id_fkey(full_name),
          doctor:profiles!appointments_doctor_id_fkey(full_name)
        `)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });

      if (error) throw error;

      const transformedAppointments: CalendarAppointment[] = (appointmentsData || []).map(apt => ({
        id: apt.id,
        patient_name: apt.patient?.full_name || 'مريض غير معروف',
        doctor_name: apt.doctor?.full_name || 'طبيب غير معروف',
        scheduled_date: apt.scheduled_date,
        scheduled_time: apt.scheduled_time,
        appointment_type: apt.appointment_type,
        status: apt.status,
        duration_minutes: apt.duration_minutes,
      }));

      setAppointments(transformedAppointments);
    } catch (error) {
      console.error("Error fetching calendar appointments:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تحميل مواعيد التقويم",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.scheduled_date), date)
    );
  };

  const getDaysWithAppointments = () => {
    return appointments.map(apt => new Date(apt.scheduled_date));
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusInArabic = (status: string) => {
    const statuses = {
      scheduled: "مجدول",
      confirmed: "مؤكد",
      completed: "مكتمل",
      cancelled: "ملغي",
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  const getTypeInArabic = (type: string) => {
    const types = {
      regular: "عادي",
      emergency: "طارئ",
      consultation: "استشارة",
      treatment: "علاج",
    };
    return types[type as keyof typeof types] || type;
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const selectedDateAppointments = getAppointmentsForDate(selectedDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">تقويم المواعيد</h1>
                <p className="text-sm text-gray-600">عرض جميع المواعيد في التقويم</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar */}
          <Card className="shadow-medical">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                التقويم الشهري
              </CardTitle>
              <CardDescription>
                اختر تاريخاً لعرض مواعيد ذلك اليوم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border mx-auto"
                locale={ar}
                modifiers={{
                  hasAppointments: getDaysWithAppointments(),
                }}
                modifiersStyles={{
                  hasAppointments: {
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    fontWeight: 'bold'
                  }
                }}
              />
              <div className="mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-100 rounded"></div>
                  <span>أيام بها مواعيد</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Appointments */}
          <Card className="shadow-medical">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                مواعيد يوم {format(selectedDate, "d MMMM yyyy", { locale: ar })}
              </CardTitle>
              <CardDescription>
                {selectedDateAppointments.length} موعد في هذا اليوم
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  </div>
                  <p className="text-gray-600">جاري التحميل...</p>
                </div>
              ) : selectedDateAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">لا توجد مواعيد في هذا اليوم</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedDateAppointments
                    .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
                    .map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(appointment.status)} variant="secondary">
                            {getStatusInArabic(appointment.status)}
                          </Badge>
                          <Badge variant="outline">{getTypeInArabic(appointment.appointment_type)}</Badge>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Clock className="h-3 w-3" />
                            {formatTime(appointment.scheduled_time)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {appointment.duration_minutes} دقيقة
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{appointment.patient_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-green-600" />
                          <span>{appointment.doctor_name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card className="shadow-medical">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">إجمالي المواعيد</p>
                  <p className="text-2xl font-bold">{appointments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medical">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">مواعيد اليوم</p>
                  <p className="text-2xl font-bold">{selectedDateAppointments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medical">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">مواعيد مؤكدة</p>
                  <p className="text-2xl font-bold">
                    {appointments.filter(apt => apt.status === 'confirmed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medical">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">مواعيد مجدولة</p>
                  <p className="text-2xl font-bold">
                    {appointments.filter(apt => apt.status === 'scheduled').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AppointmentsCalendar;
