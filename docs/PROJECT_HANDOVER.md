# 📦 POSCO FM 안전관리 플랫폼 - 프로젝트 인수인계 문서

**작성일**: 2026-08-24  
**버전**: 2.0 (자동화 로드맵 반영)  
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
| **배포** | Firebase Hosting | 운영 중 (2개 파일만) |
| **코드 관리** | GitHub (`safety99999/safety-management-platform`) | 운영 중 |
| **이메일** | EmailJS + 개인 Gmail (개발 단계) | 도입 예정 |
| **AI 대체** | JSA_DB 사전 생성 + Firestore 조회 | 데이터 완료 |

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

---

## 📊 현재 상태 (Snapshot)

### 배포 상태
| 파일 | Hosting 배포 | Firebase 연동 | 데이터 저장 |
|---|---|---|---|
| 안전관리플랫폼_대시보드_V6_.html | ✅ | ⚠️ 부분 | localStorage |
| 안전작업허가서_v2.html | ✅ | ⚠️ SDK만 로드 | localStorage |
| 위험성평가_v2.html | ❌ | ❌ | localStorage |
| TBM_및_작업중지권_v2.html | ❌ | ❌ | localStorage |
| 포항양극재공장_안전퀴즈.html | ❌ | ❌ | localStorage |
| 안전정보제공서_도급인용.html | ❌ | ❌ | localStorage |
| 안전정보제공서_수급인용.html | ❌ | ❌ | localStorage |

### 이미 완료한 작업 ✅

#### Phase 0: 검토 (완료)
- [x] 11개 파일 전체 검토
- [x] 프로젝트 방향성 확정
- [x] Master Plan 수립

#### Phase 1: 문서화 (완료)
- [x] `PROJECT_CONVENTIONS.md` 작성 (별도 문서 참조)
- [x] `IMPROVEMENT_PLAN.md` 작성
- [x] TBM 별첨 자료 README 작성

#### Phase 2: 코드 개선 (완료)
- [x] **안전퀴즈** — localStorage 저장 로직 추가 (`safetyQuizzes`)
- [x] **위험성평가** — 규약 준수 개편 (`riskAssessments`, `RA-` 형식)
- [x] **TBM & 작업중지권** — 규약 준수 개편 (`safetyTBM`, `emergencies`)
- [x] **안전정보(도급인)** — 대개편
  - MSDS 12종 → 34종 확장
  - 카테고리 필터 + 검색
  - 공장 2개 사업장 (포항양극재 1공장/2공장)
  - 비상정보 자동 채우기
  - 저장 키: `safetyInfoDocs` → `safetyProvisions`
- [x] **안전정보(수급인)** — 대개편
  - URL 파라미터: `?doc=` → `?safeinfoNo=`
  - 조회 키: `safetyProvisions`
  - 도급인 서명 이미지 표시
  - 체크리스트 진행률 바
  - 폐기 키 자동 마이그레이션

### 발견된 자산 (미활용)
| 자산 | 위치 | 상태 |
|---|---|---|
| 포항양극재 비상상황체계도 | 이미지 파일 | GitHub 저장 대기 |
| TBM 별첨 - 작업장비 체크리스트 | 이미지 파일 | GitHub 저장 대기 |
| TBM 별첨 - 온열질환 자율진단 | 이미지 파일 | GitHub 저장 대기 |
| MSDS 34종 데이터 | 코드에 하드코딩 완료 | 활용 중 |
| JSA_DB 98개 문서 | Excel/JSON | Firestore 업로드 대기 |
| 위험성평가 마스터 데이터 | Excel | JSON 변환 대기 |

---

## ⏳ 남은 작업 (우선순위별)

### 🔴 P0 (지금 당장)

#### 1. 대시보드 P0 버그 수정 ⭐ 최우선
**중요도**: 지금까지 개선한 5개 앱이 대시보드와 실제로 연동되려면 필수

**수정 대상**:
- `loadPermits()` 미정의 오류 → `loadTodayPermits()`로 통합
- `renderPermitList()` DOM 참조 오류 (`permitList` ID 없음) → 함수 삭제
- `refreshTodayPermits` 참조 오류
- workId 규칙 통일: `{date}_{originalNo}` (originalNo 없으면 skip)
- `getTodayV()` UTC → KST 변환
- 다크모드 상속 처리 확인
- `showToast('danger')` 스타일 추가 (또는 `'error'`로 통일)
- 각 앱의 저장 데이터 실제 조회 로직 검증
  - `safetyQuizzes` 카운트
  - `riskAssessments` 카운트
  - `safetyTBM` 카운트
  - `safetyProvisions` 카운트
  - `emergencies` 카운트

**예상 시간**: 1~2시간

---

#### 2. 파일명 통일 & Firebase Hosting 리다이렉트
**중요도**: 각 앱에서 대시보드로 돌아가는 링크 살아나기

**정식 파일명**:
| 페이지 | 정식 파일명 |
|---|---|
| 대시보드 | `안전관리플랫폼_대시보드_V6_.html` |
| 안전작업허가서 | `안전작업허가서_v2.html` |
| TBM | `TBM_및_작업중지권_v2.html` |
| AI 위험성평가 | `위험성평가_v2.html` |
| 안전퀴즈 | `포항양극재공장_안전퀴즈.html` |
| 안전정보제공서 (도급인) | `안전정보제공서_도급인용.html` |
| 안전정보제공서 (수급인) | `안전정보제공서_수급인용.html` |

**폐기 파일명 → 리다이렉트**:
| 폐기 | 대체 |
|---|---|
| `안전관리플랫폼_대시보드_V6_1_.html` | `_V6_.html` |
| `안전관리플랫폼_대시보드_V7_통합.html` | `_V6_.html` |
| `dashboard_v6.html` | `_V6_.html` |
| `안전작업허가서_v2_1_.html` | `_v2.html` |
| `TBM_및_작업중지권_v2_1_.html` | `_v2.html` |
| `안전정보제공서_작성.html` | `_도급인용.html` |

**firebase.json 리다이렉트**:
```json
{
  "hosting": {
    "redirects": [
      {"source": "/안전관리플랫폼_대시보드_V6_1_.html", "destination": "/안전관리플랫폼_대시보드_V6_.html", "type": 301},
      {"source": "/안전관리플랫폼_대시보드_V7_통합.html", "destination": "/안전관리플랫폼_대시보드_V6_.html", "type": 301},
      {"source": "/dashboard_v6.html", "destination": "/안전관리플랫폼_대시보드_V6_.html", "type": 301},
      {"source": "/안전작업허가서_v2_1_.html", "destination": "/안전작업허가서_v2.html", "type": 301},
      {"source": "/TBM_및_작업중지권_v2_1_.html", "destination": "/TBM_및_작업중지권_v2.html", "type": 301},
      {"source": "/안전정보제공서_작성.html", "destination": "/안전정보제공서_도급인용.html", "type": 301}
    ]
  }
}
```

**예상 시간**: 30분

---
### 🟠 P1 (이번 주 안에, 데스크톱 접속 시)

#### 3. Firebase 보안 조치
**중요도**: 보안 취약점 차단

**작업 내용**:
- [ ] API 키 HTTP 리퍼러 제한 (Google Cloud Console)
  - 허용 도메인: `safety-management-platfo-5f413.web.app/*`, `localhost:*/*`
- [ ] App Check 활성화 (reCAPTCHA v3)
- [ ] users 컬렉션 role 자기승격 방지 규칙 추가

**Firestore 보안 규칙 개선안**:
```javascript
match /users/{userId} {
  allow update: if isSignedIn() && getUserId() == userId
    && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']);
  allow update: if isAdmin();  // role 변경은 admin만
}
```

**예상 시간**: 30분

---

#### 4. 통합 테스트
**중요도**: 지금까지 개선 성과 검증

**테스트 시나리오**:
```
1. 안전정보(도급) 발행 → SIP-YYYYMMDD-001 생성
2. 수급인 링크 접속 → 서명
3. 안전퀴즈 응시 (같은 협력사)
4. 위험성평가 실시
5. 허가서 신청
6. TBM 실시
7. 대시보드에서 모두 카운트 반영 확인
```

**Console 확인 명령어**:
```javascript
// 각 저장소 데이터 개수
console.log('작업DB:', JSON.parse(localStorage.getItem('safetyDatabase')||'{"workHistory":[]}').workHistory.length);
console.log('허가서:', JSON.parse(localStorage.getItem('safetyPermits')||'[]').length);
console.log('TBM:', JSON.parse(localStorage.getItem('safetyTBM')||'[]').length);
console.log('위험성평가:', JSON.parse(localStorage.getItem('riskAssessments')||'[]').length);
console.log('안전퀴즈:', JSON.parse(localStorage.getItem('safetyQuizzes')||'[]').length);
console.log('안전정보:', JSON.parse(localStorage.getItem('safetyProvisions')||'[]').length);
console.log('긴급조치:', JSON.parse(localStorage.getItem('emergencies')||'[]').length);
```

**예상 시간**: 1시간

---

#### 5. GitHub 정리
- [ ] 커밋되지 않은 파일 정리
- [ ] `/docs/` 폴더 구조 정리
- [ ] `/docs/attachments/` 이미지 파일 업로드
  - `emergency_response_diagram.png` (비상상황체계도)
  - `equipment_checklist_v1.png` (작업장비 체크리스트)
  - `heat_illness_selfcheck_v1.png` (온열질환 자율진단)
- [ ] README.md 업데이트

**예상 시간**: 30분

---

### 🟡 P2 (파일럿 운영 후)

#### 6. Firebase Firestore 이관 (Phase 6)
**시작 조건**: 데스크톱 접근 + 파일럿 데이터 확보

**진행 순서**:
1. Firebase Console → Firestore 컬렉션 생성
2. 각 앱의 저장 로직 이관 (localStorage → Firestore)
3. dual-write 패턴 (안전망)
4. 완료 후 localStorage는 캐시로만 유지

**컬렉션 순서** (참조 무결성 고려):
```
Phase A: 마스터 데이터
  ├─ MSDS (34종)
  ├─ 공장안전정보 (2개)
  └─ 협력사관리

Phase B: 트랜잭션 데이터
  ├─ 작업DB
  ├─ 작업허가
  ├─ 위험성평가
  ├─ TBM
  └─ 안전정보제공

Phase C: 기록 데이터
  ├─ 안전퀴즈
  ├─ 긴급조치
  └─ 안전점검사항
```

**예상 시간**: 2~3주 (단계적)

---

#### 7. JSA_DB 활용 (Phase 7)
- [ ] 위험성평가 마스터 데이터 (Excel → JSON 변환)
  - 파일: `data/jsa_database.json`
  - 예상 개수: 98건 이상
- [ ] Firestore `JSA_DB` 컬렉션 업로드
  - 도구: `firestore_upload.html` (기존 or 신규 생성)
- [ ] 위험성평가 앱에서 유사 작업 검색 기능 활성화
- [ ] AI 대체 로직 완성

**예상 시간**: 1주

---

#### 8. EmailJS 도입
- [ ] EmailJS 계정 가입 (https://www.emailjs.com/)
- [ ] 개인 Gmail Service 연결
- [ ] Template 3종 작성 (sign_request, sign_complete, resend)
- [ ] 도급인용/수급인용에 SDK 통합
- [ ] 대시보드 리모트 발송 UI 통합 (Phase 3 자동화)

**예상 시간**: 반나절

---

#### 9. TBM 별첨 자료 UI 구현
**대상 자료**:
- 작업장비 체크리스트 (11개 카테고리, 55+ 항목)
- 온열질환 자율진단 (여름철 5~9월 자동 활성화)

**구현 내용**:
- TBM 파일에 조건부 표시 로직
- 별도 컬렉션 (`작업장비체크리스트`, `온열질환진단`)
- 체감온도 자동 등급 판정

**예상 시간**: 1주

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

### 자연키 형식
| 종류 | 형식 | 예시 |
|---|---|---|
| workId | `{YYYY-MM-DD}_{originalNo}` | `2025-11-24_5` |
| permitNo | `PTW-{YYYYMMDD}-{SEQ3}` | `PTW-20260824-001` |
| riskId | `RA-{YYYYMMDD}-{SEQ3}` | `RA-20260824-001` |
| tbmNo | `TBM-{YYYYMMDD}-{SEQ3}` | `TBM-20260824-001` |
| quizId | `QZ-{YYYYMMDD}-{SEQ3}` | `QZ-20260824-001` |
| emergencyNo | `EM-{YYYYMMDD}-{SEQ3}` | `EM-20260824-001` |
| safeinfoNo | `SIP-{YYYYMMDD}-{SEQ3}` | `SIP-20260824-001` |

### URL 파라미터
| 파라미터 | 예시 |
|---|---|
| `?workId=` | `?workId=2025-11-24_5` |
| `?permitNo=` | `?permitNo=PTW-20260824-001` |
| `?safeinfoNo=` | `?safeinfoNo=SIP-20260824-001` |
| `?riskId=` | `?riskId=RA-20260824-001` |

### 역할 값
- `'admin'` (관리자)
- `'manager'` (안전관리자)
- `'worker'` (작업자)

### 상태 값
| 컬렉션 | 값 |
|---|---|
| `작업허가.status` | `대기중` / `허가진행중` / `허가완료` / `작업중` / `작업완료` / `작업중지` |
| `안전퀴즈.status` | `합격` / `불합격` |
| `안전정보제공.status` | `발행완료` / `서명완료` / `반려` |
| `위험성평가.overallRisk` | `저위험` / `중위험` / `고위험` / `매우고위험` |

### 감사 필드 (모든 문서 필수)
```javascript
{
  createdAt: firebase.firestore.FieldValue.serverTimestamp(),  // 또는 ISO 문자열
  createdBy: userId,
  updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  updatedBy: userId,
  schemaVersion: 1
}
```

### 대시보드 매칭 필드 (각 앱별 필수)
| 앱 | 필수 필드 |
|---|---|
| 안전퀴즈 | `respondent`, `respondentCompany`, `status`(`'합격'`) |
| 위험성평가 | `workId`, `date`, `overallRisk`, `overallScore` |
| TBM | `permitNo`, `workId`, `date`, `status` |
| 안전정보제공 | `submittedCompany`, `submittedBy`, `status`, `date` |
| 긴급조치 | `type`, `permitNo`, `workId`, `date` |

---

## ⚠️ 폐기 예정 항목 (마이그레이션 후 제거)

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

**폐기 정책**: v1.0 배포 시 읽기 지원, 6개월 후 완전 제거

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
| `Math.random()` 시퀀스 | Firestore Transaction (또는 로컬 순차) |
| `new Date().toISOString()` (UTC) | 로컬 시간 기반 `fmtDate()` |
| `new Event('storage')` | `CustomEvent('app-data-changed')` |
| `w.date + '_' + (originalNo\|\|i)` | `originalNo` 필수 (없으면 skip) |
| `'TBM-' + Date.now()` | 로컬 시퀀스 발급 |

---
## 🚀 미래 자동화 계획 (Phase 3+)

### 🎯 비전

**"관리자가 모바일에서 리모트로 리포트 발송"**

관리자가 언제 어디서든 스마트폰으로 대시보드에 접속하여:
1. 📧 오늘 작업 리포트 발송
2. 📧 내일 작업 리스트 발송
3. 🚨 긴급 알림 발송

**구현 방식**: **하이브리드 (방식 C)** — 무료 티어 유지

---

### 🔄 자동화 3대 흐름

#### 흐름 1: 작업허가서 → 작업관리대장 자동 갱신 (완전 자동)

```
[허가서 승인]
    ↓
[클라이언트 저장 함수 내부]
  ├─ 작업허가 컬렉션 저장
  └─ 작업DB 컬렉션 자동 추가 (source: 'permit')
    ↓
[대시보드 실시간 반영]
```

**장점**:
- ✅ Excel 수동 업로드 불필요
- ✅ 실시간 반영
- ✅ 데이터 일관성

#### 흐름 2: 매일 오전/오후 리포트 발송 (반자동)

```
[관리자 - 모바일]
    ↓ (30초)
📱 대시보드 접속 (스마트폰 브라우저)
    ↓
[📧 오늘 리포트 발송] 탭
    ↓
자동으로 수신자 목록 조회
    ↓
[✅ 발송 확인] 탭
    ↓
EmailJS로 순차 발송
    ↓
[✅ 15명 발송 완료]
```

**장점**:
- ✅ 관리자가 상황 통제 (오발송 방지)
- ✅ 위치 독립적 (사무실 밖 OK)
- ✅ 무료 (EmailJS 200통/월)

#### 흐름 3: 긴급 알림 즉시 발송 (반자동)

```
[사고/작업중지 발생]
    ↓
[관리자 - 현장 또는 어디서든]
    ↓ (1분)
🚨 [긴급 알림 발송] 탭
    ↓
상황 입력 (짧게)
    ↓
전체 관리자 즉시 발송
    ↓
[✅ 20명 긴급 알림 발송 완료]
```

---

### 📱 모바일 리모트 발송 UI (구상)

대시보드 상단에 추가할 액션 카드:

```
┌─────────────────────────────────────┐
│  📊 안전관리 대시보드                  │
│  포항양극재공장 · 2026-08-24 (일)      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ⚡ 빠른 실행 (리모트)                 │
├─────────────────────────────────────┤
│                                      │
│  📧 오늘 작업 리포트                   │
│  12건의 오늘 작업을 15명에게           │
│                        [발송하기 →]  │
│                                      │
│  📧 내일 작업 리스트                   │
│  8건의 내일 작업을 12명에게            │
│                        [발송하기 →]  │
│                                      │
│  🚨 긴급 알림                         │
│  전체 관리자에게 즉시 알림              │
│                        [발송하기 →]  │
│                                      │
└─────────────────────────────────────┘

[기존 대시보드 내용]
```

---

### 🎯 이메일 리포트 종류

#### 1. 오늘 작업 리포트 (매일 오전)

**발송 시점**: 관리자가 아침에 클릭  
**발송 대상**: 안전관리자, 팀장, 오늘 작업 있는 협력사

**포함 내용**:
- 총 작업 수, 고위험 작업 수
- 고위험 작업 상세 (허가번호, 위험도)
- 일반 작업 리스트
- 오늘의 안전 포커스
- 지난 주 실적

#### 2. 내일 작업 리스트 (매일 오후)

**발송 시점**: 관리자가 퇴근 전 클릭  
**발송 대상**: 안전관리자, 내일 작업 있는 협력사

**포함 내용**:
- 협력사별 준비 사항
- 도급인 준비 사항 (미완료 서류 등)
- 안전정보제공서 발행 필요 목록
- 허가서 승인 대기 목록

#### 3. 긴급 알림 (즉시)

**발송 시점**: 사고/작업중지 발생 시 즉시  
**발송 대상**: 전체 관리자 + 팀장

**포함 내용**:
- 발생 상황 (사고 유형, 위치)
- 대응 필요 사항
- 담당자 연락처

---

### 📊 자동화 구현 로드맵 (상세)

#### Phase 3 (Week 5-8): 기본 자동화 구축

**목표**:
- 허가서 → 작업관리대장 자동 갱신
- 리포트 발송 UI 구축

**작업 내용**:
- [ ] 허가서 파일 `savePermit()` 함수 개선
  - 작업허가 저장 시 작업DB에도 자동 추가
  - `source: 'permit'` 필드로 구분
- [ ] 대시보드에 리모트 발송 UI 추가
  - "빠른 실행 (리모트)" 섹션 신규
  - 3개 액션 카드 (오늘/내일/긴급)
- [ ] EmailJS 설정
  - 계정 생성, 개인 Gmail 연결
  - 템플릿 3종 (오늘/내일/긴급) 작성
  - 도메인 화이트리스트

**예상 시간**: 2주

#### Phase 4 (Week 9-12): 수신자 관리 & 리포트 생성

**목표**:
- 자동 수신자 매핑
- 리포트 자동 생성

**작업 내용**:
- [ ] 수신자 관리 시스템
  - `users` 컬렉션에 `receiveReports` 필드 추가
  - `dailyToday`, `dailyTomorrow`, `urgent` boolean
  - 협력사관리 컬렉션에 담당자 이메일
- [ ] 리포트 자동 생성 로직
  - 오늘 리포트 생성 함수
  - 내일 리스트 생성 함수
  - 긴급 알림 생성 함수
- [ ] 발송 이력 저장
  - 새 컬렉션 `이메일로그`
  - 발송 시간, 대상, 성공/실패 기록

**예상 시간**: 2주

#### Phase 5 (Week 13-14): 고도화 (선택)

**목표**:
- 발송 이력 조회 UI
- 통계 대시보드

**작업 내용**:
- [ ] 발송 이력 조회 화면
- [ ] 수신자 활성/비활성 관리
- [ ] 템플릿 편집 UI (관리자용)
- [ ] 발송 실패 재시도

**예상 시간**: 2주

#### Phase 6+ (선택): 완전 자동화

**옵션 A: Cloud Functions (유료)**
- Blaze 플랜 전환
- 시간 트리거로 완전 자동 발송
- 예상 비용: 월 $5~20

**옵션 B: 개인 PC 스크립트 (무료)**
- Windows 작업 스케줄러
- Python 스크립트로 자동 실행
- 관리자 PC 상시 온라인 필요

**옵션 C: 현재 상태 유지 (무료)** ⭐ 확정
- 관리자가 매일 클릭
- 통제권 유지
- 실무자 선호도 높음

---

### 💰 예상 비용

#### Firebase Firestore (Spark 무료 티어)

**월 예상 사용량**:
- 읽기: 150만/월 (무료 티어 내)
- 쓰기: 60만/월 (무료 티어 내)
- **비용: $0**

#### EmailJS

**월 예상 발송량**:
- 오늘 리포트: 15명 × 30일 = 450통
- 내일 리스트: 12명 × 30일 = 360통
- 긴급 알림: 20통/월
- **총: 약 830통/월**

**해결책**:
- **옵션 1**: 발송 최적화 (Cc 활용, 통합 발송) → 100~150통/월 → 무료
- **옵션 2**: EmailJS Pro ($15/월, 무제한)
- **옵션 3**: Gmail SMTP 직접 (일 500통 무료)

**예상 총 비용**: **$0~15/월**

---

### 🎯 자동화 완성 후 기대 효과

#### 안전관리자 관점
- ⏰ **매일 30~60분 절약** (Excel 작성, 이메일 발송 자동화)
- 🌍 **위치 자유** (재택/출장 대응 가능)
- 📧 **놓치는 알림 0** (표준화된 리포트)
- 😌 **업무 스트레스 감소**

#### 협력사 관점
- 📅 **사전 준비 시간 확보** (내일 작업 미리 파악)
- 🛡️ **안전 사고 예방** (준비 사항 명확)
- 💬 **소통 개선**

#### 회사 관점
- 📊 **안전 관리 표준화**
- 📈 **감사 대응 자료 자동 생성**
- 🌱 **ESG 지표 개선**
- 💰 **연 200~700시간 인건비 절약**

---

### 📊 자동화 관련 데이터 흐름

```
[작업허가 저장]
    ↓
├─ Firestore: 작업허가 컬렉션
└─ Firestore: 작업DB 컬렉션 (자동 갱신)
    ↓
[관리자 대시보드 접속]
    ↓
[리포트 발송 버튼 클릭]
    ↓
├─ users 컬렉션 조회 (receiveReports.dailyToday=true)
├─ 협력사관리 조회 (오늘 작업 있는 곳)
└─ 작업허가 조회 (오늘 날짜)
    ↓
[리포트 자동 생성]
    ↓
[EmailJS 순차 발송]
    ↓
├─ 이메일로그 컬렉션 저장
└─ 대시보드에 발송 완료 표시
```

---

### ⚠️ 주의사항

#### 1. 발송 대상 관리
- ✅ 수신 동의 확인
- ✅ 발송 옵트아웃 기능
- ✅ 개인정보보호법 준수

#### 2. 이메일 내용
- ✅ 스팸 방지 (제목, 본문 자연스럽게)
- ✅ 발신자 명확 표시
- ✅ 문의 연락처 포함

#### 3. 실패 처리
- ✅ 발송 실패 시 재시도
- ✅ 관리자에게 실패 알림
- ✅ 로그 저장

#### 4. 보안
- ✅ EmailJS API 키 보호
- ✅ 도메인 화이트리스트
- ✅ Rate limiting

---

### 🔮 향후 확장 가능성

#### 1. **SMS 알림 추가**
- 긴급 알림은 SMS 병행 발송
- Twilio, Nexmo 등 활용

#### 2. **카카오톡 알림톡**
- 협력사 담당자에게 카카오톡 발송
- 알림톡 API 활용

#### 3. **모바일 앱 푸시 알림**
- 향후 앱 개발 시
- FCM (Firebase Cloud Messaging) 활용

#### 4. **AI 리포트 자동 생성**
- 오늘의 안전 포커스 AI 추천
- 위험도 자동 분석

#### 5. **협력사 자율 조회**
- 협력사도 자신의 작업만 대시보드 조회
- 이메일 대신 자체 대시보드 활용

---

### 📋 자동화 관련 컬렉션 (Firebase Firestore)

#### 신규 컬렉션

**`이메일로그`** (선택):
```javascript
{
  logId: 'LOG-20260824-001',
  type: 'daily_today',       // 'daily_today' | 'daily_tomorrow' | 'urgent'
  sentAt: Timestamp,
  sentBy: 'admin_uid',       // 발송자
  recipients: [               // 수신자 배열
    { email: 'user1@...', name: '홍길동', status: 'sent' },
    { email: 'user2@...', name: '김철수', status: 'failed', error: '...' }
  ],
  totalSent: 15,
  totalFailed: 0,
  reportSummary: {
    totalWorks: 12,
    highRiskWorks: 3,
    contractors: 5
  }
}
```

#### 확장 필드

**`users` 컬렉션**:
```javascript
{
  uid: 'xxx',
  email: 'user@posco.com',
  role: 'manager',
  displayName: '홍길동',
  receiveReports: {                // ⭐ 신규
    dailyToday: true,
    dailyTomorrow: true,
    urgent: true,
    weekly: false
  }
}
```

**`협력사관리` 컬렉션**:
```javascript
{
  contractorId: 'wonjun',
  contractorName: '원준',
  contactInfo: {                    // ⭐ 확장
    email: 'wonjun@example.com',
    manager: '홍길동',
    phone: '010-1234-5678',
    receiveDailyReport: true,      // 리포트 수신 여부
    receiveUrgent: true             // 긴급 알림 수신 여부
  }
}
```

---

### 🎊 이 자동화의 진짜 가치

**"관리자가 스마트폰으로 원격 발송"** — 이 하나의 기능이:

- ⏰ **매일 30~60분 절약** = 연 200~700시간
- 📧 **놓치는 알림 0** = 안전사고 예방
- 🌍 **위치 자유** = 재택/출장 대응
- 💰 **비용 0~15/월** = 무료 티어로 대부분 구현
- 🚀 **확장 가능** = 나중에 완전 자동으로 업그레이드
- ✨ **표준화** = 실무 편의성 극대화

**모든 안전관리자가 원하는 이상적인 시스템입니다!** 💪

---

### 📞 관련자 준비 사항

이 자동화가 완성되기 전에 미리 준비할 것:

#### 관리자 (도급인)
- [ ] 개인 Gmail 계정 준비 (EmailJS 연동용)
- [ ] 수신자 이메일 리스트 정리
- [ ] 리포트 발송 정책 결정 (시간, 대상)

#### 협력사
- [ ] 담당자 이메일 등록
- [ ] 리포트 수신 동의
- [ ] 이메일 확인 습관 형성

#### 안전관리팀
- [ ] 리포트 템플릿 검토
- [ ] 발송 시나리오 훈련
- [ ] 예외 상황 대응 매뉴얼

---
## 📁 프로젝트 파일 구조 (목표)

```
safety-management-platform/
├── index.html
├── 안전관리플랫폼_대시보드_V6_.html      ⭐ 배포됨
├── 안전작업허가서_v2.html                ⭐ 배포됨
├── TBM_및_작업중지권_v2.html
├── 위험성평가_v2.html
├── 포항양극재공장_안전퀴즈.html
├── 안전정보제공서_도급인용.html          ✅ 개편 완료
├── 안전정보제공서_수급인용.html          ✅ 개편 완료
├── firestore_upload.html                 (JSA_DB 업로드용)
├── firebase-config.js                    (Firebase 설정)
├── firebase.json                         (Hosting + 리다이렉트 설정)
│
├── data/                                 ⭐ 신규 폴더
│   ├── msds_database.js                 (34종 MSDS - 선택, HTML 하드코딩도 가능)
│   ├── factory_safety_info.js           (공장 비상정보 - 선택)
│   ├── jsa_database.json                (JSA_DB 마스터, Phase 6)
│   └── jsa_db_data.json                 (기존 파일, 있을 수 있음)
│
└── docs/
    ├── PROJECT_HANDOVER.md              ⭐ 이 문서
    ├── PROJECT_CONVENTIONS.md           ⭐ 규약 최종본
    ├── FILE_STORAGE_GUIDE.md            ⭐ 외부 파일 저장 가이드
    ├── IMPROVEMENT_PLAN.md              (기존)
    ├── DB_SCHEMA.md                     (기존)
    ├── FIRESTORE_SECURITY_RULES.md      (기존)
    ├── DATA_MIGRATION_GUIDE.md          (기존)
    ├── JSA_DB_STRUCTURE.md              (기존)
    ├── COMPLETE_PROJECT_GUIDE.md        (기존)
    │
    └── attachments/                      ⭐ 신규 폴더
        ├── README.md                     (별첨 자료 안내)
        ├── emergency_response_diagram.png    (비상상황체계도)
        ├── equipment_checklist_v1.png        (작업장비 체크리스트)
        └── heat_illness_selfcheck_v1.png     (온열질환 자율진단)
```

---

## 🎯 새 세션 시작 시 첫 프롬프트

새 Claude 세션에서 이 프로젝트를 이어서 진행할 때, 아래 프롬프트를 사용하세요:

```
안녕하세요! POSCO FM 포항양극재공장 안전관리 플랫폼 프로젝트를
이어서 진행하려고 합니다.

먼저 다음 3개 문서를 참고해서 프로젝트 상황을 파악해주세요:

1. docs/PROJECT_HANDOVER.md - 프로젝트 인수인계 (전체 개요, 진행 상황, 남은 작업, 자동화 로드맵)
2. docs/PROJECT_CONVENTIONS.md - 규약 문서 (필드명, 파일명, 상태값 등 모든 규약)
3. docs/FILE_STORAGE_GUIDE.md - 외부 파일 저장 가이드 (필요 시)

파악 후, 남은 작업 중 우선순위 P0인
"대시보드 P0 버그 수정"부터 진행하고 싶습니다.

지금까지 5개 앱(안전퀴즈, 위험성평가, TBM, 안전정보 도급/수급)의
저장 로직은 규약대로 개선 완료되었고,
이제 대시보드가 이 데이터를 실제로 조회할 수 있도록
버그를 수정해야 합니다.

또한 미래 자동화 계획으로 "관리자가 모바일에서 리모트로
리포트 발송" 방식(방식 C - 하이브리드)이 확정되어 있습니다.

준비되시면 시작해주세요!
```

---

## 📌 새 세션에서 Claude에게 알려야 할 것

새 세션에서 Claude가 알아야 할 핵심 사항:

### 1. 프로젝트 방향성
- ✅ Firebase + GitHub (무료 티어)
- ✅ 회사 서버 이관 유보 (Firebase 무기한)
- ✅ Cloud Functions 미사용
- ✅ **자동화는 방식 C (하이브리드) 확정** — 관리자가 모바일 리모트로 발송

### 2. 지금까지 개선한 5개 파일
- 안전퀴즈, 위험성평가, TBM, 안전정보(도급), 안전정보(수급)
- 모두 **규약 준수**로 저장 로직 개편됨

### 3. 남은 최우선 작업
- **대시보드 P0 버그 수정** (지금까지 개선 사항을 실제로 살리는 핵심)
- 파일명 통일 & Firebase Hosting 리다이렉트

### 4. 개발 환경 제약사항
- 회사 환경 (Fasoo DRM 등 보안 시스템)
- 모바일 위주 진행 (데스크톱 접근 제한적)
- Firebase Console 조작 어려움 (데스크톱 필요)
- 코드는 GitHub 웹 편집기 또는 로컬 저장 후 커밋

### 5. 응답 스타일
- 긴 코드는 **여러 파트로 나눠서** 제공 (응답 잘림 방지)
- 각 파트마다 "계속" 대기
- 실무자가 이해하기 쉬운 설명
- 규약 준수 강조

### 6. 향후 자동화 비전
- ✅ **관리자 모바일 리모트 발송** (방식 C 확정)
- 📧 오늘 리포트 / 내일 리스트 / 긴급 알림
- 💰 무료 티어 유지 (Firebase Spark + EmailJS)
- 🎯 예상 시작: Phase 3 (5~14주 단계적 진행)

---

## 📊 지금까지의 성과 요약

### 발견한 문제
- ❌ 15+ 종의 localStorage 키 이름 불일치
- ❌ 파일명 버전 접미어 혼재 (`_v2`, `_v2_1_`, `_V6_`, `_V6_1_`, `_V7_통합`)
- ❌ 3가지 백엔드 병존 (Firebase, localStorage, Apps Script)
- ❌ workId 규칙 3파일 모두 다름
- ❌ 안전퀴즈 저장 자체가 없었음 (유령 데이터)
- ❌ 대시보드 P0 버그들
- ❌ Claude API CORS 실패
- ❌ Google Apps Script URL 미설정
- ❌ 역할값 대소문자 혼재

### 해결한 것
- ✅ 저장 키 규약 통일 (`safetyProvisions`, `safetyTBM`, `riskAssessments` 등)
- ✅ 자연키 규약 통일 (`SIP-YYYYMMDD-XXX` 등)
- ✅ 감사 필드 표준화 (`createdAt`, `createdBy`, `updatedAt`, `updatedBy`)
- ✅ 대시보드 매칭 필드 명시 (`submittedCompany`, `submittedBy` 등)
- ✅ 폐기 키 자동 마이그레이션 로직
- ✅ 상태값 통일 (`발행완료`, `서명완료` 등)
- ✅ URL 파라미터 통일 (`?safeinfoNo=`, `?workId=` 등)
- ✅ MSDS 34종 데이터셋 구축
- ✅ 공장 2개 사업장 비상정보 표준화
- ✅ 안전정보 도급인 → 수급인 완전한 페어링
- ✅ 미래 자동화 방향 확정 (방식 C - 하이브리드)

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
3. **작은 단위 검증** (안전퀴즈 → 위험성평가 → TBM 순)
4. **응답 분할** (긴 코드는 여러 파트로)
5. **재활용 가능한 자산 축적** (MSDS, 비상정보 등)
6. **미래 비전 명확** (자동화 로드맵)

---

## 📞 참조 링크 (다시)

| 자원 | URL |
|---|---|
| **GitHub 저장소** | https://github.com/safety99999/safety-management-platform |
| **Firebase Console** | https://console.firebase.google.com/project/safety-management-platfo-5f413 |
| **배포된 사이트** | https://safety-management-platfo-5f413.web.app |
| **JSA_DB 업로드 도구** | https://safety-management-platfo-5f413.web.app/firestore_upload.html |
| **안전보건공단 MSDS** | https://msds.kosha.or.kr/ |
| **EmailJS** | https://www.emailjs.com/ |

---

## 📅 변경 이력

| 버전 | 날짜 | 변경 사항 |
|---|---|---|
| 1.0 | 2026-08-24 | 최초 인수인계 문서 작성 (5개 앱 개선 완료 시점) |
| **2.0** | **2026-08-24** | **자동화 로드맵 추가 (방식 C 확정)** |

---

## ⚠️ 중요 안내

**이 문서와 상충하는 경우 우선순위**:
1. **PROJECT_CONVENTIONS.md** (규약 문서) - 최우선
2. **PROJECT_HANDOVER.md** (이 문서) - 진행 상황
3. **FILE_STORAGE_GUIDE.md** - 파일 저장 방법
4. **DB_SCHEMA.md** - 세부 스키마
5. **기타 문서** - 참고용

**모든 코드 개선은 `PROJECT_CONVENTIONS.md` 규약을 반드시 준수합니다.**

---

## 🎊 마무리

이 문서를 통해:

### 즉시 가능한 것
- ✅ 새 Claude 세션에서 프로젝트 즉시 이어가기
- ✅ 남은 작업 우선순위 명확
- ✅ 규약 준수 방향 확립

### 미래 준비된 것
- 🚀 자동화 로드맵 (Phase 3~6)
- 📧 이메일 리포트 시스템 (모바일 리모트)
- 💾 Firebase 이관 계획
- 📊 확장 가능한 아키텍처

### 지금까지의 여정
- 📋 11개 파일 검토
- 🔧 5개 앱 저장 로직 개편
- 📚 5개 문서 작성
- 🎯 자동화 방향 확정

---

**끝.**

새 세션에서 이 문서를 참조하여 즉시 이어서 작업을 진행하세요! 🚀

**"이 프로젝트는 잘 정리되어 있어, 언제든 이어갈 수 있다"** — 이것이 이 문서의 목표입니다. 💪

