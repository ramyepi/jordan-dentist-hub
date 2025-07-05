import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Calendar, PieChart } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  monthlyRevenue: Array<{month: string, revenue: number}>;
  monthlyExpenses: Array<{month: string, expenses: number}>;
  expensesByCategory: Array<{category: string, amount: number}>;
  revenueByPaymentMethod: Array<{method: string, amount: number}>;
}

const FinancialAnalytics = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    monthlyRevenue: [],
    monthlyExpenses: [],
    expensesByCategory: [],
    revenueByPaymentMethod: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkUserAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchFinancialData();
    }
  }, [user, selectedPeriod]);

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

  const fetchFinancialData = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case "1month":
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case "3months":
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case "6months":
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case "1year":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch revenue data
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("paid_amount, payment_date, payment_method")
        .gte("payment_date", startDateStr)
        .lte("payment_date", endDateStr)
        .eq("status", "paid");

      if (paymentsError) throw paymentsError;

      // Fetch expenses data
      const { data: expensesData, error: expensesError } = await supabase
        .from("clinic_expenses")
        .select("amount, expense_date, category")
        .gte("expense_date", startDateStr)
        .lte("expense_date", endDateStr);

      if (expensesError) throw expensesError;

      // Calculate totals
      const totalRevenue = paymentsData?.reduce((sum, payment) => sum + payment.paid_amount, 0) || 0;
      const totalExpenses = expensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

      // Group by month for charts
      const monthlyRevenue = groupRevenueByMonth(paymentsData || [], 'payment_date', 'paid_amount');
      const monthlyExpenses = groupExpensesByMonth(expensesData || [], 'expense_date', 'amount');

      // Group expenses by category
      const expensesByCategory = groupByCategory(expensesData || []);

      // Group revenue by payment method
      const revenueByPaymentMethod = groupByPaymentMethod(paymentsData || []);

      setFinancialData({
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        monthlyRevenue,
        monthlyExpenses,
        expensesByCategory,
        revenueByPaymentMethod
      });

    } catch (error) {
      console.error("Error fetching financial data:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تحميل البيانات المالية",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const groupRevenueByMonth = (data: any[], dateField: string, amountField: string) => {
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item[dateField]);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = 0;
      }
      acc[monthKey] += item[amountField];
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([month, amount]) => ({
      month,
      revenue: amount as number
    }));
  };

  const groupExpensesByMonth = (data: any[], dateField: string, amountField: string) => {
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item[dateField]);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = 0;
      }
      acc[monthKey] += item[amountField];
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([month, amount]) => ({
      month,
      expenses: amount as number
    }));
  };

  const groupByCategory = (expensesData: any[]) => {
    const categoryLabels: Record<string, string> = {
      medicine: "أدوية",
      equipment: "معدات",
      salary: "رواتب",
      utilities: "خدمات",
      maintenance: "صيانة",
      other: "أخرى"
    };

    const grouped = expensesData.reduce((acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += expense.amount;
      return acc;
    }, {});

    return Object.entries(grouped).map(([category, amount]) => ({
      category: categoryLabels[category] || category,
      amount: amount as number
    }));
  };

  const groupByPaymentMethod = (paymentsData: any[]) => {
    const methodLabels: Record<string, string> = {
      cash: "نقد",
      cliq: "كليك",
      installment: "تقسيط"
    };

    const grouped = paymentsData.reduce((acc, payment) => {
      const method = payment.payment_method;
      if (!acc[method]) {
        acc[method] = 0;
      }
      acc[method] += payment.paid_amount;
      return acc;
    }, {});

    return Object.entries(grouped).map(([method, amount]) => ({
      method: methodLabels[method] || method,
      amount: amount as number
    }));
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} د.أ`;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
            <p className="text-lg font-medium">جاري تحميل التحليلات المالية...</p>
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">التحليلات المالية</h1>
              <p className="text-gray-600">تقارير وتحليلات شاملة للوضع المالي للعيادة</p>
            </div>
            
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="اختر الفترة الزمنية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">آخر شهر</SelectItem>
                <SelectItem value="3months">آخر 3 أشهر</SelectItem>
                <SelectItem value="6months">آخر 6 أشهر</SelectItem>
                <SelectItem value="1year">آخر سنة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800">إجمالي الإيرادات</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(financialData.totalRevenue)}
                </div>
                <p className="text-xs text-green-700">
                  من المدفوعات المحصلة
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-800">إجمالي المصروفات</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">
                  {formatCurrency(financialData.totalExpenses)}
                </div>
                <p className="text-xs text-red-700">
                  المصروفات المسجلة
                </p>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-r ${financialData.netProfit >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${financialData.netProfit >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                  صافي الربح
                </CardTitle>
                <DollarSign className={`h-4 w-4 ${financialData.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${financialData.netProfit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                  {formatCurrency(financialData.netProfit)}
                </div>
                <p className={`text-xs ${financialData.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  {financialData.netProfit >= 0 ? 'ربح' : 'خسارة'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Revenue vs Expenses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  الإيرادات والمصروفات الشهرية
                </CardTitle>
                <CardDescription>مقارنة الإيرادات والمصروفات على مدار الفترة المحددة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialData.monthlyRevenue.map((item, index) => {
                    const expenseForMonth = financialData.monthlyExpenses.find(exp => exp.month === item.month);
                    const monthlyProfit = item.revenue - (expenseForMonth?.expenses || 0);
                    
                    return (
                      <div key={item.month} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{item.month}</span>
                          <span className={`text-sm font-bold ${monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(monthlyProfit)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>الإيرادات: {formatCurrency(item.revenue)}</span>
                            <span>المصروفات: {formatCurrency(expenseForMonth?.expenses || 0)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ 
                                width: `${Math.min((item.revenue / Math.max(item.revenue, expenseForMonth?.expenses || 0)) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Expenses by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  المصروفات حسب الفئة
                </CardTitle>
                <CardDescription>توزيع المصروفات على الفئات المختلفة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {financialData.expensesByCategory.map((item, index) => {
                    const percentage = financialData.totalExpenses > 0 
                      ? (item.amount / financialData.totalExpenses * 100) 
                      : 0;
                    
                    return (
                      <div key={item.category} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{item.category}</span>
                          <span className="text-sm text-gray-600">
                            {formatCurrency(item.amount)} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                الإيرادات حسب طريقة الدفع
              </CardTitle>
              <CardDescription>توزيع الإيرادات على طرق الدفع المختلفة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {financialData.revenueByPaymentMethod.map((item, index) => {
                  const percentage = financialData.totalRevenue > 0 
                    ? (item.amount / financialData.totalRevenue * 100) 
                    : 0;
                  
                  return (
                    <div key={item.method} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(item.amount)}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{item.method}</div>
                      <div className="text-xs text-gray-500">
                        {percentage.toFixed(1)}% من الإجمالي
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalytics;