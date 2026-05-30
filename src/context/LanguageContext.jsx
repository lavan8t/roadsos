import React, { createContext, useContext, useState, useEffect } from "react";
import translations, { LANGUAGES } from "../constants/translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("roadsos_language") || "en";
  });

  const changeLang = (code) => {
    setLang(code);
    localStorage.setItem("roadsos_language", code);
  };

  // t("key") — returns translated string or falls back to English, then the key itself
  const t = (key) => {
    return translations[lang]?.[key] ?? translations["en"]?.[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
