import { escapeHTML as e, icon, safeURL, dateText } from './lib.js';

const labels = {
  ko: {
    links: '코드와 프로젝트', github: 'GitHub 프로필', source: '블로그 코드',
    activity: '요즘 하는 것', activityIntro: '만들고 써보면서 조금씩 고치고 있어요.',
    updated: '마지막 수정', projects: '만들어 본 것들',
    projectsIntro: '직접 만들거나 팀으로 함께 작업한 것들이에요.',
    timeline: '그동안의 기록', article: '관련 글 읽기', koreanArticle: '한국어 글 읽기', englishArticle: '영어 글 읽기', repository: '저장소 보기', detail: '자세히 보기',
  },
  en: {
    links: 'Code and projects', github: 'GitHub profile', source: 'Blog code',
    activity: 'Lately', activityIntro: 'A few things I have been building, trying out, and fixing.',
    updated: 'Last updated', projects: 'Things I have made',
    projectsIntro: 'Some solo projects and things I worked on with others.',
    timeline: 'Notes along the way', article: 'Read the post', koreanArticle: 'Read the post (Korean)', englishArticle: 'Read the post (English)', repository: 'View repository', detail: 'Learn more',
  },
};

const copy = language => labels[language] || labels.ko;
const entries = value => Array.isArray(value) ? value.filter(item => item && typeof item === 'object') : [];
const webURL = value => {
  const url = safeURL(value);
  return /^https?:\/\//.test(url) ? url : '';
};
const postURL = (slug, base) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '') ? `${base}posts/${slug}/` : '';
const externalLink = (url, text, className = '') => `<a class="${className}" href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(text)} ${icon('diagonal')}</a>`;

function entryLinks(item, language, base, repository = false) {
  const t = copy(language), post = postURL(item.postSlug, base), url = webURL(item.url);
  const postLanguage = item.postLanguage === 'en' ? 'en' : 'ko';
  const postLabel = postLanguage === language ? t.article : postLanguage === 'ko' ? t.koreanArticle : t.englishArticle;
  const links = [
    post ? `<a href="${e(post)}" hreflang="${postLanguage}">${e(postLabel)} ${icon('arrow')}</a>` : '',
    url ? externalLink(url, repository ? t.repository : t.detail) : '',
  ].filter(Boolean);
  return links.length ? `<div class="profile-entry-links">${links.join('')}</div>` : '';
}

export function renderProfileLinks(site, language, { base = './' } = {}) {
  const t = copy(language), github = webURL(site.github), repository = webURL(site.profileRepository);
  const links = [
    github ? `<a class="profile-github" href="${e(github)}" target="_blank" rel="noopener noreferrer">${icon('github')} <span>${e(t.github)}</span> ${icon('diagonal')}</a>` : '',
    repository ? externalLink(repository, t.source, 'profile-source') : '',
  ].filter(Boolean);
  return links.length ? `<nav class="profile-links" aria-label="${e(t.links)}">${links.join('')}</nav>` : '';
}

export function renderActivity(site, language, { base = './', limit = Infinity } = {}) {
  const items = entries(site.activity).slice(0, limit);
  if (!items.length) return '';
  const t = copy(language);
  const updated = /^\d{4}-\d{2}-\d{2}$/.test(site.updatedAt || '') && !Number.isNaN(Date.parse(site.updatedAt));
  const stamp = updated ? `<p class="profile-updated">${e(t.updated)} <time datetime="${e(site.updatedAt)}">${e(dateText(site.updatedAt, language))}</time></p>` : '';
  return `<section class="profile-section activity-section" aria-labelledby="activity-title"><div class="profile-section-heading"><div><h2 id="activity-title">${e(t.activity)}</h2><p>${e(t.activityIntro)}</p></div>${stamp}</div><ul class="activity-list">${items.map(item => `<li>${item.status ? `<span class="activity-status">${e(item.status)}</span>` : ''}<h3>${e(item.title || '')}</h3>${item.detail ? `<p>${e(item.detail)}</p>` : ''}${entryLinks(item, language, base)}</li>`).join('')}</ul></section>`;
}

export function renderProjects(site, language, { base = './', limit = Infinity } = {}) {
  const items = entries(site.projects).slice(0, limit);
  if (!items.length) return '';
  const t = copy(language);
  return `<section class="profile-section projects-section" aria-labelledby="projects-title"><div class="profile-section-heading"><div><h2 id="projects-title">${e(t.projects)}</h2><p>${e(t.projectsIntro)}</p></div></div><div class="project-list">${items.map(item => `<article class="project-entry"><div class="project-identity">${item.period ? `<p class="project-period">${e(item.period)}</p>` : ''}<h3>${e(item.name || '')}</h3>${item.role ? `<p class="project-role">${e(item.role)}</p>` : ''}</div><div class="project-detail">${item.description ? `<p>${e(item.description)}</p>` : ''}${Array.isArray(item.tags) && item.tags.length ? `<ul class="project-tags">${item.tags.map(tag => `<li>${e(tag)}</li>`).join('')}</ul>` : ''}${entryLinks(item, language, base, true)}</div></article>`).join('')}</div></section>`;
}

export function renderTimeline(site, language) {
  const items = entries(site.timeline);
  if (!items.length) return '';
  const t = copy(language);
  return `<section class="profile-section timeline-section" aria-labelledby="timeline-title"><div class="profile-section-heading"><h2 id="timeline-title">${e(t.timeline)}</h2></div><ol class="profile-timeline">${items.map(item => `<li><div class="timeline-date">${/^\d{4}(?:-\d{2})?(?:-\d{2})?$/.test(item.date || '') ? `<time datetime="${e(item.date)}">${e(item.date)}</time>` : e(item.date || '')}</div><div><h3>${e(item.title || '')}</h3>${item.detail ? `<p>${e(item.detail)}</p>` : ''}</div></li>`).join('')}</ol></section>`;
}
