import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import EditAppointmentDialog from "@/components/EditAppointmentDialog";
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Plus, 
  Search,
  Edit,
  Trash2,
  FileText,
  X
} from "lucide-react";

interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  scheduled_date: string;
  scheduled_time: string;
  appointment_type: string;
  status: string;
  duration_minutes: number;
  total_cost: number | null;
  notes: string | null;
  services: Array<{
    id: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }> | null;
}

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState<Omit<Appointment, 'id' | 'doctor_name' | 'patient_name'>>({
    patient_id: '',
    doctor_id: '',
    scheduled_date: '',
    scheduled_time: '',
    appointment_type: 'regular',
    status: 'scheduled',
    duration_minutes: 60,
    total_cost: 0,
    notes: null,
    services: null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("appointments_view")
        .select('*')
        .order("scheduled_date", { ascending: false })
        .order("scheduled_time", { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
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

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsEditDialogOpen(true);
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الموعد؟")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
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

  const handleNewAppointmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setNewAppointment({
      ...newAppointment,
      [e.target.name]: e.target.value,
    });
  };

  const handleNewAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("appointments")
        .insert([newAppointment]);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء موعد جديد بنجاح",
      });

      setIsNewDialogOpen(false);
      setNewAppointment({
        patient_id: '',
        doctor_id: '',
        scheduled_date: '',
        scheduled_time: '',
        appointment_type: 'regular',
        status: 'scheduled',
        duration_minutes: 60,
        total_cost: 0,
        notes: null,
        services: null,
      });
      fetchAppointments();
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في إنشاء الموعد",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const searchTermLower = searchTerm.toLowerCase();
    const patientNameLower = appointment.patient_name.toLowerCase();
    const doctorNameLower = appointment.doctor_name.toLowerCase();

    const matchesSearchTerm =
      patientNameLower.includes(searchTermLower) ||
      doctorNameLower.includes(searchTermLower) ||
      appointment.scheduled_date.includes(searchTerm) ||
      appointment.scheduled_time.includes(searchTerm);

    const matchesStatus = filterStatus === "all" || appointment.status === filterStatus;

    return matchesSearchTerm && matchesStatus;
  });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-JO');
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} د.أ`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">إدارة المواعيد</h1>
              <p className="text-sm text-gray-600">عرض وتعديل المواعيد</p>
            </div>
            <Button onClick={() => setIsNewDialogOpen(true)} className="gap-2 medical-gradient">
              <Plus className="h-4 w-4" />
              إضافة موعد جديد
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* نموذج إضافة موعد جديد */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  إضافة موعد جديد
                </CardTitle>
                <CardDescription>
                  إضافة موعد جديد إلى جدول المواعيد
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleNewAppointmentSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient_id">معرف المريض</Label>
                    <Input
                      type="text"
                      id="patient_id"
                      name="patient_id"
                      value={newAppointment.patient_id}
                      onChange={handleNewAppointmentChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctor_id">معرف الطبيب</Label>
                    <Input
                      type="text"
                      id="doctor_id"
                      name="doctor_id"
                      value={newAppointment.doctor_id}
                      onChange={handleNewAppointmentChange}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduled_date">التاريخ</Label>
                      <Input
                        type="date"
                        id="scheduled_date"
                        name="scheduled_date"
                        value={newAppointment.scheduled_date}
                        onChange={handleNewAppointmentChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scheduled_time">الوقت</Label>
                      <Input
                        type="time"
                        id="scheduled_time"
                        name="scheduled_time"
                        value={newAppointment.scheduled_time}
                        onChange={handleNewAppointmentChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appointment_type">نوع الموعد</Label>
                    <Select
                      name="appointment_type"
                      value={newAppointment.appointment_type}
                      onValueChange={(value) => handleNewAppointmentChange({ target: { name: 'appointment_type', value } } as any)}
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
                    <Label htmlFor="status">الحالة</Label>
                    <Select
                      name="status"
                      value={newAppointment.status}
                      onValueChange={(value) => handleNewAppointmentChange({ target: { name: 'status', value } } as any)}
                    >
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration_minutes">المدة (بالدقائق)</Label>
                    <Input
                      type="number"
                      id="duration_minutes"
                      name="duration_minutes"
                      value={newAppointment.duration_minutes}
                      onChange={handleNewAppointmentChange}
                      min="15"
                      max="180"
                      step="15"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">ملاحظات</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={newAppointment.notes || ""}
                      onChange={handleNewAppointmentChange}
                      placeholder="ملاحظات إضافية"
                      rows={3}
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full medical-gradient">
                    {isLoading ? "جاري الإنشاء..." : "إنشاء موعد"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* قائمة المواعيد */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-medical">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      جدول المواعيد
                    </CardTitle>
                    <CardDescription>
                      إدارة وعرض جميع المواعيد المجدولة
                    </CardDescription>
                  </div>
                  
                  {/* فلتر البحث */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="بحث في المواعيد..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10 w-64"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="scheduled">مجدول</SelectItem>
                        <SelectItem value="confirmed">مؤكد</SelectItem>
                        <SelectItem value="completed">مكتمل</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">لا توجد مواعيد مطابقة للبحث</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAppointments.map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(appointment.status)} variant="secondary">
                              {getStatusInArabic(appointment.status)}
                            </Badge>
                            <Badge variant="outline">{getTypeInArabic(appointment.appointment_type)}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditAppointment(appointment)}
                              className="gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              تعديل
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteAppointment(appointment.id)}
                              className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              حذف
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{appointment.patient_name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-green-600" />
                            <span>{appointment.doctor_name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            <span>{formatDate(appointment.scheduled_date)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span>{formatTime(appointment.scheduled_time)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">المدة:</span>
                            <span>{appointment.duration_minutes} دقيقة</span>
                          </div>
                        </div>

                        {appointment.services && appointment.services.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              الخدمات المقدمة:
                            </h4>
                            <div className="space-y-2">
                              {appointment.services.map((service) => (
                                <div key={service.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                  <span>{service.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span>الكمية: {service.quantity}</span>
                                    <span>السعر: {formatCurrency(service.unit_price)}</span>
                                    <span className="font-medium">المجموع: {formatCurrency(service.total_price)}</span>
                                  </div>
                                </div>
                              ))}
                              <div className="flex justify-between items-center p-2 bg-blue-50 rounded font-medium">
                                <span>إجمالي التكلفة:</span>
                                <span className="text-blue-900">{formatCurrency(appointment.total_cost || 0)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {appointment.notes && (
                          <div className="mt-3 p-2 bg-blue-50 rounded">
                            <p className="text-sm"><strong>ملاحظات:</strong> {appointment.notes}</p>
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

      {/* Edit Appointment Dialog */}
      <EditAppointmentDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingAppointment(null);
        }}
        appointment={editingAppointment}
        onUpdate={fetchAppointments}
      />
    </div>
  );
};

export default Appointments;
