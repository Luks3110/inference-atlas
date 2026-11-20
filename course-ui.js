import { t } from './i18n.js';
import { courseOrder } from './course-order.js';
import { investigations } from './production/audit.js';

export const numbered = (value) => String(value).padStart(2, '0');
export const href = (lesson, index = 0) => '#/aula/' + lesson.id + '/' + (index + 1);
export const symbols = courseOrder.map((module) => module.symbol);
export const modes = {
  aprender: ['book', t('Aprender', 'Learn')],
  producao: ['network', t('Produção', 'Production')],
  pratica: ['practice', t('Prática', 'Practice')],
  laboratorio: ['lab', t('Laboratório', 'Lab')],
  guias: ['guides', t('Guias', 'Guides')],
};
export function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem('atlas:' + key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function save(key, value) {
  try {
    localStorage.setItem('atlas:' + key, JSON.stringify(value));
  } catch {}
}
export function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
export function matchLessons(query, lessons, modules) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  const matches = (fields) => {
    const text = normalize(fields.flatMap((value) =>
      typeof value === 'string' ? [value, t(value)] : [value],
    ).join(' '));
    return tokens.every((token) => text.includes(token));
  };
  return lessons.flatMap((item) => {
    if (matches([item.title, item.summary, modules[item.group].title])) return [{ item, index: 0 }];
    const index = item.steps.findIndex((s) =>
      matches([s.label, s.title, s.body, s.idea, s.change, s.code, ...(s.decision ?? [])]),
    );
    if (index >= 0) return [{ item, index }];
    const work = item.fieldwork;
    const extra = [
      item.scenario,
      ...(item.objectives || []),
      item.source.label,
      work?.caseStudy.text,
      work?.caseStudy.source.label,
      work?.exercise.prompt,
      work?.exercise.solution,
      item.challenge?.prompt,
      item.challenge?.solution,
    ];
    if (matches(extra)) return [{ item, index: 0 }];
    const study = investigations.get(item.id);
    const caseText = [
      study.title, study.gap, study.method, study.signal, study.exercise.prompt, study.exercise.solution,
      study.source.org, study.source.title, study.source.observed, study.source.mechanism, study.source.limits,
    ];
    return matches(caseText) ? [{ item, index: 0, showCase: true }] : [];
  });
}
