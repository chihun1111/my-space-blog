export const LANGUAGES = ['ko', 'en'];
export const DEFAULT_LANGUAGE = 'ko';
export const LANGUAGE_STORAGE_KEY = 'my-space-language';
const isLanguage = value => LANGUAGES.includes(value);

export function getLanguage(fallback = DEFAULT_LANGUAGE) {
  const query = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('lang');
  if (isLanguage(query)) return query;
  try { const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY); if (isLanguage(saved)) return saved; } catch { /* Storage may be unavailable. */ }
  return fallback;
}

export function setLanguage(language) {
  const selected = isLanguage(language) ? language : 'en';
  try { localStorage.setItem(LANGUAGE_STORAGE_KEY, selected); } catch { /* URL and page language still work. */ }
  if (typeof document !== 'undefined') document.documentElement.lang = selected;
  if (typeof location !== 'undefined' && typeof history !== 'undefined') {
    const url = new URL(location.href); url.searchParams.set('lang', selected);
    history.replaceState(null, '', url);
  }
  return selected;
}

export function localizedSite(site, language) {
  if (language !== 'en') return { ...site };
  const english = site.translations?.en || {};
  return {
    ...site,
    ...Object.fromEntries(['role', 'heroTitle', 'heroDescription', 'aboutTitle', 'aboutText'].map(field => [field, english[field] || ''])),
    ...Object.fromEntries(['topics', 'activity', 'projects', 'timeline'].map(field => [field, english[field] || []])),
  };
}

export const publishedPosts = (posts, language) => posts
  .filter(post => !post.draft && (post.language || 'ko') === language)
  .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || (b.date || '').localeCompare(a.date || ''));

export const startHerePost = posts => posts.find(post => post.slug === 'development-server-journal') || posts.find(post => post.slug === 'homelab-things-i-built');
export const visibleTopics = (authoredTopics = [], posts = []) => posts.length
  ? [...new Set(authoredTopics.length ? authoredTopics : posts.flatMap(post => post.tags))]
  : [];
export function postInLanguage(posts, slug, language) {
  const source = posts.find(post => post.slug === slug && !post.draft);
  if (!source) return null;
  return posts.find(post => !post.draft && (post.language || 'ko') === language && (post.translationKey || post.slug) === (source.translationKey || source.slug)) || null;
}

export const messages = {
  ko: {
    startHere: '처음 읽기', toc: '목차', otherLanguagePosts: '영어 글 보기', noScript: '검색과 언어 전환에는 JavaScript가 필요합니다.',
    clearSearch: '검색 지우기', login: '소유자 로그인', uploadImage: '이미지 선택', replaceImage: '교체', removeImage: '삭제', uploading: '이미지를 저장하는 중…', imageSaved: '이미지를 저장했어요.', imageSaveFailed: '이미지를 저장하지 못했습니다. 소유자 로그인 상태를 확인해주세요.', imageInvalid: 'JPG, PNG, WebP, GIF 이미지를 선택해주세요.', imageTooLarge: '이미지는 10 MB 이하로 선택해주세요.', imageUnreadable: '이미지를 읽을 수 없습니다.', responseError: '서버 응답을 확인하지 못했습니다.', validationError: '저장하지 못했습니다.', zoomImage: '이미지 확대', closeImage: '이미지 닫기',
    journal: '개발과 서버 기록', blog: '블로그', about: '소개', home: '블로그 홈', skip: '본문으로 건너뛰기', search: '글 검색', searchFocus: '검색창으로 이동', searchPlaceholder: '글 검색하기', write: '글 쓰기', firstStory: '첫 글 작성', light: '라이트 모드로 전환', dark: '다크 모드로 전환', menuOpen: '메뉴 열기', menuClose: '메뉴 닫기', topics: '주제', addTopics: '주제 추가하기', noTopics: '아직 등록된 주제가 없습니다.', articles: '글 목록', sort: '정렬', newest: '최신순', oldest: '오래된순', title: '제목순', all: '전체', featured: '고정 글', read: '글 읽기', noPosts: '아직 공개한 글이 없습니다.', noResults: '검색 결과가 없습니다.', searchAgain: '다른 검색어나 주제로 다시 찾아보세요.', allArticles: '모든 글 보기', more: '글 더 보기', aboutMe: '소개 보기', editAbout: '소개 작성하기', explore: '둘러보기', mySpace: '작업실', links: '링크', editSite: '블로그 설정', top: '맨 위로 ↑', copyright: '모든 권리 보유.', copy: '주소 복사', copied: '글 주소를 복사했어요.', copyFailed: '글을 열고 주소창의 URL을 복사해 주세요.', editPost: '이 글 편집', back: '모든 글로 돌아가기', missing: '글을 찾을 수 없습니다.', missingDetail: '주소가 바뀌었거나 아직 공개되지 않은 글일 수 있어요.', backBlog: '블로그로 돌아가기', missingTranslation: '아직 한국어 글이 없습니다.', translationDetail: '작성자가 이 언어로 글을 준비하면 여기에 표시됩니다.', original: '영어 원문 보기', errorTitle: '잠시 연결을 확인해 주세요.', errorDetail: '블로그를 불러오지 못했습니다. 새로고침하거나 잠시 후 다시 시도해 주세요.', retry: '다시 불러오기', loading: '기록을 불러오는 중입니다.', imageSlot: '이미지 영역', imageLater: '이미지는 나중에 추가할 수 있어요.', imageSettings: '이미지 설정', heroAlt: '메인 이미지', aboutAlt: '소개 이미지', language: '언어', email: '이메일', count: count => `공개 글 ${count}개`, minutes: count => `${count}분 읽기`, readLabel: title => `${title} 읽기`, copyLabel: title => `${title} 주소 복사`,
  },
  en: {
    startHere: 'Start here', toc: 'On this page', otherLanguagePosts: 'Browse Korean posts', noScript: 'Search and language switching require JavaScript.',
    clearSearch: 'Clear search', login: 'Owner login', uploadImage: 'Choose image', replaceImage: 'Replace', removeImage: 'Remove', uploading: 'Saving your image…', imageSaved: 'Image saved.', imageSaveFailed: 'Could not save the image. Check your owner login and try again.', imageInvalid: 'Choose a JPG, PNG, WebP or GIF image.', imageTooLarge: 'Choose an image smaller than 10 MB.', imageUnreadable: 'This image could not be read.', responseError: 'Could not read the server response.', validationError: 'Could not save.', zoomImage: 'Enlarge image', closeImage: 'Close image',
    journal: 'Development & server notes', blog: 'Blog', about: 'About', home: 'Blog home', skip: 'Skip to content', search: 'Search posts', searchFocus: 'Go to search', searchPlaceholder: 'Search posts', write: 'Write a post', firstStory: 'Write a post', light: 'Switch to light mode', dark: 'Switch to dark mode', menuOpen: 'Open menu', menuClose: 'Close menu', topics: 'Topics', addTopics: 'Add topics', noTopics: 'No topics yet.', articles: 'Articles', sort: 'Sort by', newest: 'Newest', oldest: 'Oldest', title: 'Title', all: 'All', featured: 'Pinned', read: 'Read full article', noPosts: 'No published posts yet.', noResults: 'No articles found.', searchAgain: 'Try another search or topic.', allArticles: 'View all articles', more: 'Load more articles', aboutMe: 'About me', editAbout: 'Write your introduction', explore: 'Explore', mySpace: 'My space', links: 'Links', editSite: 'Site settings', top: 'Back to top ↑', copyright: 'All rights reserved.', copy: 'Copy URL', copied: 'Article URL copied.', copyFailed: 'Open the article and copy the URL from your address bar.', editPost: 'Edit this article', back: 'Back to all articles', missing: 'Article not found.', missingDetail: 'The address may have changed, or the article is not published yet.', backBlog: 'Back to the blog', missingTranslation: 'No English version yet.', translationDetail: 'The article will appear here when the author adds this language.', original: 'Read the Korean original', errorTitle: 'Please check the connection.', errorDetail: 'The blog could not be loaded. Refresh the page or try again shortly.', retry: 'Try again', loading: 'Loading articles…', imageSlot: 'Image space', imageLater: 'Add your own image whenever you are ready.', imageSettings: 'Image settings', heroAlt: 'Main image', aboutAlt: 'About image', language: 'Language', email: 'Email', count: count => `${count} published articles`, minutes: count => `${count} min read`, readLabel: title => `Read ${title}`, copyLabel: title => `Copy URL for ${title}`,
  },
};
