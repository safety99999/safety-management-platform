# 📦 POSCO FM 안전관리 플랫폼 - 프로젝트 인수인계 문서

**작성일**: 2026-08-27  
**버전**: 3.2 (JSA DB 관리자 페이지 최소 기능 운영본 및 Firestore 86건 반영)  
**목적**: 새 세션에서 프로젝트를 즉시 이어서 진행할 수 있도록 하는 총괄 인수인계 문서  
**대상**: Claude AI 새 세션 또는 신규 개발자

---

## 🎯 프로젝트 개요

### 프로젝트명
**POSCO FM 포항양극재공장 안전관리 플랫폼**

### 확정된 아키텍처
| 계층 | 기술 | 상태 |
|---|---|---|
| **프론트엔드** | HTML + CSS + Vanilla JS | 유지 |
| **백엔드** | Firebase Firestore | 운영 시작 |
| **인증** | Firebase Auth (Google OAuth) | 도입 예정 |
| **배포** | Firebase Hosting | 운영 중 |
| **코드 관리** | GitHub (`safety99999/safety-management-platform`) | 운영 중 |
| **이메일** | EmailJS + 개인 Gmail (개발 단계) | 도입 예정 |
| **JSA DB 운영도구** | `jsa_db_manager.html` | ✅ 최소 기능 운영본 완성 |

### 비용 정책
- ✅ **Firebase Spark(무료) 플랜만 사용**
- ❌ Blaze(유료) 전환 없음
- ❌ Cloud Functions 사용 없음
- ✅ 필요 시 EmailJS(월 200통 무료) 활용

### 주요 URL
| 자원 | URL |
|---|---|
| Firebase Console | https://console.firebase.google.com/project/safety-management-platfo-5f413 |
| 배포된 사이트 | https://safety-management-platfo-5f413.web.app |
| GitHub 저장소 | https://github.com/safety99999/safety-management-platform |
| JSA DB 관리자 | `https://safety-management-platfo-5f413.web.app/jsa_db_manager.html` |
| 안전작업허가서 | https://safety-management-platfo-5f413.web.app/안전작업허가서_v2.html |
| TBM 앱 | https://safety-management-platfo-5f413.web.app/TBM_및_작업중지권_v2.html |
| 위험성평가 앱 | https://safety-management-platfo-5f413.web.app/위험성평가_v2.html |

---

## 📊 현재 상태 (Snapshot) - 2026-08-27 기준

### 파일 완성도

| 파일 | Phase B | Phase 1 | JSA DB 연동 | 배포 |
|---|:---:|:---:|:---:|:---:|
| `안전관리플랫폼_대시보드_V6_.html` | ✅ | - | - | ✅ |
| `안전작업허가서_v2.html` | ✅ | ✅ (1-C/1-E) | - | ✅ |
| `TBM_및_작업중지권_v2.html` | ✅ | ✅ (실무 프로세스) | - | ✅ |
| `위험성평가_v2.html` | ✅ | ✅ (Phase 1 완성) | ✅ | ✅ |
| `jsa_db_manager.html` | - | ✅ | ✅ | ✅ |
| `포항양극재공장_안전퀴즈.html` | ❌ | - | - | ⚠️ 대기 |
| `안전정보제공서_도급인용.html` | ❌ | - | - | ⚠️ 대기 |
| `안전정보제공서_수급인용.html` | ❌ | - | - | ⚠️ 대기 |

### JSA DB 현재 운영 상태
- ✅ Firestore 컬렉션명: `jsaDatabase`
- ✅ 전체 86건 Firestore 업로드 완료
- ✅ 전체 DB 엑셀 다운로드 결과 86건 확인
- ✅ 업로드/다운로드 양식 16열로 통일
- ✅ 엑셀 파일 업로드 지원
- ✅ 엑셀 복사 붙여넣기 업로드 지원
- ✅ 엑셀 템플릿 다운로드 지원
- ✅ 전체 DB 엑셀 다운로드 지원

---

## 🎊 오늘 (2026-08-27) 완료 사항

### 1️⃣ 안전작업허가서 - date/time CSS 통일 ✅
- **iOS Safari 기본 스타일 강제 초기화**
- **PC/모바일 형태 완전 동일** (크기만 다름)
- 📅 🕐 아이콘 명시적 표시 (SVG background)
- 320px 이하만 세로 배치 (일반 스마트폰은 항상 2열)
- 다크모드 아이콘 대응
- **모바일 검증 완료**

### 2️⃣ TBM 앱 - Phase B 완성 ✅
- ✅ CSS 변수 통일 (안전작업허가서와 동일 팔레트)
- ✅ 반응형 방안 A (배경 그라디언트 + PC 카드 그림자)
- ✅ 홈버튼 🏠 + 테마버튼 🌙 (둘 다 유지)
- ✅ date/time 통일 (안전작업허가서와 동일 규약)
- ✅ 다크모드 완전 대응
- ✅ 바텀네비 라벨 명확화 (`작업중지권` → `작업중지 요청`)

### 3️⃣ TBM 앱 - 실무 프로세스 반영 ⭐ 중요
- ✅ **시간 필드 정리**: `TBM 종료시간`, `작업 시작시간` 제거
  - 근거: 작업 시간은 안전작업허가서에서 관리
- ✅ **작업중지권 고지 섹션 추가**
  - 산안법 제52조 법정 고지
  - 참여자 명단
  - 대표자 서명
  - **필수 검증**

### 4️⃣ TBM 앱 - 허가서 자동 채움 ⭐ 핵심 UX
- ✅ `permitNo`만 URL로 → localStorage 조회하여 자동 채움
- ✅ 자동 채움 필드:
  - 작업명, 작업 장소, 협력사, 작업인원
  - 작업 책임자
  - 밀폐공간 여부 (workTypes 자동 판단)
- ✅ 자동 채움 시각화 (`.f-input.auto`)
- ✅ 사용자가 수정하면 자동 해제
- ✅ 기존 URL 파라미터 방식 하위 호환 유지

### 5️⃣ 위험성평가 앱 - Phase 1 완성 ⭐⭐⭐
- ✅ Phase B 전체 리팩토링
- ✅ JSA DB 검색 시스템
- ✅ 안전대책 카드 선택 시스템
- ✅ 하이브리드 위험도 평가
  - 매트릭스 5×5
  - 통제 적정성 ○/△/×
- ✅ 참조 JSA 추적
- ✅ 저장 스키마 v2

### 6️⃣ JSA DB 관리자 페이지 최소 기능 운영본 완성 ⭐⭐⭐
- ✅ 파일명: `jsa_db_manager.html`
- ✅ Firestore 컬렉션: `jsaDatabase`
- ✅ 16열 최소 엑셀 템플릿 확정
- ✅ 엑셀 템플릿 다운로드 지원
- ✅ 전체 DB 엑셀 다운로드 지원
- ✅ 엑셀 파일 업로드 지원
- ✅ 엑셀 복사 붙여넣기 업로드 지원
- ✅ 내부 자동 생성:
  - `jsaId`
  - `rowNo`
  - `version`
  - `status`
  - `changeReason`
  - `effectiveDate`
  - `docId`
- ✅ 업로드 시 기존 `docId` 존재하면 스킵
- ✅ 전체 86건 Firestore 업로드 완료
- ✅ 전체 DB 다운로드 결과 86건 확인
- ✅ 다운로드와 업로드 양식 동일화 완료

### 7️⃣ 확보된 실무 자료 (참고)
- 안전작업허가서 작성 기준
- 작업 흐름/프로세스 자료
- JSA_DB 구조/검증 관련 문서 초안

---

## 🔑 확립된 새 규약 (핵심)

### 1️⃣ date/time 통일 CSS 규약
**적용 대상**: 모든 앱의 `input[type="date"]`, `input[type="time"]`, `input[type="datetime-local"]`

**적용 완료**:
- 안전작업허가서
- TBM
- 위험성평가

### 2️⃣ 앱 간 자동 채움 원칙
**원칙**:
1. URL에 permitNo만 전달
2. 받는 앱이 localStorage에서 permit 조회
3. 자동 채움 필드는 `.auto` 클래스로 시각화
4. 사용자가 수정하면 `.auto` 클래스 해제

### 3️⃣ 작업중지권 고지 규약
**법적 근거**: 산업안전보건법 제52조

**TBM 저장 시 포함 구조**:
- 참여자 명단
- 대표자 이름
- 대표자 서명
- 고지 시각
- 법적 근거

### 4️⃣ JSA DB 16열 최소 양식 규약 ⭐
현재 JSA DB 관리자 페이지는 아래 16열만 사용자 입력/다운로드 양식으로 사용한다.

1. No  
2. 분류코드  
3. 관리시트  
4. 작업유형  
5. 세부작업유형  
6. 작업명  
7. 작업단계  
8. 사용장비·공구  
9. 사용물질·에너지  
10. 원문 위험요인  
11. 사고유형  
12. 사고시나리오  
13. 안전대책  
14. 표준 안전대책명  
15. 통제 적정성  
16. 비고  

**원칙**:
- 템플릿 다운로드 = 전체 DB 다운로드 = 업로드 양식 동일
- Firestore 내부 관리 필드는 시스템이 자동 생성
- 사용자는 16열만 다룸

---

## 🎯 앱 간 데이터 흐름 (현재 기준)

### 1️⃣ 안전작업허가서
- permitNo 발급
- 작업 기본정보 저장
- TBM / 위험성평가로 permitNo 전달

### 2️⃣ 위험성평가 앱
- 허가서 정보 자동 채움
- JSA DB 검색
- 안전대책 선택
- 위험도 및 통제 적정성 평가
- 결과 저장

### 3️⃣ TBM 앱
- 허가서 정보 자동 채움
- 작업중지권 고지 포함
- TBM 저장
- permit 상태 연동

### 4️⃣ JSA DB 관리자
- 16열 템플릿 다운로드
- 전체 DB 엑셀 다운로드
- 엑셀 파일 업로드
- 엑셀 복사 붙여넣기 업로드
- Firestore `jsaDatabase` 신규 누적 업로드

---

## ⏳ 남은 작업 (우선순위별)

### 🔴 P0 (다음 세션 최우선)

#### 1. `jsa_db_manager.html` GitHub 저장 및 운영본 확보
- 현재 실제 동작본 기준 백업/저장
- 저장소에 확실히 반영

#### 2. 인수인계/구조 문서 현행화
다음 문서의 현재 운영 기준 반영 필요:
- `PROJECT_HANDOVER.md`
- `JSA_DB_STRUCTURE.md`
- `JSA_DB_VALIDATION_RULES.md`

특히 수정 필요:
- 15열 → 16열
- Firestore 컬렉션 `JSA_DB` → `jsaDatabase`
- 현행 운영 범위와 중장기 schemaVersion 3 범위 구분

#### 3. Firestore Rules 운영 전환 TODO 정리
현재 테스트용으로 `jsaDatabase` 읽기/쓰기가 열려 있음  
운영 전에는 인증 기반으로 변경 필요

### 🟠 P1

#### 4. 다른 앱 Phase B 리팩토링
- 포항양극재공장_안전퀴즈.html
- 안전정보제공서_도급인용.html
- 안전정보제공서_수급인용.html

### 🟡 P2

#### 5. 위험성평가 → TBM 자동 연계 고도화
- permit 기반 위험요인/대책 자동 반영 정교화
- 사용자 확인 UX 개선

#### 6. 통합 리포트 및 작업 완료 흐름 정리
- 작업완료 처리
- 작업중 안전조치 이행상태 확인
- 통합 리포트

### 🟢 P3

#### 7. Firestore 운영 구조 고도화
- 승인/검토/권한 구조 정리
- history 또는 버전관리 정책 검토
- 인증 기반 접근제어 적용

---

## 🔑 프로젝트 규약 요약 (현행 기준)

### 저장소 키 매핑
| 데이터 | localStorage 키 | Firestore 컬렉션 |
|---|---|---|
| 작업 | `safetyDatabase.workHistory[]` | `작업DB` |
| 허가 | `safetyPermits[]` | `작업허가` |
| TBM | `safetyTBM[]` | `TBM` |
| 위험성평가 | `riskAssessments[]` | `위험성평가` |
| 안전퀴즈 | `safetyQuizzes[]` | `안전퀴즈` |
| 안전정보제공 | `safetyProvisions[]` | `안전정보제공` |
| 긴급조치 | `emergencies[]` | `긴급조치` |
| **JSA DB** | (캐시/엑셀 기반) | `jsaDatabase` |

### JSA DB 현재 운영 원칙
- 사용자 입력/다운로드 양식은 16열 최소 구조
- Firestore 내부 관리 필드는 자동 생성
- `docId` 기준 중복 확인
- 기존 문서 존재 시 업로드 스킵
- 전체 DB 다운로드는 16열 양식으로 반환

### 감사 필드
모든 문서에 가능하면 아래 필드 유지
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `schemaVersion`

### 위험성평가 스키마 핵심
- `overallScore`
- `overallRisk`
- `controlAdequacy`
- `selectedMeasures[]`
- `userMeasures[]`
- `referencedJSA`
- `schemaVersion: 2`

---

## ⚠️ 현재 주의사항

### 1. Firestore Rules
현재 테스트 편의를 위해 `jsaDatabase` 가 열려 있을 수 있음.

예:
```js
match /jsaDatabase/{document=**} {
  allow read, write: if true;
}
## 작업DB Firestore 이관 완료

- 대시보드 작업관리대장 구조 보강 완료
- localStorage `safetyDatabase.workHistory` → Firestore `작업DB` 이관 완료
- Firestore 문서 ID는 `workId` 사용
- `workId` 형식: `{date}_{originalNo}`
- 작업DB 전체 703건 업로드 완료
- localStorage 703건 / Firestore 703건 일치 확인
- workId 오류 0건 확인
- 기존 문서 스킵 방식 적용
- `rawColumns`는 Firestore 업로드 대상에서 제외
- 대시보드 설정 화면에 다음 기능 추가
  - 작업DB 10건 확인 업로드
  - 작업DB 건수 확인
  - 작업DB 전체 업로드
  - 로컬 건수 새로고침
- Firestore 컬렉션: `작업DB`
- 현재 Firestore Rules는 작업DB 테스트 편의를 위해 공개 상태
- 운영 전 Firebase Authentication 기반 Rules 전환 필요
