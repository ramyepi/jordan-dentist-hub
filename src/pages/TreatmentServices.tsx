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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  Stethoscope, 
  Plus, 
  ArrowRight,
  Edit,
  Clock,
  DollarSign,
  Search,
  Trash2,
  Tag
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ServiceCategoriesManagement from "@/components/ServiceCategoriesManagement";

interface TreatmentService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number | null;
  category: string;
  category_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  name_en: string;
  description: string | null;
  color: string;
  is_active: boolean;
}

const TreatmentServices = () => {
  const [services, setServices] = useState<TreatmentService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<TreatmentService | null>(null);
  const navigate = useNavigate();

  // Form states
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: "",
    category_id: "",
    is_active: true
  });

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("treatment_services")
        .select(`
          *,
          service_categories (
            id,
            name,
            color
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في تحميل الخدمات العلاجية",
        });
      } else {
        setServices(data || []);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Error fetching categories:", error);
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("treatment_services")
        .insert([{
          ...newService,
          price: parseFloat(newService.price),
          duration_minutes: newService.duration_minutes ? parseInt(newService.duration_minutes) : null,
          description: newService.description || null,
          category_id: newService.category_id || null,
          // Keep the old category field for backward compatibility
          category: categories.find(c => c.id === newService.category_id)?.name_en || 'general'
        }]);

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في إضافة الخدمة",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: "تم إضافة الخدمة العلاجية بنجاح",
        });
        setIsAddDialogOpen(false);
        setNewService({
          name: "",
          description: "",
          price: "",
          duration_minutes: "",
          category_id: "",
          is_active: true
        });
        fetchServices();
      }
    } catch (error) {
      console.error("Error adding service:", error);
    }
  };

  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingService) return;

    try {
      const { error } = await supabase
        .from("treatment_services")
        .update({
          name: newService.name,
          description: newService.description || null,
          price: parseFloat(newService.price),
          duration_minutes: newService.duration_minutes ? parseInt(newService.duration_minutes) : null,
          category_id: newService.category_id || null,
          is_active: newService.is_active,
          category: categories.find(c => c.id === newService.category_id)?.name_en || 'general'
        })
        .eq("id", editingService.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في تحديث الخدمة",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: "تم تحديث الخدمة العلاجية بنجاح",
        });
        setIsEditDialogOpen(false);
        setEditingService(null);
        fetchServices();
      }
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الخدمة "${serviceName}"؟`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("treatment_services")
        .delete()
        .eq("id", serviceId);

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ في حذف الخدمة",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: "تم حذف الخدمة العلاجية بنجاح",
        });
        fetchServices();
      }
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const openEditDialog = (service: TreatmentService) => {
    setEditingService(service);
    setNewService({
      name: service.name,
      description: service.description || "",
      price: service.price.toString(),
      duration_minutes: service.duration_minutes?.toString() || "",
      category_id: service.category_id || "",
      is_active: service.is_active
    });
    setIsEditDialogOpen(true);
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.category && service.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCategoryInfo = (service: TreatmentService) => {
    if (service.category_id) {
      const category = categories.find(c => c.id === service.category_id);
      if (category) {
        return { name: category.name, color: category.color };
      }
    }
    // Fallback for old services without category_id
    const categoryNames = {
      consultation: "استشارة",
      treatment: "علاج",
      diagnostic: "تشخيص",
      laboratory: "مختبر",
      radiology: "أشعة",
      physiotherapy: "علاج طبيعي",
      injection: "حقن",
      general: "عام"
    };
    return { 
      name: categoryNames[service.category as keyof typeof categoryNames] || service.category,
      color: "bg-gray-100 text-gray-800"
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Stethoscope className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-lg font-medium">جاري تحميل الخدمات العلاجية...</p>
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
              <Stethoscope className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">الخدمات العلاجية</h1>
                <p className="text-sm text-gray-600">({services.length} خدمة)</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="services" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              الخدمات العلاجية
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tag className="h-4 w-4" />
              إدارة الفئات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-6">
            {/* Search and Add */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث عن خدمة بالاسم أو الفئة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="medical-gradient gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة خدمة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>إضافة خدمة علاجية جديدة</DialogTitle>
                    <DialogDescription>
                      أدخل تفاصيل الخدمة العلاجية الجديدة
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleAddService} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">اسم الخدمة *</Label>
                        <Input
                          id="name"
                          value={newService.name}
                          onChange={(e) => setNewService({...newService, name: e.target.value})}
                          placeholder="أدخل اسم الخدمة"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category">الفئة</Label>
                        <Select 
                          value={newService.category_id}
                          onValueChange={(value) => setNewService({...newService, category_id: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الفئة" />
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
                        <Label htmlFor="price">السعر (د.أ) *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={newService.price}
                          onChange={(e) => setNewService({...newService, price: e.target.value})}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="duration">المدة (دقيقة)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          value={newService.duration_minutes}
                          onChange={(e) => setNewService({...newService, duration_minutes: e.target.value})}
                          placeholder="30"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">الوصف</Label>
                      <Input
                        id="description"
                        value={newService.description}
                        onChange={(e) => setNewService({...newService, description: e.target.value})}
                        placeholder="وصف الخدمة العلاجية"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={newService.is_active}
                        onCheckedChange={(checked) => setNewService({...newService, is_active: checked})}
                      />
                      <Label htmlFor="is_active">خدمة نشطة</Label>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="medical-gradient flex-1">
                        إضافة الخدمة
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

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => {
                const categoryInfo = getCategoryInfo(service);
                return (
                  <Card key={service.id} className="shadow-medical hover:shadow-elevated transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={categoryInfo.color} variant="outline">
                            {categoryInfo.name}
                          </Badge>
                          <Badge variant={service.is_active ? "default" : "secondary"} className="text-xs">
                            {service.is_active ? "نشط" : "غير نشط"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-bold text-lg">{service.price.toFixed(2)} د.أ</span>
                        </div>
                        
                        {service.duration_minutes && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{service.duration_minutes} د</span>
                          </div>
                        )}
                      </div>
                      
                      {service.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 gap-1"
                          onClick={() => openEditDialog(service)}
                        >
                          <Edit className="h-3 w-3" />
                          تعديل
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleDeleteService(service.id, service.name)}
                        >
                          <Trash2 className="h-3 w-3" />
                          حذف
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredServices.length === 0 && (
              <div className="text-center py-12">
                <Stethoscope className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? "لم يتم العثور على خدمات" : "لا توجد خدمات علاجية"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? "جرب تغيير كلمات البحث" : "ابدأ بإضافة أول خدمة علاجية"}
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setIsAddDialogOpen(true)}
                    className="medical-gradient gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة خدمة جديدة
                  </Button>
                )}
              </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>تعديل الخدمة العلاجية</DialogTitle>
                  <DialogDescription>
                    تحديث تفاصيل الخدمة العلاجية
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleEditService} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">اسم الخدمة *</Label>
                      <Input
                        id="edit-name"
                        value={newService.name}
                        onChange={(e) => setNewService({...newService, name: e.target.value})}
                        placeholder="أدخل اسم الخدمة"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">الفئة</Label>
                      <Select 
                        value={newService.category_id}
                        onValueChange={(value) => setNewService({...newService, category_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفئة" />
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
                      <Label htmlFor="edit-price">السعر (د.أ) *</Label>
                      <Input
                        id="edit-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newService.price}
                        onChange={(e) => setNewService({...newService, price: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-duration">المدة (دقيقة)</Label>
                      <Input
                        id="edit-duration"
                        type="number"
                        min="1"
                        value={newService.duration_minutes}
                        onChange={(e) => setNewService({...newService, duration_minutes: e.target.value})}
                        placeholder="30"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">الوصف</Label>
                    <Input
                      id="edit-description"
                      value={newService.description}
                      onChange={(e) => setNewService({...newService, description: e.target.value})}
                      placeholder="وصف الخدمة العلاجية"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-is_active"
                      checked={newService.is_active}
                      onCheckedChange={(checked) => setNewService({...newService, is_active: checked})}
                    />
                    <Label htmlFor="edit-is_active">خدمة نشطة</Label>
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
          </TabsContent>

          <TabsContent value="categories">
            <ServiceCategoriesManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TreatmentServices;
