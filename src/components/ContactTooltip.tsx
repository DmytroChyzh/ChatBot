import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ContactTooltipProps {
  estimateStep: number;
  isVisible: boolean;
}

const ContactTooltip: React.FC<ContactTooltipProps> = ({ estimateStep, isVisible }) => {
  const { language } = useLanguage();

  if (!isVisible || estimateStep < 5) {
    return null;
  }

  return (
    <div className="absolute -left-[10rem] bottom-4 transform -translate-y-64 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-20 max-w-[200px]">
      <div className="absolute top-1/2 right-0 transform translate-x-full -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-purple-500"></div>
      {language === 'uk' 
        ? '💬 Ми можемо зв\'язатися з вами пізніше, але якщо хочете швидше - натисніть кнопку!'
        : '💬 We can contact you later, but if you want faster - click the button!'
      }
    </div>
  );
};

export default ContactTooltip;
