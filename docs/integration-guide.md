# 만세력 통합 가이드

여섯 개의 핵심 작업(온라인 만세력 연동, 오프라인 백업, 기둥 계산, 파생 분석, API 엔드포인트, 테스트)을 하나의 일관된 서비스로 묶기 위한 실무 가이드입니다. 각 모듈이 주고받는 데이터 형태와 브랜치 병합 절차를 정리하여, 여러 작업 브랜치에서 진행된 개발 결과를 한 번에 통합할 수 있도록 돕습니다.

## 1. 시스템 전체 구조

```
┌─────────────┐    ┌────────────────┐    ┌─────────────────┐    ┌───────────────────┐
│ 입력 검증/시간대 │ → │ KASI API 클라이언트 │ → │ 기둥/시주 계산 모듈 │ → │ 파생 분석 모듈 (오행/십신 등) │
└─────────────┘    │    │            │    └─────────────────┘    └───────────────┬─────┘
       ↓             │    │            │                    ↓                     │
  캐시/로깅/오류 처리 │    │            │           오프라인 백업 (Fallback)       │
       ↓             └────┴──────────────────────────────────────────────────────┘
                                   ↓
                             API 응답 생성
```

각 박스는 아래와 같은 소스 디렉터리로 대응됩니다.

| 모듈 | 제안 디렉터리 | 주요 책임 |
| --- | --- | --- |
| API 클라이언트 | `src/services/kasiClient.js` | KASI 만세력 API 호출 및 오류 처리 |
| 오프라인 백업 | `src/services/offlineLunar.js` | 네트워크 실패 시 캘린더 변환(근사 계산) |
| 기둥/시주 계산 | `src/domain/pillars.js` | 연·월·일·시 기둥 산출 |
| 파생 분석 | `src/domain/analysis.js` | 오행, 십신, 십이운성, 대운 계산 |
| 엔드포인트 | `src/routes/saju.js` | 요청 오케스트레이션 및 응답 구성 |
| 테스트 | `tests/**` | Node 내장 테스트(`node --test`) |

## 2. 데이터 계약 (DTO)

모듈 간 결합도를 낮추기 위해 다음과 같은 표준 DTO를 사용합니다.

### 2.1 `CalendarConversionResult`

```ts
interface CalendarConversionResult {
  solar: { year: number; month: number; day: number; isoString: string; };
  lunar: { year: number; month: number; day: number; isLeapMonth: boolean; };
  pillars: {
    year: { stem: string; branch: string; labelKo: string; labelHanja: string; };
    month: { stem: string; branch: string; labelKo: string; labelHanja: string; };
    day: { stem: string; branch: string; labelKo: string; labelHanja: string; };
  };
  metadata: { source: 'kasi' | 'offline'; rawResponse: unknown; };
}
```

### 2.2 `SajuComputationResult`

```ts
interface SajuComputationResult {
  pillars: CalendarConversionResult['pillars'] & {
    hour: { stem: string; branch: string; labelKo: string; labelHanja: string; };
  };
  fiveElements: Record<'wood' | 'fire' | 'earth' | 'metal' | 'water', number>;
  tenGods: Record<string, string>;
  twelveStages: Record<'year' | 'month' | 'day' | 'hour', string>;
  greatFortune: Array<{ startAge: number; startYear: number; pillar: string }>;
}
```

이 DTO들은 온라인/오프라인 변환 계층과 파생 분석 모듈이 동일한 인터페이스로 동작하도록 보장합니다.

## 3. 오케스트레이션 플로우

1. **입력 검증 & 시간대 정규화** – `routes/saju.js`에서 필수 필드를 확인하고, `utils/date.js`가 표준 `Intl.DateTimeFormat` API로 KST 기준 시각을 도출합니다.
2. **KASI API 호출** – 우선 `kasiClient.fetchLunarBySolar()` 또는 `fetchSolarByLunar()`를 호출합니다. 실패 시 오류를 포착합니다.
3. **오프라인 Fallback** – API 오류, 타임아웃, 지원 연도 범위 초과 시 `offlineLunar.convertSolarToLunarOffline()`이 간지 계산/윤달 기본값으로 근사 변환을 수행합니다.
4. **시주 계산** – `pillars.buildConversionResult()`와 `getHourPillar()`가 KST 기준 출생 시각을 받아 연·월·일·시 기둥을 계산합니다. 월 기둥은 절기 경계 테이블로, 일 기둥은 율리우스일 보정으로 도출합니다.
5. **파생 분석** – `analysis.buildSajuProfile()`이 오행, 십신, 십이운성, 대운을 산출합니다.
6. **응답 구성** – `/api/saju` 컨트롤러가 계산 결과를 JSON으로 직렬화합니다. (GPT 요약은 후속 확장 지점으로 남겨두었습니다.)

## 4. 브랜치 통합 및 PR 전략

1. **메인 타깃 브랜치 선택** – 모든 작업 브랜치를 병합할 기준 브랜치(예: `develop` 또는 `main`)를 체크아웃합니다.
2. **통합 브랜치 생성** – `git checkout -b feature/saju-integration`처럼 여섯 개 작업을 함께 묶을 임시 통합 브랜치를 만듭니다. 개별 작업 브랜치는 여기에 순차적으로 병합합니다.
3. **순차 병합** – 중요도가 낮은 브랜치부터 `git merge <branch>`로 통합 브랜치에 병합하거나, GitHub에서 통합 브랜치를 대상으로 PR을 생성합니다. 충돌은 통합 브랜치에서 해결합니다.
4. **충돌 정리 및 상태 확인** – 각 브랜치를 병합한 뒤 `git status`로 충돌이 모두 해결되었는지 확인하고, 필요 시 `npm install`/`npm test`를 실행하여 통합된 코드가 여전히 동작하는지 빠르게 검증합니다. 충돌 해결 커밋에는 어떤 브랜치를 병합했고 어떤 파일을 손봤는지 커밋 메시지로 명시합니다.
5. **단일 PR 제출** – 모든 작업을 통합 브랜치에 모은 뒤, 최종적으로 메인 브랜치에 머지하기 위한 **하나의 PR**을 생성합니다. 여섯 개 작업 각각에 별도의 PR을 만들 필요는 없으며, 단일 PR의 본문에 각 작업의 주요 변경 사항을 요약합니다.
6. **공통 의존성 정리** – `package.json`/`requirements.txt`의 중복 의존성을 조정하고, 환경 변수 키(`KASI_API_KEY`)를 `.env.example`에 정리합니다.
7. **통합 테스트 실행** – 병합 이후 `npm test`를 실행하여 전체 파이프라인이 정상 작동하는지 확인합니다. 가능하다면 `/api/saju`에 대한 수동 호출도 수행해 합쳐진 브랜치에서 서비스가 기대대로 동작하는지 최종 점검합니다.
8. **문서 및 코드 정리** – 네이밍, 디렉터리 구조, DTO 사용 여부를 다시 점검하고 `docs/`의 문서를 최신 상태로 유지합니다.

## 5. 체크리스트

- [ ] 입력 검증이 모든 필수 필드를 커버하는가?
- [ ] API 키 및 타임아웃 값이 환경 변수로 관리되는가?
- [ ] 오프라인 라이브러리 범위(1000–2050년)가 문서화되었는가?
- [ ] 시간대 변환 테스트가 엣지 케이스(23:30 등)를 포함하는가?
- [ ] 대운 계산에서 성별에 따른 순행/역행 규칙이 반영되었는가?
- [ ] 통합 테스트가 온라인/오프라인 양쪽 흐름을 검증하는가?

## 6. 참고 자료

- KASI 만세력 API 문서: <https://www.data.go.kr/data/15012690/openapi.do>
- korean-lunar-calendar: <https://www.npmjs.com/package/korean-lunar-calendar>
- 사주 천간/지지 테이블: <https://en.wikipedia.org/wiki/Sexagenary_cycle>

위 흐름에 따라 브랜치를 통합하고 문서를 정리하면, 어떤 개발자라도 저장소의 구조와 의도를 빠르게 이해하고 필요한 기능을 확장할 수 있습니다.

## 7. REST API 예시

로컬에서 `npm start`로 서버를 띄운 뒤 아래와 같이 호출하면 만세력 계산 결과를 확인할 수 있습니다.

```bash
curl -X POST http://localhost:3000/api/saju \
  -H 'Content-Type: application/json' \
  -d '{
    "calendarType": "solar",
    "date": "2023-01-20",
    "time": "07:30",
    "timezone": "Asia/Seoul",
    "gender": "male"
  }'
```

응답에는 `conversion`(연·월·일 기둥, 음력 정보)과 `saju`(시주, 오행 분포, 십신, 십이운성, 대운)가 포함됩니다. KASI API 키가 없거나 호출에 실패하면 자동으로 오프라인 근사 계산으로 전환됩니다.
