import { createApp } from 'vue';
import App from './App.vue';
import './obsidian.css';
import './style.css';

const vscode = acquireVsCodeApi();
const pending = new Map();
window.addEventListener('message', event => {
  const { id, error } = event.data || {};
  const request = pending.get(id);
  if (!request) return;
  pending.delete(id);
  if (error) request.reject(new Error(error));
  else request.resolve();
});

createApp(App, {
  makerOnly: true,
  insertLabel: 'Save SVG',
  target: 'Save a diagram and optionally insert it into Markdown',
  insert: diagram => new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    pending.set(id, { resolve, reject });
    vscode.postMessage({ type: 'save', id, ...diagram });
  })
}).mount('#app');
