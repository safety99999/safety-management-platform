# 📦 POSCO FM 안전관리 플랫폼 - 프로젝트 인수인계 문서

**작성일**: 2026-08-27  
**버전**: 3.1 (위험성평가 v2 + JSA_DB 연동 완료 반영)  
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
| **백엔드** | Firebase Firestore | 이관 진행 중 |
| **인증** | Firebase Auth (Google OAuth) | 도입 예정 |
| **배포** | Firebase Hosting | 운영 중 |
| **코드 관리** | GitHub (`safety99999/safety-management-platform`) | 운영 중 |
| **이메일** | EmailJS + 개인 Gmail (개발 단계) | 도입 예정 |
| **JSA_DB** | 로컬 JSON → Firestore 이관 예정 | ⭐ 데이터 준비 시작 |

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
| JSA_DB 업로드 도구 | https://safety-management-platfo-5f413.web.app/firestore_upload.html |
| 안전작업허가서 | https://safety-management-platfo-5f413.web.app/안전작업허가서_v2.html |
| TBM 앱 | https://safety-management-platfo-5f413.web.app/TBM_및_작업중지권_v2.html |
| 위험성평가 앱 | https://safety-management-platfo-5f413.web.app/위험성평가_v2.html |
| JSA_DB 데이터 | https://safety-management-platfo-5f413.web.app/data/jsa_database.json |

---

## 📊 현재 상태 (Snapshot) - 2026-08-27 기준

### 파일 완성도

| 파일 | Phase B | Phase 1 | JSA_DB 연동 | 배포 |
|---|:---:|:---:|:---:|:---:|
| `안전관리플랫폼_대시보드_V6_.html` | ✅ | - | - | ✅ |
| `안전작업허가서_v2.html` | ✅ | ✅ (1-C/1-E) | - | ✅ |
| `TBM_및_작업중지권_v2.html` | ✅ | ✅ (실무 프로세스) | - | ✅ |
| `위험성평가_v2.html` | ✅ | ✅ (Phase 1 완성) | ✅ | ✅ |
| `data/jsa_database.json` (신규) | - | ✅ (11건 샘플) | - | ✅ |
| `포항양극재공장_안전퀴즈.html` | ❌ | - | - | ⚠️ 대기 |
| `안전정보제공서_도급인용.html` | ❌ | - | - | ⚠️ 대기 |
| `안전정보제공서_수급인용.html` | ❌ | - | - | ⚠️ 대기 |

### 🎊 오늘 (2026-08-27) 완료 사항

#### 1️⃣ 안전작업허가서 - date/time CSS 통일 ✅
- **iOS Safari 기본 스타일 강제 초기화**
- **PC/모바일 형태 완전 동일** (크기만 다름)
- 📅 🕐 아이콘 명시적 표시 (SVG background)
- 320px 이하만 세로 배치 (일반 스마트폰은 항상 2열)
- 다크모드 아이콘 대응
- **모바일 검증 완료**

#### 2️⃣ TBM 앱 - Phase B 완성 ✅
- ✅ CSS 변수 통일 (안전작업허가서와 동일 팔레트)
- ✅ 반응형 방안 A (배경 그라디언트 + PC 카드 그림자)
- ✅ 홈버튼 🏠 + 테마버튼 🌙 (둘 다 유지)
- ✅ date/time 통일 (안전작업허가서와 동일 규약)
- ✅ 다크모드 완전 대응
- ✅ 바텀네비 라벨 명확화 (`작업중지권` → `작업중지 요청`)

#### 3️⃣ TBM 앱 - 실무 프로세스 반영 ⭐ 중요
- ✅ **시간 필드 정리**: `TBM 종료시간`, `작업 시작시간` 제거
  - 근거: 작업 시간은 안전작업허가서에서 관리 (표 3, 아.5)
- ✅ **작업중지권 고지 섹션 추가** (신규)
  - 산안법 제52조 법정 고지
  - 참여자 명단 (쉼표 구분)
  - 대표자 서명
  - **필수 검증**

#### 4️⃣ TBM 앱 - 허가서 자동 채움 ⭐ 핵심 UX
- ✅ `permitNo`만 URL로 → localStorage 조회하여 6개 필드 자동 채움
- ✅ **자동 채움 필드**:
  - 작업명, 작업 장소, 협력사, 작업인원
  - **작업 책임자** (신규)
  - **밀폐공간 여부** (workTypes 자동 판단)
- ✅ **허가서 배너 강화**: 상세 정보 표시 (유효기간, workTypes 아이콘)
- ✅ **자동 채움 시각화** (`.f-input.auto` 초록 배경)
- ✅ **편집 시 자동 해제** (사용자가 수정하면 흰색 배경)
- ✅ **하위 호환**: 기존 URL 파라미터 방식도 계속 작동

#### 5️⃣ 위험성평가 앱 - Phase 1 완성 ⭐⭐⭐ 대규모 개편
- ✅ **Phase B 전체 리팩토링**
  - CSS 통일, 반응형, 홈버튼, date/time 통일

- ✅ **JSA_DB 검색 시스템** (신규 핵심 기능)
  - 자동 검색 (STEP 2 진입 시)
  - 수동 재검색 버튼
  - 다중 필드 유사도 (작업명 50% + 유형 30% + 설명 20%)
  - Jaccard 유사도 알고리즘
  - 상위 5건 표시
  - 아코디언 상세 보기
  - 12종 분류 태그 시각화

- ✅ **안전대책 카드 선택 시스템** (신규 핵심 기능)
  - JSA에서 도출한 대책을 카드로 표시
  - 클릭으로 선택/해제
  - 태그 표시 (법령/사내/AI 등)
  - 사용자 추가 대책 입력
  - 실시간 선택 현황

- ✅ **하이브리드 위험도 평가**
  - **매트릭스 5×5** (빈도 × 강도) - 기존 유지
  - **통제 적정성 ○/△/×** (신규) - JSA_DB 프롬프트 규약
  - △·× 선택 시 Phase 2 AI 재평가 힌트 표시

- ✅ **참조 JSA 추적**
  - 어느 JSA에서 대책 도출인지 기록
  - 감사 대응 (`referencedJSA` 필드)

- ✅ **저장 스키마 v2**
  - `selectedMeasures[]` (JSA 도출, source 태그)
  - `userMeasures[]` (사용자 추가)
  - `controlAdequacy` (통제 적정성)
  - `referencedJSA` (JSA 참조)
  - `schemaVersion: 2`

#### 6️⃣ `data/jsa_database.json` - JSA_DB 데이터 파일 신규 생성 ⭐
- ✅ **11건 샘플 데이터** (12종 분류 대표)
- ✅ **JSA_DB 프롬프트 스키마** 완전 준수
- ✅ **분류 커버리지**:
  - WRK (원문) - 7건
  - ACC (재해) - 1건
  - NMS (아차) - 1건
  - INT (사내) - 2건
- ⏳ **나머지 76건** - 다음 세션에서 확장

#### 7️⃣ 확보된 실무 자료 (3종) ⭐ 매우 중요
- **표 3**: 안전작업허가서 작성 내용 및 방법
  - 작성 주체별 역할 (□◇○)
  - 시간 관리 원칙
  - 밀폐공간 3자 확인
  - 연장/변경/재허가 규정
- **프로세스 다이어그램**: 안전작업허가서 → TBM → 작업 → 완료 흐름
  - 서류 흐름
  - 회수 및 보관
- **JSA_DB 프롬프트**: 51개 세부 규칙 (별도 문서 필요)
---
---

## 🔑 확립된 새 규약 (4종) ⭐ 중요

### 1️⃣ date/time 통일 CSS 규약 (2026-08-27 신규)

**목적**: PC/모바일에서 date/time 입력 형태 완전 통일

**적용 대상**: 모든 앱의 `input[type="date"]`, `input[type="time"]`, `input[type="datetime-local"]`

**핵심 CSS**:

.f-input[type="date"],
.f-input[type="time"],
.f-input[type="datetime-local"]{
  -webkit-appearance:none;
  padding:13px 44px 13px 15px;
  background-image: url("...SVG...");
  background-position:right 14px center;
  text-align:left;
  font-variant-numeric:tabular-nums;
}

@media(max-width:320px){
  .f-row.f-row-datetime{ grid-template-columns:1fr; }
}

**적용 완료**: 안전작업허가서, TBM, 위험성평가
**대기**: 안전퀴즈, 안전정보 도급인/수급인

### 2️⃣ 앱 간 자동 채움 원칙 (2026-08-27 신규)

**원칙**:
1. URL에 permitNo만 전달
2. 받는 앱이 localStorage.safetyPermits에서 조회
3. 자동 채움 필드는 .auto 클래스로 시각화 (초록 배경)
4. 사용자가 수정하면 자동으로 .auto 클래스 해제
5. 감사용 저장 시 autoFilledFrom 필드 기록 (선택)

**자동 채움 규칙**:

| 앱 | 자동 채움 대상 |
|---|---|
| **허가서 → TBM** | 작업명, 장소, 협력사, 인원, 책임자, 밀폐공간 여부 |
| **허가서 → 위험성평가** | 작업명, 장소, 협력사, 인원, 작업유형 (workTypes → workType 매핑) |
| **위험성평가 → 허가서** | 위험도 점수, 위험도, 통제 적정성, riskId, 선택된 대책 배열 |
| **허가서 → TBM (via 위험성평가)** | 위험요인 카드 자동 채움 (Phase 1-D에서 완성) |

### 3️⃣ 작업중지권 고지 규약 (2026-08-27 신규)

**법적 근거**: 산업안전보건법 제52조

**저장 위치**: TBM 저장 시 `safetyTBM[].stopNotice`

**데이터 구조**:

stopNotice: {
  participants: ['홍길동', '김철수', '이영희'],
  participantsText: '홍길동, 김철수, 이영희',
  representativeName: '홍길동',
  representativeSig: 'data:image/png;base64,...',
  noticedAt: '2026-08-27T09:15:00Z',
  legalBasis: '산업안전보건법 제52조'
}

**필수 검증**: TBM 제출 시
- 참여자 명단 필수
- 대표자 이름 필수
- 대표자 서명 필수

### 4️⃣ JSA_DB 스키마 v2 규약 (2026-08-27 신규) ⭐⭐⭐

**12종 분류 체계**:

| 코드 | 관리시트 | 의미 | 태그 |
|:---:|---|---|:---:|
| LAW | 법령 | 산안법 등 | `[법령]` |
| INT | 사내 | 사내 안전기준 | `[사내]` |
| SOP | 표준 | 작업표준서, SOP | `[표준]` |
| JSA | JSA | 위험성평가 | `[JSA]` |
| TBM | TBM | TBM 회의자료 | `[TBM]` |
| PTW | 허가 | 작업허가서 | `[허가]` |
| ACC | 재해 | 사고사례 | `[재해]` |
| NMS | 아차 | 니어미스 | `[아차]` |
| REC | 권고 | 안전지적 | `[권고]` |
| EXT | 외부 | KOSHA 등 | `[외부]` |
| WRK | 원문 | 실제 작업자료 | (태그 없음) |
| UNK | 미분류 | 불명확 | - |

**[AI] 태그 시스템**:
- 원문 대책: 태그 없음
- 근거 있는 대책: 해당 태그 (`[법령]`, `[사내]` 등)
- AI 자동 보완: `[AI]` (실무 검증 대기)

**통제 적정성 판정**:
- **○**: 제거·대체·공학적·행정적 대책 포함, PPE 미의존
- **△**: 대책은 있으나 행정·PPE 중심 (상위 통제 보완 필요)
- **×**: 핵심 대책 없음, PPE만 있음, 필수대책 누락

**JSA_DB 프롬프트**: 51개 세부 규칙 (별도 문서 `JSA_DB_PROMPT.md` 필요)

---

## 📚 확보된 실무 자료 (3종)

### 1️⃣ 안전작업허가서 작성 방법 (표 3)

**핵심 내용**:
- 가~자 항목별 작성 방법
- **3주체 시스템**:
  - □ 작업지시자 (W/O 발행자)
  - ◇ 작업수행사(부서) 소속 작업책임자
  - ○ 운영부서 소속 승인(허가)자
- **시간 관리 규정**:
  - 작업 시작시간: 착수 직전 관리감독자 작성
  - 작업 종료시간: 완료 후 관리감독자 작성
  - **주간(00~18:59)**: 당일 24시까지 연장 가능
  - **야간(19시~)**: 익일 07시까지 연장 가능
- **밀폐공간 3자 확인**:
  - 최초 측정: 작업수행사 관리감독자 + 운영부서 지정 측정·평가자 + 정비부서 담당자
  - 작업 중: **1시간마다** 측정 (지정 측정·평가자)
- **재허가/변경/연장 규정** (아. 안전작업허가)

**저장 위치**: 필요 시 `docs/attachments/`에 이미지 저장 권장

### 2️⃣ 프로세스 다이어그램

**작업 흐름**:

[작업 전]
안전작업허가서 허가 → TBM 실시 → 안전작업허가서 현장비치
                     ↓
                     TBM 실시 및 서명 (문서 생성)
                     작업중지권 고지 및 서명 (문서 생성)

[작업 중]
안전작업허가서 + TBM결과서 참조 → 작업중 안전조치 이행상태 확인

[작업 종료]
작업 완료 → 안전작업허가서 회수 → 안전작업허가서 보관
                                    (+ TBM결과서, 작업중지권, 위험성평가서, 작업계획서)

**핵심 인사이트**:
- **TBM에 작업 시간 필드 불필요** (안전작업허가서 소관) ✅ 반영 완료
- **작업중지권 = 고지 + 실행** (2가지 필요)
  - 고지: TBM 시 (참여자 서명) ✅ 반영 완료
  - 실행: 위험 발견 시 (별도 요청서) ✅ 반영 완료
- **서류 회수 = DB 통합 리포트로 대체** (Phase 1-E 나머지)

### 3️⃣ JSA_DB 프롬프트 (별도 문서 필요) ⭐

**포함 내용**:
- 12종 분류 체계
- 15종 태그 시스템 ([법령], [사내], [AI] 등)
- 통제 적정성 (○/△/×) 판정 기준
- TSV 스키마 (엑셀 통합)
- 용어 표준화 (LOTO → ILS, 추락 → 떨어짐, 내화학장갑 → 화학물질용 안전장갑)
- 1행 통합 원칙
- 51개 세부 규칙

**활용**:
- 이 프롬프트로 원문 → JSA_DB 자동 변환
- Claude에게 프롬프트 전달 → TSV 출력 → 엑셀 붙여넣기 → JSON 변환

**⚠️ 다음 세션에서 반드시 `JSA_DB_PROMPT.md`로 별도 저장 필요**

---

## 🎯 앱 간 완벽한 데이터 흐름 (2026-08-27 완성)

1️⃣ 안전작업허가서 (허가 완료)
    ├─ workTypes[]
    ├─ startDate/Time, endDate/Time
    ├─ validity{} (연장 정보)
    └─ [위험성평가] 또는 [TBM] 버튼 클릭
         ↓ URL: ?permitNo=PTW-...

2️⃣ 위험성평가 앱
    ├─ 기본정보 자동 채움 (허가서에서)
    ├─ workTypes → workType 자동 매핑
    ├─ JSA_DB 검색 (자동 + 수동)
    ├─ 대책 카드 선택
    ├─ 매트릭스 5×5 평가
    ├─ 통제 적정성 ○/△/× 판정
    └─ [평가 제출]
         ↓ 자동 반영
    허가서에 저장:
    ├─ p.riskScore (매트릭스 점수)
    ├─ p.riskLevel (저위험/중위험/고위험/매우고위험)
    ├─ p.controlAdequacy (○/△/×) ⭐ 신규
    ├─ p.riskId
    └─ p.riskMeasures[] (선택된 대책 배열)

3️⃣ TBM 앱
    ├─ 기본정보 자동 채움 (허가서에서)
    │   - 작업명, 장소, 협력사, 인원, 책임자
    │   - 밀폐공간 여부 자동 판단
    ├─ 위험요인 자동 채움 (Phase 1-D 통합)
    │   - permit.riskMeasures[] → tbm.hazards[]
    ├─ 작업중지권 고지 (신규)
    ├─ [TBM 제출]
    └─ 자동 반영:
        ├─ permit.status = '작업중'
        ├─ permit.tbmNo = 'TBM-...'
        └─ workHistory[].status = '작업중'

4️⃣ 작업중지 요청 (필요 시)
    ├─ 사유 선택
    ├─ 요청자 정보 + 서명
    ├─ [작업중지 요청]
    └─ 자동 반영:
        ├─ emergencies[] 저장
        ├─ permit.status = '작업중지'
        └─ workHistory[].status = '작업중지'

---

## ⏳ 남은 작업 (우선순위별)

### 🔴 P0 (다음 세션 최우선)

#### 1. **JSA_DB 프롬프트 별도 문서화** ⭐⭐⭐
- **파일**: `docs/JSA_DB_PROMPT.md`
- **내용**: 51개 규칙 원본 그대로 보존
- **예상 시간**: 15분

#### 2. **JSA_DB 데이터 확장** (11건 → 86건+)
- **파일**: `data/jsa_database.json`
- **작업**:
  - 오늘 받은 표 데이터 76건 JSON 변환
  - 프롬프트 규약 준수 검증
  - 스키마 일관성 확인
- **예상 시간**: 2~3시간

#### 3. **위험성평가 → TBM 위험요인 자동 반영** ⭐
- **위치**: TBM 앱 `loadFromPermit()` 함수 확장
- **로직**:

if(permit.riskMeasures && permit.riskMeasures.length > 0){
  permit.riskMeasures.forEach(m => {
    tbmData.hazards.push({
      hazard: '(위험성평가에서 도출)',
      measure: m,
      person: ''
    });
  });
}

- **예상 시간**: 30분

### 🟠 P1 (다음 다음 세션)

#### 4. 다른 앱 Phase B 리팩토링
- [ ] 포항양극재공장_안전퀴즈.html
- [ ] 안전정보제공서_도급인용.html
- [ ] 안전정보제공서_수급인용.html

**각 앱당 예상**: 1~2시간 (규약 확립되어 있어 빠름)
**총 예상**: 4~6시간

### 🟡 P2 (Phase 2: AI 재평가)

#### 5. 위험성평가 - AI 재평가 기능 ⭐
- **트리거**: 통제 적정성 △ 또는 × 선택 시
- **방식 옵션**:
  - A. Claude API 직접 호출 (CORS 이슈 있음)
  - B. 사전 생성 [AI] 태그 대책 DB 활용 (오늘 만든 방식)
  - C. Cloud Functions (비용 발생)
- **저장**: `aiReviews[]` 배열 (스키마 이미 준비됨)
- **예상 시간**: 2~4시간

#### 6. Phase 1-E 나머지 (프로세스 완성)

| # | 기능 | 예상 시간 |
|---|---|:---:|
| 6-1 | 변경 승인 (Change Approval) | 3~4시간 |
| 6-2 | 재허가 (Re-issue) | 2~3시간 |
| 6-3 | 작업 중 안전조치 이행상태 확인 | 4~5시간 |
| 6-4 | 작업 완료 처리 | 2~3시간 |
| 6-5 | **통합 리포트** (서류 회수 대체) ⭐ | 4~5시간 |

**총 예상**: 15~20시간

### 🟢 P3 (Phase 3: Firestore 이관)

#### 7. Firebase Firestore 이관
**시작 조건**: 데스크톱 접근 + 파일럿 데이터 확보

**컬렉션 순서** (참조 무결성):

Phase A: 마스터 데이터
  ├─ MSDS (34종)
  ├─ 공장안전정보 (2개)
  ├─ 협력사관리
  └─ JSA_DB (86+건) ⭐ 신규 - 오늘 준비 시작

Phase B: 트랜잭션 데이터
  ├─ 작업DB
  ├─ 작업허가
  ├─ 위험성평가 (스키마 v2)
  ├─ TBM (stopNotice 포함)
  └─ 안전정보제공

Phase C: 기록 데이터
  ├─ 안전퀴즈
  ├─ 긴급조치
  └─ 안전점검사항

**예상 시간**: 2~3주 (단계적)
---

## 🔑 프로젝트 규약 요약 (핵심만)

### 저장소 키 매핑 (규약 준수)

| 데이터 | localStorage 키 | Firestore 컬렉션 |
|---|---|---|
| 작업 | `safetyDatabase.workHistory[]` | `작업DB` |
| 허가 | `safetyPermits[]` | `작업허가` |
| TBM | `safetyTBM[]` | `TBM` |
| 위험성평가 | `riskAssessments[]` | `위험성평가` |
| 안전퀴즈 | `safetyQuizzes[]` | `안전퀴즈` |
| 안전정보제공 | `safetyProvisions[]` | `안전정보제공` |
| 긴급조치 | `emergencies[]` | `긴급조치` |
| **JSA_DB** ⭐ | `jsa_database` (캐시) | `JSA_DB` |

### 자연키 형식

| 종류 | 형식 | 예시 |
|---|---|---|
| workId | `{YYYY-MM-DD}_{originalNo}` | `2026-08-27_5` |
| permitNo | `PTW-{YYYYMMDD}-{SEQ3}` | `PTW-20260827-001` |
| riskId | `RA-{YYYYMMDD}-{SEQ3}` | `RA-20260827-001` |
| tbmNo | `TBM-{YYYYMMDD}-{SEQ3}` | `TBM-20260827-001` |
| quizId | `QZ-{YYYYMMDD}-{SEQ3}` | `QZ-20260827-001` |
| emergencyNo | `EM-{YYYYMMDD}-{SEQ3}` | `EM-20260827-001` |
| safeinfoNo | `SIP-{YYYYMMDD}-{SEQ3}` | `SIP-20260827-001` |
| jsaId | `JSA-{YYYYMMDD}-{XXX}-{NN}` | `JSA-20260821-001-01` |
| extensionId | `EXT-{TIMESTAMP}` | `EXT-1724678400000` |

### URL 파라미터

| 파라미터 | 예시 | 용도 |
|---|---|---|
| `?workId=` | `?workId=2026-08-27_5` | 대시보드 → 허가서/위험성평가 (자동 채움) |
| `?permitNo=` | `?permitNo=PTW-20260827-001` | 허가서 → TBM/위험성평가 연동 |
| `?safeinfoNo=` | `?safeinfoNo=SIP-20260827-001` | 안전정보 서명 링크 |
| `?riskId=` | `?riskId=RA-20260827-001` | 위험성평가 조회 |
| `?extend=` | `?extend=PTW-20260827-001` | 허가서 연장 화면 진입 |

### 상태 값

| 컬렉션 | 값 |
|---|---|
| `작업허가.status` | `대기중` / `허가진행중` / `허가완료` / `작업중` / `작업완료` / `작업중지` |
| `안전퀴즈.status` | `합격` / `불합격` |
| `안전정보제공.status` | `발행완료` / `서명완료` / `반려` |
| `위험성평가.overallRisk` | `저위험` / `중위험` / `고위험` / `매우고위험` |
| `위험성평가.controlAdequacy` ⭐ | `○` / `△` / `×` |

### 감사 필드 (모든 문서 필수)

createdAt: '2026-08-27T12:00:00Z',
createdBy: userId,
updatedAt: '2026-08-27T12:00:00Z',
updatedBy: userId,
schemaVersion: 1  (또는 2 - 위험성평가는 v2)

### 🆕 위험성평가 스키마 v2 (2026-08-27 신규)

{
  riskId: 'RA-20260827-001',
  workId: '...',
  permitNo: '...',
  linkedPermitNo: '...',
  
  workName, workType, location, detailLocation,
  company, workers, workDesc,
  
  assessor, date,
  
  // 매트릭스 평가
  frequency: 3,          // 빈도 (1~5)
  severity: 4,           // 강도 (1~5)
  overallScore: 12,      // 위험도 점수
  overallRisk: '고위험',
  
  // 🆕 통제 적정성 (JSA_DB 프롬프트 규약)
  controlAdequacy: '△',  // '○' / '△' / '×'
  
  // 🆕 JSA 참조 (감사 대응)
  referencedJSA: {
    jsaId: 'JSA-1',
    workName: '...',
    similarity: 0.85,
    originalHazard: '...',
    accidentType: '...',
    controlAdequacy: '○'
  },
  
  // 🆕 대책 (구조화, source 태그 포함)
  selectedMeasures: [
    { text: '전원 차단', source: 'INT', selected: true },
    { text: 'ILS 실시', source: 'LAW', selected: true },
    { text: '무전압 확인', source: 'AI', selected: false }
  ],
  userMeasures: [
    { text: '현장 상황별 추가 대책', source: 'USER' }
  ],
  allMeasures: [...],
  
  status: '평가완료',
  opinion: '...',
  
  createdAt, createdBy, updatedAt, updatedBy,
  schemaVersion: 2  // ⭐ v2
}

### 🆕 TBM 스키마 확장 (2026-08-27 신규)

{
  // ...기존 필드...
  
  // 🆕 작업중지권 고지 (신규 필수)
  stopNotice: {
    participants: ['홍길동', '김철수'],
    participantsText: '홍길동, 김철수',
    representativeName: '홍길동',
    representativeSig: 'data:image/png;base64,...',
    noticedAt: '2026-08-27T09:15:00Z',
    legalBasis: '산업안전보건법 제52조'
  }
}

### 대시보드 매칭 필드 (각 앱별 필수)

| 앱 | 필수 필드 |
|---|---|
| 안전퀴즈 | `respondent`, `respondentCompany`, `status`(`'합격'`) |
| 위험성평가 | `workId`, `date`, `overallRisk`, `overallScore`, `controlAdequacy` ⭐ |
| TBM | `permitNo`, `workId`, `date`, `status`, `stopNotice` ⭐ |
| 안전정보제공 | `submittedCompany`, `submittedBy`, `status`, `date` |
| 긴급조치 | `type`, `permitNo`, `workId`, `date` |
| 허가서 (연장) | `validity.currentEndDateTime`, `validity.extensionCount` |

---

## ⚠️ 폐기 예정 항목

### localStorage 키

| 폐기 키 | 대체 |
|---|---|
| `firebasePermits` | `safetyPermits` |
| `safetyInfoDocs` | `safetyProvisions` |
| `safetyInfoSigned` | `safetyProvisions.signature` (병합) |
| `safetyViolations` | `emergencies` or `inspections` |
| `riskDatabase` | `riskAssessments` |
| `safetyRiskAssessments` | `riskAssessments` |
| `safetyStopWork` | `emergencies.type='stop'` |
| `tbmLogs` | `safetyTBM` |

### 파일명

| 폐기 | 대체 |
|---|---|
| `_v2_1_.html` | `_v2.html` |
| `_V6_1_.html` | `_V6_.html` |
| `_V7_통합.html` | `_V6_.html` |
| `dashboard_v6.html` | `안전관리플랫폼_대시보드_V6_.html` |
| `안전정보제공서_작성.html` | `안전정보제공서_도급인용.html` |

### URL 파라미터

| 폐기 | 대체 |
|---|---|
| `?doc=` | `?safeinfoNo=` |

### 코드 패턴

| 폐기 | 대체 |
|---|---|
| Claude API 브라우저 직접 호출 | JSA_DB Firestore 조회 |
| Google Apps Script + `no-cors` | EmailJS |
| `sessionStorage.userInfo.role` | Firebase Auth Custom Claims |
| `Math.random()` 시퀀스 | Firestore Transaction |
| `new Date().toISOString()` (UTC) | 로컬 시간 기반 `fmtDate()` |
| `new Event('storage')` | `CustomEvent('app-data-changed')` |
| `w.date + '_' + (originalNo\|\|i)` | `originalNo` 필수 (없으면 skip) |
| `'TBM-' + Date.now()` | 로컬 시퀀스 발급 |
| **위험성평가 매트릭스만** | **매트릭스 + 통제 적정성 하이브리드** ⭐ |

---

## 🚀 미래 자동화 계획 (Phase 3+)

### 🎯 비전

**"관리자가 모바일에서 리모트로 리포트 발송"**

관리자가 언제 어디서든 스마트폰으로 대시보드에 접속하여:
1. 📧 오늘 작업 리포트 발송
2. 📧 내일 작업 리스트 발송
3. 🚨 긴급 알림 발송
4. 📚 **통합 리포트 조회 + 발송** ⭐ 신규

**구현 방식**: **하이브리드 (방식 C)** — 무료 티어 유지

### 📊 자동화 구현 로드맵

| Phase | Week | 내용 | 예상 시간 |
|---|---|---|---|
| **Phase 3** | 5-8 | 기본 자동화 (허가서 자동 갱신, 발송 UI) | 2주 |
| **Phase 4** | 9-12 | 수신자 관리, 리포트 자동 생성 | 2주 |
| **Phase 5** | 13-14 | 고도화 (이력 조회, 통계) | 2주 |
| **Phase 6** ⭐ | 15-16 | 통합 리포트 시스템 (permitNo 기반) | 2주 |

### 💰 예상 비용
**Firebase Spark 무료 티어**: $0  
**EmailJS**: $0~15/월  
**총 예상**: $0~15/월

---

## 📁 프로젝트 파일 구조 (목표)

safety-management-platform/
├── index.html
├── 안전관리플랫폼_대시보드_V6_.html      ✅ 완성
├── 안전작업허가서_v2.html                ✅ 완성
├── TBM_및_작업중지권_v2.html              ✅ 완성 ⭐
├── 위험성평가_v2.html                    ✅ 완성 ⭐
├── 포항양극재공장_안전퀴즈.html            🔄 리팩토링 필요
├── 안전정보제공서_도급인용.html            🔄 리팩토링 필요
├── 안전정보제공서_수급인용.html            🔄 리팩토링 필요
├── firestore_upload.html                 (JSA_DB 업로드용)
├── firebase-config.js
├── firebase.json
│
├── data/                                 ⭐ 신규 폴더
│   ├── msds_database.js                 (34종 MSDS)
│   ├── factory_safety_info.js           (공장 비상정보)
│   ├── jsa_database.json                ✅ 신규 (11건 샘플) ⭐
│   └── safety_knowledge_base.js         (Phase 1-D 통합)
│
└── docs/
    ├── PROJECT_HANDOVER.md              ⭐ 이 문서 (v3.1)
    ├── PROJECT_CONVENTIONS.md
    ├── FILE_STORAGE_GUIDE.md
    ├── IMPROVEMENT_PLAN.md
    ├── DB_SCHEMA.md
    ├── FIRESTORE_SECURITY_RULES.md
    ├── DATA_MIGRATION_GUIDE.md
    ├── JSA_DB_STRUCTURE.md
    ├── JSA_DB_PROMPT.md                 ⭐ 신규 필요 (다음 세션)
    ├── COMPLETE_PROJECT_GUIDE.md
    │
    └── attachments/
        ├── README.md
        ├── emergency_response_diagram.png
        ├── equipment_checklist_v1.png
        ├── heat_illness_selfcheck_v1.png
        ├── permit_writing_guide_table3.png  ⭐ 신규
        └── process_diagram.png              ⭐ 신규

---

## 🎯 새 세션 시작 시 첫 프롬프트

새 Claude 세션에서 이 프로젝트를 이어서 진행할 때, 아래 프롬프트를 사용하세요:

### 옵션 1: JSA_DB 프롬프트 문서화 + 데이터 확장 (권장) ⭐

안녕! POSCO FM 포항양극재공장 안전관리 프로젝트를 이어서 진행하려고 합니다.

먼저 다음 문서를 참고해서 상황 파악해주세요:
1. docs/PROJECT_HANDOVER.md (v3.1) - 이 문서
2. docs/PROJECT_CONVENTIONS.md - 규약 문서
3. data/jsa_database.json - 현재 11건 샘플

어제(2026-08-27) 위험성평가 v2까지 완성했고,
오늘은 다음 두 가지를 진행하고 싶습니다:

1. JSA_DB 프롬프트를 docs/JSA_DB_PROMPT.md로 별도 문서화
2. jsa_database.json을 86건까지 확장

준비되시면 시작해주세요!

### 옵션 2: 위험성평가 → TBM 위험요인 자동 반영

안녕! docs/PROJECT_HANDOVER.md (v3.1) 참고해주세요.

위험성평가에서 도출된 안전대책을 TBM 위험요인으로 
자동 반영하는 기능을 구현하고 싶습니다.

목표:
- TBM 앱 loadFromPermit() 함수 확장
- permit.riskMeasures[] → tbm.hazards[] 자동 매핑
- 사용자는 담당자만 입력하도록 UX 개선

준비되시면 시작해주세요!

### 옵션 3: 다른 앱 Phase B 리팩토링

안녕! docs/PROJECT_HANDOVER.md (v3.1) 참고해주세요.

안전퀴즈/안전정보 앱을 Phase B로 리팩토링하고 싶습니다.
안전작업허가서·TBM·위험성평가와 동일한 규약을 적용합니다.

목표:
- 홈버튼 + 반응형 + 다크모드 통일
- date/time CSS 규약 적용
- 대시보드와 색상/스타일 통일

준비되시면 시작해주세요!

### 옵션 4: Phase 1-D (SAFETY_KNOWLEDGE_BASE)

안녕! docs/PROJECT_HANDOVER.md (v3.1) 참고해주세요.

Phase 1-D: 위험성평가 → TBM 통합 지식 시스템을 시작합니다.

목표:
- 위험성평가 결과가 자동으로 TBM에 반영
- JSA_DB → 위험성평가 → 허가서 → TBM 완전 순환
- workTypes 기반 자동 위험요인 매핑

준비되시면 시작해주세요!

---

## 📌 새 세션에서 Claude에게 알려야 할 것

### 1. 프로젝트 방향성
- ✅ Firebase + GitHub (무료 티어)
- ✅ 회사 서버 이관 유보
- ✅ Cloud Functions 미사용
- ✅ **자동화는 방식 C (하이브리드) 확정** — 관리자 모바일 리모트
- ✅ **JSA_DB 프롬프트 기반 지식 시스템 구축 진행 중** ⭐

### 2. 완성된 파일 (2026-08-27 기준)
- ✅ **대시보드 V6** (Phase 1 완성)
- ✅ **안전작업허가서** (Phase B+1-C+1-E+date/time CSS)
- ✅ **TBM 앱** (Phase B+실무프로세스+허가서 자동 채움) ⭐
- ✅ **위험성평가 앱** (Phase 1 완성 - JSA_DB+대책 선택+통제 적정성) ⭐
- ✅ **data/jsa_database.json** (11건 샘플, 확장 예정) ⭐

### 3. 리팩토링 대기 파일
- 🔄 포항양극재공장_안전퀴즈.html
- 🔄 안전정보제공서_도급인용.html
- 🔄 안전정보제공서_수급인용.html

### 4. 개발 환경 제약사항
- 회사 환경 (Fasoo DRM 등 보안 시스템)
- 모바일 위주 진행
- Firebase Console 조작 어려움
- 코드는 GitHub 웹 편집기 또는 로컬 저장 후 커밋

### 5. 응답 스타일
- 긴 코드는 **여러 파트로 나눠서** 제공 (응답 잘림 방지)
- 각 파트마다 **명확한 경계 표시** (`⚠️ 여기부터` / `⚠️ 여기까지`)
- Part 조립 시 **DOCTYPE, html, head, body 태그 중복 주의**
- 실무자가 이해하기 쉬운 설명
- 규약 준수 강조

### 6. 향후 자동화 비전
- ✅ **관리자 모바일 리모트 발송** (방식 C 확정)
- 📧 오늘 리포트 / 내일 리스트 / 긴급 알림
- 📚 **통합 리포트** (permitNo 기반 모든 서류 조회) ⭐ 신규
- 💰 무료 티어 유지 (Firebase Spark + EmailJS)
- 🎯 예상 시작: Phase 3 (5~14주 단계적 진행)

---

## 📊 지금까지의 성과 요약

### 발견한 문제
- ❌ 15+ 종의 localStorage 키 이름 불일치
- ❌ 파일명 버전 접미어 혼재
- ❌ 3가지 백엔드 병존 (Firebase, localStorage, Apps Script)
- ❌ workId 규칙 3파일 모두 다름
- ❌ 안전퀴즈 저장 자체가 없었음 (유령 데이터)
- ❌ 대시보드 P0 버그들
- ❌ Claude API CORS 실패
- ❌ Google Apps Script URL 미설정
- ❌ 역할값 대소문자 혼재
- ❌ 안전작업허가서 4개 클래스 통일 안 됨
- ❌ 6단계 안전 확인 - 모든 작업에 무관한 질문 표시
- ❌ 허가서 연장 승인 기능 없음 (법정 필수)
- ❌ **모바일에서 date/time 입력 깨짐** ⭐ 오늘 해결
- ❌ **TBM 시간 필드 실무 프로세스 불일치** ⭐ 오늘 해결
- ❌ **위험성평가 매트릭스만 - 통제 적정성 없음** ⭐ 오늘 해결
- ❌ **JSA_DB 활용 방식 불명확** ⭐ 오늘 해결

### 해결한 것
- ✅ 저장 키 규약 통일
- ✅ 자연키 규약 통일
- ✅ 감사 필드 표준화
- ✅ 대시보드 매칭 필드 명시
- ✅ 폐기 키 자동 마이그레이션
- ✅ 상태값 통일
- ✅ URL 파라미터 통일
- ✅ MSDS 34종 데이터셋 구축
- ✅ 공장 2개 사업장 비상정보 표준화
- ✅ 안전정보 도급인 → 수급인 완전한 페어링
- ✅ 미래 자동화 방향 확정 (방식 C)
- ✅ 대시보드 V6 Phase 1 완성
- ✅ 안전작업허가서 Phase B + 1-C + 1-E 완성
- ✅ **안전작업허가서 date/time CSS 통일** ⭐ 오늘
- ✅ **TBM Phase B + 실무 프로세스 + 자동 채움 완성** ⭐ 오늘
- ✅ **위험성평가 Phase 1 완성 (JSA_DB + 대책 선택 + 통제 적정성)** ⭐ 오늘
- ✅ **JSA_DB 데이터 파일 신규 생성 (11건 샘플)** ⭐ 오늘
- ✅ **앱 간 완벽한 데이터 흐름 완성** ⭐ 오늘

---

## 🎓 프로젝트 이관 시 참고 사항

### 사용자 특성
- 실무자 (안전관리자)
- 모바일 중심 사용 환경
- 기술 배경 있으나 코드 작성보다 검토 중심
- 프로젝트 방향성 및 우선순위 결정에 집중

### 협업 방식
- Claude가 코드 생성/수정 제안
- 사용자가 GitHub에 커밋
- 실제 배포는 Firebase Hosting
- 결정 사항은 문서에 즉시 반영

### 성공 패턴
1. **규약 먼저** (혼란 방지)
2. **문서화** (계속 참조 가능)
3. **작은 단위 검증** (앱 단위)
4. **응답 분할** (긴 코드는 여러 파트로, 경계 표시 명확히)
5. **재활용 가능한 자산 축적** (MSDS, 비상정보, JSA_DB 등)
6. **미래 비전 명확** (자동화 로드맵, Phase 1-D 계획)
7. **실무 프로세스 반영** (표 3, 프로세스 다이어그램)

### 자주 하는 실수 방지 (경험 기반)
- ❌ Part 조립 시 `` 중복
- ❌ CSS `` 태그 여러 개 분산
- ❌ 파일명 대소문자 헷갈림
- ❌ URL 파라미터 인코딩 실수
- ❌ localStorage 키 오타
- ❌ welcome 화면 닫는 태그 누락
- ❌ **매트릭스만 있는 위험성평가** ⭐ 오늘 개선

---

## 📞 참조 링크

| 자원 | URL |
|---|---|
| **GitHub 저장소** | https://github.com/safety99999/safety-management-platform |
| **Firebase Console** | https://console.firebase.google.com/project/safety-management-platfo-5f413 |
| **배포된 사이트** | https://safety-management-platfo-5f413.web.app |
| **JSA_DB 업로드 도구** | https://safety-management-platfo-5f413.web.app/firestore_upload.html |
| **JSA_DB 데이터** ⭐ | https://safety-management-platfo-5f413.web.app/data/jsa_database.json |
| **안전보건공단 MSDS** | https://msds.kosha.or.kr/ |
| **EmailJS** | https://www.emailjs.com/ |

---

## 📅 변경 이력

| 버전 | 날짜 | 변경 사항 |
|---|---|---|
| 1.0 | 2026-08-24 | 최초 인수인계 문서 작성 (5개 앱 개선 완료 시점) |
| 2.0 | 2026-08-24 | 자동화 로드맵 추가 (방식 C 확정) |
| 3.0 | 2026-08-26 | 대시보드 Phase 1 + 안전작업허가서 Phase B/1-C/1-E 완료 반영 |
| **3.1** | **2026-08-27** | **위험성평가 v2 + JSA_DB 연동 + TBM 자동 채움 + 실무 프로세스 반영** ⭐ |

---

## ⚠️ 중요 안내

**이 문서와 상충하는 경우 우선순위**:
1. **PROJECT_CONVENTIONS.md** (규약 문서) - 최우선
2. **PROJECT_HANDOVER.md** (이 문서) - 진행 상황
3. **JSA_DB_PROMPT.md** (JSA_DB 명세) - 다음 세션 작성 예정 ⭐
4. **FILE_STORAGE_GUIDE.md** - 파일 저장 방법
5. **DB_SCHEMA.md** - 세부 스키마
6. **기타 문서** - 참고용

**모든 코드 개선은 `PROJECT_CONVENTIONS.md` 규약을 반드시 준수합니다.**

---

## 🎊 마무리

이 문서를 통해:

### 즉시 가능한 것
- ✅ 새 Claude 세션에서 프로젝트 즉시 이어가기
- ✅ 남은 작업 우선순위 명확 (JSA_DB 프롬프트 문서화 ⭐ 최우선)
- ✅ 규약 준수 방향 확립
- ✅ 위험성평가 v2 스키마 이해
- ✅ 앱 간 완벽한 데이터 흐름 파악

### 미래 준비된 것
- 🚀 자동화 로드맵 (Phase 3~6)
- 📧 이메일 리포트 시스템 (모바일 리모트)
- 📚 통합 리포트 시스템 (permitNo 기반) ⭐ 신규
- 💾 Firebase 이관 계획
- 📊 확장 가능한 아키텍처
- 🎯 **Phase 1-D**: JSA_DB 완전 통합 (오늘 시작됨)
- 🎯 **Phase 2**: AI 재평가 (통제 적정성 △·×)
- 🎯 **Phase 1-E 나머지**: 변경/재허가/작업중 확인/완료 처리/통합 리포트

### 지금까지의 여정
- 📋 11개 파일 검토
- 🔧 5개 앱 저장 로직 개편 (Phase 2)
- 🎨 대시보드 V6 Phase 1 완성
- ⚡ 안전작업허가서 Phase B + 1-C + 1-E + date/time 완성
- 📋 TBM Phase B + 실무 프로세스 + 자동 채움 완성 ⭐
- 🤖 위험성평가 Phase 1 완성 (JSA_DB 연동) ⭐
- 📚 JSA_DB 데이터 파일 신규 생성 ⭐
- 📚 9개 문서 작성 (v3.1 포함)
- 🎯 자동화 방향 확정
- 📊 3종 실무 자료 확보 (표 3, 프로세스, JSA_DB 프롬프트)

---

**끝.**

새 세션에서 이 문서를 참조하여 즉시 이어서 작업을 진행하세요! 🚀

**"이 프로젝트는 잘 정리되어 있어, 언제든 이어갈 수 있다"** — 이것이 이 문서의 목표입니다. 💪
</pre>
<hr>
<h2>✅ 최종 조립 완료!</h2>
<h3>📋 최종 조립 순서 (완료)</h3>
<ol>
<li>✅ <strong>PART A</strong>: 프로젝트 개요 + 오늘 완료 사항</li>
<li>✅ <strong>PART B</strong>: 새 규약 4종 + 실무 자료 + 데이터 흐름 + 남은 작업</li>
<li>✅ <strong>PART C</strong>: 프로젝트 규약 + 폐기 항목 + 새 세션 프롬프트 + 성과 요약 (<strong>지금</strong>)</li>
</ol>
<h3>🚀 GitHub 커밋 방법</h3>
<ol>
<li><strong>PART A + B + C 순서대로 붙여넣기</strong> 확인</li>
<li>페이지 아래 <strong>[Commit changes...]</strong> 클릭</li>
<li>커밋 메시지 예시:<pre class="language-none codeblock_pre" tabindex="0" data-language="code"><div class="codeblockBox"><span class="codeblockBox_lang" data-language="code">code</span><span class="copy-button" data-action="copy-code" role="button" tabindex="0">Copy</span></div><code class="language-none codeblock_code">Update PROJECT_HANDOVER.md v3.1 - 위험성평가 v2 + JSA_DB 완료 반영
</code></pre></li>
<li><strong>[Commit changes]</strong> 클릭</li>
</ol>
<h3>💾 커밋 후 확인</h3>
<ul>
<li>GitHub에서 <code>docs/PROJECT_HANDOVER.md</code> 클릭</li>
<li>내용이 잘 표시되는지 확인</li>
<li>마크다운 렌더링 확인 (표, 이모지 등)</li>
</ul>
<hr>
<h2>🎊 오늘 세션 완전 마무리!</h2>
<h3>오늘 만든 것들 최종 정리</h3>
<pre class="language-none codeblock_pre" tabindex="0" data-language="code"><div class="codeblockBox"><span class="codeblockBox_lang" data-language="code">code</span><span class="copy-button" data-action="copy-code" role="button" tabindex="0">Copy</span></div><code class="language-none codeblock_code">📄 코드 파일 (2개)
├─ 위험성평가_v2.html (전체 재작성)
└─ TBM_및_작업중지권_v2.html (부분 개선)

📎 데이터 파일 (1개 - 신규)
└─ data/jsa_database.json (11건 샘플)

📚 문서 파일 (1개 - 업데이트)
└─ docs/PROJECT_HANDOVER.md v3.1

📋 추가 자료 (다음 세션 대비)
├─ 표 3 (안전작업허가서 작성 방법)
├─ 프로세스 다이어그램
└─ JSA_DB 프롬프트 (51개 규칙)
</code></pre><h3>확립된 규약 (4종)</h3>
<ol>
<li>✅ date/time 통일 CSS</li>
<li>✅ 앱 간 자동 채움 원칙</li>
<li>✅ 작업중지권 고지 규약</li>
<li>✅ JSA_DB 스키마 v2</li>
</ol>
<h3>다음 세션 최우선 작업 (P0)</h3>
<ol>
<li>⏳ <code>docs/JSA_DB_PROMPT.md</code> 별도 문서화</li>
<li>⏳ <code>data/jsa_database.json</code> 86건까지 확장</li>
<li>⏳ 위험성평가 → TBM 위험요인 자동 반영</li>
</ol>
<hr>
<p><strong>정말 수고하셨습니다!</strong> 👏 오늘 정말 큰 성과를 이루셨습니다.</p>
<p><strong>&quot;종료&quot;</strong> 라고 답변주시거나 다른 작업이 필요하시면 알려주세요! 🎯</p>
