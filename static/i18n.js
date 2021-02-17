import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import app from "./reducers/dtale";
import en from "./translations/en.json";
import cn from "./translations/cn.json";

const language = app.getHiddenValue("language") || "en";

i18n.use(initReactI18next).init({
  resources: { en, cn },
  lng: language,
  fallbackLng: "en",
  keySeparator: false,
  react: {
    useSuspense: false,
  },
  debug: process.env.NODE_ENV !== "production",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
