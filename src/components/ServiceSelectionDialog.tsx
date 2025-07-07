
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Search, Stethoscope, Clock, Plus, Minus } from "lucide-react";

interface TreatmentService {
  id: string;
  name: string;
  price: number;
  category: string;
  duration_minutes: number | null;
  description: string | null;
}

interface SelectedService {
  service: TreatmentService;
  quantity: number;
}

interface ServiceSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onServicesSelected: (services: SelectedService[]) => void;
}

const ServiceSelectionDialog = ({
  isOpen,
  onClose,
  onServicesSelected
}: ServiceSelectionDialogProps) => {
  const [services, setServices] = useState<TreatmentService[]>([]);
  const [filteredServices, setFilteredServices] = useState<TreatmentService[]>([]);
  const [selectedServices, setSelectedServices] = useState<Map<string, number>>(new Map());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  const categories = ["all", "general", "consultation", "treatment", "diagnostic"];
  const categoryNames = {
    all: "جميع الفئات",
    general: "عام",
    consultation: "استشارة",
    treatment: "علاج",
    diagnostic: "تشخيص"
  };

  useEffect(() => {
    if (isOpen) {
      fetchTreatmentServices();
    }
  }, [isOpen]);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, selectedCategory]);

  const fetchTreatmentServices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("treatment_services")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching treatment services:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تحميل الخدمات العلاجية",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = services;

    // فلترة حسب الفئة
    if (selectedCategory !== "all") {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    // فلترة حسب البحث
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchLower) ||
        service.description?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredServices(filtered);
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    const newSelected = new Map(selectedServices);
    if (checked) {
      newSelected.set(serviceId, 1);
    } else {
      newSelected.delete(serviceId);
    }
    setSelectedServices(newSelected);
  };

  const handleQuantityChange = (serviceId: string, quantity: number) => {
    if (quantity < 1) return;
    const newSelected = new Map(selectedServices);
    newSelected.set(serviceId, quantity);
    setSelectedServices(newSelected);
  };

  const handleConfirmSelection = () => {
    const servicesWithQuantity: SelectedService[] = [];
    
    selectedServices.forEach((quantity, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        servicesWithQuantity.push({ service, quantity });
      }
    });

    if (servicesWithQuantity.length === 0) {
      toast({
        variant: "destructive",
        title: "تنبيه",
        description: "يرجى اختيار خدمة واحدة على الأقل",
      });
      return;
    }

    onServicesSelected(servicesWithQuantity);
    handleClose();
  };

  const handleClose = () => {
    setSelectedServices(new Map());
    setSearchTerm("");
    setSelectedCategory("all");
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} د.أ`;
  };

  const calculateTotal = () => {
    let total = 0;
    selectedServices.forEach((quantity, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        total += service.price * quantity;
      }
    });
    return total;
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
              <p className="text-lg font-medium">جاري تحميل الخدمات العلاجية...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">اختيار الخدمات العلاجية</DialogTitle>
          <DialogDescription>
            اختر الخدمات التي تريد إضافتها للموعد
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* البحث والفلترة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">البحث في الخدمات</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="ابحث عن خدمة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>الفئة</Label>
              <div className="flex gap-2 flex-wrap mt-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                  >
                    {categoryNames[category as keyof typeof categoryNames]}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* قائمة الخدمات */}
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredServices.length === 0 ? (
                <div className="text-center py-8">
                  <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">لا توجد خدمات متاحة</p>
                </div>
              ) : (
                filteredServices.map((service) => {
                  const isSelected = selectedServices.has(service.id);
                  const quantity = selectedServices.get(service.id) || 1;

                  return (
                    <Card key={service.id} className={`cursor-pointer transition-colors ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => 
                                handleServiceToggle(service.id, checked as boolean)
                              }
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{service.name}</h4>
                                <Badge variant="outline">{service.category}</Badge>
                                {service.duration_minutes && (
                                  <Badge variant="secondary" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    {service.duration_minutes} دقيقة
                                  </Badge>
                                )}
                              </div>
                              {service.description && (
                                <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                              )}
                              <p className="font-bold text-green-600">{formatCurrency(service.price)}</p>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleQuantityChange(service.id, quantity - 1)}
                                variant="outline"
                                size="sm"
                                disabled={quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{quantity}</span>
                              <Button
                                onClick={() => handleQuantityChange(service.id, quantity + 1)}
                                variant="outline"
                                size="sm"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <div className="ml-2 text-sm">
                                <span className="text-gray-600">الإجمالي: </span>
                                <span className="font-bold text-green-600">
                                  {formatCurrency(service.price * quantity)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* ملخص الاختيار */}
          {selectedServices.size > 0 && (
            <Card className="bg-gradient-to-r from-green-50 to-green-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">تم اختيار {selectedServices.size} خدمة</p>
                    <p className="text-sm text-gray-600">
                      إجمالي الكمية: {Array.from(selectedServices.values()).reduce((sum, qty) => sum + qty, 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      المجموع: {formatCurrency(calculateTotal())}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline">
            إلغاء
          </Button>
          <Button 
            onClick={handleConfirmSelection}
            disabled={selectedServices.size === 0}
          >
            إضافة الخدمات المختارة ({selectedServices.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceSelectionDialog;
