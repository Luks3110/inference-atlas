<script module>
  const fields = [
    { key: 'users', label: 'Usuários ativos por dia', value: 2000000, min: 1, max: 1000000000, step: 1 },
    { key: 'calls', label: 'Gerações por usuário/dia', value: 4, min: 0.1, max: 1000, step: 'any' },
    { key: 'peak', label: 'Fator de pico sobre a média', value: 6, min: 1, max: 1000, step: 'any' },
    {
      key: 'duration',
      label: 'Duração média da geração (s)',
      value: 3.6,
      min: 0.01,
      max: 86400,
      step: 'any',
    },
    { key: 'qps', label: 'Gerações/s por réplica no SLO', value: 25, min: 0.01, max: 1000000, step: 'any' },
    { key: 'reserve', label: 'Reserva de capacidade (%)', value: 20, min: 0, max: 99, step: 'any' },
    { key: 'lookups', label: 'Leituras de chave por geração', value: 2, min: 1, max: 1000, step: 1 },
    { key: 'hits', label: 'Cache hits durante o failover (%)', value: 80, min: 0, max: 100, step: 'any' },
    { key: 'origin', label: 'Leituras/s disponíveis na origem', value: 900, min: 1, max: 1000000000, step: 'any' },
    { key: 'zones', label: 'Zonas de capacidade igual', value: 3, min: 2, max: 12, step: 1 },
  ];
  const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
  // The previous successful simulation survives a visit to another lesson.
  let lastValid = Object.fromEntries(fields.map(({ key, value }) => [key, value]));
</script>

<script>
  import { icon } from './icons.js';
  import './production/study.css';

  let values = $state({ ...lastValid });
  let valid = $derived(
    fields.every(({ key, min, max, step }) => {
      const value = values[key];
      return (
        Number.isFinite(value) && value >= min && value <= max && (step === 'any' || Number.isInteger(value))
      );
    }),
  );
  let estimate = $derived.by(() => {
    if (!valid) return null;
    const { users, calls, peak, duration, qps, reserve, zones, lookups, hits, origin } = values;
    const load = (users * calls * peak) / 86400;
    const usableRate = (qps * (100 - reserve)) / 100;
    const perZone = Math.ceil(load / (usableRate * (zones - 1)));
    const readsPerRequest = lookups * (1 - hits / 100);
    const originLoad = readsPerRequest * load;
    return {
      originLoad,
      originShortfall: Math.max(0, originLoad - origin),
      minHits: Math.max(0, 100 * (1 - origin / (load * lookups))),
      load,
      inFlight: load * duration,
      perZone,
      total: perZone * zones,
      survivingZones: zones - 1,
      survivingCapacity: usableRate * perZone * (zones - 1),
    };
  });

  $effect(() => {
    if (valid) lastValid = { ...values };
  });
</script>

<section id="fleet-lab" aria-label="Dimensionador de frota">
  <h2>{@html icon('chart')} Dimensionador de frota</h2>
  <p>
    Experimente a perda de uma zona. Use a taxa sustentável de uma réplica medida com o seu modelo e a sua
    distribuição de tokens.
  </p>
  <div class="fleet-fields">
    {#each fields as field (field.key)}
      <label>
        {field.label}
        <input
          required
          data-key={field.key}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          bind:value={values[field.key]}
        />
      </label>
    {/each}
  </div>
  <div class="fleet-result" role="status" aria-live="polite">
    {#if estimate}
      <dl>
        <div>
          <dt>Gerações/s no pico</dt>
          <dd>{decimal.format(estimate.load)}</dd>
        </div>
        <div>
          <dt>Gerações em voo (média no pico)</dt>
          <dd>{decimal.format(estimate.inFlight)}</dd>
        </div>
        <div>
          <dt>Réplicas por zona</dt>
          <dd>{decimal.format(estimate.perZone)}</dd>
        </div>
        <div>
          <dt>Réplicas totais</dt>
          <dd>{decimal.format(estimate.total)}</dd>
        </div>
      </dl>
      <p>
        Com {estimate.survivingZones} zona(s) disponível(is), a frota sustenta até {decimal.format(
          estimate.survivingCapacity,
        )} gerações/s nas premissas informadas. A concorrência usa taxa de pico × duração média em um patamar estável.
        O cálculo supõe redistribuição uniforme e réplicas já aquecidas.
      </p>
      <p class="origin-estimate">
        Com o cache a {decimal.format(values.hits)}% de acerto, as consultas ao armazenamento chegam a
        <strong>{decimal.format(estimate.originLoad)} leituras/s</strong>.
        {#if estimate.originShortfall > 0}
          Faltam {decimal.format(estimate.originShortfall)} leituras/s na origem mesmo com GPUs suficientes.
        {:else}
          A origem comporta essa carga média.
        {/if}
        A taxa mínima de acerto para caber na capacidade informada é {decimal.format(estimate.minHits)}%.
        O cálculo supõe uma ida à origem por falta no cache e capacidade já descontada das escritas.
      </p>
    {:else}
      Preencha os campos com valores dentro dos limites indicados.
    {/if}
  </div>
</section>
