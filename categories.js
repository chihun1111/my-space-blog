import { escapeHTML as e, dateText, readTime } from './lib.js';

const labels = {
  ko: {
    title: '글 모음', intro: '관심 있는 이야기를 골라서 읽어 보세요.',
    browse: '글 모음', navigation: '관련 글 모음',
    all: '글 모음', posts: '글 목록', other: '그 밖의 글',
    empty: '아직 올린 글이 없어요. 다른 글 모음도 둘러보세요.',
    emptyGroup: '이 주제의 글은 아직 없어요.', untitled: '제목 없는 글',
    missing: '글 모음을 찾을 수 없어요.', korean: '한국어', english: '영어',
    minutes: count => `${count}분 읽기`, collection: title => `${title} 글 모음`,
    back: title => `${title} 글 목록으로 돌아가기`,
  },
  en: {
    title: 'Post collections', intro: 'Pick a topic and find something to read.',
    browse: 'Post collections', navigation: 'Related post collection',
    all: 'Post collections', posts: 'Posts', other: 'Other posts',
    empty: 'No posts here yet. There are other collections to explore.',
    emptyGroup: 'No posts on this topic yet.', untitled: 'Untitled post',
    missing: 'Collection not found.', korean: 'Korean', english: 'English',
    minutes: count => `${count} min read`, collection: title => `${title} posts`,
    back: title => `Back to ${title}`,
  },
};

const copy = language => labels[language] || labels.ko;
const records = value => Array.isArray(value) ? value.filter(item => item && typeof item === 'object') : [];
const validSlug = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
// These helpers link within the generated site. Accept only directory traversal
// prefixes used by its root, category index, and nested article pages.
const safeBase = (value, fallback = './') => typeof value === 'string' && /^(?:\.\/)?(?:\.\.\/)*$/.test(value) && value ? value : fallback;
const uniqueSlugs = values => {
  const seen = new Set();
  return records(values).filter(item => {
    if (!validSlug(item.slug) || seen.has(item.slug)) return false;
    seen.add(item.slug); return true;
  });
};
const translated = (value, fallback) => typeof value === 'string' && value.trim() ? value : fallback || '';
const categoryIndexURL = (base, language) => language === 'en' ? `${base}?lang=en#categories` : `${base}categories/`;
const categoryURL = (slug, base, language) => language === 'en' ? `${base}?lang=en#category/${slug}` : `${base}categories/${slug}/`;
const groupURL = (category, group, base, language) => `${categoryURL(category.slug, base, language)}${language === 'en' ? '' : `#group-${group.slug}`}`;
const groupForPost = (category, post) => uniqueSlugs(category?.groups).find(group => group.slug === post?.group) || null;

export function localizedCategory(category, language = 'ko') {
  if (!category || typeof category !== 'object') return null;
  const translation = language === 'en' ? category.translations?.en : null;
  const translatedGroups = uniqueSlugs(translation?.groups);
  return {
    ...category,
    title: translated(translation?.title, category.title),
    description: translated(translation?.description, category.description),
    groups: uniqueSlugs(category.groups).map(group => {
      const alternate = translatedGroups.find(item => item.slug === group.slug);
      return { ...group, title: translated(alternate?.title, group.title), description: translated(alternate?.description, group.description) };
    }),
  };
}

export function categoryForPost(categories, post) {
  if (!validSlug(post?.category)) return null;
  return uniqueSlugs(categories).find(category => category.slug === post.category) || null;
}

export function categoryPosts(posts, slug) {
  if (!validSlug(slug)) return [];
  return records(posts).filter(post => !post.draft && post.category === slug && validSlug(post.slug))
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || String(b.date || '').localeCompare(String(a.date || '')));
}

export function renderCategoryCards(categories, posts, language = 'ko', { base = './', heading = true } = {}) {
  const items = uniqueSlugs(categories);
  if (!items.length) return '';
  const t = copy(language), prefix = safeBase(base);
  const links = items.map(item => {
    const category = localizedCategory(item, language);
    return `<li><a href="${e(categoryURL(item.slug, prefix, language))}">${e(category.title)}</a>${!heading && category.description ? `<p>${e(category.description)}</p>` : ''}</li>`;
  }).join('');
  return heading
    ? `<nav class="category-links" aria-labelledby="collections-title"><h2 id="collections-title">${e(t.title)}</h2><ul>${links}</ul></nav>`
    : `<nav class="category-index-list" aria-label="${e(t.browse)}"><ul>${links}</ul></nav>`;
}

export function renderCategoryIndex(categories, posts, language = 'ko', { base = '../' } = {}) {
  const t = copy(language), prefix = safeBase(base, '../');
  return `<section class="category-index"><header class="category-page-header"><h1>${e(t.title)}</h1><p>${e(t.intro)}</p></header>${renderCategoryCards(categories, posts, language, { base: prefix, heading: false })}</section>`;
}

function renderPostList(posts, language, base) {
  const t = copy(language);
  return `<div class="category-post-list">${posts.map(post => {
    const postLanguage = post.language === 'en' ? 'en' : 'ko';
    const languageLabel = postLanguage === language ? '' : `<span class="category-post-language">${e(postLanguage === 'ko' ? t.korean : t.english)}</span>`;
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(post.date || '') && !Number.isNaN(Date.parse(`${post.date}T00:00:00Z`));
    const date = validDate ? `<time datetime="${e(post.date)}">${e(dateText(post.date, language))}</time>` : '';
    return `<article class="category-post"><h3><a href="${e(base)}posts/${e(post.slug)}/" hreflang="${postLanguage}" lang="${postLanguage}">${e(post.title || t.untitled)}</a></h3>${post.description ? `<p class="category-post-excerpt" lang="${postLanguage}">${e(post.description)}</p>` : ''}<div class="category-post-meta">${date}<span>${e(t.minutes(readTime(post.body)))}</span>${languageLabel}</div></article>`;
  }).join('')}</div>`;
}

export function renderCategoryPage(category, posts, language = 'ko', { base = '../../' } = {}) {
  const t = copy(language), prefix = safeBase(base, '../../');
  if (!validSlug(category?.slug)) return `<section class="category-page"><h1>${e(t.missing)}</h1><a class="category-return" href="${e(categoryIndexURL(prefix, language))}">${e(t.all)}</a></section>`;
  const current = localizedCategory(category, language), items = categoryPosts(posts, category.slug), groups = current.groups;
  const groupSlugs = new Set(groups.map(group => group.slug));
  const remaining = items.filter(post => !groupSlugs.has(post.group));
  let fallbackSlug = 'other-posts';
  while (groupSlugs.has(fallbackSlug)) fallbackSlug += '-other';
  const sections = groups.map(group => ({ ...group, posts: items.filter(post => post.group === group.slug) }));
  if (remaining.length) sections.push({ slug: fallbackSlug, title: groups.length ? t.other : t.posts, description: '', posts: remaining });
  const contents = items.length ? sections.map(group => `<section class="category-group" id="group-${e(group.slug)}" aria-labelledby="group-title-${e(group.slug)}"><header class="category-group-heading"><h2 id="group-title-${e(group.slug)}">${e(group.title)}</h2>${group.description ? `<p>${e(group.description)}</p>` : ''}</header>${group.posts.length ? renderPostList(group.posts, language, prefix) : `<p class="category-empty">${e(t.emptyGroup)}</p>`}</section>`).join('') : `<div class="category-empty"><p>${e(t.empty)}</p><a class="category-return" href="${e(categoryIndexURL(prefix, language))}">${e(t.all)}</a></div>`;
  return `<div class="category-page"><nav class="category-breadcrumb" aria-label="${e(t.navigation)}"><a href="${e(categoryIndexURL(prefix, language))}">${e(t.all)}</a></nav><header class="category-page-header"><h1>${e(current.title)}</h1>${current.description ? `<p>${e(current.description)}</p>` : ''}</header>${contents}</div>`;
}

export function renderPostCategory(categories, post, language = 'ko', { base = './' } = {}) {
  const category = localizedCategory(categoryForPost(categories, post), language);
  if (!category) return '';
  return `<a class="post-category" href="${e(categoryURL(category.slug, safeBase(base), language))}">${e(category.title)}</a>`;
}

export function renderCategoryBreadcrumb(categories, post, language = 'ko', { base = '../../' } = {}) {
  const category = localizedCategory(categoryForPost(categories, post), language);
  if (!category) return '';
  const t = copy(language), prefix = safeBase(base, '../../');
  return `<nav class="category-breadcrumb" aria-label="${e(t.navigation)}"><a href="${e(categoryURL(category.slug, prefix, language))}">${e(t.collection(category.title))}</a></nav>`;
}

export function renderCategoryReturn(categories, post, language = 'ko', { base = '../../' } = {}) {
  const category = localizedCategory(categoryForPost(categories, post), language);
  if (!category) return '';
  const prefix = safeBase(base, '../../'), group = groupForPost(category, post);
  const href = group ? groupURL(category, group, prefix, language) : categoryURL(category.slug, prefix, language);
  return `<a class="category-return" href="${e(href)}">${e(copy(language).back(category.title))}</a>`;
}
