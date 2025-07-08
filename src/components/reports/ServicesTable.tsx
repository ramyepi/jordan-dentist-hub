
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface DetailedService {
  appointment_id: string;
  scheduled_date: string;
  scheduled_time: string;
  appointment_status: string;
  service_name: string;
  service_description: string | null;
  service_category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  service_notes: string | null;
  appointment_service_notes: string | null;
  discount_percentage?: number;
  discount_amount?: number;
  final_total?: number;
}

interface ServicesTableProps {
  services: DetailedService[];
  patientName: string;
  isPrint?: boolean;
}

const ServicesTable: React.FC<ServicesTableProps> = ({ services, patientName, isPrint = false }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ar });
    } catch {
      return "غير صحيح";
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} د.أ`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "مكتمل", variant: "default" as const },
      scheduled: { label: "مجدول", variant: "secondary" as const },
      cancelled: { label: "ملغي", variant: "destructive" as const },
      in_progress: { label: "جاري", variant: "outline" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    // ألوان مختلفة للفئات
    const categoryColors = {
      'general': 'bg-blue-100 text-blue-800',
      'dental': 'bg-green-100 text-green-800',
      'surgery': 'bg-red-100 text-red-800',
      'consultation': 'bg-purple-100 text-purple-800',
      'treatment': 'bg-orange-100 text-orange-800',
    };
    
    const colorClass = categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800';
    
    return (
      <Badge className={colorClass}>
        {category}
      </Badge>
    );
  };

  if (services.length === 0) {
    return (
      <Card className={isPrint ? "print:shadow-none" : ""}>
        <CardHeader>
          <CardTitle className="text-lg">الخدمات العلاجية</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">لا توجد خدمات علاجية مسجلة</p>
        </CardContent>
      </Card>
    );
  }

  // حساب الملخص المالي
  const subtotal = services.reduce((sum, s) => sum + s.total_price, 0);
  const totalDiscount = services.reduce((sum, s) => sum + (s.discount_amount || 0), 0);
  const finalTotal = services.reduce((sum, s) => sum + (s.final_total || s.total_price), 0);

  return (
    <Card className={isPrint ? "print:shadow-none print:break-inside-avoid" : ""}>
      <CardHeader>
        <CardTitle className="text-lg">الخدمات العلاجية التفصيلية</CardTitle>
        <p className="text-sm text-gray-600">إجمالي {services.length} خدمة</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">الخدمة</TableHead>
              <TableHead className="text-right">الفئة</TableHead>
              <TableHead className="text-right">الكمية</TableHead>
              <TableHead className="text-right">السعر</TableHead>
              <TableHead className="text-right">الإجمالي</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              {!isPrint && <TableHead className="text-right">ملاحظات</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service, index) => (
              <TableRow key={`${service.appointment_id}-${index}`}>
                <TableCell className="font-medium">
                  <div className="text-sm">
                    <div>{formatDate(service.scheduled_date)}</div>
                    <div className="text-gray-500">{service.scheduled_time}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{service.service_name}</div>
                    {service.service_description && (
                      <div className="text-sm text-gray-500">{service.service_description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getCategoryBadge(service.service_category)}
                </TableCell>
                <TableCell className="text-center">{service.quantity}</TableCell>
                <TableCell>{formatCurrency(service.unit_price)}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(service.total_price)}</TableCell>
                <TableCell>{getStatusBadge(service.appointment_status)}</TableCell>
                {!isPrint && (
                  <TableCell>
                    <div className="text-sm">
                      {service.service_notes && <div>خدمة: {service.service_notes}</div>}
                      {service.appointment_service_notes && <div>موعد: {service.appointment_service_notes}</div>}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* الملخص المالي المفصل */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <h4 className="font-medium text-lg">الملخص المالي للخدمات</h4>
          
          {/* الملخص الأساسي */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">{formatCurrency(subtotal)}</div>
              <div className="text-sm text-blue-800">المجموع الفرعي</div>
            </div>
            {totalDiscount > 0 && (
              <div className="text-center p-3 bg-yellow-50 rounded">
                <div className="text-lg font-bold text-yellow-600">-{formatCurrency(totalDiscount)}</div>
                <div className="text-sm text-yellow-800">إجمالي الخصومات</div>
              </div>
            )}
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-600">{formatCurrency(finalTotal)}</div>
              <div className="text-sm text-green-800">المبلغ النهائي</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-lg font-bold text-gray-800">{services.length}</div>
              <div className="text-sm text-gray-600">إجمالي الخدمات</div>
            </div>
          </div>

          {/* إحصائيات الخدمات */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-xl font-bold text-green-600">{services.filter(s => s.appointment_status === 'completed').length}</div>
              <div className="text-gray-600">خدمات مكتملة</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-xl font-bold text-orange-600">{services.filter(s => s.appointment_status === 'scheduled').length}</div>
              <div className="text-gray-600">خدمات مجدولة</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-xl font-bold text-blue-600">{services.filter(s => s.appointment_status === 'in_progress').length}</div>
              <div className="text-gray-600">خدمات جارية</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-xl font-bold text-red-600">{services.filter(s => s.appointment_status === 'cancelled').length}</div>
              <div className="text-gray-600">خدمات ملغية</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServicesTable;
