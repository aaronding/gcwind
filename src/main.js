import './styles/global.css';
import { mount } from 'svelte';
import App from './App.svelte';

export default mount(App, { target: document.getElementById('app') });

// Offline use, from the build only: the dev server has no sw.js. Registered
// once the page has loaded, so the worker's downloads never hold up the page's.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Refused here (some private modes): gcwind works online as before.
    });
  });
}
