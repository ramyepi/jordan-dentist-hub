
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Tag } from "lucide-react";

interface ServiceCategory {
  id: string;
  name: string;
  name_en: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
}

const ServiceCategoriesManagement = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);

  const [newCategory, setNewCategory] = useState({
    name: "",
    name_en: "",
    description: "",
    color: "bg-blue-100 text-blue-800",
    is_active: true
  });

  const colorOptions = [
    { value: "bg-blue-100 text-blue-800", label: "أزرق", preview: "bg-blue-100" },
    { value: "bg-green-100 text-green-800", label: "أخضر", preview: "bg-green-100" },
    { value: "bg-red-100 text-red-800", label: "أحمر", preview: "bg-red-100" },
    { value: "bg-purple-100 text-purple-800", label: "بنفسجي", preview: "bg-purple-100" },
    { value: "bg-pink-100 text-pink-800", label: "وردي", preview: "bg-pink-100" },
    { value: "bg-yellow-100 text-yellow-800", label: "أصفر", preview: "bg-yellow-100" },
    { value: "bg-gray-100 text-gray-800", label: "رمادي", preview: "bg-gray-100" },
    { value: "bg-orange-100 text-orange-800", label: "برتقالي", preview: "bg-orange-100" }
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في تحميل فئات الخدمات",
        });
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
    
    return profile?.id || null;
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const userId = await getCurrentUserId();
    if (!userId) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("service_categories")
        .insert([{
          ...newCategory,
          created_by: userId,
          description: newCategory.description || null
        }]);

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في إضافة الفئة",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: "تم إضافة فئة الخدمة بنجاح",
        });
        setIsAddDialogOpen(false);
        setNewCategory({
          name: "",
          name_en: "",
          description: "",
          color: "bg-blue-100 text-blue-800",
          is_active: true
        });
        fetchCategories();
      }
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCategory) return;

    try {
      const { error } = await supabase
        .from("service_categories")
        .update({
          name: newCategory.name,
          name_en: newCategory.name_en,
          description: newCategory.description || null,
          color: newCategory.color,
          is_active: newCategory.is_active
        })
        .eq("id", editingCategory.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في تحديث الفئة",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: "تم تحديث فئة الخدمة بنجاح",
        });
        setIsEditDialogOpen(false);
        setEditingCategory(null);
        fetchCategories();
      }
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`هل أنت متأكد من حذف فئة "${categoryName}"؟`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("service_categories")
        .delete()
        .eq("id", categoryId);

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في حذف الفئة",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: "تم حذف فئة الخدمة بنجاح",
        });
        fetchCategories();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const openEditDialog = (category: ServiceCategory) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      name_en: category.name_en,
      description: category.description || "",
      color: category.color,
      is_active: category.is_active
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Tag className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
        <p className="text-lg font-medium">جاري تحميل فئات الخدمات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إدارة فئات الخدمات</h2>
          <p className="text-gray-600">إضافة وتعديل فئات الخدمات العلاجية</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="medical-gradient gap-2">
              <Plus className="h-4 w-4" />
              إضافة فئة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة فئة خدمة جديدة</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل فئة الخدمة الجديدة
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم بالعربية *</Label>
                  <Input
                    id="name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    placeholder="اسم الفئة بالعربية"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name_en">الاسم بالإنجليزية *</Label>
                  <Input
                    id="name_en"
                    value={newCategory.name_en}
                    onChange={(e) => setNewCategory({...newCategory, name_en: e.target.value})}
                    placeholder="Category name in English"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Input
                  id="description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  placeholder="وصف الفئة"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color">اللون</Label>
                <Select 
                  value={newCategory.color}
                  onValueChange={(value) => setNewCategory({...newCategory, color: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${option.preview}`}></div>
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={newCategory.is_active}
                  onCheckedChange={(checked) => setNewCategory({...newCategory, is_active: checked})}
                />
                <Label htmlFor="is_active">فئة نشطة</Label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="medical-gradient flex-1">
                  إضافة الفئة
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="shadow-medical hover:shadow-elevated transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <Badge className={category.color}>
                  {category.name_en}
                </Badge>
              </div>
              {category.description && (
                <CardDescription>{category.description}</CardDescription>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant={category.is_active ? "default" : "secondary"}>
                  {category.is_active ? "نشط" : "غير نشط"}
                </Badge>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openEditDialog(category)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد فئات</h3>
          <p className="text-gray-600 mb-4">ابدأ بإضافة أول فئة خدمة</p>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="medical-gradient gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة فئة جديدة
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل فئة الخدمة</DialogTitle>
            <DialogDescription>
              تحديث تفاصيل فئة الخدمة
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditCategory} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">الاسم بالعربية *</Label>
                <Input
                  id="edit-name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="اسم الفئة بالعربية"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-name_en">الاسم بالإنجليزية *</Label>
                <Input
                  id="edit-name_en"
                  value={newCategory.name_en}
                  onChange={(e) => setNewCategory({...newCategory, name_en: e.target.value})}
                  placeholder="Category name in English"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">الوصف</Label>
              <Input
                id="edit-description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                placeholder="وصف الفئة"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-color">اللون</Label>
              <Select 
                value={newCategory.color}
                onValueChange={(value) => setNewCategory({...newCategory, color: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${option.preview}`}></div>
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={newCategory.is_active}
                onCheckedChange={(checked) => setNewCategory({...newCategory, is_active: checked})}
              />
              <Label htmlFor="edit-is_active">فئة نشطة</Label>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="medical-gradient flex-1">
                حفظ التغييرات
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceCategoriesManagement;
