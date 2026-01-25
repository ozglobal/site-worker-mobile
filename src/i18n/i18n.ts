import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Direct JSON imports
import enCommon from './en/common.json';
import enLogin from './en/login.json';
import koCommon from './ko/common.json';
import koLogin from './ko/login.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, login: enLogin },
      ko: { common: koCommon, login: koLogin }
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    ns: ['common', 'login'],
    defaultNS: 'common',
    interpolation: { escapeValue: false }
  });

export default i18n;
