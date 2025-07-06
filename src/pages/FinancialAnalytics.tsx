
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Users,
  CreditCard,
  AlertCircle,
  Download
} from "lucide-react";

interface FinancialData {
  monthlyRevenue: Array<{ month: string; revenue: number; expenses: number; }>;
  paymentMethods: Array<{ method: string; amount: number; count: number; }>;
  serviceRevenue: Array<{ service: string; revenue: number; appointments: number; }>;
  totalStats: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    totalAppointments: number;
    averagePerAppointment: number;
    pendingAmount: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const FinancialAnalytics = () => {
  const [financialData, setFinancialData] = useState<FinancialData>({
    monthlyRevenue: [],
    paymentMethods: [],
    serviceRevenue: [],
    totalStats: {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      totalAppointments: 0,
      averagePerAppointment: 0,
      pendingAmount: 0,
    }
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, [selectedYear]);

  const fetchFinancialData = async () => {
    try {
      setIsLoading(true);

      // Fetch payments data
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          paid_amount,
          payment_method,
          status,
          payment_date,
          appointment:appointments!payments_appointment_id_fkey(
            appointment_type,
            scheduled_date
          )
        `)
        .gte('payment_date', `${selectedYear}-01-01`)
        .lte('payment_date', `${selectedYear}-12-31`);

      if (paymentsError) throw paymentsError;

      // Fetch expenses data
      const { data: expenses, error: expensesError } = await supabase
        .from("clinic_expenses")
        .select("id, amount, expense_date, category")
        .gte('expense_date', `${selectedYear}-01-01`)
        .lte('expense_date', `${selectedYear}-12-31`);

      if (expensesError) throw expensesError;

      // Process monthly revenue data
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = new Date(parseInt(selectedYear), i).toLocaleDateString('ar-JO', { month: 'long' });
        const monthPayments = payments?.filter(p => {
          if (!p.payment_date) return false;
          return new Date(p.payment_date).getMonth() === i;
        }) || [];
        
        const monthExpenses = expenses?.filter(e => {
          return new Date(e.expense_date).getMonth() === i;
        }) || [];

        const revenue = monthPayments.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
        const expenseAmount = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

        return {
          month,
          revenue,
          expenses: expenseAmount,
        };
      });

      // Process payment methods data
      const paymentMethodsMap = new Map();
      payments?.forEach(payment => {
        if (payment.payment_method && payment.paid_amount > 0) {
          const method = payment.payment_method === 'cash' ? 'نقدي' : 
                        payment.payment_method === 'cliq' ? 'كليك' : 'أقساط';
          if (!paymentMethodsMap.has(method)) {
            paymentMethodsMap.set(method, { amount: 0, count: 0 });
          }
          const current = paymentMethodsMap.get(method);
          current.amount += payment.paid_amount;
          current.count += 1;
        }
      });

      const paymentMethodsData = Array.from(paymentMethodsMap.entries()).map(([method, data]) => ({
        method,
        amount: data.amount,
        count: data.count,
      }));

      // Calculate total stats
      const totalRevenue = payments?.reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const totalAppointments = payments?.length || 0;
      const averagePerAppointment = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;
      const pendingAmount = payments?.filter(p => p.status === 'pending' || p.status === 'partial')
        .reduce((sum, p) => sum + ((p.amount || 0) - (p.paid_amount || 0)), 0) || 0;

      setFinancialData({
        monthlyRevenue: monthlyData,
        paymentMethods: paymentMethodsData,
        serviceRevenue: [], // Can be expanded with service data
        totalStats: {
          totalRevenue,
          totalExpenses,
          netProfit,
          totalAppointments,
          averagePerAppointment,
          pendingAmount,
        }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-blue-600" />
          </div>
          <p className="text-lg font-medium">جاري تحميل التحليلات المالية...</p>
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
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">التحليلات المالية</h1>
                <p className="text-sm text-gray-600">تحليل شامل للوضع المالي للعيادة</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                تصدير التقرير
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-medical">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{financialData.totalStats.totalRevenue.toFixed(2)} د.أ</div>
              <p className="text-xs text-muted-foreground">
                من {financialData.totalStats.totalAppointments} موعد
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-medical">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
              <CreditCard className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{financialData.totalStats.totalExpenses.toFixed(2)} د.أ</div>
              <p className="text-xs text-muted-foreground">مصروفات العيادة</p>
            </CardContent>
          </Card>

          <Card className="shadow-medical">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${financialData.totalStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {financialData.totalStats.netProfit.toFixed(2)} د.أ
              </div>
              <p className="text-xs text-muted-foreground">
                هامش الربح: {financialData.totalStats.totalRevenue > 0 ? 
                  ((financialData.totalStats.netProfit / financialData.totalStats.totalRevenue) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-medical">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط الموعد</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{financialData.totalStats.averagePerAppointment.toFixed(2)} د.أ</div>
              <p className="text-xs text-muted-foreground">متوسط قيمة الموعد</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Revenue Chart */}
          <Card className="shadow-medical">
            <CardHeader>
              <CardTitle>الإيرادات والمصروفات الشهرية</CardTitle>
              <CardDescription>مقارنة الإيرادات والمصروفات على مدار العام</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={financialData.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} د.أ`, '']} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10B981" name="الإيرادات" />
                  <Bar dataKey="expenses" fill="#EF4444" name="المصروفات" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Methods Chart */}
          <Card className="shadow-medical">
            <CardHeader>
              <CardTitle>طرق الدفع</CardTitle>
              <CardDescription>توزيع المدفوعات حسب طريقة الدفع</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={financialData.paymentMethods}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ method, percent }) => `${method} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {financialData.paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} د.أ`, 'المبلغ']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Methods Details */}
          <Card className="shadow-medical">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                تفصيل طرق الدفع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financialData.paymentMethods.map((method, index) => (
                  <div key={method.method} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <div>
                        <p className="font-medium">{method.method}</p>
                        <p className="text-sm text-gray-600">{method.count} معاملة</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{method.amount.toFixed(2)} د.أ</p>
                      <p className="text-sm text-gray-600">
                        {financialData.totalStats.totalRevenue > 0 ? 
                          ((method.amount / financialData.totalStats.totalRevenue) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Financial Alerts */}
          <Card className="shadow-medical border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                التنبيهات المالية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {financialData.totalStats.pendingAmount > 0 && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">مبالغ معلقة</p>
                      <p className="text-xs text-gray-600">مدفوعات غير مكتملة</p>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {financialData.totalStats.pendingAmount.toFixed(2)} د.أ
                    </Badge>
                  </div>
                </div>
              )}

              {financialData.totalStats.netProfit < 0 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">خسارة مالية</p>
                      <p className="text-xs text-gray-600">المصروفات أكبر من الإيرادات</p>
                    </div>
                    <Badge variant="secondary" className="bg-red-100 text-red-800">تحذير</Badge>
                  </div>
                </div>
              )}

              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">إجمالي المعاملات</p>
                    <p className="text-xs text-gray-600">عدد المواعيد المحصلة</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {financialData.totalStats.totalAppointments}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FinancialAnalytics;
