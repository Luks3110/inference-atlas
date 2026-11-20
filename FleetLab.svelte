<script module>
  const fields = [
    { key: 'users', label: ["Usuários ativos por dia", "Daily active users"], value: 2000000, min: 1, max: 1000000000, step: 1 },
    { key: 'calls', label: ["Gerações por usuário/dia", "Generations per user per day"], value: 4, min: 0.1, max: 1000, step: 'any' },
    { key: 'peak', label: ["Fator de pico sobre a média", "Peak-to-average ratio"], value: 6, min: 1, max: 1000, step: 'any' },
    {
      key: 'duration',
      label: ["Duração média da geração (s)", "Average generation duration (s)"],
      value: 3.6,
      min: 0.01,
      max: 86400,
      step: 'any',
    },
    { key: 'qps', label: ["Gerações/s por réplica no SLO", "Generations/s per replica within the SLO"], value: 25, min: 0.01, max: 1000000, step: 'any' },
    { key: 'reserve', label: ["Reserva de capacidade (%)", "Capacity reserve (%)"], value: 20, min: 0, max: 99, step: 'any' },
    { key: 'lookups', label: ["Leituras de chave por geração", "Key reads per generation"], value: 2, min: 1, max: 1000, step: 1 },
    { key: 'hits', label: ["Cache hits durante o failover (%)", "Cache hit rate during failover (%)"], value: 80, min: 0, max: 100, step: 'any' },
    { key: 'origin', label: ["Leituras/s disponíveis na origem", "Available reads/s at the origin"], value: 900, min: 1, max: 1000000000, step: 'any' },
    { key: 'zones', label: ["Zonas de capacidade igual", "Zones with equal capacity"], value: 3, min: 2, max: 12, step: 1 },
  ];
  // The previous successful simulation survives a visit to another lesson.
  let lastValid = Object.fromEntries(fields.map(({ key, value }) => [key, value]));
</script>

<script>
  import { formatLocale, t } from './i18n.js';
  import { icon } from './icons.js';
  import './production/study.css';

  let decimal = $derived(new Intl.NumberFormat(formatLocale(), { maximumFractionDigits: 2 }));
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

<section id="fleet-lab" aria-label={t("Dimensionador de frota", "Fleet sizing calculator")}>
  <h2>{@html icon('chart')} {t("Dimensionador de frota", "Fleet sizing calculator")}</h2>
  <p>
    {t("Experimente a perda de uma zona. Use a taxa sustentável de uma réplica medida com o seu modelo e a sua distribuição de tokens.", "Simulate losing a zone. Use the sustainable throughput of one replica, measured with your model and token distribution.")}
  </p>
  <div class="fleet-fields">
    {#each fields as field (field.key)}
      <label>
        {t(...field.label)}
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
          <dt>{t("Gerações/s no pico", "Peak generations/s")}</dt>
          <dd>{decimal.format(estimate.load)}</dd>
        </div>
        <div>
          <dt>{t("Gerações em voo (média no pico)", "In-flight generations (average at peak)")}</dt>
          <dd>{decimal.format(estimate.inFlight)}</dd>
        </div>
        <div>
          <dt>{t("Réplicas por zona", "Replicas per zone")}</dt>
          <dd>{decimal.format(estimate.perZone)}</dd>
        </div>
        <div>
          <dt>{t("Réplicas totais", "Total replicas")}</dt>
          <dd>{decimal.format(estimate.total)}</dd>
        </div>
      </dl>
      <p>
        {t(`Com ${estimate.survivingZones} zona(s) disponível(is), a frota sustenta até ${decimal.format(estimate.survivingCapacity)} gerações/s nas premissas informadas. A concorrência usa taxa de pico × duração média em um patamar estável. O cálculo supõe redistribuição uniforme e réplicas já aquecidas.`, `With ${estimate.survivingZones} surviving ${estimate.survivingZones === 1 ? "zone" : "zones"}, the fleet supports up to ${decimal.format(estimate.survivingCapacity)} generations/s under these assumptions. Concurrency equals the peak rate times the average duration at a steady load. The estimate assumes even redistribution and warm replicas.`)}
      </p>
      <p class="origin-estimate">
        {t(`Com o cache a ${decimal.format(values.hits)}% de acerto, as consultas ao armazenamento chegam a`, `At a cache hit rate of ${decimal.format(values.hits)}%, storage queries reach`)}
        <strong>{t(`${decimal.format(estimate.originLoad)} leituras/s`, `${decimal.format(estimate.originLoad)} reads/s`)}</strong>.
        {#if estimate.originShortfall > 0}
          {t(`Faltam ${decimal.format(estimate.originShortfall)} leituras/s na origem mesmo com GPUs suficientes.`, `The origin falls short by ${decimal.format(estimate.originShortfall)} reads/s even with enough GPUs.`)}
        {:else}
          {t("A origem comporta essa carga média.", "The origin can handle this average load.")}
        {/if}
        {t(`A taxa mínima de acerto para caber na capacidade informada é ${decimal.format(estimate.minHits)}%. O cálculo supõe uma ida à origem por falta no cache e capacidade já descontada das escritas.`, `The minimum hit rate to stay within the specified capacity is ${decimal.format(estimate.minHits)}%. The estimate assumes one origin read per cache miss and capacity after accounting for writes.`)}
      </p>
    {:else}
      {t("Preencha os campos com valores dentro dos limites indicados.", "Enter values within the specified limits.")}
    {/if}
  </div>
</section>
