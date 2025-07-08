
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

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

interface PaymentsTableProps {
  payments: DetailedPayment[];
  patientName: string;
  isPrint?: boolean;
}

const PaymentsTable: React.FC<PaymentsTableProps> = ({ payments, patientName, isPrint = false }) => {
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

  const getPaymentMethodBadge = (method: string) => {
    const methodConfig = {
      cash: { label: "نقدي", variant: "default" as const, icon: CreditCard },
      cliq: { label: "كليك", variant: "secondary" as const, icon: CreditCard },
      installment: { label: "أقساط", variant: "outline" as const, icon: Clock },
    };
    
    const config = methodConfig[method as keyof typeof methodConfig] || { label: method, variant: "outline" as const, icon: CreditCard };
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: "مدفوع", variant: "default" as const, icon: CheckCircle },
      partial: { label: "جزئي", variant: "secondary" as const, icon: Clock },
      pending: { label: "معلق", variant: "destructive" as const, icon: Clock },
      cancelled: { label: "ملغي", variant: "outline" as const, icon: Clock },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "outline" as const, icon: Clock };
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (payments.length === 0) {
    return (
      <Card className={isPrint ? "print:shadow-none print:break-inside-avoid" : ""}>
        <CardHeader>
          <CardTitle className="text-lg">المدفوعات</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">لا توجد مدفوعات مسجلة</p>
        </CardContent>
      </Card>
    );
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.paid_amount, 0);
  const totalAmount = payments.reduce((sum, p) => sum + p.total_amount, 0);
  const pendingAmount = totalAmount - totalPaid;

  return (
    <Card className={isPrint ? "print:shadow-none print:break-inside-avoid" : ""}>
      <CardHeader>
        <CardTitle className="text-lg">المدفوعات التفصيلية</CardTitle>
        <p className="text-sm text-gray-600">إجمالي {payments.length} عملية دفع</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">تاريخ الموعد</TableHead>
              <TableHead className="text-right">تاريخ الدفع</TableHead>
              <TableHead className="text-right">طريقة الدفع</TableHead>
              <TableHead className="text-right">المبلغ الإجمالي</TableHead>
              <TableHead className="text-right">المبلغ المدفوع</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              {!isPrint && <TableHead className="text-right">ملاحظات</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments
              .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
              .map((payment) => (
              <TableRow key={payment.payment_id}>
                <TableCell className="font-medium">
                  {formatDate(payment.appointment_date)}
                </TableCell>
                <TableCell>
                  {payment.payment_date ? formatDate(payment.payment_date) : "-"}
                </TableCell>
                <TableCell>
                  {getPaymentMethodBadge(payment.payment_method)}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(payment.total_amount)}
                </TableCell>
                <TableCell className="font-semibold text-green-600">
                  {formatCurrency(payment.paid_amount)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(payment.payment_status)}
                </TableCell>
                {!isPrint && (
                  <TableCell>
                    <div className="text-sm">
                      {payment.payment_notes && <div>دفع: {payment.payment_notes}</div>}
                      {payment.appointment_notes && <div>موعد: {payment.appointment_notes}</div>}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* ملخص المدفوعات */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">ملخص المدفوعات</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">{formatCurrency(totalAmount)}</div>
              <div className="text-sm text-blue-800">إجمالي المبلغ المستحق</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</div>
              <div className="text-sm text-green-800">إجمالي المبلغ المدفوع</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-lg font-bold text-red-600">{formatCurrency(pendingAmount)}</div>
              <div className="text-sm text-red-800">المبلغ المتبقي</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-xl font-bold text-gray-800">{payments.length}</div>
              <div className="text-gray-600">إجمالي المدفوعات</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-xl font-bold text-green-600">{payments.filter(p => p.payment_status === 'paid').length}</div>
              <div className="text-gray-600">مدفوعات مكتملة</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-xl font-bold text-orange-600">{payments.filter(p => p.payment_status === 'partial').length}</div>
              <div className="text-gray-600">مدفوعات جزئية</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-xl font-bold text-red-600">{payments.filter(p => p.payment_status === 'pending').length}</div>
              <div className="text-gray-600">مدفوعات معلقة</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentsTable;
