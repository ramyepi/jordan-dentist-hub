
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
                  <Badge variant="outline">{service.service_category}</Badge>
                </TableCell>
                <TableCell>{service.quantity}</TableCell>
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
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>إجمالي الخدمات:</strong> {services.length}
            </div>
            <div>
              <strong>إجمالي التكلفة:</strong> {formatCurrency(services.reduce((sum, s) => sum + s.total_price, 0))}
            </div>
            <div>
              <strong>الخدمات المكتملة:</strong> {services.filter(s => s.appointment_status === 'completed').length}
            </div>
            <div>
              <strong>الخدمات المجدولة:</strong> {services.filter(s => s.appointment_status === 'scheduled').length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServicesTable;
