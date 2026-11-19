import { engineeringIllustrations } from './engineering.js';
import { retiredLessons } from '../course-order.js';
import { applicationsIllustrations } from './illustrations-apps.js';
import { platformIllustrations } from './illustrations-platform.js';
import { practiceIllustrations } from './illustrations-practice.js';
import { servingIllustrations } from './illustrations-serving.js';

const catalog = {
  ...applicationsIllustrations,
  ...platformIllustrations,
  ...practiceIllustrations,
  ...servingIllustrations,
  ...engineeringIllustrations,
};
export const illustrations = Object.fromEntries(
  Object.entries(catalog).filter(([id]) => !retiredLessons.includes(id)),
);
