
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface CreateInstallmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateInstallmentDialog = ({
  isOpen,
  onClose,
  onSuccess
}: CreateInstallmentDialogProps) => {
  const [formData, setFormData] = useState({
    patient_id: "",
    appointment_id: "",
    total_amount: 0,
    installment_count: 3,
    first_payment_date: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch patients
  const { data: patients = [] } = useQuery({
    queryKey: ['patients-for-installments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, phone')
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch appointments for selected patient
  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-appointments', formData.patient_id],
    queryFn: async () => {
      if (!formData.patient_id) return [];
      
      const { data, error } = await supabase
        .from('appointments')
        .select('id, scheduled_date, scheduled_time, total_cost')
        .eq('patient_id', formData.patient_id)
        .eq('status', 'completed')
        .order('scheduled_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!formData.patient_id
  });

  const handleAppointmentChange = (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    setFormData({
      ...formData,
      appointment_id: appointmentId,
      total_amount: appointment?.total_cost || 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id || !formData.appointment_id || !formData.total_amount || !formData.first_payment_date) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment record first
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert([{
          appointment_id: formData.appointment_id,
          patient_id: formData.patient_id,
          amount: formData.total_amount,
          paid_amount: 0,
          payment_method: "installment",
          status: "pending",
          payment_date: formData.first_payment_date
        }])
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Create installment plan
      const monthlyAmount = formData.total_amount / formData.installment_count;
      const installmentRecords = [];
      
      for (let i = 1; i <= formData.installment_count; i++) {
        const dueDate = new Date(formData.first_payment_date);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        
        installmentRecords.push({
          payment_id: paymentData.id,
          installment_number: i,
          amount: i === formData.installment_count ? 
            formData.total_amount - (monthlyAmount * (formData.installment_count - 1)) :
            monthlyAmount,
          due_date: dueDate.toISOString().split('T')[0],
          is_paid: false
        });
      }

      const { error: installmentError } = await supabase
        .from("installment_plans")
        .insert(installmentRecords);

      if (installmentError) throw installmentError;

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء خطة الأقساط بنجاح",
      });

      onSuccess();
      setFormData({
        patient_id: "",
        appointment_id: "",
        total_amount: 0,
        installment_count: 3,
        first_payment_date: ""
      });
    } catch (error) {
      console.error("Error creating installment plan:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في إنشاء خطة الأقساط",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} د.أ`;
  };

  const monthlyAmount = formData.total_amount / formData.installment_count;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>خطة أقساط جديدة</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient">المريض *</Label>
            <Select
              value={formData.patient_id}
              onValueChange={(value) => setFormData({ ...formData, patient_id: value, appointment_id: "", total_amount: 0 })}
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

          {formData.patient_id && (
            <div className="space-y-2">
              <Label htmlFor="appointment">الموعد *</Label>
              <Select
                value={formData.appointment_id}
                onValueChange={handleAppointmentChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموعد" />
                </SelectTrigger>
                <SelectContent>
                  {appointments.map((appointment) => (
                    <SelectItem key={appointment.id} value={appointment.id}>
                      {appointment.scheduled_date} - {formatCurrency(appointment.total_cost || 0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="total_amount">إجمالي المبلغ *</Label>
            <Input
              id="total_amount"
              type="number"
              step="0.01"
              min="1"
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="installment_count">عدد الأقساط</Label>
            <Select
              value={formData.installment_count.toString()}
              onValueChange={(value) => setFormData({ ...formData, installment_count: parseInt(value) })}
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

          <div className="space-y-2">
            <Label htmlFor="first_payment_date">تاريخ أول قسط *</Label>
            <Input
              id="first_payment_date"
              type="date"
              value={formData.first_payment_date}
              onChange={(e) => setFormData({ ...formData, first_payment_date: e.target.value })}
            />
          </div>

          {formData.total_amount > 0 && formData.installment_count > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">ملخص الأقساط:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>إجمالي المبلغ:</span>
                  <span>{formatCurrency(formData.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>عدد الأقساط:</span>
                  <span>{formData.installment_count}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>قيمة القسط الشهري:</span>
                  <span>{formatCurrency(monthlyAmount)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isProcessing} className="flex-1">
              {isProcessing ? "جاري الإنشاء..." : "إنشاء خطة الأقساط"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInstallmentDialog;
