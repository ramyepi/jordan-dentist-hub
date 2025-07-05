const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="text-center max-w-2xl mx-auto p-8">
        <div className="mb-8">
          <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <svg 
              className="w-10 h-10 text-blue-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-gray-800">
            عيادة الأسنان الذكية
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            نظام إدارة شامل للعيادات الطبية
          </p>
          <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">المميزات الرئيسية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>إدارة المواعيد والحجوزات</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>ملفات المرضى الإلكترونية</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>نظام الدفع والتقسيط</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>تقارير مالية وطبية</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>تخزين الأشعة والصور</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>نظام صلاحيات متعدد</span>
              </div>
            </div>
          </div>
          <a 
            href="/auth" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors duration-300 text-lg shadow-lg"
          >
            دخول النظام
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
