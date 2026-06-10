import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

// ── Global uppercase enforcer ──────────────────────────────────────────────
const SKIP_TYPES = new Set(['date','number','email','password','checkbox','radio','file','color','range','time','datetime-local','month','week','search']);

function shouldUppercase(el) {
  if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return false;
  if (el.dataset?.noUpper) return false;
  if (window.location.pathname === '/login') return false;
  return !SKIP_TYPES.has((el.type || '').toLowerCase());
}

function setNativeValue(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

document.addEventListener('keydown', (e) => {
  const el = e.target;
  if (!shouldUppercase(el)) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length !== 1) return;
  e.preventDefault();
  const upper = e.key.toUpperCase();
  const s = el.selectionStart, end = el.selectionEnd;
  const next = el.value.slice(0, s) + upper + el.value.slice(end);
  setNativeValue(el, next);
  el.setSelectionRange(s + 1, s + 1);
}, true);

document.addEventListener('paste', (e) => {
  const el = e.target;
  if (!shouldUppercase(el)) return;
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text').toUpperCase();
  const s = el.selectionStart, end = el.selectionEnd;
  const next = el.value.slice(0, s) + text + el.value.slice(end);
  setNativeValue(el, next);
  el.setSelectionRange(s + text.length, s + text.length);
}, true);
// ──────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
