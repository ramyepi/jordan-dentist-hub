import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import PaymentDialog from "@/components/PaymentDialog";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  FileText, 
  DollarSign,
  ArrowRight,
  Stethoscope,
  Clock,
  CreditCard,
  AlertTriangle
} from "lucide-react";

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  address: string | null;
  medical_history: string | null;
  notes: string | null;
  created_at: string;
}

interface PatientFinancialSummary {
  total_appointments: number;
  total_amount: number;
  total_paid: number;
  total_pending: number;
  last_payment_date: string | null;
  last_appointment_date: string | null;
}

interface Appointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  appointment_type: string;
  total_cost: number;
  notes: string | null;
  doctor: {
    full_name: string;
    specialization: string | null;
  };
  services: Array<{
    id: string;
    service_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

interface Payment {
  id: string;
  amount: number;
  paid_amount: number;
  payment_method: string;
  status: string;
  payment_date: string | null;
  appointment_date: string;
  appointment_id: string;
  notes: string | null;
}

const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [financialSummary, setFinancialSummary] = useState<PatientFinancialSummary | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    console.log("PatientProfile mounted with ID:", id);
    if (id) {
      fetchPatientData();
    } else {
      console.error("No patient ID provided");
      setIsLoading(false);
    }
  }, [id]);

  const fetchPatientData = async () => {
    if (!id) {
      console.error("No patient ID available for fetching data");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Fetching data for patient ID:", id);
      
      // جلب بيانات المريض
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (patientError) {
        console.error("Error fetching patient:", patientError);
        throw patientError;
      }
      
      if (!patientData) {
        console.log("No patient found with ID:", id);
        setPatient(null);
        setIsLoading(false);
        return;
      }
      
      console.log("Patient data loaded:", patientData);
      setPatient(patientData);

      // جلب الملخص المالي
      const { data: summaryData, error: summaryError } = await supabase
        .from("patient_financial_summary")
        .select("*")
        .eq("patient_id", id)
        .maybeSingle();

      if (summaryError && summaryError.code !== 'PGRST116') {
        console.error("Error fetching financial summary:", summaryError);
      } else {
        console.log("Financial summary loaded:", summaryData);
        setFinancialSummary(summaryData);
      }

      // جلب المواعيد مع تفاصيل الطبيب والخدمات
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
          *,
          profiles!appointments_doctor_id_fkey(full_name, specialization),
          appointment_services(
            id,
            quantity,
            unit_price,
            total_price,
            treatment_services(name)
          )
        `)
        .eq("patient_id", id)
        .order("scheduled_date", { ascending: false });

      if (appointmentsError) {
        console.error("Error fetching appointments:", appointmentsError);
      } else {
        const formattedAppointments = appointmentsData?.map(apt => ({
          ...apt,
          doctor: apt.profiles || { full_name: 'غير محدد', specialization: null },
          services: apt.appointment_services?.map((service: any) => ({
            id: service.id,
            service_name: service.treatment_services?.name || 'خدمة غير محددة',
            quantity: service.quantity,
            unit_price: service.unit_price,
            total_price: service.total_price
          })) || []
        })) || [];
        
        console.log("Appointments loaded:", formattedAppointments);
        setAppointments(formattedAppointments);
      }

      // جلب المدفوعات
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select(`
          *,
          appointments(scheduled_date)
        `)
        .eq("patient_id", id)
        .order("created_at", { ascending: false });

      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError);
      } else {
        const formattedPayments = paymentsData?.map(payment => ({
          ...payment,
          appointment_date: payment.appointments?.scheduled_date || ''
        })) || [];
        
        console.log("Payments loaded:", formattedPayments);
        setPayments(formattedPayments);
      }

    } catch (error) {
      console.error("Error fetching patient data:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات المريض",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentComplete = () => {
    fetchPatientData();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      partial: "bg-orange-100 text-orange-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusInArabic = (status: string) => {
    const statuses = {
      scheduled: "مجدول",
      confirmed: "مؤكد",
      completed: "مكتمل",
      cancelled: "ملغي",
      pending: "معلق",
      paid: "مدفوع",
      partial: "جزئي"
    };
    return statuses[status as keyof typeof statuses] || status;
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

  // Check if appointment has pending payment
  const getAppointmentPaymentStatus = (appointmentId: string, totalCost: number) => {
    const appointmentPayments = payments.filter(p => p.appointment_id === appointmentId);
    const totalPaid = appointmentPayments.reduce((sum, p) => sum + p.paid_amount, 0);
    
    if (totalPaid >= totalCost) return "paid";
    if (totalPaid > 0) return "partial";
    return "pending";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-lg font-medium">جاري تحميل ملف المريض...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-red-600" />
          <p className="text-lg font-medium text-red-600">لم يتم العثور على المريض</p>
          <Button onClick={() => navigate("/patients")} className="mt-4">
            العودة لقائمة المرضى
          </Button>
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
                onClick={() => navigate("/patients")}
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                العودة لقائمة المرضى
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{patient.full_name}</h1>
                <p className="text-sm text-gray-600">ملف المريض التفصيلي</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* معلومات المريض */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  معلومات المريض
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span>{patient.phone}</span>
                </div>
                
                {patient.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-600" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                )}
                
                {patient.date_of_birth && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span>{formatDate(patient.date_of_birth)}</span>
                  </div>
                )}
                
                {patient.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <span>{patient.address}</span>
                  </div>
                )}
                
                <Separator />
                
                {patient.medical_history && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">التاريخ المرضي</h4>
                    <p className="text-sm text-gray-600">{patient.medical_history}</p>
                  </div>
                )}
                
                {patient.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">ملاحظات</h4>
                    <p className="text-sm text-gray-600">{patient.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* الملخص المالي */}
            {financialSummary && (
              <Card className="shadow-medical">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    الملخص المالي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-900">
                        {financialSummary.total_appointments}
                      </div>
                      <div className="text-sm text-blue-700">مواعيد</div>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-900">
                        {formatCurrency(financialSummary.total_paid)}
                      </div>
                      <div className="text-sm text-green-700">مدفوع</div>
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-900">
                      {formatCurrency(financialSummary.total_pending)}
                    </div>
                    <div className="text-sm text-yellow-700">
                      {financialSummary.total_pending > 0 ? (
                        <span className="flex items-center justify-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          مبلغ معلق
                        </span>
                      ) : (
                        "لا توجد مستحقات"
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>إجمالي المبالغ:</span>
                      <span className="font-medium">{formatCurrency(financialSummary.total_amount)}</span>
                    </div>
                    
                    {financialSummary.last_payment_date && (
                      <div className="flex justify-between">
                        <span>آخر دفعة:</span>
                        <span>{formatDate(financialSummary.last_payment_date)}</span>
                      </div>
                    )}
                    
                    {financialSummary.last_appointment_date && (
                      <div className="flex justify-between">
                        <span>آخر موعد:</span>
                        <span>{formatDate(financialSummary.last_appointment_date)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  المواعيد والخدمات العلاجية
                </CardTitle>
                <CardDescription>
                  تاريخ المواعيد والخدمات المقدمة للمريض
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">لا توجد مواعيد مسجلة لهذا المريض</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => {
                      const paymentStatus = getAppointmentPaymentStatus(appointment.id, appointment.total_cost || 0);
                      const needsPayment = paymentStatus !== "paid" && appointment.total_cost && appointment.total_cost > 0;
                      
                      return (
                        <div key={appointment.id} className="border rounded-lg p-4 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusColor(appointment.status)} variant="secondary">
                                {getStatusInArabic(appointment.status)}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                {formatDate(appointment.scheduled_date)} - {formatTime(appointment.scheduled_time)}
                              </span>
                              {paymentStatus !== "paid" && (
                                <Badge className={getStatusColor(paymentStatus)} variant="secondary">
                                  {getStatusInArabic(paymentStatus)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-left">
                                <p className="font-bold text-lg">{formatCurrency(appointment.total_cost || 0)}</p>
                              </div>
                              {needsPayment && (
                                <Button
                                  size="sm"
                                  onClick={() => handlePayment(appointment)}
                                  className="gap-1 medical-gradient"
                                >
                                  <CreditCard className="h-3 w-3" />
                                  دفع
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{appointment.doctor.full_name}</span>
                              {appointment.doctor.specialization && (
                                <span className="text-sm text-gray-600">({appointment.doctor.specialization})</span>
                              )}
                            </div>
                          </div>
                          
                          {appointment.services.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">الخدمات المقدمة:</h4>
                              <div className="space-y-1">
                                {appointment.services.map((service) => (
                                  <div key={service.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                                    <span>{service.service_name}</span>
                                    <span>
                                      {service.quantity} × {formatCurrency(service.unit_price)} = {formatCurrency(service.total_price)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {appointment.notes && (
                            <div className="mt-3 p-2 bg-blue-50 rounded">
                              <p className="text-sm"><strong>ملاحظات:</strong> {appointment.notes}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* المدفوعات */}
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  سجل المدفوعات
                </CardTitle>
                <CardDescription>
                  تاريخ جميع المدفوعات المسجلة للمريض
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">لا توجد مدفوعات مسجلة لهذا المريض</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(payment.status)} variant="secondary">
                              {getStatusInArabic(payment.status)}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {payment.payment_date ? formatDate(payment.payment_date) : 'غير محدد'}
                            </span>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-lg">{formatCurrency(payment.paid_amount)}</p>
                            {payment.amount !== payment.paid_amount && (
                              <p className="text-sm text-gray-500">من أصل {formatCurrency(payment.amount)}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">طريقة الدفع:</span>
                            <span className="mr-2 font-medium">
                              {payment.payment_method === 'cash' ? 'نقد' : 
                               payment.payment_method === 'cliq' ? 'كليك' : 'تقسيط'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">موعد الجلسة:</span>
                            <span className="mr-2">{formatDate(payment.appointment_date)}</span>
                          </div>
                        </div>
                        
                        {payment.notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded">
                            <p className="text-sm"><strong>ملاحظات:</strong> {payment.notes}</p>
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

      {/* Payment Dialog */}
      {selectedAppointment && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => {
            setIsPaymentDialogOpen(false);
            setSelectedAppointment(null);
          }}
          appointmentId={selectedAppointment.id}
          patientId={patient.id}
          totalAmount={selectedAppointment.total_cost || 0}
          patientName={patient.full_name}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export default PatientProfile;
