
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Search, Plus, Edit, Trash2, User, Clock, Stethoscope } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import EditAppointmentDialog from "@/components/EditAppointmentDialog";
import NewAppointmentDialog from "@/components/NewAppointmentDialog";

interface Appointment {
  id: string;
  patient_name: string;
  doctor_name: string | null;
  doctor_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  appointment_type: string;
  duration_minutes: number;
  notes: string | null;
  patient_id: string;
}

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patients (
            full_name
          ),
          profiles:doctor_id (
            full_name
          )
        `)
        .order("scheduled_date", { ascending: false })
        .order("scheduled_time", { ascending: false });

      if (error) throw error;

      const formattedAppointments = data?.map(appointment => ({
        id: appointment.id,
        patient_name: appointment.patients?.full_name || "غير محدد",
        doctor_name: appointment.profiles?.full_name || null,
        doctor_id: appointment.doctor_id,
        scheduled_date: appointment.scheduled_date,
        scheduled_time: appointment.scheduled_time,
        status: appointment.status,
        appointment_type: appointment.appointment_type,
        duration_minutes: appointment.duration_minutes,
        notes: appointment.notes,
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

  const handleDelete = async (appointmentId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الموعد؟")) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الموعد بنجاح",
      });

      fetchAppointments();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في حذف الموعد",
      });
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsEditDialogOpen(true);
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
      no_show: "bg-orange-100 text-orange-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status: string) => {
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

  const getTypeText = (type: string) => {
    const types = {
      regular: "عادي",
      emergency: "طارئ",
      consultation: "استشارة",
      treatment: "علاج"
    };
    return types[type as keyof typeof types] || type;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">جاري تحميل المواعيد...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المواعيد</h1>
          <p className="text-muted-foreground">عرض وإدارة مواعيد المرضى</p>
        </div>
        <Button 
          className="medical-gradient"
          onClick={() => setIsNewDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          موعد جديد
        </Button>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="البحث في المواعيد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="تصفية حسب الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="scheduled">مجدول</SelectItem>
            <SelectItem value="confirmed">مؤكد</SelectItem>
            <SelectItem value="in_progress">جاري</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
            <SelectItem value="no_show">لم يحضر</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* جدول المواعيد */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            قائمة المواعيد ({filteredAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المريض</TableHead>
                <TableHead>الطبيب</TableHead>
                <TableHead>التاريخ والوقت</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المدة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    لا توجد مواعيد مطابقة للبحث
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{appointment.patient_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {appointment.doctor_name ? (
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-green-600" />
                          <span>د. {appointment.doctor_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">غير محدد</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <div>
                          <div className="font-medium">
                            {format(new Date(appointment.scheduled_date), "dd/MM/yyyy", { locale: ar })}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.scheduled_time}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTypeText(appointment.appointment_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {appointment.duration_minutes} دقيقة
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(appointment.status)} variant="secondary">
                        {getStatusText(appointment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(appointment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(appointment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
              {appointments.filter(a => a.status === "confirmed").length}
            </div>
            <div className="text-sm text-gray-600">مؤكدة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {appointments.filter(a => a.status === "scheduled").length}
            </div>
            <div className="text-sm text-gray-600">مجدولة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {appointments.filter(a => a.status === "completed").length}
            </div>
            <div className="text-sm text-gray-600">مكتملة</div>
          </CardContent>
        </Card>
      </div>

      {/* حوارات التعديل والإضافة */}
      <EditAppointmentDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingAppointment(null);
        }}
        appointment={editingAppointment}
        onUpdate={fetchAppointments}
      />

      <NewAppointmentDialog
        isOpen={isNewDialogOpen}
        onClose={() => setIsNewDialogOpen(false)}
        onSuccess={fetchAppointments}
      />
    </div>
  );
};

export default Appointments;
