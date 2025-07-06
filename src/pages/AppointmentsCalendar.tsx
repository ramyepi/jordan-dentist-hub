
import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { ar } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Plus, RotateCcw } from "lucide-react";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import NewAppointmentDialog from "@/components/NewAppointmentDialog";
import EditAppointmentDialog from "@/components/EditAppointmentDialog";

// إعداد المترجم للتواريخ
const locales = {
  ar: ar,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 6 }), // السبت بداية الأسبوع
  getDay,
  locales,
});

// رسائل باللغة العربية
const messages = {
  allDay: 'طوال اليوم',
  previous: 'السابق',
  next: 'التالي',
  today: 'اليوم',
  month: 'شهر',
  week: 'أسبوع',
  day: 'يوم',
  agenda: 'جدول',
  date: 'التاريخ',
  time: 'الوقت',
  event: 'موعد',
  noEventsInRange: 'لا توجد مواعيد في هذا النطاق',
  showMore: (total: number) => `+${total} أكثر`,
};

const AppointmentsCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showNewAppointmentDialog, setShowNewAppointmentDialog] = useState(false);
  const [showEditAppointmentDialog, setShowEditAppointmentDialog] = useState(false);
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { formatDateTime } = useSystemSettings();

  // جلب المواعيد
  const { data: appointments = [], refetch: refetchAppointments } = useQuery({
    queryKey: ['appointments-calendar', currentDate, doctorFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients(full_name, phone),
          profiles(full_name, specialization)
        `)
        .gte('scheduled_date', format(startOfMonth(currentDate), 'yyyy-MM-dd'))
        .lte('scheduled_date', format(endOfMonth(currentDate), 'yyyy-MM-dd'))
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (doctorFilter !== "all") {
        query = query.eq('doctor_id', doctorFilter);
      }

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data?.map(appointment => ({
        ...appointment,
        id: appointment.id,
        title: `${appointment.patients?.full_name} - ${appointment.profiles?.full_name || 'غير محدد'}`,
        start: new Date(`${appointment.scheduled_date}T${appointment.scheduled_time}`),
        end: new Date(`${appointment.scheduled_date}T${appointment.scheduled_time}`),
        resource: appointment
      })) || [];
    },
  });

  // جلب الأطباء للفلترة
  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, specialization')
        .eq('role', 'doctor')
        .eq('is_active', true)
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
  });

  const handleSelectEvent = (event: any) => {
    setSelectedAppointment(event.resource);
    setShowAppointmentDialog(true);
  };

  const handleNavigate = (action: 'prev' | 'next' | 'today') => {
    let newDate = currentDate;
    
    switch (action) {
      case 'prev':
        if (view === 'month') newDate = subMonths(currentDate, 1);
        else if (view === 'week') newDate = subWeeks(currentDate, 1);
        else newDate = subDays(currentDate, 1);
        break;
      case 'next':
        if (view === 'month') newDate = addMonths(currentDate, 1);
        else if (view === 'week') newDate = addWeeks(currentDate, 1);
        else newDate = addDays(currentDate, 1);
        break;
      case 'today':
        newDate = new Date();
        break;
    }
    
    setCurrentDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'confirmed': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-purple-500';
      case 'cancelled': return 'bg-red-500';
      case 'no_show': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'مجدول';
      case 'confirmed': return 'مؤكد';
      case 'in_progress': return 'جاري';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      case 'no_show': return 'لم يحضر';
      default: return status;
    }
  };

  const eventStyleGetter = (event: any) => {
    const backgroundColor = getStatusColor(event.resource.status);
    return {
      style: {
        backgroundColor: backgroundColor.replace('bg-', '#'),
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">تقويم المواعيد</h1>
          <p className="text-muted-foreground">إدارة وعرض المواعيد في التقويم</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowNewAppointmentDialog(true)}
            className="medical-gradient"
          >
            <Plus className="h-4 w-4 mr-2" />
            موعد جديد
          </Button>
          <Button
            variant="outline"
            onClick={() => refetchAppointments()}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* شريط التحكم */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* التنقل */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate('prev')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleNavigate('today')}
                className="min-w-[80px]"
              >
                اليوم
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate('next')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="mx-4 font-semibold text-lg">
                {format(currentDate, 'MMMM yyyy', { locale: ar })}
              </div>
            </div>

            {/* العرض والفلاتر */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex gap-1">
                <Button
                  variant={view === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('month')}
                >
                  شهر
                </Button>
                <Button
                  variant={view === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('week')}
                >
                  أسبوع
                </Button>
                <Button
                  variant={view === 'day' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('day')}
                >
                  يوم
                </Button>
              </div>

              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="كل الأطباء" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأطباء</SelectItem>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="كل الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="scheduled">مجدول</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التقويم */}
      <Card>
        <CardContent className="p-4">
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={appointments}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              view={view}
              onView={setView}
              date={currentDate}
              onNavigate={setCurrentDate}
              messages={messages}
              eventPropGetter={eventStyleGetter}
              className="rbc-calendar-rtl"
              culture="ar"
              rtl={true}
              showMultiDayTimes={true}
              step={30}
              showAllEvents={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {appointments.filter(a => isSameDay(a.start, new Date())).length}
            </div>
            <div className="text-sm text-gray-600">مواعيد اليوم</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter(a => a.resource.status === 'confirmed').length}
            </div>
            <div className="text-sm text-gray-600">مواعيد مؤكدة</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {appointments.filter(a => a.resource.status === 'scheduled').length}
            </div>
            <div className="text-sm text-gray-600">في الانتظار</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {appointments.filter(a => a.resource.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">مكتملة</div>
          </CardContent>
        </Card>
      </div>

      {/* حوار تفاصيل الموعد */}
      <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تفاصيل الموعد</DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">المريض</Label>
                <p className="text-sm text-gray-600">{selectedAppointment.patients?.full_name}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">الطبيب</Label>
                <p className="text-sm text-gray-600">{selectedAppointment.profiles?.full_name || 'غير محدد'}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">التاريخ والوقت</Label>
                <p className="text-sm text-gray-600">
                  {formatDateTime(new Date(`${selectedAppointment.scheduled_date}T${selectedAppointment.scheduled_time}`))}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">الحالة</Label>
                <Badge className={`${getStatusColor(selectedAppointment.status)} text-white`}>
                  {getStatusText(selectedAppointment.status)}
                </Badge>
              </div>
              
              {selectedAppointment.notes && (
                <div>
                  <Label className="text-sm font-medium">ملاحظات</Label>
                  <p className="text-sm text-gray-600">{selectedAppointment.notes}</p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowAppointmentDialog(false);
                    setShowEditAppointmentDialog(true);
                  }}
                  className="flex-1"
                >
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAppointmentDialog(false)}
                  className="flex-1"
                >
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* حوار موعد جديد */}
      <NewAppointmentDialog
        isOpen={showNewAppointmentDialog}
        onClose={() => setShowNewAppointmentDialog(false)}
        onSuccess={() => {
          setShowNewAppointmentDialog(false);
          refetchAppointments();
        }}
      />

      {/* حوار تعديل الموعد */}
      {selectedAppointment && (
        <EditAppointmentDialog
          isOpen={showEditAppointmentDialog}
          onClose={() => setShowEditAppointmentDialog(false)}
          onSuccess={() => {
            setShowEditAppointmentDialog(false);
            setShowAppointmentDialog(false);
            refetchAppointments();
          }}
          appointment={selectedAppointment}
        />
      )}
    </div>
  );
};

export default AppointmentsCalendar;
