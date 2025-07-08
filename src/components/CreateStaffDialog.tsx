
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus } from "lucide-react";

interface CreateStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStaffCreated: () => void;
}

type StaffRole = 'admin' | 'doctor' | 'receptionist' | 'nurse';

const CreateStaffDialog = ({ isOpen, onClose, onStaffCreated }: CreateStaffDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "nurse" as StaffRole,
    phone: "",
    specialization: "",
    employee_id: "",
    hire_date: "",
    salary: "",
    emergency_contact: "",
    notes: ""
  });

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      full_name: "",
      role: "nurse",
      phone: "",
      specialization: "",
      employee_id: "",
      hire_date: "",
      salary: "",
      emergency_contact: "",
      notes: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // إنشاء المستخدم في Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone,
          specialization: formData.specialization
        }
      });

      if (authError) {
        throw new Error(`خطأ في إنشاء المستخدم: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("فشل في إنشاء المستخدم");
      }

      // إنشاء ملف التعريف في جدول profiles
      const profileData = {
        user_id: authData.user.id,
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone || null,
        specialization: formData.specialization || null,
        employee_id: formData.employee_id || null,
        hire_date: formData.hire_date || null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        emergency_contact: formData.emergency_contact || null,
        notes: formData.notes || null
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .insert([profileData]);

      if (profileError) {
        // إذا فشل إنشاء الملف الشخصي، احذف المستخدم من Auth
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`خطأ في إنشاء الملف الشخصي: ${profileError.message}`);
      }

      toast({
        title: "تم بنجاح",
        description: "تم إضافة الموظف الجديد بنجاح",
      });

      resetForm();
      onClose();
      onStaffCreated();
    } catch (error: any) {
      console.error("Error creating staff:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "حدث خطأ في إضافة الموظف",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            إضافة موظف جديد
          </DialogTitle>
          <DialogDescription>
            إنشاء حساب مستخدم جديد وملف شخصي للموظف
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* معلومات تسجيل الدخول */}
            <div className="space-y-2 md:col-span-2">
              <h3 className="font-medium text-lg border-b pb-2">معلومات تسجيل الدخول</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="employee@clinic.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="كلمة مرور قوية"
                minLength={6}
                required
              />
            </div>

            {/* المعلومات الشخصية */}
            <div className="space-y-2 md:col-span-2">
              <h3 className="font-medium text-lg border-b pb-2 mt-4">المعلومات الشخصية</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="full_name">الاسم الكامل *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="الاسم الكامل"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">المنصب *</Label>
              <Select value={formData.role} onValueChange={(value: StaffRole) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدير</SelectItem>
                  <SelectItem value="doctor">طبيب</SelectItem>
                  <SelectItem value="receptionist">موظف استقبال</SelectItem>
                  <SelectItem value="nurse">ممرض</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+962XXXXXXXXX"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="employee_id">رقم الموظف</Label>
              <Input
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                placeholder="EMP001"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="specialization">التخصص</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                placeholder="التخصص أو المجال"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hire_date">تاريخ التوظيف</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="salary">الراتب</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                value={formData.salary}
                onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emergency_contact">جهة اتصال الطوارئ</Label>
              <Input
                id="emergency_contact"
                value={formData.emergency_contact}
                onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                placeholder="رقم هاتف الطوارئ"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أي ملاحظات إضافية"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1 medical-gradient"
              disabled={isLoading}
            >
              {isLoading ? "جاري الإنشاء..." : "إنشاء الموظف"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStaffDialog;
