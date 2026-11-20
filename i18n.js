import { baseLocale, getLocale, locales, overwriteGetLocale, setLocale } from './paraglide/runtime.js';
import appPatterns from './locales/dynamic-apps.en.js';
import platformPatterns from './locales/dynamic-platform.en.js';

export { getLocale, setLocale };

let course = {};
const englishPatterns = [...appPatterns, ...platformPatterns];

function englishNumber(value) {
  if (!/^[+−-]?\d[\d.,]*$/.test(value)) return value;
  const [integer, decimals] = value.split(',');
  const grouped = /^[-+−]?[1-9]\d{0,2}(?:\.\d{3})+$/.test(integer);
  const formatted = grouped ? integer.replaceAll('.', ',') : integer;
  return decimals === undefined ? formatted : formatted + '.' + decimals;
}

export function t(portuguese, english) {
  if (typeof portuguese !== 'string' || getLocale() !== 'en') return portuguese;
  if (english !== undefined) return english;
  if (Object.hasOwn(course, portuguese)) return course[portuguese];
  const core = portuguese.trim();
  if (!core) return portuguese;
  if (Object.hasOwn(course, core)) return portuguese.replace(core, () => course[core]);
  for (const [pattern, replacement] of englishPatterns) {
    const match = pattern.exec(core);
    if (!match) continue;
    const translated = replacement.replace(/\$(\$|\d+)/g, (_, token) =>
      token === '$' ? '$' : englishNumber(match[Number(token)] ?? ''));
    return portuguese.replace(core, () => translated);
  }
  const parts = portuguese.split(/(\s+[·→]\s+|\n+)/u);
  if (parts.length > 1) return parts.map((part, index) => index % 2 ? part : t(part)).join('');
  const amount = /^([+−-]?[\d.,]+%?\s+)(\p{L}.*)$/u.exec(portuguese);
  if (amount && Object.hasOwn(course, amount[2])) {
    return amount[1].replace(/[+−-]?[\d.,]+/, englishNumber) + course[amount[2]];
  }
  return portuguese;
}

export function formatLocale() {
  return getLocale();
}

export async function prepareLocale() {
  const requested = new URLSearchParams(location.search).get('lang');
  const locale = locales.includes(requested) ? requested : getLocale();
  overwriteGetLocale(() => locale);
  document.documentElement.lang = locale;
  if (locale !== baseLocale) {
    const response = await fetch('/locales/course.' + locale + '.json');
    if (!response.ok) throw new Error('Course translation could not be loaded');
    course = await response.json();
  }
}

export async function switchLocale(locale) {
  if (!locales.includes(locale) || locale === getLocale()) return;
  const url = new URL(location.href);
  url.searchParams.set('lang', locale);
  await setLocale(locale, { reload: false });
  location.assign(url);
}
