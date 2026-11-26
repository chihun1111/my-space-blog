# 안녕하세요, 치헌입니다.

만들다가 배운 것들을 적어 둬요

[GitHub](https://github.com/chihun1111) · [블로그 코드](https://github.com/chihun1111/my-space-blog)

마지막 수정: 2026-11-26

안녕하세요, **이치헌**입니다. 이것저것 만들어 보고, 집에서 서버도 만지고 있어요. 이 블로그에는 만들다가 배운 것과 설정을 고치면서 알게 된 내용을 적어 두고 있어요.

최근에는 팀 프로젝트 **말씨**를 작업했어요. 어려움을 겪는 사람 곁의 가족이나 친구가 대화를 준비하도록 돕는 서비스예요. 저는 PostgreSQL과 Gemma를 연결하고, 질문 흐름과 답변 저장을 손봤어요. 답변을 수정하거나 요청이 끊겨도 대화를 이어 갈 수 있도록 고친 내용도 글로 정리했어요.

**CTF 대회 사이트**도 만들었어요. 참가자 화면과 관리자 페이지를 만들고, 서버를 구성해서 배포하는 것까지 직접 해 봤어요. 플래그를 제출하면 어떻게 점수를 보여 줄지, 완료한 기록은 어떻게 남길지 같은 내용을 다뤘어요.

집에서는 **Proxmox와 TrueNAS로 홈서버**를 구성해 왔어요. NAS와 개발용 VM, 자동화 도구, 게임 서버를 올려 보고 원격 접속도 붙였어요. 온라인인데 답하지 않는 Discord 봇을 고친 이야기나, 웹에서 PC를 켜는 WOL 포털을 만든 기록도 있어요.

코드는 [GitHub의 chihun1111](https://github.com/chihun1111)에 올리고 있어요. 나중에 같은 곳에서 또 막히지 않도록, 해 본 것과 아직 확인할 것을 조금씩 남겨 보려고 해요.

## 요즘 하는 것

### 말씨 질문 흐름 다듬기

최근에 고친 것 — 필요한 질문만 묻고 답변을 잘 남기도록 손봤어요. 답변을 고치거나 서버가 다시 켜졌을 때의 처리도 정리했어요.

[관련 글](./malssi-ai-conversation-recovery.md)

### CTF 대회 사이트 만들기

만들어 본 것 — 참가자가 문제를 풀고 정답을 제출하는 화면부터 관리자 페이지와 서버 배포까지 만들어 봤어요.

[관련 글](./ctf-platform-auth-submission-operations.md)

### 홈서버 기록 모으기

적어 둔 것 — VM 설정, NAS, Discord 봇, WOL, 원격 접속처럼 직접 만진 것들을 적었어요. 당시 설정과 확인한 날짜도 같이 남겼어요.

[관련 글](https://chihun1111.github.io/my-space-blog/posts/homelab-things-i-built/)

## 만들어 본 것들

### 말씨

2026.10–11 · 팀으로 만든 AI 대화 프로젝트

HOP Biohealth AI Challenge에서 함께 만든 서비스예요. DB와 모델을 연결하고, 질문 흐름과 입력 보존, 결과 저장을 손봤어요.

기술: JavaScript, PostgreSQL, Gemma, 상태 관리

[저장소](https://github.com/seonizz/HOP_Biohealth_AI-Challenge) · [관련 글](./malssi-ai-conversation-recovery.md)

### CTF 대회 사이트

직접 만들어 배포했어요 · 참가자 화면과 관리자 페이지

문제를 풀고 플래그를 제출하는 사이트예요. Next.js와 NestJS로 화면과 API를 만들고, 참가자별 정답과 제출 기록을 관리하도록 구성했어요.

기술: Next.js, NestJS, PostgreSQL, Docker, Nginx

[저장소](https://github.com/chihun1111/CTF_KDU) · [관련 글](./ctf-platform-auth-submission-operations.md)

### 집에서 쓰는 홈서버

2026.10에 정리한 기록 · NAS와 여러 VM을 모아 둔 환경

Proxmox와 TrueNAS에 NAS, 개발 환경, 자동화 도구, 게임 서버를 올려 봤어요. 설정한 방법과 접속하다 막힌 부분을 글로 남겼어요.

기술: Proxmox, TrueNAS, Tailscale, Home Assistant

[관련 글](https://chihun1111.github.io/my-space-blog/posts/homelab-things-i-built/)

## 그동안의 기록

### 2026-11 · 말씨의 질문과 결과 저장 손보기

질문을 고르는 모델과 결과를 만드는 모델을 나눴어요. 답변을 수정했을 때 예전 결과가 저장되지 않도록 처리했어요.

### 2026-11 · 말씨로 HOP Biohealth AI Challenge 참가

씨앗 팀으로 함께 만든 말씨로 참가해 수상했어요. 제가 작업한 부분도 블로그에 정리했어요.

### 2026-10 · 홈서버 설정을 글로 정리하기

Proxmox와 TrueNAS, VM 설정, 원격 접속, NAS 앱을 어떻게 구성했는지 적어 뒀어요.

### 2026-10 · 딥보이스 AI 탐지 대회 참가

딥보이스 범죄 대응을 위한 AI 탐지 모델 경진대회에 팀으로 참가해 수상했어요.
