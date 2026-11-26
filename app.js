import { uploadRasterImage } from './images.js';
import { installImageViewer, installCodeCopy } from './interactions.js';
import { escapeHTML as e, icon, safeURL, markdown, readTime, dateText, loadContent } from './lib.js';
import { getLanguage, setLanguage, localizedSite, publishedPosts, startHerePost, visibleTopics, postInLanguage, messages } from './i18n.js';

const main = document.querySelector('#main');
document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); main.focus(); });
let content, editorEnabled = false, localEditor = false, imageSaving = false, language = getLanguage(), topic = '', query = '', visibleCount = 12, toastTimer;
let t = messages[language];
const theme = () => document.documentElement.dataset.theme;
const siteCopy = () => localizedSite(content.site, language);
const editorURL = (hash = '') => `./editor.html?lang=${language}${hash}`;
const postLink = post => `./posts/${encodeURIComponent(post.slug)}/`;
const otherLanguage = language => language === 'ko' ? 'en' : 'ko';
const hasAbout = site => Boolean(site.role || site.aboutTitle || site.aboutText || site.aboutImage);
function saveBrowseState() {
  const url = new URL(location.href);
  for (const [key, value] of [['q', query], ['topic', topic]]) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  if (url.href !== location.href) history.replaceState(history.state, '', url);
}
const imageField = kind => kind === 'hero' ? 'heroImage' : 'aboutImage';
const imageControls = (kind, hasImage) => editorEnabled && ['hero', 'about'].includes(kind) ? `<div class="site-image-actions"><button type="button" data-site-image-upload="${imageField(kind)}" ${imageSaving ? 'disabled' : ''}>${icon('plus')} ${hasImage ? t.replaceImage : t.uploadImage}</button>${hasImage ? `<button type="button" data-site-image-remove="${imageField(kind)}" ${imageSaving ? 'disabled' : ''}>${t.removeImage}</button>` : ''}</div>` : '';
const imagePlaceholder = (kind, editable = false) => `<div class="image-placeholder image-placeholder-${kind}"><div class="placeholder-center" role="img" aria-label="${e(t.imageSlot)}">${icon('image')}<span>${t.imageSlot}</span></div>${editable ? imageControls(kind, false) : ''}</div>`;
const imageMarkup = (path, kind, alt = '') => {
  if (!path) return imagePlaceholder(kind, kind === 'hero' || kind === 'about');
  const photo = `<img data-image="${kind}" src="${e(path)}" alt="${e(alt)}" ${kind === 'hero' ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
  if (kind === 'cover') return photo;
  return `<div class="image-frame"><button type="button" class="image-zoom" data-zoom-image aria-label="${t.zoomImage}">${photo}<span class="zoom-hint">${icon('plus')}</span></button>${imageControls(kind, true)}</div>`;
};
installImageViewer(() => t);
installCodeCopy();
const imageInput = document.createElement('input');
imageInput.type = 'file'; imageInput.accept = 'image/jpeg,image/png,image/webp,image/gif'; imageInput.hidden = true; imageInput.id = 'site-image-file'; document.body.append(imageInput);
let selectedImageField;
async function saveSiteImage(field, file) {
  if (!editorEnabled || imageSaving || !['heroImage', 'aboutImage'].includes(field)) return;
  imageSaving = true;
  main.querySelectorAll('[data-site-image-upload],[data-site-image-remove]').forEach(button => { button.disabled = true; });
  toast(t.uploading);
  try {
    const value = file ? await uploadRasterImage(file, t) : '';
    const latest = await loadContent();
    const site = { ...latest.site, [field]: value };
    const response = await fetch('./api/site', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(site) });
    if (!response.ok) throw new Error(t.imageSaveFailed);
    content = { ...latest, site }; imageSaving = false;
    const position = scrollY; renderShell(); route(); scrollTo({ top: position, behavior: 'instant' });
    try { localStorage.setItem('my-space-content-revision', `${Date.now()}-${Math.random()}`); } catch {}
    toast(t.imageSaved);
  } catch (error) { toast(language === 'en' && /[가-힣]/.test(error.message) ? t.imageSaveFailed : error.message); }
  finally { imageSaving = false; imageInput.value = ''; main.querySelectorAll('[data-site-image-upload],[data-site-image-remove]').forEach(button => { button.disabled = false; }); }
}
document.addEventListener('click', event => {
  const upload = event.target.closest('[data-site-image-upload]');
  if (upload && !imageSaving) { selectedImageField = upload.dataset.siteImageUpload; imageInput.click(); }
  const remove = event.target.closest('[data-site-image-remove]');
  if (remove) saveSiteImage(remove.dataset.siteImageRemove, null);
  const menu = document.querySelector('#mobile-nav');
  if (menu && !menu.hidden && !event.target.closest('#header')) closeMenu();
});
imageInput.addEventListener('change', () => { if (imageInput.files[0]) saveSiteImage(selectedImageField, imageInput.files[0]); });
function closeMenu() {
  const menu = document.querySelector('#mobile-nav'); if (menu) menu.hidden = true;
  const button = document.querySelector('.menu-toggle'); if (button) { button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-label', t.menuOpen); }
}
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

function toast(message) {
  const element = document.querySelector('#toast'); element.textContent = message; element.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => element.classList.remove('visible'), 2600);
}
function toggleTheme() {
  document.documentElement.dataset.theme = theme() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('my-space-theme-v3', theme()); } catch { /* Storage is optional. */ }
  renderShell(); updateNav();
}
function changeLanguage(next, focusControl = true) {
  if (next === language) return;
  language = setLanguage(next); t = messages[language]; topic = ''; query = ''; visibleCount = 12;
  saveBrowseState();
  renderShell(); route();
  if (focusControl) document.querySelector(`[data-language="${language}"]`)?.focus({ preventScroll: true });
}
function renderShell() {
  const site = siteCopy();
  document.documentElement.lang = language;
  document.querySelector('meta[name="theme-color"]').content = theme() === 'dark' ? '#101116' : '#f8f9fc';
  document.querySelector('.skip-link').textContent = t.skip;
  document.querySelector('meta[name="description"]').content = site.heroDescription || `${site.name} — ${t.blog}`;
  const nav = `<a href="#blog" data-nav="blog">${t.blog}</a><a href="#about" data-nav="about">${t.about}</a>`;
  const switcher = `<div class="language-switch" data-active="${language}" role="group" aria-label="${t.language}"><button data-language="ko" lang="ko" aria-label="한국어" aria-pressed="${language === 'ko'}">KO</button><button data-language="en" lang="en" aria-label="English" aria-pressed="${language === 'en'}">EN</button></div>`;
  document.querySelector('#header').innerHTML = `<div class="brand-group"><a class="brand" href="#blog" aria-label="${e(site.name)} ${t.home}">${e(site.name)}</a></div><nav aria-label="${t.explore}">${nav}</nav><div class="header-actions">${switcher}<button class="icon-button theme-toggle" aria-label="${theme() === 'dark' ? t.light : t.dark}">${icon(theme() === 'dark' ? 'sun' : 'moon')}</button><button class="icon-button menu-toggle" aria-label="${t.menuOpen}" aria-expanded="false" aria-controls="mobile-nav">${icon('menu')}</button>${localEditor ? `<a class="icon-button editor-avatar" href="${editorURL()}" aria-label="${editorEnabled ? t.write : t.login}">${editorEnabled ? `<span>${e(site.initials)}</span>` : icon('pen')}</a>` : ''}</div><div class="mobile-nav" id="mobile-nav" hidden>${nav}<button class="button mobile-theme">${theme() === 'dark' ? t.light : t.dark}</button></div>`;
  document.querySelectorAll('[data-language]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.language === language)); button.onclick = event => changeLanguage(button.dataset.language, event.detail === 0); });
  document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);
  document.querySelector('.mobile-theme').addEventListener('click', toggleTheme);
  document.querySelector('.menu-toggle').addEventListener('click', event => {
    const button = event.currentTarget; const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open)); button.setAttribute('aria-label', open ? t.menuClose : t.menuOpen);
    document.querySelector('#mobile-nav').hidden = !open;
  });
  document.querySelectorAll('#mobile-nav a').forEach(link => link.addEventListener('click', () => {
    document.querySelector('#mobile-nav').hidden = true;
    document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');
    document.querySelector('.menu-toggle').setAttribute('aria-label', t.menuOpen);
  }));
  const github = safeURL(site.github);
  const links = [github ? `<a href="${e(github)}" target="_blank" rel="noopener noreferrer">GitHub</a>` : '', site.email ? `<a href="mailto:${e(site.email)}" aria-label="${t.email}">${icon('mail')}</a>` : ''].join('');
  document.querySelector('#footer').innerHTML = `<div class="footer-bottom"><span>© ${e(site.name)} ${new Date().getFullYear()}</span><nav class="footer-nav" aria-label="${t.explore}">${links}${editorEnabled ? `<a href="${editorURL('#settings')}">${t.editSite}</a>` : ''}<a href="#blog" data-back-top>${t.top}</a></nav></div>`;
  document.querySelector('[data-back-top]').addEventListener('click', () => window.scrollTo({ top: 0 }));
}
function updateNav() {
  const current = location.hash === '#about' ? 'about' : 'blog';
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.dataset.nav === current) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
}
function blogPage() {
  const site = siteCopy();
  const allPosts = publishedPosts(content.posts, language);
  const topics = visibleTopics(site.topics, allPosts);
  const params = new URLSearchParams(location.search);
  const savedTopic = params.get('topic');
  query = params.get('q') || '';
  topic = topics.includes(savedTopic) ? savedTopic : '';
  main.replaceChildren(document.querySelector('#blog-home-template').content.cloneNode(true));
  const heroImage = main.querySelector('.hero-art');
  heroImage.hidden = !site.heroImage && !editorEnabled;
  heroImage.innerHTML = imageMarkup(site.heroImage, 'hero', t.heroAlt);
  main.querySelector('.hero').classList.toggle('has-image', !heroImage.hidden);
  const title = main.querySelector('#hero-title');
  title.textContent = site.heroTitle || t.journal;
  title.classList.toggle('empty-title', !site.heroTitle);
  main.querySelector('.hero-description').textContent = site.heroDescription;
  const startPost = startHerePost(allPosts);
  const startLink = main.querySelector('[data-start-post]');
  startLink.hidden = !startPost;
  if (startPost) {
    startLink.href = postLink(startPost);
    startLink.querySelector('span').textContent = `${t.startHere} · ${startPost.title}`;
  }
  main.querySelector('.search-area').hidden = false;
  main.querySelector('label[for="search"]').textContent = t.search;
  const search = main.querySelector('#search');
  search.placeholder = t.searchPlaceholder; search.value = query;
  main.querySelector('#topics-title').textContent = t.topics;
  main.querySelectorAll('[data-home-text]').forEach(element => { element.textContent = t[element.dataset.homeText]; });
  const caption = main.querySelector('.search-caption');
  caption.hidden = !editorEnabled || allPosts.length > 0;
  const editorLink = caption.querySelector('a');
  editorLink.href = editorURL(); editorLink.textContent = t.firstStory;
  const aboutImage = main.querySelector('.about-image'), aboutStrip = main.querySelector('.about-strip');
  aboutImage.hidden = !site.aboutImage && !editorEnabled;
  aboutImage.innerHTML = imageMarkup(site.aboutImage, 'about', t.aboutAlt);
  aboutStrip.hidden = !hasAbout(site) && !editorEnabled;
  aboutStrip.classList.toggle('has-image', !aboutImage.hidden);
  main.querySelector('.about-strip-copy h2').textContent = site.aboutTitle || t.about;
  const role = main.querySelector('[data-about-role]');
  role.hidden = !site.role; role.textContent = site.role;
  main.querySelector('.browse').hidden = !topics.length;
  document.querySelector('#topics').innerHTML = topics.length ? ['', ...topics].map(value => `<button class="topic ${topic === value ? 'selected' : ''}" type="button" aria-pressed="${topic === value}" data-topic="${e(value)}">${e(value || t.all)}</button>`).join('') : '';
  document.querySelectorAll('[data-topic]').forEach(button => button.addEventListener('click', () => {
    topic = button.dataset.topic; visibleCount = 12;
    saveBrowseState();
    document.querySelectorAll('[data-topic]').forEach(b => { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    renderResults();
  }));
  const clear = document.querySelector('#clear-search'); clear.setAttribute('aria-label', t.clearSearch);
  const updateSearch = value => { query = value; visibleCount = 12; clear.hidden = !query; saveBrowseState(); renderResults(); };
  clear.hidden = !query;
  search.addEventListener('input', event => updateSearch(event.target.value));
  clear.addEventListener('click', () => { search.value = ''; updateSearch(''); search.focus(); });
  search.addEventListener('keydown', event => { if (event.key === 'Escape') { search.value = ''; updateSearch(''); } });
  renderResults();
}
function renderResults() {
  const allPosts = publishedPosts(content.posts, language);
  const needle = query.trim().toLocaleLowerCase(language);
  const posts = allPosts.filter(p => (!topic || p.tags.includes(topic)) && (!needle || `${p.title} ${p.description} ${p.tags.join(' ')} ${p.body}`.toLocaleLowerCase(language).includes(needle)));
  document.querySelector('#post-count').textContent = posts.length;
  const count = document.querySelector('#search-total'); if (count) { count.textContent = posts.length; count.parentElement.hidden = !posts.length; count.parentElement.setAttribute('aria-label', t.count(posts.length)); }
  let html = '';
  if (posts.length) {
    html = `<div class="post-list">${posts.slice(0, visibleCount).map(post => `<article class="post-card"><div class="post-copy"><h3><a href="${postLink(post)}">${e(post.title)}</a></h3>${post.description ? `<p class="post-excerpt">${e(post.description)}</p>` : ''}<div class="post-meta"><time datetime="${e(post.date)}">${dateText(post.date, language)}</time><span>${t.minutes(readTime(post.body))}</span>${post.featured ? `<span class="post-feature-label">${icon('pin')} ${t.featured}</span>` : ''}</div></div>${post.image ? `<a href="${postLink(post)}" class="post-image" aria-label="${e(t.readLabel(post.title))}">${imageMarkup(post.image, 'cover', post.title)}</a>` : ''}</article>`).join('')}</div>${posts.length > visibleCount ? `<div class="end-note"><button class="button" id="load-more">${t.more} ${icon('plus')}</button></div>` : ''}`;
  } else if (!allPosts.length) {
    const alternate = otherLanguage(language);
    const hasOtherPosts = publishedPosts(content.posts, alternate).length > 0;
    html = `<div class="empty-feature"><h3>${t.noPosts}</h3>${hasOtherPosts ? `<a class="text-link" href="?lang=${alternate}">${t.otherLanguagePosts} ${icon('arrow')}</a>` : ''}</div>`;
  }
  else html = `<div class="empty-state"><h3>${t.noResults}</h3><p>${t.searchAgain}</p><button class="button" id="reset-search">${t.allArticles}</button></div>`;
  document.querySelector('#results').innerHTML = html;
  document.querySelector('#reset-search')?.addEventListener('click', () => { topic = ''; query = ''; visibleCount = 12; saveBrowseState(); blogPage(); document.querySelector('#search').focus(); });
  document.querySelector('#load-more')?.addEventListener('click', () => { visibleCount += 12; renderResults(); });
  bindImageFallbacks();
}
function aboutPage() {
  const site = siteCopy();
  const hasImage = Boolean(site.aboutImage) || editorEnabled;
  main.innerHTML = `<section class="about-page ${hasImage ? 'has-image' : ''}"><div><h1>${e(site.aboutTitle || t.about)}</h1>${site.role ? `<p class="about-role">${e(site.role)}</p>` : ''}<div class="prose">${markdown(site.aboutText)}</div>${editorEnabled ? `<a class="text-link about-edit" href="${editorURL('#settings')}">${t.editAbout}</a>` : ''}</div><div class="about-art" ${hasImage ? '' : 'hidden'}>${imageMarkup(site.aboutImage, 'about', t.aboutAlt)}</div></section>`;
}
function openLegacyArticle(slug) {
  const source = content.posts.find(post => post.slug === slug && !post.draft);
  const requested = new URLSearchParams(location.search).get('lang');
  const post = postInLanguage(content.posts, slug, ['ko', 'en'].includes(requested) ? requested : source?.language || 'ko');
  if (!post) {
    main.innerHTML = `<section class="empty-state missing-article"><h1>${source ? t.missingTranslation : t.missing}</h1><p>${source ? t.translationDetail : t.missingDetail}</p>${source ? `<button class="button" id="original-language">${t.original}</button>` : `<a class="button" href="#blog">${t.backBlog}</a>`}</section>`;
    document.querySelector('#original-language')?.addEventListener('click', () => changeLanguage(source.language || 'ko'));
    return;
  }
  location.replace(postLink(post));
}
function bindImageFallbacks() {
  main.querySelectorAll('img[data-image]').forEach(img => {
    const fallback = () => {
      const thumbnail = img.closest('.post-image');
      if (thumbnail) { thumbnail.remove(); return; }
      const kind = img.dataset.image;
      if (!editorEnabled && ['hero', 'about'].includes(kind)) {
        const art = img.closest('.hero-art,.about-image,.about-art');
        if (art) { art.hidden = true; art.closest('.hero,.about-strip,.about-page')?.classList.remove('has-image'); }
        return;
      }
      const frame = img.closest('.image-frame');
      (frame || img).outerHTML = imagePlaceholder(kind, kind !== 'cover');
    };
    img.addEventListener('error', fallback, { once: true });
    if (img.complete && !img.naturalWidth) fallback();
  });
}
function route() {
  const hash = location.hash;
  document.title = `${content.site.name} — ${t.journal}`;
  if (hash.startsWith('#post/')) { let slug; try { slug = decodeURIComponent(hash.slice(6)); } catch { slug = ''; } openLegacyArticle(slug); }
  else if (hash === '#about') aboutPage();
  else blogPage();
  updateNav(); bindImageFallbacks(); window.scrollTo({ top: 0, behavior: 'instant' });
}
let refreshing = false;
async function refreshContent() {
  if (!localEditor || refreshing || document.hidden) return;
  refreshing = true;
  try {
    const authResponse = await fetch('./api/editor');
    const authenticated = authResponse.ok && (await authResponse.json()).authenticated === true;
    const authChanged = authenticated !== editorEnabled; editorEnabled = authenticated;
    const latest = await loadContent();
    if (authChanged || JSON.stringify(latest) !== JSON.stringify(content)) {
      const position = window.scrollY; content = latest; renderShell(); route(); window.scrollTo({ top: position, behavior: 'instant' });
    }
  } catch { /* Keep the current page when the local server is temporarily unavailable. */ }
  finally { refreshing = false; }
}
window.addEventListener('storage', event => { if (event.key === 'my-space-content-revision') refreshContent(); });
window.addEventListener('focus', refreshContent);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshContent(); });
async function init() {
  document.documentElement.lang = language;
  const loading = main.querySelector('.loading-state'); if (loading) loading.textContent = t.loading;
  try {
    content = await loadContent();
    try { const response = await fetch('./api/editor'); if (response.ok && response.headers.get('content-type')?.includes('application/json')) { const owner = await response.json(); localEditor = owner.enabled === true; editorEnabled = owner.authenticated === true; } } catch { /* Editing is local only. */ }
    renderShell(); route();
    window.addEventListener('hashchange', () => { if (location.hash !== '#main') route(); });
    window.addEventListener('popstate', () => { language = getLanguage(); t = messages[language]; visibleCount = 12; renderShell(); route(); });
    document.addEventListener('keydown', event => { if (event.key === '/' && !event.metaKey && !event.ctrlKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { const search = document.querySelector('#search'); if (search) { event.preventDefault(); search.focus(); } } });
  } catch {
    main.innerHTML = `<div class="empty-state"><h1>${t.errorTitle}</h1><p>${t.errorDetail}</p><button class="button" id="retry">${t.retry}</button></div>`;
    document.querySelector('#retry').addEventListener('click', () => { main.innerHTML = `<div class="loading-state" role="status">${t.loading}</div>`; init(); });
  }
}
init();
