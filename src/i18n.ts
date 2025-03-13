import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      title: 'TypeScript Playground',
      run: 'Run',
      running: 'Running...',
      config: 'Config',
      share: 'Share',
      selectExample: 'Select Example',

      basicTypes: 'Basic Types',
      interfaces: 'Interfaces',
      classes: 'Classes',

      output: 'Output',
      js: 'JS',
      definitions: 'Definitions',
      runToSeeResults: 'Run code to see results...',
      jsWillAppearHere: '// Compiled JavaScript will appear here',
      definitionsWillAppearHere:
        '// TypeScript type definitions will appear here',

      tsconfig: 'tsconfig.json',
    },
  },
  zh: {
    translation: {
      title: 'TypeScript Playground',
      run: '运行',
      running: '运行中...',
      config: '配置',
      share: '分享',
      selectExample: '选择示例',

      basicTypes: '基础类型',
      interfaces: '接口',
      classes: '类',

      output: '输出',
      js: 'JS',
      definitions: '定义',
      runToSeeResults: '运行代码后查看输出结果...',
      jsWillAppearHere: '// 编译后的 JavaScript 将显示在这里',
      definitionsWillAppearHere: '// TypeScript 类型定义将显示在这里',

      tsconfig: 'tsconfig.json',
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false, // not needed for React
    },
  });

export default i18n;
