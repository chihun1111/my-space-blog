import { installCodeCopy, installImageViewer } from './interactions.js';
import { LANGUAGE_STORAGE_KEY, messages } from './i18n.js';
import { icon } from './lib.js';

const root = document.documentElement;
const t = messages[root.lang];
installImageViewer(() => t);
installCodeCopy();

const copy = document.querySelector('#copy-link');
const toast = document.querySelector('#toast');
let toastTimer;
copy.hidden = false;
copy.addEventListener('click', async () => {
  const url = new URL(location.href);
  url.pathname = new URL('./', url).pathname;
  url.search = '';
  if (!url.hash.startsWith('#section-')) url.hash = '';
  try {
    await navigator.clipboard.writeText(url.href);
    toast.textContent = t.copied;
  } catch {
    toast.textContent = t.copyFailed;
  }
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
});

const themeButton = document.querySelector('.theme-toggle');
const mobileTheme = document.querySelector('.mobile-theme');
const syncThemeControls = () => {
  const dark = root.dataset.theme === 'dark';
  themeButton.innerHTML = icon(dark ? 'sun' : 'moon');
  themeButton.setAttribute('aria-label', dark ? t.light : t.dark);
  mobileTheme.textContent = dark ? t.light : t.dark;
  document.querySelector('meta[name="theme-color"]').content = dark ? '#101116' : '#f8f9fc';
};
themeButton.hidden = false;
syncThemeControls();
const toggleTheme = () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('my-space-theme-v3', root.dataset.theme); } catch { /* Theme works for this page. */ }
  syncThemeControls();
};
themeButton.addEventListener('click', toggleTheme);
mobileTheme.addEventListener('click', toggleTheme);

const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#mobile-nav');
const setMenu = open => {
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? t.menuClose : t.menuOpen);
};
menuButton.hidden = false;
menuButton.addEventListener('click', () => setMenu(menu.hidden));
document.addEventListener('click', event => {
  if (!menu.hidden && !event.target.closest('.site-header')) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || menu.hidden) return;
  setMenu(false);
  menuButton.focus();
});

document.querySelector('a[data-language]').addEventListener('click', event => {
  try { localStorage.setItem(LANGUAGE_STORAGE_KEY, event.currentTarget.dataset.language); } catch { /* The link works without storage. */ }
});

if (document.referrer) {
  const previous = new URL(document.referrer);
  for (const link of document.querySelectorAll('[data-article-back]')) {
    const home = new URL(link.href);
    if (previous.origin !== home.origin || previous.pathname !== home.pathname) continue;
    const previousLanguage = previous.searchParams.get('lang');
    if (previousLanguage && previousLanguage !== root.lang) continue;
    for (const name of ['q', 'topic']) {
      if (previous.searchParams.has(name)) home.searchParams.set(name, previous.searchParams.get(name));
    }
    link.href = home.href;
  }
}

const edit = document.querySelector('[data-edit-article]');
if (edit) {
  const updateAuthorLink = async () => {
    try {
      const response = await fetch(new URL('../../api/editor', location.href), { cache: 'no-store' });
      edit.hidden = !response.ok || (await response.json()).authenticated !== true;
    } catch {
      edit.hidden = true;
    }
  };
  updateAuthorLink();
  window.addEventListener('focus', updateAuthorLink);
  window.addEventListener('storage', event => {
    if (event.key === 'my-space-content-revision') location.reload();
  });
}
