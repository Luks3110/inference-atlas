import { mount } from 'svelte';
import { prepareLocale } from './i18n.js';
import { m } from './paraglide/messages.js';
import './style.css';
import './diagram.css';
import './production/study.css';

const target = document.getElementById('app');
try {
  await prepareLocale();
  document.querySelector('meta[name="description"]').content = m.site_description();
  const { default: App } = await import('./App.svelte');
  mount(App, { target });
} catch (error) {
  console.error(error);
  const status = document.createElement('p');
  status.textContent = m.load_error();
  const retry = document.createElement('button');
  retry.textContent = m.retry();
  retry.onclick = () => location.reload();
  target.replaceChildren(status, retry);
}
