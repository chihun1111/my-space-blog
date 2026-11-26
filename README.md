# Chihun · 코딩이랑 홈서버 이야기

[블로그](https://chihun1111.github.io/my-space-blog/) · [소개](https://chihun1111.github.io/my-space-blog/about/) · [GitHub](https://github.com/chihun1111)

개발하다가 배운 것, 홈서버를 만지면서 생긴 일을 적는 개인 블로그예요. 말씨에 참여한 이야기와 CTF 사이트를 만들어 본 과정, Proxmox·TrueNAS를 써 본 기록을 모아 뒀어요. 글은 한국어로, 소개는 한국어와 영어로 볼 수 있어요.

## 글의 말투

한국어 소개와 글은 **편한 해요체(`~해요`, `~했어요`)**로 맞춰요. 새 글을 쓰거나 기존 글을 고칠 때도 같은 기준을 사용해요.

- 직접 해 본 일은 `~했어요`, 현재 동작이나 설정 설명은 `~해요`로 적어요. 본문에 `~했다`, `~한다`, `~합니다` 같은 다른 말투가 섞이지 않도록 해요.
- 제목과 소제목은 짧은 명사형이나 `~하기`처럼 써도 괜찮아요. 문장으로 쓸 때는 `~해 봤어요`처럼 본문과 맞춰요.
- 1인칭 설명은 `저`, `제`를 사용해요. 만들게 된 이유, 막힌 부분, 바꾼 내용과 확인한 결과를 편하게 풀어 써요.
- 기술 용어는 필요한 곳에 쓰고, 처음 나오는 낯선 용어는 짧게 설명해요. 경력이나 성과를 강조하기 위한 문구는 덧붙이지 않아요.
- 코드, 명령어, 설정값, 원본 로그와 인용문은 그대로 두고 주변 설명의 말투를 다듬어요.
- 본문뿐 아니라 요약, 표 안의 설명, 관련 글 안내도 함께 확인해요. 정적 페이지와 피드에는 같은 원본이 반영되도록 다시 생성해요.

## 글과 소개를 수정하기

콘텐츠 원본은 `data/content.json`이에요.

소개와 프로젝트 글은 [소개 전체](writing/about.md), [처음 읽기](writing/development-server-journal.md), [말씨 이야기](writing/malssi-ai-conversation-recovery.md), [CTF 사이트 이야기](writing/ctf-platform-auth-submission-operations.md)에서 읽을 수 있어요. `writing/`의 Markdown은 같은 원본으로 생성한 읽기용 사본이에요.

- `site`: 소개, GitHub, 요즘 하는 것, 만들어 본 것들, 그동안의 기록. `updatedAt`은 실제로 소개를 검토한 날짜예요.
- `site.translations.en`: 영어 소개와 활동·프로젝트·이력.
- `posts`: 글의 제목·발행일·설명·태그·본문. `draft: true`인 글은 생성·검색·피드에서 제외해요.
- `post.updatedAt`: 기존 글의 내용을 실질적으로 수정한 날짜예요. 원래 발행일 `date`와 구분해요.
- `post.exportMarkdown`: `true`이면 GitHub에서 바로 읽을 수 있는 `writing/` 사본도 생성해요. 수정은 원본의 `body`에 반영해요.

본문에서는 `# 제목`이 글 안의 주요 소제목(`h2`)이 돼요. 페이지 제목은 `title`에서 생성해요. 글 사이 링크는 `[링크 이름](#post/slug)`로 작성하면 실제 게시글 URL로 바뀌어요. 공개 코드 근거는 가능한 한 커밋에 고정한 링크를 사용해요.

`index.html`, `about/index.html`, `posts/*/index.html`, `rss.xml`, `sitemap.xml`, `robots.txt`, `data/generated-pages.json`은 생성 결과예요. 원본을 바꾸고 다시 생성해서 수정해요. 생성기는 기존 생성 목록에 있는 폐기된 게시글 페이지만 제거하고, 그 외 파일은 그대로 둬요.

## 생성·확인·미리보기

Node.js 22 이상이 필요해요. 외부 npm 패키지를 설치하지 않아도 돼요.

```sh
npm run build
npm run check
npm run preview
```

미리보기는 Python 3의 정적 서버를 사용하고 `http://localhost:4173`에서 열려요. `check`는 JavaScript 구문, 글의 날짜·slug·내부 링크, 프로필의 글 링크, 원본과 생성 파일의 일치를 확인해요.

정적 HTML에 본문과 소개가 들어 있어서 JavaScript가 꺼져 있어도 읽을 수 있어요. 검색·주제 필터·언어 전환·테마·코드 복사는 브라우저 JavaScript로 동작해요. GitHub Pages에서는 `data-static="true"`로 로컬 편집기 API 요청을 생략해요.

GitHub Pages의 저장소 경로는 `site.url`에 지정해요. 주소를 바꾸면 이 값을 수정하고 다시 생성해야 canonical, Open Graph, RSS, sitemap 주소가 함께 바뀌어요.

## 글을 작성하는 기준

프로젝트 전체와 제가 한 일을 구분하고, 만든 기능·실제로 확인한 결과·앞으로 확인할 것을 나눠 적어요. 홈서버 글의 설정과 상태는 각 글에 적은 확인 날짜를 기준으로 해요. 소개의 '요즘 하는 것'에는 작업한 내용을 정리하고, 서버 상태는 각 글의 확인 날짜와 함께 봐요.

공개 페이지에는 계정 비밀, 원본 개인 메일, 민감한 첨부나 제3자 연락처를 넣지 않아요. 팀 프로젝트는 대표 코드와 변경 이력으로 연결해요. 수상 순위·성능·기여율은 근거가 확인된 경우에만 적어요.

## 주요 구성

| 파일 | 역할 |
| --- | --- |
| `app.js` | 홈·소개 라우팅, 검색·필터·언어 전환 |
| `profile.js` | 최근 작업·프로젝트·이력의 공통 HTML 렌더링 |
| `article.js` | 정적 글·소개 페이지의 테마·메뉴·공유 동작 |
| `lib.js` | 안전한 Markdown 렌더링, 목차, 공통 유틸리티 |
| `scripts/build.mjs` | 본문·소개·목록·검색 공유 정보·피드 생성 |
| `styles.css` | 모바일·다크 모드·읽기 화면 스타일 |

Pretendard 글꼴의 라이선스와 출처는 `assets/fonts/`에 있어요.
