import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { 
  Search, 
  Printer, 
  FileText, 
  User, 
  Calendar, 
  DollarSign,
  ArrowRight,
  ClipboardList,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import ServicesTable from "@/components/reports/ServicesTable";
import InstallmentsTable from "@/components/reports/InstallmentsTable";
import PaymentsTable from "@/components/reports/PaymentsTable";

interface PatientReport {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  address: string | null;
  medical_history: string | null;
  patient_notes: string | null;
  patient_since: string;
  total_appointments: number;
  completed_appointments: number;
  scheduled_appointments: number;
  last_appointment_date: string | null;
  first_appointment_date: string | null;
  treatment_plans: string | null;
  total_treatment_cost: number;
  total_paid: number;
  outstanding_balance: number;
  total_installments: number;
  pending_installments: number;
  next_installment_date: string | null;
  pending_installments_amount: number;
}

interface DetailedService {
  appointment_id: string;
  scheduled_date: string;
  scheduled_time: string;
  appointment_status: string;
  service_name: string;
  service_description: string | null;
  service_category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  service_notes: string | null;
  appointment_service_notes: string | null;
  discount_percentage?: number;
  discount_amount?: number;
  final_total?: number;
}

interface DetailedInstallment {
  installment_id: string;
  installment_number: number;
  installment_amount: number;
  due_date: string;
  paid_date: string | null;
  is_paid: boolean;
  installment_status: string; // Changed from union type to string
  days_overdue: number;
  appointment_date: string;
  total_payment_amount: number;
}

interface DetailedPayment {
  payment_id: string;
  appointment_id: string;
  appointment_date: string;
  payment_method: string;
  payment_status: string;
  total_amount: number;
  paid_amount: number;
  payment_date: string | null;
  payment_notes: string | null;
  appointment_notes: string | null;
}

const PatientReports = () => {
  const [patients, setPatients] = useState<PatientReport[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientReport | null>(null);
  const [detailedServices, setDetailedServices] = useState<DetailedService[]>([]);
  const [detailedInstallments, setDetailedInstallments] = useState<DetailedInstallment[]>([]);
  const [detailedPayments, setDetailedPayments] = useState<DetailedPayment[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const navigate = useNavigate();
  const { settings, formatCurrency } = useSystemSettings();

  useEffect(() => {
    fetchPatientReports();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient =>
        patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)
      );
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  const fetchPatientReports = async () => {
    try {
      const { data, error } = await supabase
        .from("patient_comprehensive_report")
        .select("*")
        .order("patient_since", { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في تحميل تقارير المرضى",
        });
      } else {
        setPatients(data || []);
        setFilteredPatients(data || []);
      }
    } catch (error) {
      console.error("Error fetching patient reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatientDetails = async (patientId: string) => {
    setIsLoadingDetails(true);
    try {
      // جلب الخدمات التفصيلية
      const { data: servicesData, error: servicesError } = await supabase
        .from("patient_detailed_services")
        .select("*")
        .eq("patient_id", patientId)
        .order("scheduled_date", { ascending: false });

      if (servicesError) {
        console.error("Error fetching detailed services:", servicesError);
      } else {
        setDetailedServices(servicesData || []);
      }

      // جلب الأقساط التفصيلية
      const { data: installmentsData, error: installmentsError } = await supabase
        .from("patient_detailed_installments")
        .select("*")
        .eq("patient_id", patientId)
        .order("due_date", { ascending: true });

      if (installmentsError) {
        console.error("Error fetching detailed installments:", installmentsError);
      } else {
        setDetailedInstallments(installmentsData || []);
      }

      // جلب المدفوعات التفصيلية
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          paid_amount,
          payment_method,
          payment_date,
          status,
          notes,
          appointments!inner(
            id,
            scheduled_date,
            notes,
            total_cost
          )
        `)
        .eq("patient_id", patientId)
        .order("payment_date", { ascending: false });

      if (paymentsError) {
        console.error("Error fetching detailed payments:", paymentsError);
      } else {
        // تحويل البيانات إلى التنسيق المطلوب
        const formattedPayments: DetailedPayment[] = (paymentsData || []).map(payment => ({
          payment_id: payment.id,
          appointment_id: payment.appointments.id,
          appointment_date: payment.appointments.scheduled_date,
          payment_method: payment.payment_method,
          payment_status: payment.status,
          total_amount: payment.appointments.total_cost || payment.amount,
          paid_amount: payment.paid_amount,
          payment_date: payment.payment_date,
          payment_notes: payment.notes,
          appointment_notes: payment.appointments.notes,
        }));
        setDetailedPayments(formattedPayments);
      }
    } catch (error) {
      console.error("Error fetching patient details:", error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "غير محدد";
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ar });
    } catch {
      return "غير صحيح";
    }
  };

  const handlePrintReport = async (patient: PatientReport) => {
    setSelectedPatient(patient);
    await fetchPatientDetails(patient.id);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-lg font-medium">جاري تحميل تقارير المرضى...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 print:bg-white">
        {/* Header - Hidden in print */}
        <header className="bg-white shadow-md print:hidden">
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
                <FileText className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">تقارير المرضى</h1>
                  <p className="text-sm text-gray-600">({filteredPatients.length} مريض)</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0">
          {/* Search Bar - Hidden in print */}
          <div className="mb-6 print:hidden">
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث عن مريض بالاسم أو الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* Patients List - Hidden in print when a patient is selected */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 ${selectedPatient ? 'print:hidden' : ''}`}>
            {filteredPatients.map((patient) => (
              <Card key={patient.id} className="shadow-medical hover:shadow-elevated transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      {patient.full_name}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintReport(patient)}
                      className="gap-1"
                    >
                      <Printer className="h-3 w-3" />
                      طباعة
                    </Button>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <span>{patient.phone}</span>
                    {patient.email && <span>• {patient.email}</span>}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Medical Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">إجمالي المواعيد:</span>
                      <Badge variant="outline">{patient.total_appointments}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">المواعيد المكتملة:</span>
                      <Badge variant="default">{patient.completed_appointments}</Badge>
                    </div>
                    {patient.last_appointment_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">آخر موعد:</span>
                        <span className="text-sm">{formatDate(patient.last_appointment_date)}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Financial Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">إجمالي التكلفة:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(patient.total_treatment_cost)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">المدفوع:</span>
                      <span className="text-green-600">{formatCurrency(patient.total_paid)}</span>
                    </div>
                    {patient.outstanding_balance > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">المتبقي:</span>
                        <span className="text-red-600 font-semibold">
                          {formatCurrency(patient.outstanding_balance)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Installments Info */}
                  {patient.pending_installments > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          <span className="text-sm text-orange-600">
                            {patient.pending_installments} أقساط معلقة
                          </span>
                        </div>
                        {patient.next_installment_date && (
                          <div className="text-xs text-gray-500">
                            القسط القادم: {formatDate(patient.next_installment_date)}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredPatients.length === 0 && (
            <div className="text-center py-12 print:hidden">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "لم يتم العثور على مرضى" : "لا توجد تقارير"}
              </h3>
              <p className="text-gray-600">
                {searchTerm ? "جرب تغيير كلمات البحث" : "لا توجد بيانات مرضى متاحة"}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Print Layout - Only visible when printing */}
      {selectedPatient && (
        <div className="hidden print:block p-8 bg-white">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">تقرير شامل للمريض</h1>
            <p className="text-gray-600">{settings.clinic_name}</p>
            <p className="text-sm text-gray-500">تاريخ الطباعة: {formatDate(new Date().toISOString())}</p>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">المعلومات الشخصية</h2>
              <div className="space-y-2">
                <div><strong>الاسم:</strong> {selectedPatient.full_name}</div>
                <div><strong>الهاتف:</strong> {selectedPatient.phone}</div>
                {selectedPatient.email && <div><strong>البريد الإلكتروني:</strong> {selectedPatient.email}</div>}
                {selectedPatient.date_of_birth && (
                  <div><strong>تاريخ الميلاد:</strong> {formatDate(selectedPatient.date_of_birth)}</div>
                )}
                {selectedPatient.address && <div><strong>العنوان:</strong> {selectedPatient.address}</div>}
                <div><strong>مريض منذ:</strong> {formatDate(selectedPatient.patient_since)}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">التاريخ الطبي</h2>
              <div className="space-y-2">
                {selectedPatient.medical_history ? (
                  <div><strong>التاريخ المرضي:</strong> {selectedPatient.medical_history}</div>
                ) : (
                  <p className="text-gray-500">لا يوجد تاريخ مرضي مسجل</p>
                )}
                {selectedPatient.patient_notes && (
                  <div><strong>ملاحظات:</strong> {selectedPatient.patient_notes}</div>
                )}
              </div>
            </div>
          </div>

          {/* Treatment Plans */}
          {selectedPatient.treatment_plans && (
            <div className="mb-8 print:break-inside-avoid">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">الخطط العلاجية</h2>
              <p className="text-gray-700">{selectedPatient.treatment_plans}</p>
            </div>
          )}

          {/* Appointments Summary */}
          <div className="mb-8 print:break-inside-avoid">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">ملخص المواعيد</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{selectedPatient.total_appointments}</div>
                <div className="text-sm text-gray-600">إجمالي المواعيد</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-green-600">{selectedPatient.completed_appointments}</div>
                <div className="text-sm text-gray-600">مواعيد مكتملة</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-orange-600">{selectedPatient.scheduled_appointments}</div>
                <div className="text-sm text-gray-600">مواعيد مجدولة</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">آخر موعد</div>
                <div className="font-semibold">{formatDate(selectedPatient.last_appointment_date)}</div>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="mb-8 print:break-inside-avoid">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">الملخص المالي</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">إجمالي التكلفة</h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(selectedPatient.total_treatment_cost)}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">المبلغ المدفوع</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(selectedPatient.total_paid)}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">المبلغ المتبقي</h3>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(selectedPatient.outstanding_balance)}
                </p>
              </div>
            </div>
          </div>

          {/* Page Break */}
          <div className="print:break-before-page"></div>

          {/* Detailed Services */}
          {isLoadingDetails ? (
            <div className="mb-8 text-center py-8">
              <p>جاري تحميل التفاصيل...</p>
            </div>
          ) : (
            <div className="mb-8 print:break-before-page">
              <ServicesTable 
                services={detailedServices} 
                patientName={selectedPatient.full_name}
                isPrint={true}
              />
            </div>
          )}

          {/* Page Break */}
          <div className="print:break-before-page"></div>

          {/* Financial Summary for Services */}
          {!isLoadingDetails && (
            <div className="mb-8 print:break-before-page">
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">الملخص المالي للخدمات</h2>
                
                {(() => {
                  const subtotal = detailedServices.reduce((sum, s) => sum + s.total_price, 0);
                  const totalDiscount = detailedServices.reduce((sum, s) => sum + (s.discount_amount || 0), 0);
                  const discountPercentage = subtotal > 0 ? ((totalDiscount / subtotal) * 100).toFixed(1) : 0;
                  const finalTotal = detailedServices.reduce((sum, s) => sum + (s.final_total || s.total_price), 0);
                  
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(subtotal)}</div>
                        <div className="text-sm text-blue-800">إجمالي التكلفة العلاجية</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{discountPercentage}%</div>
                        <div className="text-sm text-orange-800">مقدار الخصم</div>
                        <div className="text-xs text-orange-600 mt-1">{formatCurrency(totalDiscount)}</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(finalTotal)}</div>
                        <div className="text-sm text-green-800">المبلغ بعد الخصم</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-600">{detailedServices.length}</div>
                        <div className="text-sm text-gray-600">إجمالي الخدمات</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Page Break */}
          <div className="print:break-before-page"></div>

          {/* Detailed Payments */}
          {!isLoadingDetails && (
            <div className="mb-8 print:break-before-page">
              <PaymentsTable 
                payments={detailedPayments}
                patientName={selectedPatient.full_name}
                isPrint={true}
              />
            </div>
          )}

          {/* Page Break */}
          <div className="print:break-before-page"></div>

          {/* Detailed Installments */}
          {!isLoadingDetails && (
            <div className="mb-8 print:break-before-page">
              <InstallmentsTable 
                installments={detailedInstallments}
                patientName={selectedPatient.full_name}
                isPrint={true}
              />
            </div>
          )}

          <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
            <p>هذا التقرير تم إنشاؤه تلقائياً من {settings.clinic_name}</p>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          .print\\:break-before-page {
            break-before: page;
          }
          table {
            break-inside: avoid;
          }
          tr {
            break-inside: avoid;
          }
        }
      `}</style>
    </>
  );
};

export default PatientReports;
