import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHTML as e, icon, articleContent, articleToc, markdown, readTime, dateText } from '../lib.js';
import { publishedPosts, startHerePost, messages } from '../i18n.js';
import { renderProfileLinks, renderActivity, renderProjects, renderTimeline } from '../profile.js';
import { categoryForPost, categoryPosts, renderCategoryCards, renderCategoryIndex, renderCategoryPage, renderPostCategory, renderCategoryBreadcrumb, renderCategoryReturn } from '../categories.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const content = JSON.parse(await readFile(resolve(root, 'data/content.json'), 'utf8'));
const { site, categories = [] } = content;
const posts = publishedPosts(content.posts, 'ko');
const publicPosts = content.posts.filter(post => !post.draft);
const slugs = new Set();
const validSlug = value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value || '');
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
if (!/^https:\/\/.+\/$/.test(site.url || '')) throw new Error('site.url must be the absolute HTTPS blog URL, ending in /.');
for (const post of content.posts) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || slugs.has(post.slug)) throw new Error(`Invalid or duplicate post slug: ${post.slug}`);
  slugs.add(post.slug);
  if (!validDate(post.date)) throw new Error(`Invalid date in ${post.slug}`);
  if (!post.title || !post.body || !Array.isArray(post.tags)) throw new Error(`Incomplete post: ${post.slug}`);
}
if (!Array.isArray(categories)) throw new Error('categories must be an array.');
const categorySlugs = new Set();
for (const category of categories) {
  if (!validSlug(category.slug) || categorySlugs.has(category.slug)) throw new Error(`Invalid or duplicate category slug: ${category.slug}`);
  categorySlugs.add(category.slug);
  if (!category.title || !category.description || !Array.isArray(category.groups)) throw new Error(`Incomplete category: ${category.slug}`);
  const groups = new Set();
  for (const group of category.groups) {
    if (!validSlug(group.slug) || groups.has(group.slug) || !group.title) throw new Error(`Invalid or duplicate group in ${category.slug}: ${group.slug}`);
    groups.add(group.slug);
  }
  for (const group of category.translations?.en?.groups || []) {
    if (!groups.has(group.slug)) throw new Error(`Unknown translated group in ${category.slug}: ${group.slug}`);
  }
}
for (const post of publicPosts) {
  const category = categoryForPost(categories, post);
  if (!category) throw new Error(`Missing or unknown category in ${post.slug}: ${post.category || '(none)'}`);
  if (post.group && !category.groups.some(group => group.slug === post.group)) throw new Error(`Unknown group in ${post.slug}: ${post.group}`);
}
const publicSlugs = new Set(publicPosts.map(post => post.slug));
for (const post of publicPosts) {
  for (const [, slug] of post.body.matchAll(/\]\(#post\/([a-z0-9-]+)\)/g)) {
    if (!publicSlugs.has(slug)) throw new Error(`Broken article link in ${post.slug}: ${slug}`);
  }
}
for (const profile of [site, site.translations?.en].filter(Boolean)) {
  for (const item of [...(profile.activity || []), ...(profile.projects || [])]) {
    if (item.postSlug && !publicSlugs.has(item.postSlug)) throw new Error(`Broken profile link: ${item.postSlug}`);
  }
}
const canonical = path => new URL(path, site.url).href;
const jsonLD = value => JSON.stringify(value).replace(/</g, '\\u003c');
const person = { '@type': 'Person', name: site.author || site.name, alternateName: site.name, url: canonical('about/'), sameAs: [site.github] };
const langStyle = `<style>.language-switch .article-language{display:inline-grid;place-items:center;width:44px;min-height:44px;color:var(--muted);font-size:12px;font-weight:500}.language-switch .article-language[aria-current]{color:var(--ink);text-decoration:underline;text-underline-offset:6px}.language-switch a.article-language:hover{color:var(--accent)}</style>`;

function head({ title, description, path = '', base = './', language = 'ko', post, about = false, collection = false, items = [] }) {
  const url = canonical(path);
  const category = post && categoryForPost(categories, post);
  const structured = post ? { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description, inLanguage: language, datePublished: `${post.date}T00:00:00+09:00`, dateModified: `${post.updatedAt || post.date}T00:00:00+09:00`, author: person, articleSection: category?.title, mainEntityOfPage: url, url }
    : about ? { '@context': 'https://schema.org', '@type': 'AboutPage', name: title, description, url, mainEntity: person }
    : collection ? { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description, url, inLanguage: language, isPartOf: { '@type': 'Blog', name: site.name, url: site.url }, mainEntity: { '@type': 'ItemList', numberOfItems: items.length, itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.title, url: canonical(item.path) })) } }
    : { '@context': 'https://schema.org', '@type': 'Blog', name: site.name, description, url, author: person, inLanguage: ['ko', 'en'] };
  return `<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${e(description)}"><meta name="theme-color" content="#f8f9fc">
<title>${e(title)}</title><link rel="canonical" href="${e(url)}">
<link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${base}styles.css">
<link rel="alternate" type="application/rss+xml" title="${e(site.name)} RSS" href="${base}rss.xml">
<meta property="og:type" content="${post ? 'article' : 'website'}"><meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(description)}"><meta property="og:url" content="${e(url)}">
<meta property="og:site_name" content="${e(site.name)}"><meta property="og:locale" content="${language === 'en' ? 'en_US' : 'ko_KR'}">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(description)}">
${post ? `<meta property="article:published_time" content="${post.date}T00:00:00+09:00"><meta property="article:modified_time" content="${post.updatedAt || post.date}T00:00:00+09:00">` : ''}
<script type="application/ld+json">${jsonLD(structured)}</script><script src="${base}theme.js"></script>
<script type="module" src="${base}${post || about || collection ? 'article.js' : 'app.js'}"></script>${post || about || collection ? langStyle : ''}
</head>`;
}

function header(base = './', { language = 'ko', post, about = false, collection = false, categorySlug = '' } = {}) {
  const t = messages[language];
  const home = base === './' ? '#blog' : `${base}?lang=${language}`;
  const aboutLink = base === './' ? '#about' : `${base}about/`;
  const nav = `<a href="${home}"${!about && !collection ? ' aria-current="page"' : ''}>${t.blog}</a><a href="${base}categories/"${collection ? ' aria-current="page"' : ''}>${t.categories}</a><a href="${aboutLink}"${about ? ' aria-current="page"' : ''}>${t.about}</a><a class="nav-github" href="${e(site.github)}" target="_blank" rel="noopener noreferrer">GitHub ${icon('diagonal')}</a>`;
  const other = language === 'ko' ? 'en' : 'ko';
  const alternatePost = post && publicPosts.find(candidate => candidate.language === other && (candidate.translationKey || candidate.slug) === (post.translationKey || post.slug));
  const alternate = post ? alternatePost ? `${base}posts/${alternatePost.slug}/` : `${base}?lang=${other}#post/${post.slug}` : `${base}?lang=${other}${about ? '#about' : collection ? categorySlug ? `#category/${categorySlug}` : '#categories' : ''}`;
  return `<header class="site-header wrap" id="${base === './' ? 'header' : 'top'}"><div class="brand-group"><a class="brand" href="${home}" aria-label="${e(site.name)} ${t.home}">${e(site.name)}</a></div><nav aria-label="${t.explore}">${nav}</nav><div class="header-actions"><div class="language-switch" data-active="${language}" role="group" aria-label="${t.language}"><span class="article-language" lang="${language}" aria-current="true">${language.toUpperCase()}</span><a class="article-language" data-language="${other}" lang="${other}" href="${alternate}" hreflang="${other}">${other.toUpperCase()}</a></div><button type="button" class="icon-button theme-toggle" aria-label="${t.dark}" hidden>${icon('moon')}</button><button type="button" class="icon-button menu-toggle" aria-label="${t.menuOpen}" aria-expanded="false" aria-controls="mobile-nav" hidden>${icon('menu')}</button></div><div class="mobile-nav" id="mobile-nav" hidden>${nav}<button type="button" class="button mobile-theme">${t.dark}</button></div></header>`;
}
function footer(base = './', language = 'ko') {
  const t = messages[language];
  return `<footer id="footer" class="wrap"><div class="footer-bottom"><span>© ${e(site.name)} ${site.updatedAt.slice(0, 4)}</span><nav class="footer-nav" aria-label="${t.explore}"><a href="${e(site.github)}" target="_blank" rel="noopener noreferrer">GitHub</a><a href="${base}categories/">${t.categories}</a><a href="${base}rss.xml">RSS</a><a href="${base}about/">${t.about}</a><a href="#${base === './' ? 'header' : 'top'}" data-back-top>${t.top}</a></nav></div></footer>`;
}
function documentHTML({ headHTML, body, base = './', language = 'ko', post, about = false, collection = false, categorySlug = '', extra = '' }) {
  return `<!doctype html>\n<html lang="${language}" data-static="true">${headHTML}<body><a class="skip-link" href="#main">${messages[language].skip}</a>${header(base, { language, post, about, collection, categorySlug })}<main id="main" class="wrap" tabindex="-1">${body}</main>${footer(base, language)}${extra}<div id="toast" class="toast" role="status" aria-live="polite"></div><noscript><p class="wrap">${messages[language].noScript} <a href="${base}about/">${messages[language].about}</a></p></noscript></body></html>\n`;
}
function postList(items, base = './') {
  return `<div class="post-list">${items.map(post => `<article class="post-card"><div class="post-copy"><h3><a href="${base}posts/${post.slug}/">${e(post.title)}</a></h3>${post.description ? `<p class="post-excerpt">${e(post.description)}</p>` : ''}<div class="post-meta">${renderPostCategory(categories, post, 'ko', { base })}<time datetime="${post.date}">${dateText(post.date, 'ko')}</time><span>${messages.ko.minutes(readTime(post.body))}</span>${post.featured ? `<span class="post-feature-label">${icon('pin')} ${messages.ko.featured}</span>` : ''}</div></div></article>`).join('')}</div>`;
}
function homeScaffold(enhanced = false) {
  const start = startHerePost(posts);
  const startLink = `<a class="text-link hero-start" data-start-post${start ? ` href="./posts/${start.slug}/"` : ' hidden'}><span>${start ? `${messages.ko.startHere} · ${e(start.title)}` : ''}</span>${icon('arrow')}</a>`;
  return `<section class="hero" aria-labelledby="hero-title"><div class="hero-art" hidden></div><div class="hero-copy"><h1 id="hero-title">${e(site.heroTitle)}</h1><p class="hero-description">${e(site.heroDescription)}</p>${enhanced ? `<div class="hero-actions">${renderProfileLinks(site, 'ko')}</div>` : ''}${startLink}<div class="search-area" hidden><div class="search-box">${icon('search')}<label class="sr-only" for="search">${messages.ko.search}</label><input type="search" id="search" placeholder="글 검색하기" autocomplete="off"><button id="clear-search" class="search-clear" type="button" hidden aria-label="검색 지우기">${icon('close')}</button><span class="search-count" hidden><span id="search-total">0</span></span></div><p class="search-caption" hidden><a data-home-editor href="./editor.html">첫 글 작성</a></p></div></div></section>
${enhanced ? renderCategoryCards(categories, publicPosts, 'ko') + renderActivity(site, 'ko', { limit: 3 }) : ''}
<section class="browse" aria-labelledby="topics-title" hidden><h2 id="topics-title">주제</h2><div class="topic-list" id="topics"></div></section><section class="articles" aria-labelledby="articles-title"><div class="section-heading"><h2 id="articles-title"><span data-home-text="articles">글 목록</span> <span id="post-count">${enhanced ? posts.length : 0}</span></h2></div><div id="results" aria-live="polite" aria-atomic="false">${enhanced ? postList(posts) : '<div class="empty-feature"><h3>기록을 불러오는 중입니다.</h3></div>'}</div></section>
${enhanced ? renderProjects(site, 'ko', { limit: 3 }) : ''}
<section class="about-strip"><div class="about-image" hidden></div><div class="about-strip-copy"><h2>${e(site.aboutTitle)}</h2><p data-about-role>${e(site.role)}</p><a class="text-link" href="${enhanced ? './about/' : '#about'}"><span data-home-text="aboutMe">소개 보기</span><span class="round-arrow">${icon('arrow')}</span></a></div></section>`;
}

const output = new Map();
// Readable Markdown copies are generated from the same content as the website.
const reviewPosts = publicPosts.filter(post => post.exportMarkdown);
const reviewLink = slug => reviewPosts.some(post => post.slug === slug) ? `./${slug}.md` : canonical(`posts/${slug}/`);
for (const post of reviewPosts) {
  const body = post.body.replace(/\]\(#post\/([a-z0-9-]+)\)/g, (_, slug) => `](${reviewLink(slug)})`);
  output.set(`writing/${post.slug}.md`, `# ${post.title}\n\n${post.description}\n\n작성일: ${post.date}\n\n${body.replace(/^# /gm, '## ')}`);
}
const profileReview = `# ${site.aboutTitle}\n\n${site.role}\n\n[GitHub](${site.github}) · [블로그 코드](${site.profileRepository})\n\n마지막 수정: ${site.updatedAt}\n\n${site.aboutText.replace(/^# /gm, '## ')}\n\n## 요즘 하는 것\n\n${site.activity.map(item => `### ${item.title}\n\n${item.status} — ${item.detail}\n\n[관련 글](${reviewLink(item.postSlug)})`).join('\n\n')}\n\n## 만들어 본 것들\n\n${site.projects.map(item => `### ${item.name}\n\n${item.period} · ${item.role}\n\n${item.description}\n\n기술: ${item.tags.join(', ')}\n\n${item.url ? `[저장소](${item.url}) · ` : ''}[관련 글](${reviewLink(item.postSlug)})`).join('\n\n')}\n\n## 그동안의 기록\n\n${site.timeline.map(item => `### ${item.date} · ${item.title}\n\n${item.detail}`).join('\n\n')}\n`;
output.set('writing/about.md', profileReview);
output.set('index.html', documentHTML({ headHTML: head({ title: `${site.name} — 코딩이랑 홈서버 이야기`, description: site.heroDescription }), body: homeScaffold(true), extra: `<template id="blog-home-template">${homeScaffold(false)}</template>` }));
const aboutBody = `<section class="about-page"><div><h1>${e(site.aboutTitle)}</h1><p class="about-role">${e(site.role)}</p>${renderProfileLinks(site, 'ko', { base: '../' })}<div class="prose">${markdown(site.aboutText)}</div></div></section>${renderActivity(site, 'ko', { base: '../' })}${renderProjects(site, 'ko', { base: '../' })}${renderTimeline(site, 'ko')}`;
output.set('about/index.html', documentHTML({ headHTML: head({ title: `${site.aboutTitle} — ${site.name}`, description: site.role + '. ' + site.heroDescription, path: 'about/', base: '../', about: true }), body: aboutBody, base: '../', about: true }));

output.set('categories/index.html', documentHTML({
  headHTML: head({ title: `${messages.ko.categories} — ${site.name}`, description: '대회 참가, 취미·홈서버, 학교 프로젝트와 블로그 안내를 나눠서 읽어 보세요.', path: 'categories/', base: '../', collection: true, items: categories.map(category => ({ title: category.title, path: `categories/${category.slug}/` })) }),
  body: renderCategoryIndex(categories, publicPosts, 'ko', { base: '../' }), base: '../', collection: true,
}));
for (const category of categories) {
  const items = categoryPosts(publicPosts, category.slug);
  output.set(`categories/${category.slug}/index.html`, documentHTML({
    headHTML: head({ title: `${category.title} — ${site.name}`, description: category.description, path: `categories/${category.slug}/`, base: '../../', collection: true, items: items.map(post => ({ title: post.title, path: `posts/${post.slug}/` })) }),
    body: renderCategoryPage(category, publicPosts, 'ko', { base: '../../' }), base: '../../', collection: true, categorySlug: category.slug,
  }));
}

for (const post of publicPosts) {
  const language = post.language || 'ko', t = messages[language], base = '../../';
  const rendered = articleContent(post.body, { base });
  const related = publicPosts.filter(other => other.slug !== post.slug && other.category === post.category && (other.language || 'ko') === language).map(other => ({ post: other, weight: Number(Boolean(post.group) && other.group === post.group) * 10 + other.tags.filter(tag => post.tags.includes(tag)).length })).sort((a,b) => b.weight - a.weight || b.post.date.localeCompare(a.post.date)).slice(0, 3).map(item => item.post);
  const image = post.image ? `<figure class="article-cover"><img src="${e(post.image.startsWith('./') ? base + post.image.slice(2) : post.image)}" alt="${e(post.title)}"></figure>` : '';
  const relatedHTML = related.length ? `<h2 id="related-title">${language === 'ko' ? '같은 분류에서 더 읽기' : 'More in this category'}</h2><ul>${related.map(other => `<li><a href="../${other.slug}/">${e(other.title)}</a></li>`).join('')}</ul>` : '';
  const body = `<article class="article-page">${renderCategoryBreadcrumb(categories, post, language, { base })}<a class="text-link back-link" data-article-back href="${base}?lang=${language}">${icon('back')}${t.back}</a><header class="article-header"><h1>${e(post.title)}</h1><p>${e(post.description)}</p><div class="article-byline"><a href="${base}about/"><strong>${e(site.name)}</strong></a><time datetime="${post.date}">${dateText(post.date, language)}</time>${post.updatedAt && post.updatedAt !== post.date ? `<span>${language === 'ko' ? '수정' : 'Updated'} ${dateText(post.updatedAt, language)}</span>` : ''}<span>${t.minutes(readTime(post.body))}</span><button type="button" class="copy-card" id="copy-link" aria-label="${t.copy}" hidden>${icon('link')}<span>${t.copy}</span></button></div></header>${image}${articleToc(rendered.headings, t.toc)}<div class="prose article-body">${rendered.html}</div><section class="article-related" ${related.length ? 'aria-labelledby="related-title"' : `aria-label="${t.explore}"`}>${relatedHTML}${renderCategoryReturn(categories, post, language, { base })}<a class="text-link" data-article-back href="${base}?lang=${language}">${t.back}</a></section></article>`;
  output.set(`posts/${post.slug}/index.html`, documentHTML({ headHTML: head({ title: `${post.title} — ${site.name}`, description: post.description, path: `posts/${post.slug}/`, base, language, post }), body, base, language, post }));
}

const rssPosts = [...publicPosts].sort((a,b) => b.date.localeCompare(a.date));
output.set('rss.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${e(site.name)} — 코딩이랑 홈서버 이야기</title><link>${e(site.url)}</link><description>${e(site.heroDescription)}</description><language>ko</language><atom:link href="${e(canonical('rss.xml'))}" rel="self" type="application/rss+xml"/>${rssPosts.map(post => `<item><title>${e(post.title)}</title><link>${e(canonical(`posts/${post.slug}/`))}</link><guid isPermaLink="true">${e(canonical(`posts/${post.slug}/`))}</guid><pubDate>${new Date(`${post.date}T00:00:00+09:00`).toUTCString()}</pubDate><description>${e(post.description)}</description><category domain="${e(canonical('categories/'))}">${e(categoryForPost(categories, post).title)}</category>${post.tags.map(tag => `<category>${e(tag)}</category>`).join('')}</item>`).join('')}</channel></rss>\n`);
const sitemapEntries = [{ path: '', date: site.updatedAt }, { path: 'about/', date: site.updatedAt }, { path: 'categories/', date: site.updatedAt }, ...categories.map(category => ({ path: `categories/${category.slug}/`, date: [site.updatedAt, ...categoryPosts(publicPosts, category.slug).map(post => post.updatedAt || post.date)].sort().at(-1) })), ...publicPosts.map(post => ({ path: `posts/${post.slug}/`, date: post.updatedAt || post.date }))];
output.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapEntries.map(({path,date}) => `<url><loc>${e(canonical(path))}</loc><lastmod>${date}</lastmod></url>`).join('')}</urlset>\n`);
output.set('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${canonical('sitemap.xml')}\n`);
const generatedPages = ['index.html', 'about/index.html', 'categories/index.html', ...categories.map(category => `categories/${category.slug}/index.html`), ...publicPosts.map(post => `posts/${post.slug}/index.html`), 'writing/about.md', ...reviewPosts.map(post => `writing/${post.slug}.md`)];
const manifestPath = 'data/generated-pages.json';
let previous = [];
try { previous = JSON.parse(await readFile(resolve(root, manifestPath), 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (!Array.isArray(previous) || previous.some(path => !/^(?:index\.html|about\/index\.html|categories\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)?index\.html|posts\/[a-z0-9]+(?:-[a-z0-9]+)*\/index\.html|writing\/[a-z0-9]+(?:-[a-z0-9]+)*\.md)$/.test(path))) throw new Error('Invalid generated-page manifest');
output.set(manifestPath, JSON.stringify(generatedPages, null, 2) + '\n');
const stale = previous.filter(path => !generatedPages.includes(path));
let differences = 0;
for (const [path, body] of output) {
  const target = resolve(root, path);
  if (check) {
    let current; try { current = await readFile(target, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (current !== body) { console.error(`Out of date: ${path}`); differences++; }
  } else { await mkdir(dirname(target), { recursive: true }); await writeFile(target, body); }
}
for (const path of stale) {
  if (check) { console.error(`Stale generated page: ${path}`); differences++; }
  else await rm(resolve(root, path), { force: true });
}
if (differences) { process.exitCode = 1; console.error('Run npm run build to update the static pages.'); }
else console.log(`${check ? 'Verified' : 'Generated'} ${publicPosts.length} articles, ${categories.length} categories, home, about, RSS, and sitemap.`);
