
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Calendar, AlertCircle } from "lucide-react";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  patientId: string;
  totalAmount: number;
  patientName: string;
  onPaymentComplete: () => void;
}

interface InstallmentPlan {
  installment_number: number;
  amount: number;
  due_date: string;
}

const PaymentDialog = ({ 
  isOpen, 
  onClose, 
  appointmentId, 
  patientId, 
  totalAmount, 
  patientName,
  onPaymentComplete 
}: PaymentDialogProps) => {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "cliq" | "installment">("cash");
  const [paidAmount, setPaidAmount] = useState(totalAmount);
  const [notes, setNotes] = useState("");
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(3);
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInstallmentToggle = (enabled: boolean) => {
    setIsInstallment(enabled);
    if (enabled) {
      setPaymentMethod("installment");
      setPaidAmount(totalAmount / installmentCount);
      generateInstallmentPlan();
    } else {
      setPaymentMethod("cash");
      setPaidAmount(totalAmount);
      setInstallmentPlans([]);
    }
  };

  const generateInstallmentPlan = () => {
    const monthlyAmount = totalAmount / installmentCount;
    const plans: InstallmentPlan[] = [];
    
    for (let i = 1; i <= installmentCount; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      
      plans.push({
        installment_number: i,
        amount: i === installmentCount ? 
          totalAmount - (monthlyAmount * (installmentCount - 1)) :
          monthlyAmount,
        due_date: dueDate.toISOString().split('T')[0]
      });
    }
    
    setInstallmentPlans(plans);
  };

  const handleInstallmentCountChange = (count: number) => {
    setInstallmentCount(count);
    if (isInstallment) {
      setPaidAmount(totalAmount / count);
      const monthlyAmount = totalAmount / count;
      const plans: InstallmentPlan[] = [];
      
      for (let i = 1; i <= count; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        
        plans.push({
          installment_number: i,
          amount: i === count ? 
            totalAmount - (monthlyAmount * (count - 1)) :
            monthlyAmount,
          due_date: dueDate.toISOString().split('T')[0]
        });
      }
      
      setInstallmentPlans(plans);
    }
  };

  const handlePayment = async () => {
    if (paidAmount <= 0) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يجب أن يكون المبلغ المدفوع أكبر من صفر",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // إنشاء سجل الدفع
      const paymentStatus = paidAmount >= totalAmount ? "paid" : "partial";
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert([{
          appointment_id: appointmentId,
          patient_id: patientId,
          amount: totalAmount,
          paid_amount: paidAmount,
          payment_method: paymentMethod,
          status: paymentStatus,
          payment_date: new Date().toISOString().split('T')[0],
          notes: notes || null
        }])
        .select()
        .single();

      if (paymentError) {
        throw paymentError;
      }

      // إذا كان دفع بالتقسيط، أنشئ خطة الأقساط
      if (isInstallment && installmentPlans.length > 0) {
        const installmentRecords = installmentPlans.map((plan, index) => ({
          payment_id: paymentData.id,
          installment_number: plan.installment_number,
          amount: plan.amount,
          due_date: plan.due_date,
          is_paid: index === 0
        }));

        const { error: installmentError } = await supabase
          .from("installment_plans")
          .insert(installmentRecords);

        if (installmentError) {
          console.error("Error creating installment plan:", installmentError);
        }
      }

      toast({
        title: "تم بنجاح",
        description: isInstallment ? 
          "تم إنشاء خطة الدفع بالتقسيط بنجاح" : 
          "تم تسجيل الدفعة بنجاح",
      });

      onPaymentComplete();
      onClose();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في معالجة الدفع",
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            معالجة الدفع - {patientName}
          </DialogTitle>
          <DialogDescription>
            إجمالي المبلغ المطلوب: {formatCurrency(totalAmount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">طريقة الدفع</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                type="button"
                variant={paymentMethod === "cash" ? "default" : "outline"}
                onClick={() => {
                  if (!isInstallment) {
                    setPaymentMethod("cash");
                  }
                }}
                disabled={isInstallment}
                className="h-12"
              >
                💵 نقد
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "cliq" ? "default" : "outline"}
                onClick={() => {
                  if (!isInstallment) {
                    setPaymentMethod("cliq");
                  }
                }}
                disabled={isInstallment}
                className="h-12"
              >
                📱 كليك
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "installment" ? "default" : "outline"}
                onClick={() => handleInstallmentToggle(!isInstallment)}
                className="h-12"
              >
                📅 تقسيط
              </Button>
            </div>
          </div>

          {/* Installment Toggle */}
          <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
            <Switch
              id="installment-toggle"
              checked={isInstallment}
              onCheckedChange={handleInstallmentToggle}
            />
            <Label htmlFor="installment-toggle" className="font-medium">
              دفع بالتقسيط على عدة أشهر
            </Label>
          </div>

          {/* Installment Configuration */}
          {isInstallment && (
            <div className="space-y-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="space-y-2">
                <Label>عدد الأقساط</Label>
                <Select 
                  value={installmentCount.toString()}
                  onValueChange={(value) => handleInstallmentCountChange(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">قسطان (شهرين)</SelectItem>
                    <SelectItem value="3">3 أقساط (3 أشهر)</SelectItem>
                    <SelectItem value="4">4 أقساط (4 أشهر)</SelectItem>
                    <SelectItem value="6">6 أقساط (6 أشهر)</SelectItem>
                    <SelectItem value="12">12 قسط (سنة)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {installmentPlans.length > 0 && (
                <div className="space-y-2">
                  <Label className="font-medium">جدول الأقساط:</Label>
                  <div className="space-y-2">
                    {installmentPlans.map((plan, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                        <span>القسط {plan.installment_number}</span>
                        <div className="flex items-center gap-2">
                          <span>{formatCurrency(plan.amount)}</span>
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(plan.due_date).toLocaleDateString('ar-JO')}
                          </Badge>
                          {index === 0 && (
                            <Badge className="text-xs bg-green-100 text-green-800">
                              سيُدفع اليوم
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="paid_amount">
              {isInstallment ? "مبلغ القسط الأول" : "المبلغ المدفوع"}
            </Label>
            <Input
              id="paid_amount"
              type="number"
              step="0.01"
              min="0"
              max={isInstallment ? undefined : totalAmount}
              value={paidAmount}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
            
            {!isInstallment && paidAmount < totalAmount && (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  المتبقي: {formatCurrency(totalAmount - paidAmount)}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات إضافية حول الدفع"
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>إجمالي المبلغ:</span>
              <span className="font-bold">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>{isInstallment ? "القسط الأول:" : "المبلغ المدفوع:"}</span>
              <span className="font-bold text-green-600">{formatCurrency(paidAmount)}</span>
            </div>
            {!isInstallment && (
              <div className="flex justify-between">
                <span>المتبقي:</span>
                <span className="font-bold text-red-600">
                  {formatCurrency(Math.max(0, totalAmount - paidAmount))}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 medical-gradient"
            >
              {isProcessing ? "جاري المعالجة..." : 
               isInstallment ? "إنشاء خطة التقسيط" : "تأكيد الدفع"}
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

export default PaymentDialog;
