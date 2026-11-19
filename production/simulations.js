import { engineeringSimulations } from './engineering.js';
import { retiredLessons } from '../course-order.js';
import { servingSimulations } from './sim-serving.js';
import { platformSimulations } from './sim-platform.js';
import { applicationsSimulations } from './sim-apps.js';
import { practiceSimulations } from './sim-practice.js';

const catalog = {
  ...servingSimulations,
  ...platformSimulations,
  ...applicationsSimulations,
  ...practiceSimulations,
  ...engineeringSimulations,
};
export const simulations = Object.fromEntries(
  Object.entries(catalog).filter(([id]) => !retiredLessons.includes(id)),
);
