import { withDecisions } from './production/decisions.js';
import { engineeringLessons } from './production/engineering.js';
import { courseOrder } from './course-order.js';
import infrastructure from './production/infrastructure.json' with { type: 'json' };
import { inferenceCases } from './production/inference-cases.js';
import { platformCases } from './production/platform-cases.js';
import { llmApiModules } from './production/llm-api.js';
import { llmApiDrills } from './production/llm-api-drills.js';
import { graphMemoryModules } from './production/graph-memory.js';
import { graphMemoryDrills } from './production/graph-memory-drills.js';
import { ragEvalModules } from './production/rag-evals.js';
import { ragEvalDrills } from './production/rag-eval-drills.js';
import { operationsModule } from './production/operations.js';
import { operationsDrills } from './production/operations-drills.js';
import { infrastructureChallenges, outcomes } from './production/outcomes.js';

import { vectorIndexLessons } from './production/vector-index.js';
import { transformerLessons } from './production/transformer-internals.js';

const cases = { ...inferenceCases, ...platformCases };
const drills = { ...llmApiDrills, ...graphMemoryDrills, ...ragEvalDrills, ...operationsDrills };
const infrastructureModules = infrastructure.map((group) => ({
  ...group,
  lessons: group.lessons.map((meta) => ({
    ...meta,
    ...cases[meta.id],
    challenge: infrastructureChallenges[meta.id],
    objectives: outcomes[meta.id],
  })),
}));
const productionContent = [...llmApiModules, ...graphMemoryModules, ...ragEvalModules, operationsModule];
const applicationModules = productionContent.map((group) => ({
  ...group,
  lessons: group.lessons
    .map((lesson) => {
      const drill = drills[lesson.id];
      const steps = lesson.steps.map((s, i) => ({ ...s, ...drill.initial[i] }));
      return {
        ...lesson,
        objectives: outcomes[lesson.id],
        scenario: drill.scenario,
        minutes: lesson.minutes + 7,
        steps: [...steps, ...drill.steps],
        labStart: steps.length,
      };
    })
    .concat(
      (group === llmApiModules[0]
        ? transformerLessons
        : group === ragEvalModules[0]
          ? vectorIndexLessons
          : []
      ).map((l) => ({ ...l, objectives: outcomes[l.id] })),
    ),
}));
const catalog = new Map([...infrastructureModules, ...applicationModules].flatMap(group => group.lessons)
  .concat(engineeringLessons).map(lesson => [lesson.id, lesson]));
export const modules = courseOrder.map((group) => ({
  ...group,
  lessons: group.lessons.map((id) => withDecisions(catalog.get(id))),
}));
export const productionModules = modules.filter(group => group.phase !== 'Fundamentos' && group.phase !== 'Aprofundamento opcional');
export const lessons = modules.flatMap((group, g) =>
  group.lessons.map((lesson, index) => ({ ...lesson, group: g, index })),
);

export const coreLessons = lessons.filter(lesson => modules[lesson.group].phase !== 'Aprofundamento opcional');
