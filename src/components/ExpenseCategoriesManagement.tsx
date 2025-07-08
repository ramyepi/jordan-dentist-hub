import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Settings, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface ExpenseCategory {
  id: string;
  name: string;
  name_en: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
}

interface ExpenseCategoriesManagementProps {
  onCategoriesUpdate?: () => void;
}

const ExpenseCategoriesManagement = ({ onCategoriesUpdate }: ExpenseCategoriesManagementProps) => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    description: '',
    color: 'bg-gray-100 text-gray-800'
  });

  const colorOptions = [
    { value: 'bg-blue-100 text-blue-800', label: 'أزرق', preview: 'bg-blue-100' },
    { value: 'bg-green-100 text-green-800', label: 'أخضر', preview: 'bg-green-100' },
    { value: 'bg-purple-100 text-purple-800', label: 'بنفسجي', preview: 'bg-purple-100' },
    { value: 'bg-yellow-100 text-yellow-800', label: 'أصفر', preview: 'bg-yellow-100' },
    { value: 'bg-orange-100 text-orange-800', label: 'برتقالي', preview: 'bg-orange-100' },
    { value: 'bg-red-100 text-red-800', label: 'أحمر', preview: 'bg-red-100' },
    { value: 'bg-gray-100 text-gray-800', label: 'رمادي', preview: 'bg-gray-100' }
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ في تحميل الفئات',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.name_en) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const categoryData = {
        name: formData.name,
        name_en: formData.name_en,
        description: formData.description || null,
        color: formData.color,
        created_by: profile.id
      };

      let error;
      if (editingCategory) {
        const result = await supabase
          .from('expense_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('expense_categories')
          .insert([categoryData]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'تم الحفظ',
        description: editingCategory ? 'تم تحديث الفئة بنجاح' : 'تم إضافة الفئة بنجاح',
      });

      setIsDialogOpen(false);
      resetForm();
      fetchCategories();
      onCategoriesUpdate?.(); // إشعار الصفحة الرئيسية بالتحديت
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ في حفظ الفئة',
      });
    }
  };

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      name_en: category.name_en,
      description: category.description || '',
      color: category.color
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (category: ExpenseCategory) => {
    try {
      // التحقق من وجود مصاريف مرتبطة بهذه الفئة
      const { data: relatedExpenses, error: checkError } = await supabase
        .from('clinic_expenses')
        .select('id')
        .eq('category_id', category.id)
        .limit(1);

      if (checkError) throw checkError;

      if (relatedExpenses && relatedExpenses.length > 0) {
        toast({
          variant: 'destructive',
          title: 'لا يمكن حذف الفئة',
          description: 'هناك مصاريف مرتبطة بهذه الفئة. يجب حذف المصاريف أولاً أو تغيير فئتها.',
        });
        return;
      }

      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      toast({
        title: 'تم الحذف',
        description: 'تم حذف الفئة بنجاح',
      });

      fetchCategories();
      onCategoriesUpdate?.();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ في حذف الفئة',
      });
    }
  };

  const handleToggleActive = async (category: ExpenseCategory) => {
    try {
      const { error } = await supabase
        .from('expense_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;
      
      toast({
        title: 'تم التحديث',
        description: `تم ${category.is_active ? 'إلغاء تفعيل' : 'تفعيل'} الفئة`,
      });
      
      fetchCategories();
      onCategoriesUpdate?.(); // إشعار الصفحة الرئيسية بالتحديث
    } catch (error) {
      console.error('Error toggling category status:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ في تحديث حالة الفئة',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_en: '',
      description: '',
      color: 'bg-gray-100 text-gray-800'
    });
    setEditingCategory(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Settings className="h-8 w-8 mx-auto mb-4 animate-spin" />
          <p>جاري تحميل الفئات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">إدارة فئات المصاريف</h2>
          <p className="text-gray-600">إضافة وتعديل فئات المصاريف</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          إضافة فئة جديدة
        </Button>
      </div>

      <div className="grid gap-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Badge className={category.color}>
                  {category.name}
                </Badge>
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-gray-600">{category.name_en}</p>
                  {category.description && (
                    <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`active-${category.id}`} className="text-sm">
                    {category.is_active ? 'مفعل' : 'معطل'}
                  </Label>
                  <Switch
                    id={`active-${category.id}`}
                    checked={category.is_active}
                    onCheckedChange={() => handleToggleActive(category)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(category)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                      <AlertDialogDescription>
                        هل أنت متأكد من حذف فئة "{category.name}"؟ 
                        هذا الإجراء لا يمكن التراجع عنه.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(category)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        حذف
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'تعديل فئة المصروف' : 'إضافة فئة مصروف جديدة'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? 'تعديل بيانات فئة المصروف' : 'أدخل بيانات فئة المصروف الجديدة'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم بالعربية *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: أدوية"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name_en">الاسم بالإنجليزية *</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="Example: medicine"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف الفئة..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>اللون</Label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      formData.color === color.value 
                        ? 'border-blue-500' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                  >
                    <div className={`w-full h-8 rounded ${color.preview} mb-1`}></div>
                    <span className="text-xs">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>
              {editingCategory ? 'تحديث' : 'إضافة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseCategoriesManagement;
