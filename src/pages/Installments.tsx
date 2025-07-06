
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, User, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import InstallmentPaymentDialog from "@/components/InstallmentPaymentDialog";
import CreateInstallmentDialog from "@/components/CreateInstallmentDialog";

const Installments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: installments = [], isLoading, refetch } = useQuery({
    queryKey: ['installments', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('installment_plans')
        .select(`
          *,
          payment:payments(
            id,
            amount,
            patient_id,
            appointment_id,
            patient:patients(full_name, phone),
            appointment:appointments(scheduled_date, scheduled_time)
          )
        `)
        .order('due_date', { ascending: true });

      if (statusFilter === 'paid') {
        query = query.eq('is_paid', true);
      } else if (statusFilter === 'unpaid') {
        query = query.eq('is_paid', false);
      } else if (statusFilter === 'overdue') {
        query = query.eq('is_paid', false).lt('due_date', new Date().toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data || [];
      
      if (searchTerm) {
        filteredData = filteredData.filter(installment => 
          installment.payment?.patient?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          installment.payment?.patient?.phone?.includes(searchTerm)
        );
      }

      return filteredData;
    }
  });

  const getStatusBadge = (installment: any) => {
    if (installment.is_paid) {
      return <Badge className="bg-green-100 text-green-800">مدفوع</Badge>;
    }
    
    const dueDate = new Date(installment.due_date);
    const today = new Date();
    
    if (dueDate < today) {
      return <Badge variant="destructive">متأخر</Badge>;
    }
    
    return <Badge variant="outline">غير مدفوع</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} د.أ`;
  };

  const handlePayInstallment = (installment: any) => {
    setSelectedInstallment(installment);
    setShowPaymentDialog(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الأقساط</h1>
          <p className="text-muted-foreground">متابعة ودفع أقساط المرضى</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          خطة أقساط جديدة
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث بالاسم أو رقم الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقساط</SelectItem>
                <SelectItem value="unpaid">غير مدفوعة</SelectItem>
                <SelectItem value="paid">مدفوعة</SelectItem>
                <SelectItem value="overdue">متأخرة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Installments List */}
      {isLoading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : installments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">لا توجد أقساط متاحة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {installments.map((installment) => (
            <Card key={installment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">
                          {installment.payment?.patient?.full_name || 'غير محدد'}
                        </span>
                        {getStatusBadge(installment)}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          القسط {installment.installment_number}: {formatCurrency(installment.amount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          تاريخ الاستحقاق: {format(new Date(installment.due_date), 'dd/MM/yyyy', { locale: ar })}
                        </span>
                        {installment.payment?.patient?.phone && (
                          <span>هاتف: {installment.payment.patient.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!installment.is_paid && (
                      <Button 
                        onClick={() => handlePayInstallment(installment)}
                        size="sm"
                      >
                        دفع القسط
                      </Button>
                    )}
                    {installment.is_paid && installment.paid_date && (
                      <div className="text-sm text-green-600">
                        تم الدفع في: {format(new Date(installment.paid_date), 'dd/MM/yyyy', { locale: ar })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payment Dialog */}
      <InstallmentPaymentDialog
        isOpen={showPaymentDialog}
        onClose={() => {
          setShowPaymentDialog(false);
          setSelectedInstallment(null);
        }}
        installment={selectedInstallment}
        onSuccess={() => {
          refetch();
          setShowPaymentDialog(false);
          setSelectedInstallment(null);
        }}
      />

      {/* Create Installment Dialog */}
      <CreateInstallmentDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          refetch();
          setShowCreateDialog(false);
        }}
      />
    </div>
  );
};

export default Installments;
