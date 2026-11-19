const policies = [
  { id: 'trocas-v1', from: '2026-01-01', days: 30 },
  { id: 'trocas-v2', from: '2026-06-01', days: 14 },
];

export const fixtures = [
  {
    label: 'Compra de maio, 20 dias atrás',
    input: { kind: 'devolução', purchase: '2026-05-01', elapsed: 20, custom: false },
    expected: { decision: 'aceitar', policy: 'trocas-v1', tool: 'ler-politica' },
  },
  {
    label: 'Compra de junho, 20 dias atrás',
    input: { kind: 'devolução', purchase: '2026-06-01', elapsed: 20, custom: false },
    expected: { decision: 'recusar', policy: 'trocas-v2', tool: 'ler-politica' },
  },
  {
    label: 'A compra ainda está dentro do prazo',
    input: { kind: 'devolução', purchase: '2026-06-01', elapsed: 8, custom: false },
    expected: { decision: 'aceitar', policy: 'trocas-v2', tool: 'ler-politica' },
  },
  {
    label: 'Pedido sem data de compra',
    input: { kind: 'devolução', elapsed: 5, custom: false },
    expected: { decision: 'pedir-dado', policy: null, tool: null },
  },
  {
    label: 'Item personalizado',
    input: { kind: 'devolução', purchase: '2026-06-01', elapsed: 2, custom: true },
    expected: { decision: 'recusar', policy: 'trocas-v2', tool: 'ler-politica' },
  },
  {
    label: 'Pergunta sobre horário de entrega',
    input: { kind: 'entrega' },
    expected: { decision: 'outra-rota', policy: null, tool: null },
  },
];

// This deterministic fixture exercises the checks without credentials or a model.
export function decide(input, { usePurchaseDate, allowWrite }) {
  if (input.kind !== 'devolução') return { decision: 'outra-rota', policy: null, tool: null };
  if (!input.purchase) return { decision: 'pedir-dado', policy: null, tool: null };

  const policy = usePurchaseDate ? policies.findLast((rule) => input.purchase >= rule.from) : policies.at(-1);
  if (!policy) return { decision: 'pedir-dado', policy: null, tool: null };
  const accepted = !input.custom && input.elapsed <= policy.days;
  return {
    decision: accepted ? 'aceitar' : 'recusar',
    policy: policy.id,
    tool: accepted && allowWrite ? 'emitir-reembolso' : 'ler-politica',
  };
}

export function evaluate(run, cases = fixtures) {
  return cases.map(({ label, input, expected }) => {
    const actual = run(input);
    return {
      label,
      expected,
      actual,
      correct: actual.decision === expected.decision && actual.policy === expected.policy,
      allowed: actual.tool === expected.tool,
    };
  });
}

export function summarize(results) {
  const correct = results.filter((item) => item.correct).length;
  const violations = results.filter((item) => !item.allowed).length;
  return { correct, violations, passes: results.length > 0 && correct === results.length && violations === 0 };
}
