import { engineeringDecisions } from './engineering.js';
import { retiredLessons } from '../course-order.js';
import { servingDecisions } from './decisions-serving.js';
import { platformDecisions } from './decisions-platform.js';
import { applicationsDecisions } from './decisions-apps.js';
import { practiceDecisions } from './decisions-practice.js';

const catalog = {
  ...servingDecisions,
  ...platformDecisions,
  ...applicationsDecisions,
  ...practiceDecisions,
  ...engineeringDecisions,
};
export const stepDecisions = Object.fromEntries(
  Object.entries(catalog).filter(([id]) => !retiredLessons.includes(id)),
);

export function withDecisions(lesson) {
  const rows = stepDecisions[lesson.id];
  const steps = lesson.steps.map((step, index) => ({ ...step, decision: rows[index] }));
  const words = rows.reduce((total, row) => total + row[6].split(/\s+/).length, 0);
  return { ...lesson, steps, minutes: lesson.minutes + Math.ceil(words / 180) };
}
