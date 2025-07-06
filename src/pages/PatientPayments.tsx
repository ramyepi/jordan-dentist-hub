
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Search, Plus, Edit, Trash2, DollarSign, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Payment {
  id: string;
  amount: number;
  paid_amount: number;
  payment_method: string;
  status: string;
  payment_date: string | null;
  notes: string | null;
  patient_name: string;
  appointment_date: string;
  appointment_time: string;
}

interface Patient {
  id: string;
  full_name: string;
  phone: string;
}

interface Appointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  patient_name: string;
  total_cost: number | null;
}

const PatientPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // بيانات النموذج
  const [formData, setFormData] = useState({
    appointment_id: "",
    patient_id: "",
    amount: "",
    paid_amount: "",
    payment_method: "cash",
    payment_date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  useEffect(() => {
    fetchPayments();
    fetchPatients();
    fetchAppointments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          patients (
            full_name
          ),
          appointments (
            scheduled_date,
            scheduled_time
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedPayments = data?.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        paid_amount: payment.paid_amount,
        payment_method: payment.payment_method,
        status: payment.status,
        payment_date: payment.payment_date,
        notes: payment.notes,
        patient_name: payment.patients?.full_name || "غير محدد",
        appointment_date: payment.appointments?.scheduled_date || "",
        appointment_time: payment.appointments?.scheduled_time || ""
      })) || [];

      setPayments(formattedPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تحميل الدفعات",
      });
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

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          total_cost,
          patients (
            full_name
          )
        `)
        .order("scheduled_date", { ascending: false });

      if (error) throw error;

      const formattedAppointments = data?.map(apt => ({
        id: apt.id,
        scheduled_date: apt.scheduled_date,
        scheduled_time: apt.scheduled_time,
        patient_name: apt.patients?.full_name || "غير محدد",
        total_cost: apt.total_cost
      })) || [];

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const paymentData = {
        appointment_id: formData.appointment_id,
        patient_id: formData.patient_id,
        amount: parseFloat(formData.amount),
        paid_amount: parseFloat(formData.paid_amount),
        payment_method: formData.payment_method as "cash" | "cliq" | "installment",
        payment_date: formData.payment_date,
        notes: formData.notes || null,
        status: parseFloat(formData.paid_amount) >= parseFloat(formData.amount) ? "paid" as const : "partial" as const
      };

      let error;
      if (editingPayment) {
        const result = await supabase
          .from("payments")
          .update(paymentData)
          .eq("id", editingPayment.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("payments")
          .insert(paymentData);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: editingPayment ? "تم تحديث الدفعة بنجاح" : "تم إضافة الدفعة بنجاح",
      });

      setIsDialogOpen(false);
      setEditingPayment(null);
      resetForm();
      fetchPayments();
    } catch (error) {
      console.error("Error saving payment:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في حفظ الدفعة",
      });
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الدفعة؟")) return;

    try {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الدفعة بنجاح",
      });

      fetchPayments();
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في حذف الدفعة",
      });
    }
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      appointment_id: "", // يحتاج تحديد من الـ appointments
      patient_id: "", // يحتاج تحديد من الـ patients
      amount: payment.amount.toString(),
      paid_amount: payment.paid_amount.toString(),
      payment_method: payment.payment_method,
      payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
      notes: payment.notes || ""
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      appointment_id: "",
      patient_id: "",
      amount: "",
      paid_amount: "",
      payment_method: "cash",
      payment_date: new Date().toISOString().split('T')[0],
      notes: ""
    });
  };

  const filteredPayments = payments.filter(payment =>
    payment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors = {
      paid: "bg-green-100 text-green-800",
      partial: "bg-yellow-100 text-yellow-800",
      pending: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status: string) => {
    const statuses = {
      paid: "مدفوع",
      partial: "جزئي",
      pending: "معلق",
      cancelled: "ملغي"
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  const getPaymentMethodText = (method: string) => {
    const methods = {
      cash: "نقدي",
      cliq: "كليك",
      installment: "تقسيط"
    };
    return methods[method as keyof typeof methods] || method;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">جاري تحميل الدفعات...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة دفعات المرضى</h1>
          <p className="text-muted-foreground">تسجيل ومتابعة دفعات المرضى</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="medical-gradient" onClick={() => {
              setEditingPayment(null);
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              دفعة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? "تعديل الدفعة" : "إضافة دفعة جديدة"}
              </DialogTitle>
              <DialogDescription>
                {editingPayment ? "تعديل تفاصيل الدفعة" : "إضافة دفعة جديدة للمريض"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المريض</Label>
                  <Select value={formData.patient_id} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, patient_id: value }))
                  } required>
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
                  <Label>الموعد</Label>
                  <Select value={formData.appointment_id} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, appointment_id: value }))
                  } required>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الموعد" />
                    </SelectTrigger>
                    <SelectContent>
                      {appointments.map((appointment) => (
                        <SelectItem key={appointment.id} value={appointment.id}>
                          {appointment.patient_name} - {appointment.scheduled_date} {appointment.scheduled_time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المبلغ الإجمالي</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>المبلغ المدفوع</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, paid_amount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>طريقة الدفع</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, payment_method: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">نقدي</SelectItem>
                      <SelectItem value="cliq">كليك</SelectItem>
                      <SelectItem value="installment">تقسيط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>تاريخ الدفع</Label>
                  <Input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="أي ملاحظات إضافية"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 medical-gradient">
                  <CreditCard className="h-4 w-4 mr-2" />
                  {editingPayment ? "تحديث الدفعة" : "إضافة الدفعة"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* شريط البحث */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="البحث في الدفعات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* جدول الدفعات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            قائمة الدفعات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المريض</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>المبلغ الإجمالي</TableHead>
                <TableHead>المبلغ المدفوع</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    لا توجد دفعات مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium">{payment.patient_name}</div>
                          {payment.appointment_date && (
                            <div className="text-xs text-gray-500">
                              {payment.appointment_date} {payment.appointment_time}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.payment_date ? 
                        format(new Date(payment.payment_date), "dd/MM/yyyy", { locale: ar }) :
                        "غير محدد"
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        {payment.amount.toFixed(2)} د.أ
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        {payment.paid_amount.toFixed(2)} د.أ
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPaymentMethodText(payment.payment_method)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)} variant="secondary">
                        {getStatusText(payment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(payment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(payment.id)}
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
    </div>
  );
};

export default PatientPayments;
