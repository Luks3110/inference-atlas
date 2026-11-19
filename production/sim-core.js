export function knob(label, unit, min, max, step, initial) {
  return { label, unit, min, max, step, initial };
}

export function sim(kind, knobs, calculate, metrics, explanation) {
  return { kind, knobs, calculate, metrics, explanation };
}

export function snap(value, parameter) {
  const index = Math.round((value - parameter.min) / parameter.step);
  const bounded = Math.min(parameter.max, Math.max(parameter.min, parameter.min + index * parameter.step));
  return Number(bounded.toPrecision(13));
}

export function responseCurves(model, inputs, axis) {
  const parameter = model.knobs[axis];
  const increments = Math.round((parameter.max - parameter.min) / parameter.step);
  const intervals = Math.min(32, increments);
  const positions = new Set([inputs[axis], parameter.initial]);
  for (let i = 0; i <= intervals; i++) {
    const value = parameter.min + Math.round(i * increments / intervals) * parameter.step;
    positions.add(snap(value, parameter));
  }
  const samples = [...positions].sort((a,b)=>a-b).map((value) => {
    const next = [...inputs];
    next[axis] = value;
    return { value, outputs: model.calculate(...next) };
  });

  return model.metrics.map((_, i) => {
    const ys = samples.map(sample => sample.outputs[i]);
    const min = Math.min(...ys), max = Math.max(...ys);
    const points = samples.map(({ value, outputs }) => ({
      x: 5 + 190 * (value - parameter.min) / (parameter.max - parameter.min),
      y: max === min ? 26 : 46 - 40 * (outputs[i] - min) / (max - min),
      value,
    }));
    return { min, max, points, current: points.find(p => p.value === inputs[axis]) };
  });
}
