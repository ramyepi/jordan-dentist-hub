
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

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

interface InstallmentsTableProps {
  installments: DetailedInstallment[];
  patientName: string;
  isPrint?: boolean;
}

const InstallmentsTable: React.FC<InstallmentsTableProps> = ({ installments, patientName, isPrint = false }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "غير محدد";
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ar });
    } catch {
      return "غير صحيح";
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} د.أ`;
  };

  const getStatusBadge = (installment: DetailedInstallment) => {
    switch (installment.installment_status) {
      case 'paid':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            مدفوع
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            متأخر ({installment.days_overdue} يوم)
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            مستحق
          </Badge>
        );
      default:
        return <Badge variant="outline">{installment.installment_status}</Badge>;
    }
  };

  if (installments.length === 0) {
    return (
      <Card className={isPrint ? "print:shadow-none" : ""}>
        <CardHeader>
          <CardTitle className="text-lg">الأقساط</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">لا توجد أقساط مسجلة</p>
        </CardContent>
      </Card>
    );
  }

  const paidInstallments = installments.filter(i => i.is_paid);
  const overdueInstallments = installments.filter(i => i.installment_status === 'overdue');
  const pendingInstallments = installments.filter(i => i.installment_status === 'pending');
  
  const totalAmount = installments.reduce((sum, i) => sum + i.installment_amount, 0);
  const paidAmount = paidInstallments.reduce((sum, i) => sum + i.installment_amount, 0);
  const overdueAmount = overdueInstallments.reduce((sum, i) => sum + i.installment_amount, 0);

  return (
    <Card className={isPrint ? "print:shadow-none print:break-inside-avoid" : ""}>
      <CardHeader>
        <CardTitle className="text-lg">الأقساط التفصيلية</CardTitle>
        <p className="text-sm text-gray-600">إجمالي {installments.length} قسط</p>
      </CardHeader>
      <CardContent>
        {/* تنبيه للأقساط المتأخرة */}
        {overdueInstallments.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <strong>تنبيه: يوجد {overdueInstallments.length} أقساط متأخرة</strong>
            </div>
            <p className="text-sm text-red-600 mt-1">
              إجمالي المبلغ المتأخر: {formatCurrency(overdueAmount)}
            </p>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">رقم القسط</TableHead>
              <TableHead className="text-right">المبلغ</TableHead>
              <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
              <TableHead className="text-right">تاريخ الدفع</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">تاريخ الموعد</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {installments
              .sort((a, b) => a.installment_number - b.installment_number)
              .map((installment) => (
              <TableRow 
                key={installment.installment_id}
                className={
                  installment.installment_status === 'overdue' 
                    ? 'bg-red-50' 
                    : installment.installment_status === 'paid'
                    ? 'bg-green-50'
                    : ''
                }
              >
                <TableCell className="font-medium">
                  القسط #{installment.installment_number}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(installment.installment_amount)}
                </TableCell>
                <TableCell>
                  <div className={
                    installment.installment_status === 'overdue' ? 'text-red-600 font-medium' : ''
                  }>
                    {formatDate(installment.due_date)}
                  </div>
                </TableCell>
                <TableCell>
                  {installment.paid_date ? formatDate(installment.paid_date) : "-"}
                </TableCell>
                <TableCell>
                  {getStatusBadge(installment)}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {formatDate(installment.appointment_date)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* ملخص الأقساط */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">ملخص الأقساط</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-xl font-bold text-gray-800">{installments.length}</div>
              <div className="text-gray-600">إجمالي الأقساط</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-xl font-bold text-green-600">{paidInstallments.length}</div>
              <div className="text-gray-600">أقساط مدفوعة</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-xl font-bold text-orange-600">{pendingInstallments.length}</div>
              <div className="text-gray-600">أقساط مستحقة</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-xl font-bold text-red-600">{overdueInstallments.length}</div>
              <div className="text-gray-600">أقساط متأخرة</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">{formatCurrency(totalAmount)}</div>
              <div className="text-sm text-blue-800">إجمالي المبلغ</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-600">{formatCurrency(paidAmount)}</div>
              <div className="text-sm text-green-800">المبلغ المدفوع</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-lg font-bold text-red-600">{formatCurrency(totalAmount - paidAmount)}</div>
              <div className="text-sm text-red-800">المبلغ المتبقي</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstallmentsTable;
