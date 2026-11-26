import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHTML as e, icon, articleContent, articleToc, markdown, readTime, dateText } from '../lib.js';
import { publishedPosts, startHerePost, messages } from '../i18n.js';
import { renderProfileLinks, renderActivity, renderProjects, renderTimeline } from '../profile.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const content = JSON.parse(await readFile(resolve(root, 'data/content.json'), 'utf8'));
const { site } = content;
const posts = publishedPosts(content.posts, 'ko');
const publicPosts = content.posts.filter(post => !post.draft);
const slugs = new Set();
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
if (!/^https:\/\/.+\/$/.test(site.url || '')) throw new Error('site.url must be the absolute HTTPS blog URL, ending in /.');
for (const post of content.posts) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || slugs.has(post.slug)) throw new Error(`Invalid or duplicate post slug: ${post.slug}`);
  slugs.add(post.slug);
  if (!validDate(post.date)) throw new Error(`Invalid date in ${post.slug}`);
  if (!post.title || !post.body || !Array.isArray(post.tags)) throw new Error(`Incomplete post: ${post.slug}`);
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

function head({ title, description, path = '', base = './', language = 'ko', post, about = false }) {
  const url = canonical(path);
  const structured = post ? { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description, inLanguage: language, datePublished: `${post.date}T00:00:00+09:00`, dateModified: `${post.updatedAt || post.date}T00:00:00+09:00`, author: person, mainEntityOfPage: url, url }
    : about ? { '@context': 'https://schema.org', '@type': 'AboutPage', name: title, description, url, mainEntity: person }
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
<script type="module" src="${base}${post || about ? 'article.js' : 'app.js'}"></script>${post || about ? langStyle : ''}
</head>`;
}

function header(base = './', { language = 'ko', post, about = false } = {}) {
  const t = messages[language];
  const home = base === './' ? '#blog' : `${base}?lang=${language}`;
  const aboutLink = base === './' ? '#about' : `${base}about/`;
  const nav = `<a href="${home}"${!about ? ' aria-current="page"' : ''}>${t.blog}</a><a href="${aboutLink}"${about ? ' aria-current="page"' : ''}>${t.about}</a><a class="nav-github" href="${e(site.github)}" target="_blank" rel="noopener noreferrer">GitHub ${icon('diagonal')}</a>`;
  const other = language === 'ko' ? 'en' : 'ko';
  const alternatePost = post && publicPosts.find(candidate => candidate.language === other && (candidate.translationKey || candidate.slug) === (post.translationKey || post.slug));
  const alternate = post ? alternatePost ? `${base}posts/${alternatePost.slug}/` : `${base}?lang=${other}#post/${post.slug}` : `${base}?lang=${other}${about ? '#about' : ''}`;
  return `<header class="site-header wrap" id="${base === './' ? 'header' : 'top'}"><div class="brand-group"><a class="brand" href="${home}" aria-label="${e(site.name)} ${t.home}">${e(site.name)}</a></div><nav aria-label="${t.explore}">${nav}</nav><div class="header-actions"><div class="language-switch" data-active="${language}" role="group" aria-label="${t.language}"><span class="article-language" lang="${language}" aria-current="true">${language.toUpperCase()}</span><a class="article-language" data-language="${other}" lang="${other}" href="${alternate}" hreflang="${other}">${other.toUpperCase()}</a></div><button type="button" class="icon-button theme-toggle" aria-label="${t.dark}" hidden>${icon('moon')}</button><button type="button" class="icon-button menu-toggle" aria-label="${t.menuOpen}" aria-expanded="false" aria-controls="mobile-nav" hidden>${icon('menu')}</button></div><div class="mobile-nav" id="mobile-nav" hidden>${nav}<button type="button" class="button mobile-theme">${t.dark}</button></div></header>`;
}
function footer(base = './', language = 'ko') {
  const t = messages[language];
  return `<footer id="footer" class="wrap"><div class="footer-bottom"><span>© ${e(site.name)} ${site.updatedAt.slice(0, 4)}</span><nav class="footer-nav" aria-label="${t.explore}"><a href="${e(site.github)}" target="_blank" rel="noopener noreferrer">GitHub</a><a href="${base}rss.xml">RSS</a><a href="${base}about/">${t.about}</a><a href="#${base === './' ? 'header' : 'top'}" data-back-top>${t.top}</a></nav></div></footer>`;
}
function documentHTML({ headHTML, body, base = './', language = 'ko', post, about = false, extra = '' }) {
  return `<!doctype html>\n<html lang="${language}" data-static="true">${headHTML}<body><a class="skip-link" href="#main">${messages[language].skip}</a>${header(base, { language, post, about })}<main id="main" class="wrap" tabindex="-1">${body}</main>${footer(base, language)}${extra}<div id="toast" class="toast" role="status" aria-live="polite"></div><noscript><p class="wrap">${messages[language].noScript} <a href="${base}about/">${messages[language].about}</a></p></noscript></body></html>\n`;
}
function postList(items, base = './') {
  return `<div class="post-list">${items.map(post => `<article class="post-card"><div class="post-copy"><h3><a href="${base}posts/${post.slug}/">${e(post.title)}</a></h3>${post.description ? `<p class="post-excerpt">${e(post.description)}</p>` : ''}<div class="post-meta"><time datetime="${post.date}">${dateText(post.date, 'ko')}</time><span>${messages.ko.minutes(readTime(post.body))}</span>${post.featured ? `<span class="post-feature-label">${icon('pin')} ${messages.ko.featured}</span>` : ''}</div></div></article>`).join('')}</div>`;
}
function homeScaffold(enhanced = false) {
  const start = startHerePost(posts);
  return `<section class="hero" aria-labelledby="hero-title"><div class="hero-art" hidden></div><div class="hero-copy"><h1 id="hero-title">${e(site.heroTitle)}</h1><p class="hero-description">${e(site.heroDescription)}</p>${enhanced ? `<div class="hero-actions">${renderProfileLinks(site, 'ko')}</div>` : ''}<a class="text-link hero-start" data-start-post href="./posts/${start.slug}/"><span>${messages.ko.startHere} · ${e(start.title)}</span>${icon('arrow')}</a><div class="search-area" hidden><div class="search-box">${icon('search')}<label class="sr-only" for="search">${messages.ko.search}</label><input type="search" id="search" placeholder="글 검색하기" autocomplete="off"><button id="clear-search" class="search-clear" type="button" hidden aria-label="검색 지우기">${icon('close')}</button><span class="search-count" hidden><span id="search-total">0</span></span></div><p class="search-caption" hidden><a data-home-editor href="./editor.html">첫 글 작성</a></p></div></div></section>
${enhanced ? renderActivity(site, 'ko', { limit: 3 }) : ''}
<section class="browse" aria-labelledby="topics-title" hidden><h2 id="topics-title">주제</h2><div class="topic-list" id="topics"></div></section><section class="articles" aria-labelledby="articles-title"><div class="section-heading"><h2 id="articles-title"><span data-home-text="articles">글 목록</span> <span id="post-count">${enhanced ? posts.length : 0}</span></h2></div><div id="results" aria-live="polite" aria-atomic="false">${enhanced ? postList(posts) : '<div class="empty-feature"><h3>기록을 불러오는 중입니다.</h3></div>'}</div></section>
${enhanced ? renderProjects(site, 'ko', { limit: 3 }) : ''}
<section class="about-strip"><div class="about-image" hidden></div><div class="about-strip-copy"><h2>${e(site.aboutTitle)}</h2><p data-about-role>${e(site.role)}</p><a class="text-link" href="${enhanced ? './about/' : '#about'}"><span data-home-text="aboutMe">소개 보기</span><span class="round-arrow">${icon('arrow')}</span></a></div></section>`;
}

const output = new Map();
// Readable review copies are generated from the same content as the website.
const reviewPosts = publicPosts.filter(post => post.exportMarkdown);
const reviewLink = slug => reviewPosts.some(post => post.slug === slug) ? `./${slug}.md` : canonical(`posts/${slug}/`);
for (const post of reviewPosts) {
  const body = post.body.replace(/\]\(#post\/([a-z0-9-]+)\)/g, (_, slug) => `](${reviewLink(slug)})`);
  output.set(`writing/${post.slug}.md`, `# ${post.title}\n\n${post.description}\n\n작성일: ${post.date}\n\n${body.replace(/^# /gm, '## ')}`);
}
const profileReview = `# ${site.aboutTitle}\n\n${site.role}\n\n[GitHub](${site.github}) · [블로그 소스](${site.profileRepository})\n\n소개 업데이트: ${site.updatedAt}\n\n${site.aboutText.replace(/^# /gm, '## ')}\n\n## 최근 작업\n\n${site.activity.map(item => `### ${item.title}\n\n${item.status} — ${item.detail}\n\n[관련 글](${reviewLink(item.postSlug)})`).join('\n\n')}\n\n## 만들어온 것\n\n${site.projects.map(item => `### ${item.name}\n\n${item.period} · ${item.role}\n\n${item.description}\n\n기술: ${item.tags.join(', ')}\n\n${item.url ? `[저장소](${item.url}) · ` : ''}[관련 글](${reviewLink(item.postSlug)})`).join('\n\n')}\n\n## 기록의 흐름\n\n${site.timeline.map(item => `### ${item.date} · ${item.title}\n\n${item.detail}`).join('\n\n')}\n`;
output.set('writing/about.md', profileReview);
output.set('index.html', documentHTML({ headHTML: head({ title: `${site.name} — 개발과 서버 기록`, description: site.heroDescription }), body: homeScaffold(true), extra: `<template id="blog-home-template">${homeScaffold(false)}</template>` }));
const aboutBody = `<section class="about-page"><div><h1>${e(site.aboutTitle)}</h1><p class="about-role">${e(site.role)}</p>${renderProfileLinks(site, 'ko', { base: '../' })}<div class="prose">${markdown(site.aboutText)}</div></div></section>${renderActivity(site, 'ko', { base: '../' })}${renderProjects(site, 'ko', { base: '../' })}${renderTimeline(site, 'ko')}`;
output.set('about/index.html', documentHTML({ headHTML: head({ title: `${site.aboutTitle} — ${site.name}`, description: site.role + '. ' + site.heroDescription, path: 'about/', base: '../', about: true }), body: aboutBody, base: '../', about: true }));

for (const post of publicPosts) {
  const language = post.language || 'ko', t = messages[language], base = '../../';
  const rendered = articleContent(post.body, { base });
  const related = publicPosts.filter(other => other.slug !== post.slug && (other.language || 'ko') === language).map(other => ({ post: other, weight: other.tags.filter(tag => post.tags.includes(tag)).length })).filter(item => item.weight > 0).sort((a,b) => b.weight - a.weight || b.post.date.localeCompare(a.post.date)).slice(0, 3).map(item => item.post);
  const image = post.image ? `<figure class="article-cover"><img src="${e(post.image.startsWith('./') ? base + post.image.slice(2) : post.image)}" alt="${e(post.title)}"></figure>` : '';
  const body = `<article class="article-page"><a class="text-link back-link" data-article-back href="${base}?lang=${language}">${icon('back')}${t.back}</a><header class="article-header"><h1>${e(post.title)}</h1><p>${e(post.description)}</p><div class="article-byline"><a href="${base}about/"><strong>${e(site.name)}</strong></a><time datetime="${post.date}">${dateText(post.date, language)}</time>${post.updatedAt && post.updatedAt !== post.date ? `<span>${language === 'ko' ? '수정' : 'Updated'} ${dateText(post.updatedAt, language)}</span>` : ''}<span>${t.minutes(readTime(post.body))}</span><button type="button" class="copy-card" id="copy-link" aria-label="${t.copy}" hidden>${icon('link')}<span>${t.copy}</span></button></div></header>${image}${articleToc(rendered.headings, t.toc)}<div class="prose article-body">${rendered.html}</div><section class="article-related" aria-labelledby="related-title"><h2 id="related-title">${language === 'ko' ? '이어서 읽기' : 'Read next'}</h2><ul>${related.map(other => `<li><a href="../${other.slug}/">${e(other.title)} ${icon('arrow')}</a></li>`).join('')}</ul><a class="text-link" data-article-back href="${base}?lang=${language}">${t.back}</a></section></article>`;
  output.set(`posts/${post.slug}/index.html`, documentHTML({ headHTML: head({ title: `${post.title} — ${site.name}`, description: post.description, path: `posts/${post.slug}/`, base, language, post }), body, base, language, post }));
}

const rssPosts = [...publicPosts].sort((a,b) => b.date.localeCompare(a.date));
output.set('rss.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${e(site.name)} — 개발과 서버 기록</title><link>${e(site.url)}</link><description>${e(site.heroDescription)}</description><language>ko</language><atom:link href="${e(canonical('rss.xml'))}" rel="self" type="application/rss+xml"/>${rssPosts.map(post => `<item><title>${e(post.title)}</title><link>${e(canonical(`posts/${post.slug}/`))}</link><guid isPermaLink="true">${e(canonical(`posts/${post.slug}/`))}</guid><pubDate>${new Date(`${post.date}T00:00:00+09:00`).toUTCString()}</pubDate><description>${e(post.description)}</description>${post.tags.map(tag => `<category>${e(tag)}</category>`).join('')}</item>`).join('')}</channel></rss>\n`);
const sitemapEntries = [{ path: '', date: site.updatedAt }, { path: 'about/', date: site.updatedAt }, ...publicPosts.map(post => ({ path: `posts/${post.slug}/`, date: post.updatedAt || post.date }))];
output.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapEntries.map(({path,date}) => `<url><loc>${e(canonical(path))}</loc><lastmod>${date}</lastmod></url>`).join('')}</urlset>\n`);
output.set('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${canonical('sitemap.xml')}\n`);
const generatedPages = ['index.html', 'about/index.html', ...publicPosts.map(post => `posts/${post.slug}/index.html`), 'writing/about.md', ...reviewPosts.map(post => `writing/${post.slug}.md`)];
const manifestPath = 'data/generated-pages.json';
let previous = [];
try { previous = JSON.parse(await readFile(resolve(root, manifestPath), 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (!Array.isArray(previous) || previous.some(path => !/^(?:index\.html|about\/index\.html|posts\/[a-z0-9]+(?:-[a-z0-9]+)*\/index\.html|writing\/[a-z0-9]+(?:-[a-z0-9]+)*\.md)$/.test(path))) throw new Error('Invalid generated-page manifest');
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
else console.log(`${check ? 'Verified' : 'Generated'} ${publicPosts.length} articles, home, about, RSS, and sitemap.`);
