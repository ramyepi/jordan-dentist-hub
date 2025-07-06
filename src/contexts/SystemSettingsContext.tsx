
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SystemSettings {
  id?: string;
  language: string;
  time_format: string;
  timezone: string;
  date_format: string;
  currency: string;
  currency_symbol: string;
}

interface SystemSettingsContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  formatDateTime: (date: Date, includeTime?: boolean) => string;
  formatCurrency: (amount: number) => string;
  isLoading: boolean;
}

const defaultSettings: SystemSettings = {
  language: 'ar',
  time_format: '24h',
  timezone: 'Asia/Amman',
  date_format: 'dd/MM/yyyy',
  currency: 'JOD',
  currency_symbol: 'د.أ'
};

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
};

interface SystemSettingsProviderProps {
  children: ReactNode;
}

export const SystemSettingsProvider: React.FC<SystemSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Type cast to include the new fields
        const settingsData = data as any;
        setSettings({
          id: settingsData.id,
          language: settingsData.language || defaultSettings.language,
          time_format: settingsData.time_format || defaultSettings.time_format,
          timezone: settingsData.timezone || defaultSettings.timezone,
          date_format: settingsData.date_format || defaultSettings.date_format,
          currency: settingsData.currency || defaultSettings.currency,
          currency_symbol: settingsData.currency_symbol || defaultSettings.currency_symbol
        });
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const settingsData = {
        language: updatedSettings.language,
        time_format: updatedSettings.time_format,
        timezone: updatedSettings.timezone,
        date_format: updatedSettings.date_format,
        currency: updatedSettings.currency,
        currency_symbol: updatedSettings.currency_symbol,
        created_by: profile.id
      };

      let error;
      if (settings.id) {
        const result = await supabase
          .from('system_settings')
          .update(settingsData)
          .eq('id', settings.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('system_settings')
          .insert([settingsData]);
        error = result.error;
      }

      if (error) throw error;

      setSettings(updatedSettings);
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ الإعدادات بنجاح',
      });

      // إعادة تحميل الصفحة لتطبيق التغييرات
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ في حفظ الإعدادات',
      });
    }
  };

  const formatDateTime = (date: Date, includeTime = true) => {
    const timeZone = settings.timezone;
    
    const dateOptions: Intl.DateTimeFormatOptions = {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: settings.time_format === '12h'
    };

    const locale = settings.language === 'ar' ? 'ar-SA' : 'en-US';
    
    if (includeTime) {
      return new Intl.DateTimeFormat(locale, { ...dateOptions, ...timeOptions }).format(date);
    } else {
      return new Intl.DateTimeFormat(locale, dateOptions).format(date);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ${settings.currency_symbol}`;
  };

  return (
    <SystemSettingsContext.Provider
      value={{
        settings,
        updateSettings,
        formatDateTime,
        formatCurrency,
        isLoading
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
};
