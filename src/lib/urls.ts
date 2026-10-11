import type { Lang } from '../config/site';

/** URL menija: default jezik je na /<slug>, ostali na /<slug>/<lang>. */
export function menuUrl(slug: string, lang: Lang, defaultLanguage: Lang): string {
  return lang === defaultLanguage ? `/${slug}` : `/${slug}/${lang}`;
}
