'use client';
import { useI18n } from '@/lib/i18n';

export default function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
      className="px-2.5 py-1.5 rounded-lg bg-[#181924] border border-[#2a2d3e] hover:border-[#00f0ff]/40 transition-all text-xs font-mono text-[#9ca3af] hover:text-[#00f0ff]"
      title={lang === 'en' ? 'Switch to Chinese' : 'Switch to English'}
    >
      {lang === 'en' ? '中文' : 'EN'}
    </button>
  );
}
