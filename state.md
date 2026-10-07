# 가발 게임 진행 상태

갱신: 2026-10-06

## 첫 비행 CTA 정합성 개선 (2026-10-06)

- 첫 비행 코치의 마지막 `Launch it`이 코치만 닫고 실제 비행을 시작하지 않던 문제를 수정했다. 마지막 클릭에서 첫 lift 입력까지 연결하고, 중간 `Got it` 단계만 첫 입력/SDK 시작 알림을 보낸다.
- 가발 `index.html` meta CSP에서 브라우저가 무시한다고 보고하던 `frame-ancestors`만 제거했다. 나머지 허용 출처와 script 정책은 유지했다.
- 검증: TypeScript + Vite 프로덕션 빌드 통과(dist/index.html 344.41 kB / gzip 101.92 kB), `git diff --check` 통과. 격리 브라우저에서 코치 1/3→2/3→3/3 진행 뒤 `Launch it`을 눌렀고, 게임이 실제 run을 시작해 무조작 상태에서 추락 결과 화면까지 도달했다. 새 페이지 재접속 시 console errors/warnings 0/0.
- 한계: 입력 유지/조향 없이 끝낸 자동화 run이므로 자연 플레이 성공률·첫 착지 시간은 측정하지 않았다. Poki Inspector와 모바일 터치 실기 검증은 미완료.

## Solarena 바이럴성 개선

- 착지/충돌 결과에서 현재 요약 데이터로 친구 도전 링크를 만든다. 무한 모드는 실제 홉·점수, 스테이지/보스는 실제 착지 정확도·현재 스테이지를 전달한다.
- Poki에서는 `shareableURL`에 모드·기록을 전달하고, 초대 URL을 열면 같은 모드로 시작해 기록을 상단 도전 배너에 보여준다. 비 Poki 환경은 `type=toupee_challenge` query fallback 사용.
- 선택형 Web Share, 지원되지 않으면 클립보드 복사를 제공한다.
- 확인: `npm run build` 통과 (TypeScript + Vite, dist/index.html 344.39 kB / gzip 101.91 kB). `git diff --check` 통과.
- 실제 브라우저에서 `?type=toupee_challenge&mode=endless&hops=21&score=2400&accuracy=92&stage=4`로 열어 배너의 “21 hops / 2400 points”와 Endless 모드 선택을 확인했다.
- 제한: 실제 자연 플레이로 결과를 만든 뒤 공유하는 흐름, 기기 공유시트/클립보드, Poki Inspector/SDK는 미검증. 브라우저에는 기존 `frame-ancestors` meta CSP 경고 한 건이 있고 기능 런타임 오류는 확인되지 않았다.
- 코드: `src/game/share.ts`, `src/App.tsx`, `src/components/FlyingToupeeGameCanvas.tsx`.
- 다음: 자연 플레이로 결과 공유와 재도전을 확인하고, 실SDK/모바일 검증을 수행한다.
