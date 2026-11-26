# 개발과 홈서버 사이에서 만드는 것들

온라인인데 답하지 않는 봇, 수정 중인 AI 대화, CTF 제출 기록. 코드와 서버를 오가며 만드는 것들과 이 블로그의 읽기 순서.

작성일: 2026-11-26

Discord 봇 여섯 개가 모두 온라인으로 표시되는데 일반 채팅에는 답이 없었다. 프로세스도 살아 있었고 상태 명령도 등록돼 있었다. 코드를 따라가 보니 슬래시 명령을 받는 처리는 있지만, 일반 채팅 메시지를 받는 처리가 빠져 있었다. 이후에는 결과를 원래 채널로 보내는 부분과 CLI 호출도 차례로 고쳤다.

[그때의 기록](https://chihun1111.github.io/my-space-blog/posts/hermes-development-vm/)을 다시 보면 개발과 서버 운영을 함께 다루는 이유가 드러난다. 연결 상태, 요청 수신, 실제 실행, 결과 전달은 각각 확인해야 하는 단계였다. 최근에 작업한 AI 대화 서비스와 CTF 플랫폼에서도 같은 질문을 만나고 있다. **요청이 어디까지 진행됐고, 무엇이 저장됐으며, 실패한 뒤에는 어디서 다시 시작해야 할까.**

이 블로그에는 [chihun1111](https://github.com/chihun1111)이라는 이름으로 작업해 온 코드와 홈서버의 기록을 함께 남긴다. 처음 방문했다면 아래 세 작업을 통해 어떤 문제를 다루는지 살펴볼 수 있다.

## 말씨에서 다루는 대화와 결과의 상태

말씨는 HOP Biohealth AI Challenge에서 함께 개발한 팀 프로젝트다. 어려움을 겪는 사람 곁의 가족이나 친구가 대화와 행동을 준비하도록 돕는다. 사용자는 목적과 상황을 설명하고, 필요한 질문에 답한 뒤 대화문과 행동 가이드를 카드로 받는다.

나는 웹 화면에 PostgreSQL과 Gemma 모델 경로를 연결하고, 입력 보존·재시도·후속 대화·결과 저장을 개선하는 작업에 참여했다. 최근에는 다음 질문을 고르는 모델과 최종 카드를 만드는 모델의 역할을 나누고, 오래 걸리는 결과 생성을 별도 작업으로 관리하도록 반영했다.

여기에는 모델의 답변 외에도 결정할 것이 많다. 사용자가 기다리다가 입력을 수정하면 이전 답변으로 만든 결과를 어떻게 처리할지, 브라우저 연결이 끊겨도 결과를 계속 저장할지, 서버가 다시 시작하면 어느 작업을 이어받을지 정해야 한다. 대화의 버전과 실행 상태를 함께 관리하는 이유다.

[말씨 개발 기록](./malssi-ai-conversation-recovery.md)에서는 이러한 문제를 입력부터 저장까지 이어서 설명했다. 실제로 반영한 변경은 [말씨 저장소의 내 커밋](https://github.com/seonizz/HOP_Biohealth_AI-Challenge/commits/main/?author=chihun1111)에서도 확인할 수 있다.

## CTF에서 연결한 참가자 경험과 운영 기능

CTF 플랫폼은 문제를 열고 플래그를 제출하는 참가자 화면, 진행 상황을 확인하는 관리자 기능, 서버 구축과 배포까지 직접 맡은 프로젝트다. 문제의 유형과 난이도를 구성하는 작업과 함께, 참가자 데이터를 어떤 권한으로 읽고 저장할지도 다뤘다.

구현은 Next.js와 NestJS, PostgreSQL을 중심으로 묶었다. 문제 서비스에는 필요한 데이터만 제한된 API로 전달하고, 참가자별 플래그와 세션을 연결했다. 제출 처리에서는 정답 수와 문제별 결과, 감사 기록, 완료 상태가 같은 작업 안에서 확정되도록 구성했다.

예를 들어 참가자가 일부 정답을 먼저 제출한 뒤 나머지를 제출했다면, 그 두 번을 합쳐 완료로 볼 것인지부터 정해야 한다. 이 플랫폼에서는 최근 제출의 결과와 한 번이라도 최종 완료한 이력을 나누었다. 데이터 구조와 운영 화면이 같은 의미를 보여 주도록 설계한 부분이다.

[CTF 플랫폼을 만들며 배운 인증·제출·운영의 경계](./ctf-platform-auth-submission-operations.md)에서는 개인별 플래그, 제출 트랜잭션, 접속 현황 집계와 배포 후 복구 과제를 풀었다. [소스 코드](https://github.com/chihun1111/CTF_KDU)도 함께 공개하고 있다.

## 홈서버에서 직접 다루는 실행 환경

홈서버는 Proxmox 위에 TrueNAS, 개발 환경, 데이터 처리, 자동화, 게임 서버를 나눈 구성이다. VM마다 CPU·메모리·디스크를 배정하고, 브리지와 주소, 저장소, 원격 접속 경로를 연결해 왔다.

이 환경에서는 기능을 붙이는 작업과 운영 문제를 좁히는 작업이 자주 이어진다. Discord bridge에서는 메시지를 받아 실행한 뒤 원래 채널에 결과를 전달하는 흐름을 고쳤다. WOL 포털에서는 패킷 전송, Windows 준비 확인, 다음 부팅 대상 지정, 재부팅 이후 확인을 별도 단계로 다뤘다. 각 단계의 상태가 남아야 어디에서 멈췄는지 설명할 수 있다.

서버 설정이 궁금하다면 [전체 홈서버 구성](https://chihun1111.github.io/my-space-blog/posts/homelab-things-i-built/)에서 시작하면 된다. 구체적인 문제 해결 과정은 [Discord 봇 기록](https://chihun1111.github.io/my-space-blog/posts/hermes-development-vm/)과 [WOL·Windows·Ubuntu 부팅 기록](https://chihun1111.github.io/my-space-blog/posts/wol-power-portal/)에 모았다. VM으로 들어가는 경로는 [Tailscale과 SSH](https://chihun1111.github.io/my-space-blog/posts/tailscale-ssh-homelab/), 데이터 서비스 환경은 [PostgreSQL VM](https://chihun1111.github.io/my-space-blog/posts/postgresql-data-services-vm/) 글로 이어진다.

## 관심 있는 문제부터 읽기

| 궁금한 내용 | 먼저 읽을 글 |
| --- | --- |
| AI 요청의 입력 보존과 결과 복구 | [말씨 개발 기록](./malssi-ai-conversation-recovery.md) |
| 인증·제출·관리자 운영을 연결한 웹 서비스 | [CTF 플랫폼 기록](./ctf-platform-auth-submission-operations.md) |
| VM·NAS·네트워크의 전체 구성 | [홈서버 구축 기록](https://chihun1111.github.io/my-space-blog/posts/homelab-things-i-built/) |
| 연결은 됐는데 결과가 돌아오지 않는 문제 | [온라인인 Discord 봇이 답하지 않던 이유](https://chihun1111.github.io/my-space-blog/posts/hermes-development-vm/) |
| 전원 요청과 OS 준비 상태를 나누는 방법 | [WOL 포털과 부팅 작업](https://chihun1111.github.io/my-space-blog/posts/wol-power-portal/) |

앞으로도 문제의 증상, 원인을 좁힌 과정, 바꾼 코드와 확인 결과를 함께 남기려고 한다. 말씨에서는 질문·생성·검토·저장까지 이어지는 실제 모델 검증이 다음 과제다. 홈서버에서는 접속이 막혀 확인을 마치지 못한 서비스의 기록을 이어가려 한다. 다시 작업할 때 필요한 맥락이 이곳에 쌓였으면 한다.

기록 시점: 연결한 홈서버 글은 2026년 10월에 정리한 구성과 이전 작업 이력을 담고 있다. 당시 확인한 상태와 이후에 확인할 항목은 각 글에 따로 적었다.
