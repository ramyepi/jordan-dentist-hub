import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar,
  FileText,
  ArrowRight,
  Eye,
  DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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

interface PatientWithSummary extends Patient {
  patient_financial_summary?: {
    total_appointments: number;
    total_amount: number;
    total_paid: number;
    total_pending: number;
  };
}

const Patients = () => {
  const [patients, setPatients] = useState<PatientWithSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Form states
  const [newPatient, setNewPatient] = useState({
    full_name: "",
    phone: "",
    email: "",
    date_of_birth: "",
    address: "",
    medical_history: "",
    notes: ""
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select(`
          *,
          patient_financial_summary(
            total_appointments,
            total_amount,
            total_paid,
            total_pending
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في تحميل بيانات المرضى",
        });
      } else {
        setPatients(data || []);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("patients")
        .insert([{
          ...newPatient,
          email: newPatient.email || null,
          date_of_birth: newPatient.date_of_birth || null,
          address: newPatient.address || null,
          medical_history: newPatient.medical_history || null,
          notes: newPatient.notes || null
        }]);

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في إضافة المريض",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: "تم إضافة المريض بنجاح",
        });
        setIsAddDialogOpen(false);
        setNewPatient({
          full_name: "",
          phone: "",
          email: "",
          date_of_birth: "",
          address: "",
          medical_history: "",
          notes: ""
        });
        fetchPatients();
      }
    } catch (error) {
      console.error("Error adding patient:", error);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-JO');
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} د.أ`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-lg font-medium">جاري تحميل بيانات المرضى...</p>
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
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">إدارة المرضى</h1>
                <p className="text-sm text-gray-600">({patients.length} مريض)</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Add */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث عن مريض بالاسم أو رقم الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="medical-gradient gap-2">
                <Plus className="h-4 w-4" />
                إضافة مريض جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة مريض جديد</DialogTitle>
                <DialogDescription>
                  أدخل بيانات المريض الجديد
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddPatient} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">الاسم الكامل *</Label>
                    <Input
                      id="full_name"
                      value={newPatient.full_name}
                      onChange={(e) => setNewPatient({...newPatient, full_name: e.target.value})}
                      placeholder="أدخل الاسم الكامل"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف *</Label>
                    <Input
                      id="phone"
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                      placeholder="07xxxxxxxx"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newPatient.email}
                      onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                      placeholder="example@email.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">تاريخ الميلاد</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={newPatient.date_of_birth}
                      onChange={(e) => setNewPatient({...newPatient, date_of_birth: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">العنوان</Label>
                  <Input
                    id="address"
                    value={newPatient.address}
                    onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
                    placeholder="أدخل العنوان"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="medical_history">التاريخ المرضي</Label>
                  <Input
                    id="medical_history"
                    value={newPatient.medical_history}
                    onChange={(e) => setNewPatient({...newPatient, medical_history: e.target.value})}
                    placeholder="أي أمراض أو علاجات سابقة"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Input
                    id="notes"
                    value={newPatient.notes}
                    onChange={(e) => setNewPatient({...newPatient, notes: e.target.value})}
                    placeholder="أي ملاحظات إضافية"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="medical-gradient flex-1">
                    إضافة المريض
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

        {/* Patients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="shadow-medical hover:shadow-elevated transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{patient.full_name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    مريض
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span>{patient.phone}</span>
                </div>
                
                {patient.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-green-600" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                )}
                
                {patient.date_of_birth && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span>{formatDate(patient.date_of_birth)}</span>
                  </div>
                )}

                {/* Financial Summary */}
                {patient.patient_financial_summary && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">الملخص المالي</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">مواعيد:</span>
                        <span className="mr-1 font-medium">{patient.patient_financial_summary.total_appointments}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">مدفوع:</span>
                        <span className="mr-1 font-medium text-green-600">
                          {formatCurrency(patient.patient_financial_summary.total_paid)}
                        </span>
                      </div>
                      {patient.patient_financial_summary.total_pending > 0 && (
                        <div className="col-span-2">
                          <span className="text-gray-600">معلق:</span>
                          <span className="mr-1 font-medium text-red-600">
                            {formatCurrency(patient.patient_financial_summary.total_pending)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-1"
                    onClick={() => navigate(`/patient/${patient.id}`)}
                  >
                    <Eye className="h-3 w-3" />
                    الملف
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-1"
                    onClick={() => navigate(`/appointments?patient=${patient.id}`)}
                  >
                    <Calendar className="h-3 w-3" />
                    مواعيد
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-1"
                    onClick={() => navigate(`/payments?patient=${patient.id}`)}
                  >
                    <FileText className="h-3 w-3" />
                    مدفوعات
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "لم يتم العثور على مرضى" : "لا يوجد مرضى مسجلين"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? "جرب تغيير كلمات البحث" : "ابدأ بإضافة أول مريض"}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="medical-gradient gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة مريض جديد
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Patients;
