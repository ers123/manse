# 만세력 계산 서비스 개요

이 저장소는 사주 만세력 계산 모듈을 설계·구현하기 위한 제품 요구 사항(PRD)과 기술적 가이드를 제공합니다. 현재 `manse.md` 파일에 핵심 PRD가 정리되어 있으며, 여섯 개의 주요 작업을 통합한 전체 아키텍처와 흐름은 `docs/integration-guide.md`에서 확인할 수 있습니다.

## 저장소 구조

- `manse.md` – 제품 요구 사항 문서(PRD)
- `docs/integration-guide.md` – 여섯 개 작업을 하나의 서비스로 묶는 통합 가이드

## 빠른 시작

1. `docs/integration-guide.md`를 통해 전체 아키텍처와 작업 흐름을 파악합니다.
2. PRD(`manse.md`)의 세부 요구 사항과 수용 기준을 확인합니다.
3. 필요한 환경 변수를 `.env.example`을 참고해 `.env`에 설정합니다.
4. 아래 실행 가이드를 따라 만세력 REST 서비스를 기동합니다.

## 실행 가이드

- **필수 요건**: Node.js 18 이상 (표준 `fetch`, `node:test` 내장 기능 사용)
- **환경 변수**: `KASI_API_KEY` (KASI 만세력 API 키), `PORT` (선택)

```bash
cp .env.example .env
# .env 파일에 KASI_API_KEY를 입력합니다.

npm start
# http://localhost:3000/api/saju 로 POST 요청을 보내 만세력을 계산합니다.

npm test
# 핵심 만세력 계산 로직과 오행/십신 파생 계산 테스트 실행
```

외부 API를 사용할 수 없는 환경에서는 자동으로 오프라인 근사 로직을 사용합니다. 오프라인 모드는 KST 기준 시간대 조정과 간지(干支) 계산을 직접 수행하며, 윤달 여부는 `false`로 기본 처리됩니다.

## 라이선스

해당 프로젝트는 아직 라이선스가 명시되지 않았습니다.
