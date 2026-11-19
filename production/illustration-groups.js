// A unit belongs to the quantity on screen, not to the SVG used to draw it.
function family(shape, defaultUnit) {
  return (label, value, unit = defaultUnit, details = {}) => ({ label, shape, value, unit, ...details });
}
export const token = family('token', 'tokens');
export const document = family('document', 'documentos');
export const gpu = family('gpu', 'GPUs');
export const page = family('page', 'páginas');
export const worker = family('worker', 'workers');
export const request = family('request', 'pedidos');
export const cell = family('cell', 'posições');
export const clock = family('clock', 'ms');
export const check = family('check', 'casos');
export const packet = family('packet', 'eventos');
export const bucket = family('bucket', 'slots');
export const items = (count, make) => Array.from({ length: count }, (_, i) => make(i));
export const item = (label, state = 'active') => ({ label: String(label), state });
