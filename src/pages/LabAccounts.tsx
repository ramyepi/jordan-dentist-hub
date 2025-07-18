import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  FileText, 
  User, 
  DollarSign,
  ArrowRight,
  FlaskConical,
  Calculator,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
}

interface LabAccount {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  lab_work_description: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: 'pending' | 'partial' | 'paid';
  lab_work_date: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
}

const LabAccounts = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [labAccounts, setLabAccounts] = useState<LabAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<LabAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<LabAccount | null>(null);
  const navigate = useNavigate();
  const { settings, formatCurrency } = useSystemSettings();

  // Form states
  const [formData, setFormData] = useState({
    patient_id: "",
    lab_work_description: "",
    total_amount: "",
    lab_work_date: "",
    due_date: "",
    notes: ""
  });

  const [paymentData, setPaymentData] = useState({
    payment_amount: "",
    payment_notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredAccounts(labAccounts);
    } else {
      const filtered = labAccounts.filter(account =>
        account.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.patient_phone.includes(searchTerm) ||
        account.lab_work_description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAccounts(filtered);
    }
  }, [searchTerm, labAccounts]);

  const fetchData = async () => {
    try {
      // جلب المرضى
      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select("id, full_name, phone, email")
        .order("full_name");

      if (patientsError) {
        console.error("Error fetching patients:", patientsError);
      } else {
        setPatients(patientsData || []);
      }

      // جلب حسابات المختبر
      const { data: labData, error: labError } = await supabase
        .from("lab_accounts")
        .select(`
          *,
          patients!inner(
            full_name,
            phone
          )
        `)
        .order("created_at", { ascending: false });

      if (labError) {
        console.error("Error fetching lab accounts:", labError);
      } else {
        const formattedData: LabAccount[] = (labData || []).map(item => ({
          id: item.id,
          patient_id: item.patient_id,
          patient_name: item.patients.full_name,
          patient_phone: item.patients.phone,
          lab_work_description: item.lab_work_description,
          total_amount: item.total_amount,
          paid_amount: item.paid_amount || 0,
          remaining_amount: item.total_amount - (item.paid_amount || 0),
          payment_status: item.payment_status,
          lab_work_date: item.lab_work_date,
          due_date: item.due_date,
          notes: item.notes,
          created_at: item.created_at
        }));
        setLabAccounts(formattedData);
        setFilteredAccounts(formattedData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تحميل البيانات",
      });
    } finally {
      setIsLoading(false);
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

  const getStatusBadge = (status: string, remainingAmount: number) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            مدفوع
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            دفع جزئي
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            لم يدفع
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id || !formData.lab_work_description || !formData.total_amount) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("lab_accounts")
        .insert([{
          patient_id: formData.patient_id,
          lab_work_description: formData.lab_work_description,
          total_amount: parseFloat(formData.total_amount),
          paid_amount: 0,
          payment_status: 'pending',
          lab_work_date: formData.lab_work_date || new Date().toISOString().split('T')[0],
          due_date: formData.due_date || null,
          notes: formData.notes || null
        }]);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء حساب المختبر بنجاح",
      });

      setIsDialogOpen(false);
      setFormData({
        patient_id: "",
        lab_work_description: "",
        total_amount: "",
        lab_work_date: "",
        due_date: "",
        notes: ""
      });
      
      fetchData();
    } catch (error) {
      console.error("Error creating lab account:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في إنشاء حساب المختبر",
      });
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccount || !paymentData.payment_amount) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى إدخال مبلغ الدفع",
      });
      return;
    }

    const paymentAmount = parseFloat(paymentData.payment_amount);
    const newPaidAmount = selectedAccount.paid_amount + paymentAmount;
    const newRemainingAmount = selectedAccount.total_amount - newPaidAmount;

    if (paymentAmount <= 0 || paymentAmount > selectedAccount.remaining_amount) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "مبلغ الدفع غير صحيح",
      });
      return;
    }

    let newStatus: 'pending' | 'partial' | 'paid' = 'partial';
    if (newRemainingAmount <= 0) {
      newStatus = 'paid';
    } else if (newPaidAmount === 0) {
      newStatus = 'pending';
    }

    try {
      const { error } = await supabase
        .from("lab_accounts")
        .update({
          paid_amount: newPaidAmount,
          payment_status: newStatus
        })
        .eq("id", selectedAccount.id);

      if (error) throw error;

      // إدراج سجل الدفع
      const { error: paymentError } = await supabase
        .from("lab_payments")
        .insert([{
          lab_account_id: selectedAccount.id,
          payment_amount: paymentAmount,
          payment_date: new Date().toISOString(),
          notes: paymentData.payment_notes || null
        }]);

      if (paymentError) throw paymentError;

      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الدفع بنجاح",
      });

      setIsPaymentDialogOpen(false);
      setSelectedAccount(null);
      setPaymentData({
        payment_amount: "",
        payment_notes: ""
      });
      
      fetchData();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تسجيل الدفع",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FlaskConical className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-lg font-medium">جاري تحميل حسابات المختبر...</p>
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
              <FlaskConical className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">حسابات المختبر</h1>
                <p className="text-sm text-gray-600">({filteredAccounts.length} حساب)</p>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  حساب جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>إنشاء حساب مختبر جديد</DialogTitle>
                  <DialogDescription>
                    أدخل تفاصيل العمل المخبري للمريض
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="patient_id">المريض *</Label>
                    <Select value={formData.patient_id} onValueChange={(value) => setFormData({...formData, patient_id: value})}>
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

                  <div>
                    <Label htmlFor="lab_work_description">وصف العمل المخبري *</Label>
                    <Textarea
                      id="lab_work_description"
                      value={formData.lab_work_description}
                      onChange={(e) => setFormData({...formData, lab_work_description: e.target.value})}
                      placeholder="مثال: تركيب أسنان، تقويم، إلخ..."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="total_amount">المبلغ الإجمالي ({settings.currency_symbol}) *</Label>
                    <Input
                      id="total_amount"
                      type="number"
                      step="0.01"
                      value={formData.total_amount}
                      onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="lab_work_date">تاريخ العمل</Label>
                    <Input
                      id="lab_work_date"
                      type="date"
                      value={formData.lab_work_date}
                      onChange={(e) => setFormData({...formData, lab_work_date: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="due_date">تاريخ الاستحقاق</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">ملاحظات</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="ملاحظات إضافية..."
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit">
                      إنشاء الحساب
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث عن مريض أو وصف العمل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FlaskConical className="h-8 w-8 text-blue-600" />
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">إجمالي الحسابات</p>
                  <p className="text-2xl font-bold text-gray-900">{labAccounts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">مدفوعة</p>
                  <p className="text-2xl font-bold text-green-600">{labAccounts.filter(a => a.payment_status === 'paid').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">جزئية</p>
                  <p className="text-2xl font-bold text-yellow-600">{labAccounts.filter(a => a.payment_status === 'partial').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">معلقة</p>
                  <p className="text-2xl font-bold text-red-600">{labAccounts.filter(a => a.payment_status === 'pending').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>حسابات المختبر</CardTitle>
            <CardDescription>
              قائمة بجميع الأعمال المخبرية وحالة الدفع
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المريض</TableHead>
                  <TableHead className="text-right">وصف العمل</TableHead>
                  <TableHead className="text-right">المبلغ الكلي</TableHead>
                  <TableHead className="text-right">المدفوع</TableHead>
                  <TableHead className="text-right">المتبقي</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ العمل</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{account.patient_name}</div>
                        <div className="text-sm text-gray-500">{account.patient_phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="truncate">{account.lab_work_description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(account.total_amount)}
                    </TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(account.paid_amount)}
                    </TableCell>
                    <TableCell className="text-red-600 font-medium">
                      {formatCurrency(account.remaining_amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(account.payment_status, account.remaining_amount)}
                    </TableCell>
                    <TableCell>
                      {formatDate(account.lab_work_date)}
                    </TableCell>
                    <TableCell>
                      {account.payment_status !== 'paid' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => {
                            setSelectedAccount(account);
                            setIsPaymentDialogOpen(true);
                          }}
                        >
                          <Calculator className="h-3 w-3" />
                          دفع
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredAccounts.length === 0 && (
              <div className="text-center py-12">
                <FlaskConical className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? "لم يتم العثور على حسابات" : "لا توجد حسابات مختبر"}
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? "جرب تغيير كلمات البحث" : "ابدأ بإنشاء حساب مختبر جديد"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>تسجيل دفعة</DialogTitle>
              <DialogDescription>
                {selectedAccount && (
                  <>
                    المريض: {selectedAccount.patient_name}<br />
                    المبلغ المتبقي: {formatCurrency(selectedAccount.remaining_amount)}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <Label htmlFor="payment_amount">مبلغ الدفع ({settings.currency_symbol}) *</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  step="0.01"
                  value={paymentData.payment_amount}
                  onChange={(e) => setPaymentData({...paymentData, payment_amount: e.target.value})}
                  placeholder="0.00"
                  max={selectedAccount?.remaining_amount}
                  required
                />
              </div>

              <div>
                <Label htmlFor="payment_notes">ملاحظات الدفع</Label>
                <Textarea
                  id="payment_notes"
                  value={paymentData.payment_notes}
                  onChange={(e) => setPaymentData({...paymentData, payment_notes: e.target.value})}
                  placeholder="ملاحظات إضافية..."
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">
                  تسجيل الدفع
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default LabAccounts;