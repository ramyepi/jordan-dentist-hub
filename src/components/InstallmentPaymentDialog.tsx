
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar, DollarSign, User } from "lucide-react";

interface InstallmentPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  installment: any;
  onSuccess: () => void;
}

const InstallmentPaymentDialog = ({
  isOpen,
  onClose,
  installment,
  onSuccess
}: InstallmentPaymentDialogProps) => {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "cliq">("cash");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!installment) return null;

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Update installment as paid
      const { error: installmentError } = await supabase
        .from("installment_plans")
        .update({
          is_paid: true,
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', installment.id);

      if (installmentError) throw installmentError;

      // Update the main payment record if needed
      if (installment.payment?.id) {
        const { data: allInstallments, error: fetchError } = await supabase
          .from("installment_plans")
          .select("*")
          .eq('payment_id', installment.payment.id);

        if (fetchError) throw fetchError;

        const paidInstallments = allInstallments?.filter(i => i.is_paid || i.id === installment.id) || [];
        const totalPaid = paidInstallments.reduce((sum, i) => sum + Number(i.amount), 0);
        const totalAmount = installment.payment.amount;

        const newStatus = totalPaid >= totalAmount ? "paid" : "partial";

        const { error: paymentError } = await supabase
          .from("payments")
          .update({
            paid_amount: totalPaid,
            status: newStatus,
            payment_method: paymentMethod,
            notes: notes || null
          })
          .eq('id', installment.payment.id);

        if (paymentError) throw paymentError;
      }

      toast({
        title: "تم بنجاح",
        description: "تم دفع القسط بنجاح",
      });

      onSuccess();
    } catch (error) {
      console.error("Error processing installment payment:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في معالجة دفع القسط",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} د.أ`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>دفع القسط</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Installment Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium">
                {installment.payment?.patient?.full_name || 'غير محدد'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span>رقم القسط:</span>
                <span>{installment.installment_number}</span>
              </div>
              <div className="flex justify-between">
                <span>المبلغ:</span>
                <span className="font-bold">{formatCurrency(installment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>تاريخ الاستحقاق:</span>
                <span>{format(new Date(installment.due_date), 'dd/MM/yyyy', { locale: ar })}</span>
              </div>
              {installment.payment?.patient?.phone && (
                <div className="flex justify-between">
                  <span>الهاتف:</span>
                  <span>{installment.payment.patient.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>طريقة الدفع</Label>
            <Select value={paymentMethod} onValueChange={(value: "cash" | "cliq") => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">💵 نقد</SelectItem>
                <SelectItem value="cliq">📱 كليك</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات إضافية..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? "جاري المعالجة..." : "تأكيد الدفع"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallmentPaymentDialog;
