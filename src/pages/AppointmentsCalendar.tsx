import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Phone, Plus, Edit, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import EditAppointmentDialog from "@/components/EditAppointmentDialog";
import NewAppointmentDialog from "@/components/NewAppointmentDialog";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";

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
  total_cost: number | null;
  patient_id: string;
}

const AppointmentsCalendar = () => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [isLoading, setIsLoading] = useState(true);
  const [editAppointment, setEditAppointment] = useState<AppointmentWithDetails | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewAppointmentDialogOpen, setIsNewAppointmentDialogOpen] = useState(false);

  const { formatDateTime, formatCurrency } = useSystemSettings();

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
  ];

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, viewMode]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      let startDate, endDate;
      
      if (viewMode === "day") {
        startDate = endDate = format(selectedDate, "yyyy-MM-dd");
      } else {
        const weekStart = startOfWeek(selectedDate, { locale: ar });
        const weekEnd = endOfWeek(selectedDate, { locale: ar });
        startDate = format(weekStart, "yyyy-MM-dd");
        endDate = format(weekEnd, "yyyy-MM-dd");
      }

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
        .gte("scheduled_date", startDate)
        .lte("scheduled_date", endDate)
        .order("scheduled_date")
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
        doctor_id: appointment.doctor_id,
        total_cost: appointment.total_cost,
        patient_id: appointment.patient_id
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

  const getAppointmentsForDate = (date: string) => {
    return appointments.filter(apt => apt.scheduled_date === date);
  };

  const getAppointmentForTimeSlot = (date: string, timeSlot: string) => {
    return appointments.find(apt => 
      apt.scheduled_date === date && apt.scheduled_time === timeSlot + ":00"
    );
  };

  const handleEditAppointment = (appointment: AppointmentWithDetails) => {
    setEditAppointment(appointment);
    setIsEditDialogOpen(true);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "day") {
      setSelectedDate(direction === "next" ? addDays(selectedDate, 1) : subDays(selectedDate, 1));
    } else {
      setSelectedDate(direction === "next" ? addDays(selectedDate, 7) : subDays(selectedDate, 7));
    }
  };

  const getWeekDays = () => {
    const weekStart = startOfWeek(selectedDate, { locale: ar });
    const weekEnd = endOfWeek(selectedDate, { locale: ar });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">جاري تحميل التقويم...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">تقويم المواعيد</h1>
          <p className="text-muted-foreground">عرض وإدارة المواعيد الطبية</p>
        </div>
        <Button 
          className="medical-gradient"
          onClick={() => setIsNewAppointmentDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          موعد جديد
        </Button>
      </div>

      {/* أدوات التحكم */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              التحكم بالتقويم
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("day")}
              >
                يومي
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
              >
                أسبوعي
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? formatDateTime(selectedDate, false) : "اختر التاريخ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <UICalendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                  السابق
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                  التالي
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                  اليوم
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              {viewMode === "day" 
                ? formatDateTime(selectedDate, false)
                : `أسبوع ${format(startOfWeek(selectedDate), "d MMM", { locale: ar })} - ${format(endOfWeek(selectedDate), "d MMM yyyy", { locale: ar })}`
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* عرض التقويم */}
      {viewMode === "day" ? (
        <Card>
          <CardHeader>
            <CardTitle>جدول المواعيد - {formatDateTime(selectedDate, false)}</CardTitle>
            <CardDescription>
              المواعيد المجدولة لهذا اليوم ({getAppointmentsForDate(format(selectedDate, "yyyy-MM-dd")).length} موعد)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {timeSlots.map((timeSlot) => {
                const appointment = getAppointmentForTimeSlot(format(selectedDate, "yyyy-MM-dd"), timeSlot);
                
                return (
                  <div
                    key={timeSlot}
                    className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                      appointment 
                        ? "bg-blue-50 border-blue-200 hover:bg-blue-100" 
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                    onClick={() => appointment && handleEditAppointment(appointment)}
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
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            handleEditAppointment(appointment);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <div className="text-xs text-gray-500">
                            {appointment.duration_minutes} دقيقة • {appointment.appointment_type === "regular" ? "عادي" : 
                             appointment.appointment_type === "emergency" ? "طارئ" : 
                             appointment.appointment_type === "consultation" ? "استشارة" : "علاج"}
                            {appointment.total_cost && (
                              <span> • {formatCurrency(appointment.total_cost)}</span>
                            )}
                          </div>
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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>العرض الأسبوعي</CardTitle>
            <CardDescription>
              المواعيد للأسبوع من {format(startOfWeek(selectedDate), "d MMM", { locale: ar })} إلى {format(endOfWeek(selectedDate), "d MMM yyyy", { locale: ar })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {getWeekDays().map((day) => {
                const dayAppointments = getAppointmentsForDate(format(day, "yyyy-MM-dd"));
                const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                
                return (
                  <div
                    key={format(day, "yyyy-MM-dd")}
                    className={`p-3 border rounded-lg ${isToday ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  >
                    <div className="text-center mb-2">
                      <div className={`text-sm font-medium ${isToday ? "text-blue-600" : "text-gray-900"}`}>
                        {format(day, "EEE", { locale: ar })}
                      </div>
                      <div className={`text-lg font-bold ${isToday ? "text-blue-600" : "text-gray-900"}`}>
                        {format(day, "d")}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((appointment) => (
                        <div
                          key={appointment.id}
                          className="text-xs p-2 bg-white rounded border cursor-pointer hover:bg-gray-50"
                          onClick={() => handleEditAppointment(appointment)}
                        >
                          <div className="font-medium truncate">{appointment.patient_name}</div>
                          <div className="text-gray-500">{appointment.scheduled_time.slice(0, 5)}</div>
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-center text-gray-500 p-1">
                          +{dayAppointments.length - 3} أخرى
                        </div>
                      )}
                      {dayAppointments.length === 0 && (
                        <div className="text-xs text-center text-gray-400 p-2">
                          لا توجد مواعيد
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Dialog لتعديل الموعد */}
      <EditAppointmentDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditAppointment(null);
        }}
        appointment={editAppointment}
        onUpdate={fetchAppointments}
      />

      {/* Dialog لإضافة موعد جديد */}
      <NewAppointmentDialog
        isOpen={isNewAppointmentDialogOpen}
        onClose={() => setIsNewAppointmentDialogOpen(false)}
        onSuccess={fetchAppointments}
        defaultDate={selectedDate}
      />
    </div>
  );
};

export default AppointmentsCalendar;
