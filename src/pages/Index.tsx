
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Stethoscope, Users, Calendar, CreditCard, BarChart3, Shield, Clock, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";

const Index = () => {
  const { settings } = useSystemSettings();
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: Users,
      title: "إدارة المرضى",
      description: "نظام شامل لإدارة بيانات المرضى والتاريخ الطبي",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Calendar,
      title: "إدارة المواعيد",
      description: "جدولة ومتابعة المواعيد مع تذكيرات تلقائية",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: CreditCard,
      title: "النظام المالي",
      description: "إدارة المدفوعات والفواتير والتقسيط",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: BarChart3,
      title: "التحليلات",
      description: "تقارير مفصلة وإحصائيات شاملة",
      color: "bg-orange-100 text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{settings.clinic_name}</h1>
                <p className="text-sm text-gray-600">نظام إدارة متكامل</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="gap-1">
                <Globe className="h-3 w-3" />
                {settings.language === 'ar' ? 'العربية' : 'English'}
              </Badge>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  دخول النظام
                  <ArrowLeft className="h-4 w-4 mr-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full text-blue-700 text-sm mb-6">
            <Shield className="h-4 w-4" />
            نظام آمن ومتطور
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
              {settings.clinic_name}
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            نظام إدارة طبي متكامل يوفر جميع الأدوات اللازمة لإدارة عيادتك بكفاءة عالية
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg px-8 py-6">
                ابدأ الآن
                <ArrowLeft className="h-5 w-5 mr-2" />
              </Button>
            </Link>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>دقيقة واحدة للإعداد</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            مميزات النظام
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            حلول شاملة لإدارة العيادات الطبية بأحدث التقنيات
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                currentFeature === index ? 'border-blue-200 shadow-lg' : 'border-gray-100'
              }`}
              onMouseEnter={() => setCurrentFeature(index)}
            >
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <p className="text-blue-100">وقت التشغيل</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <p className="text-blue-100">الدعم الفني</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <p className="text-blue-100">أمان البيانات</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ابدأ رحلتك الرقمية اليوم
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            انضم إلى المئات من العيادات التي تثق في نظامنا
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg px-8 py-6">
              دخول النظام
              <ArrowLeft className="h-5 w-5 mr-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
