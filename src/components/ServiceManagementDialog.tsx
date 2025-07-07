
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Percent, 
  DollarSign, 
  Save,
  X,
  Calculator
} from "lucide-react";
import ServiceSelectionDialog from "./ServiceSelectionDialog";

interface TreatmentService {
  id: string;
  name: string;
  price: number;
  category: string;
  duration_minutes: number | null;
}

interface AppointmentService {
  id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  service_notes: string | null;
  treatment_services: {
    name: string;
    category: string;
  };
}

interface ServiceManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  onServicesUpdated: () => void;
  userRole: string;
}

const ServiceManagementDialog = ({
  isOpen,
  onClose,
  appointmentId,
  onServicesUpdated,
  userRole
}: ServiceManagementDialogProps) => {
  const [services, setServices] = useState<AppointmentService[]>([]);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [isServiceSelectionOpen, setIsServiceSelectionOpen] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(1);
  const [editingNotes, setEditingNotes] = useState<string>("");
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // تحديد الصلاحيات بناءً على دور المستخدم
  const canDelete = userRole === 'admin' || userRole === 'doctor';
  const canApplyDiscount = userRole === 'admin' || userRole === 'doctor';

  useEffect(() => {
    if (isOpen) {
      fetchAppointmentServices();
    }
  }, [isOpen, appointmentId]);

  const fetchAppointmentServices = async () => {
    try {
      setIsLoading(true);
      
      // جلب بيانات الموعد مع الخدمات
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .select(`
          id,
          subtotal,
          discount_percentage,
          discount_amount,
          final_total,
          total_cost
        `)
        .eq("id", appointmentId)
        .single();

      if (appointmentError) throw appointmentError;
      setAppointmentData(appointmentData);

      // جلب الخدمات المرتبطة بالموعد
      const { data: servicesData, error: servicesError } = await supabase
        .from("appointment_services")
        .select(`
          id,
          service_id,
          quantity,
          unit_price,
          total_price,
          service_notes,
          treatment_services(name, category)
        `)
        .eq("appointment_id", appointmentId);

      if (servicesError) throw servicesError;
      
      setServices(servicesData || []);
      setDiscountValue(appointmentData?.discount_percentage || 0);
      
    } catch (error) {
      console.error("Error fetching appointment services:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات الخدمات",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddServices = async (selectedServices: Array<{service: TreatmentService, quantity: number}>) => {
    try {
      const servicesToAdd = selectedServices.map(({ service, quantity }) => ({
        appointment_id: appointmentId,
        service_id: service.id,
        quantity: quantity,
        unit_price: service.price,
        total_price: service.price * quantity,
        service_notes: null
      }));

      const { error } = await supabase
        .from("appointment_services")
        .insert(servicesToAdd);

      if (error) throw error;

      toast({
        title: "نجح",
        description: "تم إضافة الخدمات بنجاح",
      });

      fetchAppointmentServices();
      onServicesUpdated();
    } catch (error) {
      console.error("Error adding services:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في إضافة الخدمات",
      });
    }
  };

  const handleUpdateService = async (serviceId: string) => {
    try {
      const service = services.find(s => s.id === serviceId);
      if (!service) return;

      const newTotalPrice = service.unit_price * editingQuantity;

      const { error } = await supabase
        .from("appointment_services")
        .update({
          quantity: editingQuantity,
          total_price: newTotalPrice,
          service_notes: editingNotes
        })
        .eq("id", serviceId);

      if (error) throw error;

      toast({
        title: "نجح",
        description: "تم تحديث الخدمة بنجاح",
      });

      setEditingService(null);
      fetchAppointmentServices();
      onServicesUpdated();
    } catch (error) {
      console.error("Error updating service:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تحديث الخدمة",
      });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!canDelete) {
      toast({
        variant: "destructive",
        title: "غير مسموح",
        description: "ليس لديك صلاحية حذف الخدمات",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("appointment_services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;

      toast({
        title: "نجح",
        description: "تم حذف الخدمة بنجاح",
      });

      fetchAppointmentServices();
      onServicesUpdated();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في حذف الخدمة",
      });
    }
  };

  const handleApplyDiscount = async () => {
    if (!canApplyDiscount) {
      toast({
        variant: "destructive",
        title: "غير مسموح",
        description: "ليس لديك صلاحية تطبيق الخصومات",
      });
      return;
    }

    try {
      setIsApplyingDiscount(true);

      const updateData = discountType === "percentage" 
        ? { discount_percentage: discountValue, discount_amount: 0 }
        : { discount_percentage: 0, discount_amount: discountValue };

      const { error } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", appointmentId);

      if (error) throw error;

      // استدعاء دالة إعادة حساب المجموع
      const { error: functionError } = await supabase.rpc('recalculate_appointment_total', {
        appointment_id_param: appointmentId
      });

      if (functionError) throw functionError;

      toast({
        title: "نجح",
        description: "تم تطبيق الخصم بنجاح",
      });

      fetchAppointmentServices();
      onServicesUpdated();
    } catch (error) {
      console.error("Error applying discount:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تطبيق الخصم",
      });
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const startEditing = (service: AppointmentService) => {
    setEditingService(service.id);
    setEditingQuantity(service.quantity);
    setEditingNotes(service.service_notes || "");
  };

  const cancelEditing = () => {
    setEditingService(null);
    setEditingQuantity(1);
    setEditingNotes("");
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} د.أ`;
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Calculator className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
              <p className="text-lg font-medium">جاري تحميل بيانات الخدمات...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">إدارة الخدمات العلاجية</DialogTitle>
            <DialogDescription>
              إضافة وتعديل وحذف الخدمات العلاجية للموعد
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* الخدمات الحالية */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">الخدمات الحالية</CardTitle>
                  <Button
                    onClick={() => setIsServiceSelectionOpen(true)}
                    className="gap-2"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة خدمة
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">لا توجد خدمات مضافة لهذا الموعد</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div key={service.id} className="border rounded-lg p-4">
                        {editingService === service.id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`quantity-${service.id}`}>الكمية</Label>
                                <Input
                                  id={`quantity-${service.id}`}
                                  type="number"
                                  min="1"
                                  value={editingQuantity}
                                  onChange={(e) => setEditingQuantity(Number(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label>السعر الإجمالي</Label>
                                <div className="text-lg font-bold text-green-600">
                                  {formatCurrency(service.unit_price * editingQuantity)}
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor={`notes-${service.id}`}>ملاحظات</Label>
                              <Textarea
                                id={`notes-${service.id}`}
                                value={editingNotes}
                                onChange={(e) => setEditingNotes(e.target.value)}
                                placeholder="ملاحظات خاصة بالخدمة..."
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleUpdateService(service.id)}
                                size="sm"
                                className="gap-1"
                              >
                                <Save className="h-3 w-3" />
                                حفظ
                              </Button>
                              <Button
                                onClick={cancelEditing}
                                variant="outline"
                                size="sm"
                                className="gap-1"
                              >
                                <X className="h-3 w-3" />
                                إلغاء
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium">{service.treatment_services?.name}</h4>
                                <Badge variant="outline">{service.treatment_services?.category}</Badge>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>الكمية: {service.quantity} × {formatCurrency(service.unit_price)}</p>
                                <p className="font-bold text-green-600">الإجمالي: {formatCurrency(service.total_price)}</p>
                                {service.service_notes && (
                                  <p className="italic">ملاحظات: {service.service_notes}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => startEditing(service)}
                                variant="outline"
                                size="sm"
                                className="gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                تعديل
                              </Button>
                              {canDelete && (
                                <Button
                                  onClick={() => handleDeleteService(service.id)}
                                  variant="destructive"
                                  size="sm"
                                  className="gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  حذف
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* الخصومات */}
            {canApplyDiscount && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">الخصومات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>نوع الخصم</Label>
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => setDiscountType("percentage")}
                          variant={discountType === "percentage" ? "default" : "outline"}
                          size="sm"
                          className="gap-1"
                        >
                          <Percent className="h-3 w-3" />
                          نسبة مئوية
                        </Button>
                        <Button
                          onClick={() => setDiscountType("amount")}
                          variant={discountType === "amount" ? "default" : "outline"}
                          size="sm"
                          className="gap-1"
                        >
                          <DollarSign className="h-3 w-3" />
                          مبلغ ثابت
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="discount-value">
                        {discountType === "percentage" ? "نسبة الخصم (%)" : "مبلغ الخصم (د.أ)"}
                      </Label>
                      <Input
                        id="discount-value"
                        type="number"
                        min="0"
                        max={discountType === "percentage" ? "100" : undefined}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleApplyDiscount}
                        disabled={isApplyingDiscount}
                        className="w-full"
                      >
                        {isApplyingDiscount ? "جاري التطبيق..." : "تطبيق الخصم"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ملخص المبالغ */}
            {appointmentData && (
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardHeader>
                  <CardTitle className="text-lg">ملخص المبالغ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>المجموع الفرعي:</span>
                      <span className="font-medium">{formatCurrency(appointmentData.subtotal || 0)}</span>
                    </div>
                    {appointmentData.discount_percentage > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span>خصم ({appointmentData.discount_percentage}%):</span>
                        <span>-{formatCurrency(appointmentData.discount_amount || 0)}</span>
                      </div>
                    )}
                    {appointmentData.discount_amount > 0 && appointmentData.discount_percentage === 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span>خصم ثابت:</span>
                        <span>-{formatCurrency(appointmentData.discount_amount || 0)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>المجموع النهائي:</span>
                      <span className="text-green-600">{formatCurrency(appointmentData.final_total || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ServiceSelectionDialog
        isOpen={isServiceSelectionOpen}
        onClose={() => setIsServiceSelectionOpen(false)}
        onServicesSelected={handleAddServices}
      />
    </>
  );
};

export default ServiceManagementDialog;
