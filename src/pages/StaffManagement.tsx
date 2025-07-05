import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Users, UserPlus, Edit, Trash2, Phone, Mail, Calendar, Building } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: 'doctor' | 'receptionist' | 'nurse' | 'admin';
  phone: string | null;
  specialization: string | null;
  employee_id: string | null;
  hire_date: string | null;
  salary: number | null;
  emergency_contact: string | null;
  is_active: boolean;
  created_at: string;
}

const StaffManagement = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const navigate = useNavigate();

  // Form state for editing
  const [formData, setFormData] = useState({
    full_name: "",
    role: "nurse" as "doctor" | "nurse" | "receptionist" | "admin",
    phone: "",
    specialization: "",
    employee_id: "",
    hire_date: "",
    salary: "",
    emergency_contact: "",
    is_active: true
  });

  useEffect(() => {
    checkUserAuth();
    fetchStaffProfiles();
  }, []);

  const checkUserAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      toast({
        variant: "destructive",
        title: "غير مخول",
        description: "ليس لديك صلاحية للوصول لهذه الصفحة",
      });
      navigate("/dashboard");
      return;
    }
  };

  const fetchStaffProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في تحميل بيانات الموظفين",
        });
      } else {
        setProfiles(data || []);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleInArabic = (role: string) => {
    const roles = {
      doctor: "طبيب",
      receptionist: "موظف استقبال", 
      nurse: "ممرضة",
      admin: "مدير"
    };
    return roles[role as keyof typeof roles] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      doctor: "bg-blue-100 text-blue-800",
      receptionist: "bg-green-100 text-green-800",
      nurse: "bg-purple-100 text-purple-800", 
      admin: "bg-red-100 text-red-800"
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const handleEditProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setFormData({
      full_name: profile.full_name,
      role: profile.role,
      phone: profile.phone || "",
      specialization: profile.specialization || "",
      employee_id: profile.employee_id || "",
      hire_date: profile.hire_date || "",
      salary: profile.salary?.toString() || "",
      emergency_contact: profile.emergency_contact || "",
      is_active: profile.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!selectedProfile) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone || null,
          specialization: formData.specialization || null,
          employee_id: formData.employee_id || null,
          hire_date: formData.hire_date || null,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          emergency_contact: formData.emergency_contact || null,
          is_active: formData.is_active
        })
        .eq("id", selectedProfile.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في تحديث بيانات الموظف",
        });
      } else {
        toast({
          title: "تم التحديث",
          description: "تم تحديث بيانات الموظف بنجاح",
        });
        setIsDialogOpen(false);
        fetchStaffProfiles();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const toggleUserStatus = async (profile: Profile) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !profile.is_active })
        .eq("id", profile.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في تحديث حالة الموظف",
        });
      } else {
        toast({
          title: "تم التحديث",
          description: `تم ${profile.is_active ? 'إلغاء تفعيل' : 'تفعيل'} الموظف بنجاح`,
        });
        fetchStaffProfiles();
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || profile.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
            <p className="text-lg font-medium">جاري تحميل بيانات الموظفين...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الموظفين</h1>
            <p className="text-gray-600">إدارة وتحديث بيانات موظفي العيادة</p>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                البحث والفلترة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="البحث بالاسم أو رقم الموظف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="فلترة حسب الوظيفة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الوظائف</SelectItem>
                    <SelectItem value="doctor">طبيب</SelectItem>
                    <SelectItem value="nurse">ممرضة</SelectItem>
                    <SelectItem value="receptionist">موظف استقبال</SelectItem>
                    <SelectItem value="admin">مدير</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Staff List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => (
              <Card key={profile.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{profile.full_name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge className={getRoleBadgeColor(profile.role)}>
                          {getRoleInArabic(profile.role)}
                        </Badge>
                        <Badge variant={profile.is_active ? "default" : "secondary"}>
                          {profile.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {profile.employee_id && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building className="h-4 w-4" />
                      <span>رقم الموظف: {profile.employee_id}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile.specialization && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <UserPlus className="h-4 w-4" />
                      <span>التخصص: {profile.specialization}</span>
                    </div>
                  )}
                  {profile.hire_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>تاريخ التوظيف: {new Date(profile.hire_date).toLocaleDateString('ar-SA')}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditProfile(profile)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      تعديل
                    </Button>
                    <Button
                      size="sm"
                      variant={profile.is_active ? "destructive" : "default"}
                      onClick={() => toggleUserStatus(profile)}
                    >
                      {profile.is_active ? "إلغاء تفعيل" : "تفعيل"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProfiles.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">لا توجد نتائج</p>
                <p className="text-gray-600">لم يتم العثور على موظفين يطابقون البحث</p>
              </CardContent>
            </Card>
          )}

          {/* Edit Profile Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>تعديل بيانات الموظف</DialogTitle>
                <DialogDescription>
                  تحديث معلومات {selectedProfile?.full_name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">الاسم الكامل</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">الوظيفة</Label>
                  <Select value={formData.role} onValueChange={(value: any) => setFormData({...formData, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">طبيب</SelectItem>
                      <SelectItem value="nurse">ممرضة</SelectItem>
                      <SelectItem value="receptionist">موظف استقبال</SelectItem>
                      <SelectItem value="admin">مدير</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="employee_id">رقم الموظف</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                  />
                </div>
                
                {formData.role === 'doctor' && (
                  <div className="space-y-2">
                    <Label htmlFor="specialization">التخصص</Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="hire_date">تاريخ التوظيف</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salary">الراتب (د.أ)</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">جهة الاتصال للطوارئ</Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSaveProfile}>
                  حفظ التغييرات
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;