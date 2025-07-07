
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { 
  Users, 
  Search, 
  Edit, 
  Shield, 
  UserCheck, 
  UserX,
  Trash2,
  Calendar,
  Phone,
  DollarSign
} from "lucide-react";

interface StaffMember {
  id: string;
  full_name: string;
  role: 'admin' | 'doctor' | 'receptionist' | 'nurse';
  phone: string | null;
  specialization: string | null;
  employee_id: string | null;
  hire_date: string | null;
  salary: number | null;
  emergency_contact: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const StaffManagement = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    role: "nurse" as StaffMember['role'],
    phone: "",
    specialization: "",
    employee_id: "",
    hire_date: "",
    salary: "",
    emergency_contact: "",
    notes: ""
  });

  useEffect(() => {
    fetchCurrentUserProfile();
    fetchStaff();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [staff, searchTerm, selectedRole]);

  const fetchCurrentUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setCurrentUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات الموظفين",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterStaff = () => {
    let filtered = staff;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.phone && member.phone.includes(searchTerm)) ||
        (member.employee_id && member.employee_id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedRole !== "all") {
      filtered = filtered.filter(member => member.role === selectedRole);
    }

    setFilteredStaff(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
      toast({
        variant: "destructive",
        title: "غير مسموح",
        description: "لا يمكنك تعديل الموظفين",
      });
      return;
    }

    if (!editingStaff) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "لا يمكن إضافة موظفين جدد من هذه الواجهة. يجب إنشاء حساب مستخدم أولاً.",
      });
      return;
    }

    try {
      const staffData = {
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone || null,
        specialization: formData.specialization || null,
        employee_id: formData.employee_id || null,
        hire_date: formData.hire_date || null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        emergency_contact: formData.emergency_contact || null,
        notes: formData.notes || null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(staffData)
        .eq("id", editingStaff.id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات الموظف بنجاح",
      });

      resetForm();
      setIsDialogOpen(false);
      fetchStaff();
    } catch (error) {
      console.error("Error saving staff:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في حفظ بيانات الموظف",
      });
    }
  };

  const handleEdit = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      full_name: staffMember.full_name,
      role: staffMember.role,
      phone: staffMember.phone || "",
      specialization: staffMember.specialization || "",
      employee_id: staffMember.employee_id || "",
      hire_date: staffMember.hire_date || "",
      salary: staffMember.salary?.toString() || "",
      emergency_contact: staffMember.emergency_contact || "",
      notes: staffMember.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (staffMember: StaffMember) => {
    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
      toast({
        variant: "destructive",
        title: "غير مسموح",
        description: "لا يمكنك حذف الموظفين",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", staffMember.id);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الموظف بنجاح",
      });

      fetchStaff();
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في حذف الموظف",
      });
    }
  };

  const toggleStaffStatus = async (staffMember: StaffMember) => {
    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
      toast({
        variant: "destructive",
        title: "غير مسموح",
        description: "لا يمكنك تعديل حالة الموظفين",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !staffMember.is_active })
        .eq("id", staffMember.id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: `تم ${staffMember.is_active ? 'إلغاء تفعيل' : 'تفعيل'} الموظف بنجاح`,
      });

      fetchStaff();
    } catch (error) {
      console.error("Error toggling staff status:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تحديث حالة الموظف",
      });
    }
  };

  const resetForm = () => {
    setFormData({
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
    setEditingStaff(null);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: "مدير", color: "bg-red-100 text-red-800" },
      doctor: { label: "طبيب", color: "bg-green-100 text-green-800" },
      receptionist: { label: "استقبال", color: "bg-blue-100 text-blue-800" },
      nurse: { label: "ممرض", color: "bg-purple-100 text-purple-800" }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, color: "bg-gray-100 text-gray-800" };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-lg font-medium">جاري تحميل بيانات الموظفين...</p>
        </div>
      </div>
    );
  }

  if (!currentUserProfile || currentUserProfile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">غير مسموح</h2>
            <p className="text-gray-600">
              هذه الصفحة مخصصة للمدير فقط. يرجى التواصل مع الإدارة للحصول على الصلاحيات المناسبة.
            </p>
          </CardContent>
        </Card>
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
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">إدارة الموظفين</h1>
                <p className="text-sm text-gray-600">({filteredStaff.length} موظف)</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              ملاحظة: يمكن تعديل بيانات الموظفين الحاليين فقط. لإضافة موظف جديد، يجب إنشاء حساب مستخدم أولاً.
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث عن موظف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المناصب</SelectItem>
              <SelectItem value="admin">مدير</SelectItem>
              <SelectItem value="doctor">طبيب</SelectItem>
              <SelectItem value="receptionist">موظف استقبال</SelectItem>
              <SelectItem value="nurse">ممرض</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Staff Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((staffMember) => (
            <Card key={staffMember.id} className="shadow-medical hover:shadow-elevated transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold">
                      {staffMember.full_name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      {getRoleBadge(staffMember.role)}
                      <Badge variant={staffMember.is_active ? "default" : "secondary"}>
                        {staffMember.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Dialog open={isDialogOpen && editingStaff?.id === staffMember.id} onOpenChange={(open) => {
                      setIsDialogOpen(open);
                      if (!open) setEditingStaff(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(staffMember)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>تعديل بيانات الموظف</DialogTitle>
                          <DialogDescription>
                            قم بتعديل بيانات الموظف أدناه
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="full_name">الاسم الكامل *</Label>
                              <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="role">المنصب *</Label>
                              <Select value={formData.role} onValueChange={(value: StaffMember['role']) => setFormData(prev => ({ ...prev, role: value }))}>
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
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="employee_id">رقم الموظف</Label>
                              <Input
                                id="employee_id"
                                value={formData.employee_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="specialization">التخصص</Label>
                              <Input
                                id="specialization"
                                value={formData.specialization}
                                onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
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
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="emergency_contact">جهة اتصال الطوارئ</Label>
                              <Input
                                id="emergency_contact"
                                value={formData.emergency_contact}
                                onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="notes">ملاحظات</Label>
                              <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                rows={3}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                              إلغاء
                            </Button>
                            <Button type="submit">
                              تحديث
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStaffStatus(staffMember)}
                    >
                      {staffMember.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف الموظف "{staffMember.full_name}"؟ هذا الإجراء لا يمكن التراجع عنه.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(staffMember)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {staffMember.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{staffMember.phone}</span>
                  </div>
                )}
                
                {staffMember.employee_id && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">رقم الموظف: {staffMember.employee_id}</Badge>
                  </div>
                )}
                
                {staffMember.specialization && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>التخصص: {staffMember.specialization}</span>
                  </div>
                )}
                
                {staffMember.hire_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>تاريخ التوظيف: {new Date(staffMember.hire_date).toLocaleDateString('ar-EG')}</span>
                  </div>
                )}
                
                {staffMember.salary && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span>الراتب: {staffMember.salary.toFixed(2)} د.أ</span>
                  </div>
                )}

                {staffMember.notes && (
                  <>
                    <Separator />
                    <div className="text-sm text-gray-600">
                      <strong>ملاحظات:</strong> {staffMember.notes}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredStaff.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedRole !== "all" ? "لم يتم العثور على موظفين" : "لا توجد موظفين"}
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedRole !== "all" ? "جرب تغيير معايير البحث" : "لا يوجد موظفين مسجلين في النظام"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffManagement;
