import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Plus, 
  ArrowRight,
  Calendar,
  Users,
  DollarSign,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Payment {
  id: string;
  amount: number;
  paid_amount: number;
  payment_method: string;
  status: string;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  appointment_id: string;
  patient_id: string;
  patients: {
    full_name: string;
    phone: string;
  };
  appointments: {
    scheduled_date: string;
    scheduled_time: string;
    total_cost: number;
  };
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
  total_cost: number;
  patients: {
    full_name: string;
  };
}

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Form states
  const [newPayment, setNewPayment] = useState({
    patient_id: "",
    appointment_id: "",
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
          patients(full_name, phone),
          appointments(scheduled_date, scheduled_time, total_cost)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في تحميل المدفوعات",
        });
      } else {
        setPayments(data || []);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
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

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          total_cost,
          patients(full_name)
        `)
        .order("scheduled_date", { ascending: false });

      if (error) {
        console.error("Error fetching appointments:", error);
      } else {
        setAppointments(data || []);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(newPayment.amount);
    const paidAmount = parseFloat(newPayment.paid_amount);
    
    if (paidAmount > amount) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "المبلغ المدفوع لا يمكن أن يكون أكثر من المبلغ الإجمالي",
      });
      return;
    }

    try {
      const status = paidAmount === amount ? "paid" : paidAmount > 0 ? "partial" : "pending";
      
      const { error } = await supabase
        .from("payments")
        .insert([{
          ...newPayment,
          amount: amount,
          paid_amount: paidAmount,
          payment_method: newPayment.payment_method as "cash" | "cliq" | "installment",
          status: status as "pending" | "paid" | "partial" | "cancelled",
          notes: newPayment.notes || null
        }]);

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في تسجيل الدفعة",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: "تم تسجيل الدفعة بنجاح",
        });
        setIsAddDialogOpen(false);
        setNewPayment({
          patient_id: "",
          appointment_id: "",
          amount: "",
          paid_amount: "",
          payment_method: "cash",
          payment_date: new Date().toISOString().split('T')[0],
          notes: ""
        });
        fetchPayments();
      }
    } catch (error) {
      console.error("Error adding payment:", error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      partial: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusInArabic = (status: string) => {
    const statuses = {
      pending: "معلق",
      paid: "مدفوع",
      partial: "جزئي",
      cancelled: "ملغي"
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  const getMethodInArabic = (method: string) => {
    const methods = {
      cash: "كاش",
      cliq: "كليك",
      installment: "تقسيط"
    };
    return methods[method as keyof typeof methods] || method;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-JO');
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  // Calculate totals with corrected logic
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.paid_amount, 0);
  
  // Calculate pending amount correctly - sum all unpaid amounts from appointments
  const pendingAmount = payments.reduce((sum, payment) => {
    const appointmentTotal = payment.appointments?.total_cost || payment.amount;
    const remainingForThisPayment = Math.max(0, appointmentTotal - payment.paid_amount);
    return sum + remainingForThisPayment;
  }, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-lg font-medium">جاري تحميل المدفوعات...</p>
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
              <CreditCard className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">إدارة المدفوعات</h1>
                <p className="text-sm text-gray-600">({payments.length} معاملة)</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-medical">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} د.أ</div>
              <p className="text-xs text-muted-foreground">المبلغ المدفوع فعلياً</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مبالغ معلقة</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingAmount.toFixed(2)} د.أ</div>
              <p className="text-xs text-muted-foreground">في انتظار الدفع</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">عدد المعاملات</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payments.length}</div>
              <p className="text-xs text-muted-foreground">إجمالي المعاملات</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Payment Button */}
        <div className="mb-6">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="medical-gradient gap-2">
                <Plus className="h-4 w-4" />
                تسجيل دفعة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
                <DialogDescription>
                  أدخل تفاصيل الدفعة الجديدة
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient_id">المريض *</Label>
                    <Select 
                      value={newPayment.patient_id}
                      onValueChange={(value) => setNewPayment({...newPayment, patient_id: value})}
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
                    <Label htmlFor="appointment_id">الموعد *</Label>
                    <Select 
                      value={newPayment.appointment_id}
                      onValueChange={(value) => setNewPayment({...newPayment, appointment_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الموعد" />
                      </SelectTrigger>
                      <SelectContent>
                        {appointments.map((appointment) => (
                          <SelectItem key={appointment.id} value={appointment.id}>
                            {appointment.patients.full_name} - {formatDate(appointment.scheduled_date)} {formatTime(appointment.scheduled_time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">المبلغ الإجمالي (د.أ) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                      placeholder="100.00"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paid_amount">المبلغ المدفوع (د.أ) *</Label>
                    <Input
                      id="paid_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newPayment.paid_amount}
                      onChange={(e) => setNewPayment({...newPayment, paid_amount: e.target.value})}
                      placeholder="100.00"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">طريقة الدفع</Label>
                    <Select 
                      value={newPayment.payment_method}
                      onValueChange={(value) => setNewPayment({...newPayment, payment_method: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">كاش</SelectItem>
                        <SelectItem value="cliq">كليك</SelectItem>
                        <SelectItem value="installment">تقسيط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment_date">تاريخ الدفعة</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={newPayment.payment_date}
                      onChange={(e) => setNewPayment({...newPayment, payment_date: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Input
                    id="notes"
                    value={newPayment.notes}
                    onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                    placeholder="أي ملاحظات إضافية"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="medical-gradient flex-1">
                    تسجيل الدفعة
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

        {/* Payments List */}
        <Card className="shadow-medical">
          <CardHeader>
            <CardTitle>المدفوعات الأخيرة</CardTitle>
            <CardDescription>
              جميع المعاملات المالية
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  لا توجد مدفوعات مسجلة
                </h3>
                <p className="text-gray-600 mb-4">
                  ابدأ بتسجيل أول دفعة
                </p>
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="medical-gradient gap-2"
                >
                  <Plus className="h-4 w-4" />
                  تسجيل دفعة جديدة
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => {
                  const appointmentTotal = payment.appointments?.total_cost || payment.amount;
                  const remainingAmount = Math.max(0, appointmentTotal - payment.paid_amount);
                  
                  return (
                    <div 
                      key={payment.id} 
                      className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(payment.status)} variant="secondary">
                            {getStatusInArabic(payment.status)}
                          </Badge>
                          <Badge variant="outline">
                            {getMethodInArabic(payment.payment_method)}
                          </Badge>
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-500">المبلغ الإجمالي:</span>
                            <span className="font-medium text-gray-900">{appointmentTotal.toFixed(2)} د.أ</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-500">المبلغ المدفوع:</span>
                            <span className="font-bold text-green-600">{payment.paid_amount.toFixed(2)} د.أ</span>
                          </div>
                          {remainingAmount > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">المبلغ المتبقي:</span>
                              <span className="font-medium text-red-600">{remainingAmount.toFixed(2)} د.أ</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            المريض: {payment.patients.full_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {payment.patients.phone}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            الموعد: {formatDate(payment.appointments.scheduled_date)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatTime(payment.appointments.scheduled_time)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {payment.payment_date ? formatDate(payment.payment_date) : 'غير محدد'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          مسجل في: {formatDate(payment.created_at)}
                        </div>
                      </div>
                      
                      {payment.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded">
                          <p className="text-sm text-gray-700">
                            <strong>ملاحظات:</strong> {payment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Payments;
