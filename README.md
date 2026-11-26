# Chihun · 개발과 서버 기록

[블로그](https://chihun1111.github.io/my-space-blog/) · [소개](https://chihun1111.github.io/my-space-blog/about/) · [GitHub](https://github.com/chihun1111)

AI 서비스와 CTF 플랫폼을 개발한 과정, Proxmox·TrueNAS 홈서버를 구성하고 문제를 해결한 기록을 남깁니다. 한국어 글과 한국어·영어 소개를 제공합니다.

## 글과 소개를 수정하기

콘텐츠 원본은 `data/content.json`입니다.

- `site`: 소개, GitHub, 최근 작업, 프로젝트, 날짜별 이력. `updatedAt`은 실제로 소개를 검토한 날짜입니다.
- `site.translations.en`: 영어 소개와 활동·프로젝트·이력.
- `posts`: 글의 제목·발행일·설명·태그·본문. `draft: true`인 글은 생성·검색·피드에서 제외합니다.
- `post.updatedAt`: 기존 글의 내용을 실질적으로 수정한 날짜. 원래 발행일 `date`와 구분합니다.

본문에서는 `# 제목`이 글 안의 주요 소제목(`h2`)이 됩니다. 페이지 제목은 `title`에서 생성합니다. 글 사이 링크는 `[링크 이름](#post/slug)`로 작성하면 실제 게시글 URL로 변환됩니다. 공개 코드 근거는 가능한 한 커밋에 고정한 링크를 사용합니다.

`index.html`, `about/index.html`, `posts/*/index.html`, `rss.xml`, `sitemap.xml`, `robots.txt`, `data/generated-pages.json`은 생성 결과입니다. 직접 편집하기보다 원본을 바꾸고 다시 생성합니다. 생성기는 기존 생성 목록에 있는 폐기된 게시글 페이지만 제거하며, 그 외 파일을 지우지 않습니다.

## 생성·확인·미리보기

Node.js 22 이상이 필요합니다. 외부 npm 패키지 설치는 필요하지 않습니다.

```sh
npm run build
npm run check
npm run preview
```

미리보기는 Python 3의 정적 서버를 사용하며 `http://localhost:4173`에서 열립니다. `check`는 JavaScript 구문, 글의 날짜·slug·내부 링크, 프로필의 글 링크, 원본과 생성 파일의 일치를 확인합니다.

정적 HTML에 본문과 소개를 넣으므로 JavaScript가 꺼져 있어도 읽을 수 있습니다. 검색·주제 필터·언어 전환·테마·코드 복사는 브라우저 JavaScript로 동작합니다. GitHub Pages에서는 `data-static="true"`로 로컬 편집기 API 요청을 생략합니다.

GitHub Pages의 저장소 경로는 `site.url`에 지정합니다. 주소를 바꾸면 이 값을 수정하고 다시 생성해야 canonical, Open Graph, RSS, sitemap 주소가 함께 바뀝니다.

## 글을 작성하는 기준

프로젝트 전체와 개인 기여를 구분하고, 구현한 기능·실제로 확인한 결과·앞으로 검증할 항목을 나눠 씁니다. 홈서버 글의 설정과 상태는 각 글에 적은 확인 날짜를 기준으로 합니다. 소개의 최근 작업은 활동 기록이며 실시간 상태 모니터가 아닙니다.

공개 페이지에는 계정 비밀, 원본 개인 메일, 민감한 첨부나 제3자 연락처를 넣지 않습니다. 팀 프로젝트는 대표 코드와 변경 이력으로 연결합니다. 수상 순위·성능·기여율은 근거가 확인된 경우에만 기재합니다.

## 주요 구성

| 파일 | 역할 |
| --- | --- |
| `app.js` | 홈·소개 라우팅, 검색·필터·언어 전환 |
| `profile.js` | 최근 작업·프로젝트·이력의 공통 HTML 렌더링 |
| `article.js` | 정적 글·소개 페이지의 테마·메뉴·공유 동작 |
| `lib.js` | 안전한 Markdown 렌더링, 목차, 공통 유틸리티 |
| `scripts/build.mjs` | 본문·소개·목록·검색 공유 정보·피드 생성 |
| `styles.css` | 모바일·다크 모드·읽기 화면 스타일 |

Pretendard 글꼴의 라이선스와 출처는 `assets/fonts/`에 있습니다.
