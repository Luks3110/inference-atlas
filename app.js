import { mount } from 'svelte';
import App from './App.svelte';
import './style.css';
import './diagram.css';
import './production/study.css';

mount(App, { target: document.getElementById('app') });
