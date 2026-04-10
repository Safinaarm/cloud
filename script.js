// index.js — Theme toggle
const html = document.documentElement;
const btn  = document.getElementById('theme-toggle');

// Load saved preference, fallback to dark
const saved = localStorage.getItem('cp-theme') || 'dark';
html.setAttribute('data-theme', saved);

btn.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('cp-theme', next);
});