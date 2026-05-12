// Detect script-based language from text content
function detectLang(text: string): string {
  if (/[぀-ゟ゠-ヿ]/.test(text)) return 'ja';     // Japanese hiragana/katakana
  if (/[一-鿿]/.test(text))              return 'zh-CN';  // Chinese / shared CJK
  if (/[가-힯]/.test(text))              return 'ko';     // Korean hangul
  if (/[؀-ۿ]/.test(text))              return 'ar';     // Arabic
  if (/[Ѐ-ӿ]/.test(text))              return 'ru';     // Cyrillic
  return 'en';
}

// Translate text to English. Falls back to original on any error or timeout.
export async function toEnglish(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const lang = detectLang(trimmed);
  if (lang === 'en') return text;

  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${lang}|en`,
      { signal: controller.signal }
    );
    clearTimeout(tid);

    const data = await res.json() as {
      responseStatus: number;
      responseData?: { translatedText?: string };
    };

    const translated = data.responseData?.translatedText;
    if (data.responseStatus === 200 && translated && translated !== trimmed) {
      return translated;
    }
  } catch {
    // timeout or network error — use original
  }

  return text;
}
