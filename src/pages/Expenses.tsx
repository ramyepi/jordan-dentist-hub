import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { DollarSign, Plus, Calendar, FileText, Receipt, Settings } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { useNavigate } from "react-router-dom";
import ExpenseCategoriesManagement from "@/components/ExpenseCategoriesManagement";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import type { User } from "@supabase/supabase-js";

interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  category: string;
  category_id: string | null;
  expense_date: string;
  created_by: string;
  receipt_path: string | null;
  created_at: string;
  created_by_profile?: {
    full_name: string;
  };
  expense_categories?: {
    name: string;
    color: string;
  };
}

interface ExpenseCategory {
  id: string;
  name: string;
  name_en: string;
  color: string;
  is_active: boolean;
}

const Expenses = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const navigate = useNavigate();

  const { formatDateTime, formatCurrency } = useSystemSettings();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    category_id: "",
    expense_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    checkUserAuth();
    fetchCategories();
    fetchExpenses();
  }, []);

  const checkUserAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Check user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (profile && !['admin', 'doctor', 'receptionist'].includes(profile.role)) {
      toast({
        variant: "destructive",
        title: "غير مخول",
        description: "ليس لديك صلاحية للوصول لهذه الصفحة",
      });
      navigate("/dashboard");
      return;
    }

    setUserRole(profile?.role || "");
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("expense_categories" as any)
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("clinic_expenses")
        .select(`
          *,
          created_by_profile:profiles!clinic_expenses_created_by_fkey(full_name),
          expense_categories(name, color)
        `)
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

  const handleAddExpense = async () => {
    if (!user) return;

    try {
      // Get current user's profile ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "لم يتم العثور على ملف المستخدم",
        });
        return;
      }

      const selectedCategory = categories.find(cat => cat.id === formData.category_id);

      const { error } = await supabase
        .from("clinic_expenses")
        .insert({
          title: formData.title,
          description: formData.description || null,
          amount: parseFloat(formData.amount),
          category: selectedCategory?.name_en || 'other',
          category_id: formData.category_id,
          expense_date: formData.expense_date,
          created_by: profile.id
        });

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في إضافة المصروف",
        });
      } else {
        toast({
          title: "تم الحفظ",
          description: "تم إضافة المصروف بنجاح",
        });
        setIsDialogOpen(false);
        setFormData({
          title: "",
          description: "",
          amount: "",
          category_id: "",
          expense_date: new Date().toISOString().split('T')[0]
        });
        fetchExpenses();
      }
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const getCategoryInfo = (expense: Expense) => {
    if (expense.expense_categories) {
      return {
        name: expense.expense_categories.name,
        color: expense.expense_categories.color
      };
    }
    
    // Fallback للمصاريف القديمة
    const fallbackCategories = {
      medicine: { name: "أدوية", color: "bg-blue-100 text-blue-800" },
      equipment: { name: "معدات", color: "bg-green-100 text-green-800" },
      salary: { name: "رواتب", color: "bg-purple-100 text-purple-800" },
      utilities: { name: "خدمات", color: "bg-yellow-100 text-yellow-800" },
      maintenance: { name: "صيانة", color: "bg-orange-100 text-orange-800" },
      other: { name: "أخرى", color: "bg-gray-100 text-gray-800" }
    };
    
    return fallbackCategories[expense.category as keyof typeof fallbackCategories] || 
           { name: expense.category, color: "bg-gray-100 text-gray-800" };
  };

  const filteredExpenses = expenses.filter(expense => {
    const categoryMatch = selectedCategory === "all" || expense.category_id === selectedCategory;
    const dateMatch = !dateFilter || expense.expense_date.includes(dateFilter);
    return categoryMatch && dateMatch;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
            <p className="text-lg font-medium">جاري تحميل المصروفات...</p>
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
          <Tabs defaultValue="expenses" className="w-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">مصروفات العيادة</h1>
                <p className="text-gray-600">تسجيل ومتابعة جميع مصروفات العيادة</p>
              </div>
              <div className="flex items-center gap-2">
                <TabsList>
                  <TabsTrigger value="expenses">المصروفات</TabsTrigger>
                  {(userRole === 'admin' || userRole === 'receptionist') && (
                    <TabsTrigger value="categories">
                      <Settings className="h-4 w-4 mr-1" />
                      إدارة الفئات
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
            </div>

            <TabsContent value="expenses">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
                    <p className="text-xs text-muted-foreground">
                      {filteredExpenses.length} مصروف
                    </p>
                  </CardContent>
                </Card>

                {categories.slice(0, 3).map((category) => {
                  const categoryTotal = filteredExpenses
                    .filter(expense => expense.category_id === category.id)
                    .reduce((sum, expense) => sum + expense.amount, 0);
                  
                  return (
                    <Card key={category.id}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(categoryTotal)}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Add Expense Button */}
              {(userRole === 'admin' || userRole === 'receptionist') && (
                <div className="flex justify-end mb-6">
                  <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة مصروف
                  </Button>
                </div>
              )}

              
              {/* Filters */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>الفلترة والبحث</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 flex-wrap">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="فلترة حسب الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الفئات</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Input
                      type="month"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-[200px]"
                      placeholder="فلترة حسب الشهر"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Expenses List */}
              <div className="space-y-4">
                {filteredExpenses.map((expense) => {
                  const categoryInfo = getCategoryInfo(expense);
                  
                  return (
                    <Card key={expense.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{expense.title}</h3>
                              <Badge className={categoryInfo.color}>
                                {categoryInfo.name}
                              </Badge>
                            </div>
                            
                            {expense.description && (
                              <p className="text-gray-600 mb-2">{expense.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDateTime(new Date(expense.expense_date), false)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                <span>بواسطة: {expense.created_by_profile?.full_name}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-left">
                            <div className="text-2xl font-bold text-red-600">
                              {formatCurrency(expense.amount)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredExpenses.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">لا توجد مصروفات</p>
                    <p className="text-gray-600">لم يتم العثور على مصروفات تطابق الفلترة المحددة</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {(userRole === 'admin' || userRole === 'receptionist') && (
              <TabsContent value="categories">
                <ExpenseCategoriesManagement />
              </TabsContent>
            )}
          </Tabs>

          {/* Add Expense Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة مصروف جديد</DialogTitle>
                <DialogDescription>
                  أدخل تفاصيل المصروف الجديد
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان المصروف</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="أدخل عنوان المصروف"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category_id">الفئة</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر فئة المصروف" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">المبلغ</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expense_date">تاريخ المصروف</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">الوصف (اختياري)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="تفاصيل إضافية عن المصروف"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleAddExpense} disabled={!formData.title || !formData.amount || !formData.category_id}>
                  إضافة المصروف
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
