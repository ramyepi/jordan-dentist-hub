import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { 
  Receipt, 
  Plus, 
  ArrowRight,
  Edit,
  Trash2,
  Search,
  Download,
  Upload
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ClinicExpense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  category: string;
  expense_date: string;
  receipt_path: string | null;
  created_at: string;
  updated_at: string;
}

const Expenses = () => {
  const [expenses, setExpenses] = useState<ClinicExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ClinicExpense | null>(null);
  const [newExpenseDate, setNewExpenseDate] = useState<Date | undefined>();
  const navigate = useNavigate();

  // Form states
  const [newExpense, setNewExpense] = useState({
    title: "",
    description: "",
    amount: "",
    category: "general",
    expense_date: "",
    receipt_path: ""
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("clinic_expenses")
        .select("*")
        .order("expense_date", { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في تحميل المصروفات",
        });
      } else {
        setExpenses(data || []);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
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

  const handleAddExpense = async (e: React.FormEvent) => {
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

    if (!newExpenseDate) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "الرجاء تحديد تاريخ المصروف",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("clinic_expenses")
        .insert([{
          ...newExpense,
          amount: parseFloat(newExpense.amount),
          expense_date: format(newExpenseDate, "yyyy-MM-dd"),
          created_by: userId,
          description: newExpense.description || null,
          receipt_path: newExpense.receipt_path || null
        }]);

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في إضافة المصروف",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: "تم إضافة المصروف بنجاح",
        });
        setIsAddDialogOpen(false);
        setNewExpense({
          title: "",
          description: "",
          amount: "",
          category: "general",
          expense_date: "",
          receipt_path: ""
        });
        setNewExpenseDate(undefined);
        fetchExpenses();
      }
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingExpense) return;

    if (!newExpenseDate) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "الرجاء تحديد تاريخ المصروف",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("clinic_expenses")
        .update({
          title: newExpense.title,
          description: newExpense.description || null,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          expense_date: format(newExpenseDate, "yyyy-MM-dd"),
          receipt_path: newExpense.receipt_path || null
        })
        .eq("id", editingExpense.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في تحديث المصروف",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: "تم تحديث المصروف بنجاح",
        });
        setIsEditDialogOpen(false);
        setEditingExpense(null);
        fetchExpenses();
      }
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };

  const handleDeleteExpense = async (expenseId: string, expenseTitle: string) => {
    if (!confirm(`هل أنت متأكد من حذف المصروف "${expenseTitle}"؟`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("clinic_expenses")
        .delete()
        .eq("id", expenseId);

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في حذف المصروف",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: "تم حذف المصروف بنجاح",
        });
        fetchExpenses();
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const openEditDialog = (expense: ClinicExpense) => {
    setEditingExpense(expense);
    setNewExpense({
      title: expense.title,
      description: expense.description || "",
      amount: expense.amount.toString(),
      category: expense.category,
      expense_date: expense.expense_date,
      receipt_path: expense.receipt_path || ""
    });
    setNewExpenseDate(new Date(expense.expense_date));
    setIsEditDialogOpen(true);
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryInArabic = (category: string) => {
    const categories = {
      general: "عام",
      rent: "إيجار",
      salaries: "رواتب",
      utilities: "خدمات",
      supplies: "لوازم",
      marketing: "تسويق",
      maintenance: "صيانة"
    };
    return categories[category as keyof typeof categories] || category;
  };

  const handleDownloadReceipt = (receiptPath: string | null) => {
    if (!receiptPath) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "لا يوجد ملف مرفق",
      });
      return;
    }

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${receiptPath}`;
    window.open(url, '_blank');
  };

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
      });
      return;
    }

    const filePath = `receipts/${userId}/${file.name}`;

    try {
      const { data, error } = await supabase
        .storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في رفع الملف",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: "تم رفع الملف بنجاح",
        });
        setNewExpense({...newExpense, receipt_path: filePath});
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Receipt className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-lg font-medium">جاري تحميل المصروفات...</p>
        </div>
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
              <Button 
                variant="ghost" 
                onClick={() => navigate("/dashboard")}
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                العودة للوحة التحكم
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <Receipt className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">مصروفات العيادة</h1>
                <p className="text-sm text-gray-600">({expenses.length} مصروف)</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Add */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث عن مصروف بالاسم أو الفئة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="medical-gradient gap-2">
                <Plus className="h-4 w-4" />
                إضافة مصروف جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة مصروف جديد</DialogTitle>
                <DialogDescription>
                  أدخل تفاصيل المصروف الجديد
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddExpense} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">عنوان المصروف *</Label>
                    <Input
                      id="title"
                      value={newExpense.title}
                      onChange={(e) => setNewExpense({...newExpense, title: e.target.value})}
                      placeholder="أدخل عنوان المصروف"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">الفئة</Label>
                    <Select 
                      value={newExpense.category}
                      onValueChange={(value) => setNewExpense({...newExpense, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">عام</SelectItem>
                        <SelectItem value="rent">إيجار</SelectItem>
                        <SelectItem value="salaries">رواتب</SelectItem>
                        <SelectItem value="utilities">خدمات</SelectItem>
                        <SelectItem value="supplies">لوازم</SelectItem>
                        <SelectItem value="marketing">تسويق</SelectItem>
                        <SelectItem value="maintenance">صيانة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">المبلغ (د.أ) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expense_date">تاريخ المصروف *</Label>
                    <Calendar
                      mode="single"
                      locale={ar}
                      selected={newExpenseDate}
                      onSelect={setNewExpenseDate}
                      className="rounded-md border"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    placeholder="وصف المصروف"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt">إيصال الدفع</Label>
                  <Input
                    type="file"
                    id="receipt"
                    className="hidden"
                    onChange={handleUploadReceipt}
                  />
                  <Button variant="secondary" asChild>
                    <Label htmlFor="receipt" className="flex items-center gap-2 cursor-pointer">
                      <Upload className="h-4 w-4" />
                      {newExpense.receipt_path ? "تغيير الإيصال" : "إرفاق إيصال"}
                    </Label>
                  </Button>
                  {newExpense.receipt_path && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        تم رفع الإيصال: {newExpense.receipt_path.split('/').pop()}
                      </p>
                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={() => handleDownloadReceipt(newExpense.receipt_path)}
                      >
                        <Download className="h-4 w-4 ml-2" />
                        تحميل
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="medical-gradient flex-1">
                    إضافة المصروف
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

        {/* Expenses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExpenses.map((expense) => (
            <Card key={expense.id} className="shadow-medical hover:shadow-elevated transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{expense.title}</CardTitle>
                  <Badge variant="outline">
                    {getCategoryInArabic(expense.category)}
                  </Badge>
                </div>
                <CardDescription>
                  {format(new Date(expense.expense_date), "dd MMMM yyyy", { locale: ar })}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-blue-600" />
                    <span className="font-bold text-lg">{expense.amount.toFixed(2)} د.أ</span>
                  </div>
                </div>
                
                {expense.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{expense.description}</p>
                )}

                {expense.receipt_path && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      مرفق إيصال
                    </p>
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => handleDownloadReceipt(expense.receipt_path)}
                    >
                      <Download className="h-4 w-4 ml-2" />
                      تحميل
                    </Button>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-1"
                    onClick={() => openEditDialog(expense)}
                  >
                    <Edit className="h-3 w-3" />
                    تعديل
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => handleDeleteExpense(expense.id, expense.title)}
                  >
                    <Trash2 className="h-3 w-3" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        
        {filteredExpenses.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "لم يتم العثور على مصروفات" : "لا توجد مصروفات"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? "جرب تغيير كلمات البحث" : "ابدأ بإضافة أول مصروف"}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="medical-gradient gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة مصروف جديد
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل المصروف</DialogTitle>
            <DialogDescription>
              تحديث تفاصيل المصروف
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditExpense} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">عنوان المصروف *</Label>
                <Input
                  id="edit-title"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({...newExpense, title: e.target.value})}
                  placeholder="أدخل عنوان المصروف"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-category">الفئة</Label>
                <Select 
                  value={newExpense.category}
                  onValueChange={(value) => setNewExpense({...newExpense, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">عام</SelectItem>
                    <SelectItem value="rent">إيجار</SelectItem>
                    <SelectItem value="salaries">رواتب</SelectItem>
                    <SelectItem value="utilities">خدمات</SelectItem>
                    <SelectItem value="supplies">لوازم</SelectItem>
                    <SelectItem value="marketing">تسويق</SelectItem>
                    <SelectItem value="maintenance">صيانة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-amount">المبلغ (د.أ) *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-expense_date">تاريخ المصروف *</Label>
                <Calendar
                  mode="single"
                  locale={ar}
                  selected={newExpenseDate}
                  onSelect={setNewExpenseDate}
                  className="rounded-md border"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">الوصف</Label>
              <Textarea
                id="edit-description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                placeholder="وصف المصروف"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-receipt">إيصال الدفع</Label>
              <Input
                type="file"
                id="edit-receipt"
                className="hidden"
                onChange={handleUploadReceipt}
              />
              <Button variant="secondary" asChild>
                <Label htmlFor="edit-receipt" className="flex items-center gap-2 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  {newExpense.receipt_path ? "تغيير الإيصال" : "إرفاق إيصال"}
                </Label>
              </Button>
              {newExpense.receipt_path && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    تم رفع الإيصال: {newExpense.receipt_path.split('/').pop()}
                  </p>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => handleDownloadReceipt(newExpense.receipt_path)}
                  >
                    <Download className="h-4 w-4 ml-2" />
                    تحميل
                  </Button>
                </div>
              )}
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

export default Expenses;
