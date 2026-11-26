import { escapeHTML as e, dateText, readTime } from './lib.js';

const labels = {
  ko: {
    title: '분류별 글', intro: '관심 있는 이야기를 골라서 읽어 보세요.',
    browse: '글 분류', navigation: '현재 글의 분류', groupNavigation: '이 분류의 주제',
    view: '글 보기', all: '모든 분류', posts: '글 목록', other: '그 밖의 글',
    empty: '아직 이 분류에 올린 글이 없어요. 다른 분류도 둘러보세요.',
    emptyGroup: '이 주제의 글은 아직 없어요.', untitled: '제목 없는 글',
    missing: '분류를 찾을 수 없어요.', korean: '한국어', english: '영어',
    count: count => `글 ${count}개`, minutes: count => `${count}분 읽기`,
    back: title => `${title} 글 목록으로 돌아가기`,
  },
  en: {
    title: 'Browse by category', intro: 'Pick a topic and find something to read.',
    browse: 'Post categories', navigation: 'Current post category', groupNavigation: 'Topics in this category',
    view: 'Browse posts', all: 'All categories', posts: 'Posts', other: 'Other posts',
    empty: 'No posts here yet. There are other categories to explore.',
    emptyGroup: 'No posts on this topic yet.', untitled: 'Untitled post',
    missing: 'Category not found.', korean: 'Korean', english: 'English',
    count: count => `${count} ${count === 1 ? 'post' : 'posts'}`, minutes: count => `${count} min read`,
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
  const t = copy(language), prefix = safeBase(base), titleTag = heading ? 'h3' : 'h2';
  const headingHTML = heading ? `<div class="category-section-heading"><h2 id="categories-title">${e(t.title)}</h2><a href="${e(categoryIndexURL(prefix, language))}">${e(t.all)}</a></div>` : '';
  return `<section class="category-cards" ${heading ? 'aria-labelledby="categories-title"' : `aria-label="${e(t.browse)}"`}>${headingHTML}<div class="category-card-grid">${items.map(item => {
    const category = localizedCategory(item, language), count = categoryPosts(posts, item.slug).length;
    return `<a class="category-card" href="${e(categoryURL(item.slug, prefix, language))}"><span class="category-count">${e(t.count(count))}</span><${titleTag} class="category-card-title">${e(category.title)}</${titleTag}>${category.description ? `<p>${e(category.description)}</p>` : ''}<span class="category-card-action">${e(t.view)}</span></a>`;
  }).join('')}</div></section>`;
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
  const jumpLinks = items.length && sections.length ? `<nav class="category-group-nav" aria-label="${e(t.groupNavigation)}">${sections.map(group => `<a href="#group-${e(group.slug)}">${e(group.title)} <span>${group.posts.length}</span></a>`).join('')}</nav>` : '';
  const contents = items.length ? sections.map(group => `<section class="category-group" id="group-${e(group.slug)}" aria-labelledby="group-title-${e(group.slug)}"><header class="category-group-heading"><h2 id="group-title-${e(group.slug)}">${e(group.title)}</h2>${group.description ? `<p>${e(group.description)}</p>` : ''}</header>${group.posts.length ? renderPostList(group.posts, language, prefix) : `<p class="category-empty">${e(t.emptyGroup)}</p>`}</section>`).join('') : `<div class="category-empty"><p>${e(t.empty)}</p><a class="category-return" href="${e(categoryIndexURL(prefix, language))}">${e(t.all)}</a></div>`;
  return `<div class="category-page"><nav class="category-breadcrumb" aria-label="${e(t.navigation)}"><ol><li><a href="${e(categoryIndexURL(prefix, language))}">${e(t.all)}</a></li><li><span class="category-separator" aria-hidden="true">/</span><span aria-current="page">${e(current.title)}</span></li></ol></nav><header class="category-page-header"><p class="category-count">${e(t.count(items.length))}</p><h1>${e(current.title)}</h1>${current.description ? `<p>${e(current.description)}</p>` : ''}</header>${jumpLinks}${contents}</div>`;
}

export function renderPostCategory(categories, post, language = 'ko', { base = './' } = {}) {
  const category = localizedCategory(categoryForPost(categories, post), language);
  if (!category) return '';
  return `<a class="post-category" href="${e(categoryURL(category.slug, safeBase(base), language))}">${e(category.title)}</a>`;
}

export function renderCategoryBreadcrumb(categories, post, language = 'ko', { base = '../../' } = {}) {
  const category = localizedCategory(categoryForPost(categories, post), language);
  if (!category) return '';
  const t = copy(language), prefix = safeBase(base, '../../'), group = groupForPost(category, post);
  return `<nav class="category-breadcrumb" aria-label="${e(t.navigation)}"><ol><li><a href="${e(categoryIndexURL(prefix, language))}">${e(t.all)}</a></li><li><span class="category-separator" aria-hidden="true">/</span><a href="${e(categoryURL(category.slug, prefix, language))}">${e(category.title)}</a></li>${group ? `<li><span class="category-separator" aria-hidden="true">/</span><a href="${e(groupURL(category, group, prefix, language))}">${e(group.title)}</a></li>` : ''}</ol></nav>`;
}

export function renderCategoryReturn(categories, post, language = 'ko', { base = '../../' } = {}) {
  const category = localizedCategory(categoryForPost(categories, post), language);
  if (!category) return '';
  const prefix = safeBase(base, '../../'), group = groupForPost(category, post);
  const href = group ? groupURL(category, group, prefix, language) : categoryURL(category.slug, prefix, language);
  return `<a class="category-return" href="${e(href)}">${e(copy(language).back(category.title))}</a>`;
}
