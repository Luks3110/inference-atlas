import { courseOrder } from '../course-order.js';
import { servingAudit } from './audit-serving.js';
import { platformAudit } from './audit-platform.js';
import { applicationsAudit } from './audit-apps.js';
import { operationsAudit } from './audit-operations.js';
import { engineeringCases } from './engineering.js';

const reports = [...servingAudit, ...platformAudit, ...applicationsAudit, ...operationsAudit];

export const audit = courseOrder.map((module) => {
  const report = reports.find((entry) => entry.moduleTitle === module.title);
  const cases = [...(report?.cases ?? [])];
  const lessons = {};
  for (const id of module.lessons) {
    const added = engineeringCases.get(id);
    if (added) {
      const caseIndex = cases.push(added.source) - 1;
      lessons[id] = { ...added, caseIndex };
    } else {
      lessons[id] = report.lessons[id];
    }
  }
  return {
    moduleTitle: module.title,
    cases,
    lessons,
    baseline: report?.baseline ?? 'As aulas de API já mostram ferramentas e respostas estruturadas.',
    gaps: report?.gaps ?? [
      'Escolher quem toma cada decisão, retomar tarefas após falhas e integrar agentes ou um portal sem API.',
    ],
  };
});

export const investigations = new Map(
  audit.flatMap((module) =>
    Object.entries(module.lessons).map(([id, lesson]) => [
      id,
      { ...lesson, source: module.cases[lesson.caseIndex] },
    ]),
  ),
);
