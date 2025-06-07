import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from './en';
import vi from './vi';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'vi';

export type TranslationKeys = typeof en;

export const translations = {
  en,
  vi
};

// Create language context
export const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}>({
  language: 'en',
  setLanguage: () => {},
  t: () => ''
});

// Language Provider props
interface LanguageProviderProps {
  children: ReactNode;
}

// Helper to get nested translation value by dot notation
const getNestedTranslation = (obj: any, path: string): string => {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return the key if translation not found
    }
  }
  
  return result;
};

// Language Provider component
export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>('en');
  
  // Load language from AsyncStorage on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'vi')) {
          setLanguageState(savedLanguage as Language);
        }
      } catch (error) {
        console.error('Failed to load language:', error);
      }
    };
    
    loadLanguage();
  }, []);
  
  // Function to set language and save to AsyncStorage
  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('language', lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };
  
  // Translation function
  const t = (key: string): string => {
    const currentTranslations = translations[language];
    return getNestedTranslation(currentTranslations, key);
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use translations
export const useTranslation = () => {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  
  return context;
}; 