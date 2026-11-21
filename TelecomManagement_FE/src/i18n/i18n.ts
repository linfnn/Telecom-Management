import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import viTranslation from "./locales/vi.json";
import enTranslation from "./locales/en.json";

i18n
  .use(LanguageDetector) // Tự động phát hiện và lưu ngôn ngữ vào localStorage
  .use(initReactI18next) // Kết nối với React
  .init({
    resources: {
      vi: { translation: viTranslation },
      en: { translation: enTranslation },
    },
    fallbackLng: "vi", // Ngôn ngữ mặc định khi không phát hiện được hoặc thiếu file dịch
    interpolation: {
      escapeValue: false, // React đã tự động chống XSS nên đặt false
    },
    detection: {
      order: ["localStorage", "navigator"], // Ưu tiên đọc từ localStorage trước, rồi mới tới trình duyệt
      caches: ["localStorage"], // Lưu lại lựa chọn của user vào localStorage
    },
  });

export default i18n;
