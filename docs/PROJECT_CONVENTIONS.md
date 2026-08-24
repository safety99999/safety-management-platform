# 📘 PROJECT_CONVENTIONS.md

**POSCO FM 포항양극재공장 안전관리 시스템**  
**규약 문서 (Single Source of Truth)**

Version: 2.0 (Final)  
Last Updated: 2026-08-24  
Status: 확정 (5개 앱 개선 완료 반영)

---

## 🎯 이 문서의 역할

이 프로젝트의 **모든 코드·문서·데이터가 지켜야 할 규약**을 정의합니다.

다른 문서(DB 스키마, 보안 규칙, 마이그레이션 가이드)와 상충 시 **이 문서가 우선**합니다.

---

## 1. 프로젝트 아키텍처

### 1.1 확정된 스택

| 계층 | 기술 | 상태 |
|---|---|---|
| **프론트엔드** | HTML + CSS + Vanilla JS | 유지 |
| **백엔드** | Firebase Firestore | 이관 진행 중 |
| **인증** | Firebase Auth (Google OAuth) | 도입 예정 |
| **배포** | Firebase Hosting | 운영 중 |
| **코드 관리** | GitHub | 운영 중 |
| **이메일** | EmailJS + 개인 Gmail (개발) | 도입 예정 |
| **AI 대체** | JSA_DB 사전 생성 + Firestore 조회 | 데이터 완료 |

### 1.2 비용 정책

- ✅ **Firebase Spark(무료) 플랜만 사용**
- ❌ Blaze(유료) 전환 없음
- ❌ Cloud Functions 사용 없음
- ✅ 필요 시 EmailJS(월 200통 무료) 활용

### 1.3 회사 서버 이관

- 유보 상태 (Firebase 무기한 사용)

### 1.4 개발 환경 제약사항

- 회사 환경 (Fasoo DRM 등 보안 시스템)
- 모바일 위주 진행
- Firebase Console 조작은 데스크톱에서
- 코드 저장은 GitHub 웹 편집기 or 로컬

---

## 2. 역할(Role) 규약

### 2.1 역할 값 표기

| 역할 | 저장 값 | UI 라벨 |
|---|---|---|
| 관리자 | `'admin'` | 관리자 |
| 매니저 | `'manager'` | 안전관리자 |
| 작업자 | `'worker'` | 작업자 |

**규약**:
- ✅ **소문자로만** 저장 (`'admin'`, `'manager'`, `'worker'`)
- ❌ `'ADMIN'`, `'Admin'`, `'USER'` 등 금지
- ✅ 저장 위치: Firebase Auth Custom Claims

### 2.2 역할 검증 방식

**클라이언트**:
```javascript
async function getUserRole() {
  const user = firebase.auth().currentUser;
  if (!user) return 'worker';
  const token = await user.getIdTokenResult();
  return token.claims.role || 'worker';
}
```

**Firestore Rules**:
```javascript
function isAdmin() {
  return request.auth != null && request.auth.token.role == 'admin';
}
function isManager() {
  return request.auth != null && request.auth.token.role in ['admin', 'manager'];
}
```

⚠️ **금지**: `get(/databases/.../users/$(uid)).data.role` 방식 (매 요청 Firestore 조회 = 비용 폭탄)

---

## 3. 자연키(Natural Key) 생성 규칙

### 3.1 형식 규약

| 종류 | 형식 | 예시 |
|---|---|---|
| **workId** | `{YYYY-MM-DD}_{originalNo}` | `2025-11-24_5` |
| **permitNo** | `PTW-{YYYYMMDD}-{SEQ3}` | `PTW-20260824-001` |
| **riskId** | `RA-{YYYYMMDD}-{SEQ3}` | `RA-20260824-001` |
| **tbmNo** | `TBM-{YYYYMMDD}-{SEQ3}` | `TBM-20260824-001` |
| **quizId** | `QZ-{YYYYMMDD}-{SEQ3}` | `QZ-20260824-001` |
| **emergencyNo** | `EM-{YYYYMMDD}-{SEQ3}` | `EM-20260824-001` |
| **inspectionNo** | `IN-{YYYYMMDD}-{SEQ3}` | `IN-20260824-001` |
| **safeinfoNo** | `SIP-{YYYYMMDD}-{SEQ3}` | `SIP-20260824-001` |
| **jsaId** | `JSA-{YYYYMMDD}-{XXX}-{NN}` | `JSA-20260821-001-01` |

### 3.2 시퀀스 발급 방식

**임시 (localStorage 단계)**:
```javascript
function getNextSequence(prefix, date){
  var dateStr = date.replace(/-/g, '');
  var storageKey = 'safetyProvisions'; // 각 앱마다 다름
  try {
    var list = JSON.parse(localStorage.getItem(storageKey) || '[]');
    var todayCount = list.filter(function(d){
      return d[prefix + 'No'] && d[prefix + 'No'].startsWith(prefix + '-' + dateStr);
    }).length;
    var seq = todayCount + 1;
    return prefix + '-' + dateStr + '-' + String(seq).padStart(3, '0');
  } catch(e) {
    return prefix + '-' + dateStr + '-001';
  }
}
```

**정식 (Firestore Transaction 이관 후)**:
```javascript
async function getNextSequence(prefix, date) {
  const dateStr = date.replace(/-/g, '');
  const counterRef = db.doc(`counters/${prefix}_${dateStr}`);
 
  const seq = await db.runTransaction(async (t) => {
    const doc = await t.get(counterRef);
    const next = (doc.exists ? doc.data().count : 0) + 1;
    t.set(counterRef, {
      count: next,
      lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
    });
    return next;
  });
 
  return `${prefix}-${dateStr}-${String(seq).padStart(3, '0')}`;
}
```

### 3.3 폐기 방식

- ❌ `'PTW-' + Math.random()...` (충돌 위험)
- ❌ `'TBM-' + Date.now()` (규약 불일치)
- ❌ `w.date + '_' + (w.originalNo || i)` (fallback 위험)

### 3.4 workId 특수 규약

- `originalNo`가 없는 작업은 **저장 거부** (skip)
- 인덱스 fallback(`i`), 빈 문자열 fallback(`''`) **모두 금지**

---

## 4. Firestore 컬렉션 (16개 + JSA_DB)

### 4.1 Core Collections (7개)

| 컬렉션명 | 문서ID | 자연키 필드 | 용도 |
|---|---|---|---|
| `users` | Firebase Auth UID | `uid` | 사용자 관리 |
| `작업DB` | `{workId}` | `workId` | 원본 작업 정보 |
| `작업허가` | `{permitNo}` | `permitNo` | 안전작업허가서 |
| `TBM` | `{tbmNo}` | `tbmNo` | Tool Box Meeting |
| `위험성평가` | `{riskId}` | `riskId` | 위험성 평가 |
| `안전퀴즈` | `{quizId}` | `quizId` | 출입자 안전퀴즈 |
| `긴급조치` | `{emergencyNo}` | `emergencyNo` | 사고 후 조치 + 작업중지권 |

### 4.2 Safety Info Collections (3개)

| 컬렉션명 | 문서ID | 자연키 필드 | 용도 |
|---|---|---|---|
| `안전정보제공` | `{safeinfoNo}` | `safeinfoNo` | 안전정보제공서 (도급↔수급) |
| `안전점검사항` | `{inspectionNo}` | `inspectionNo` | 안전 점검·위반 |
| `공장안전정보` | `{factoryId}` | `factoryId` | 공장별 위험 설비 (**2개 사업장**) |

### 4.3 Management Collections (4개)

| 컬렉션명 | 문서ID | 자연키 필드 | 용도 |
|---|---|---|---|
| `협력사관리` | `{contractorId}` | `contractorId` | 협력사 정보 |
| `작업자관리` | `{workerId}` | `workerId` | 작업자 정보 |
| `MSDS` | `{msdsId}` | `msdsId` | 화학물질 안전정보 (**34종**) |
| `사내안전기준` | `{standardNo}` | `standardNo` | 사내 안전 기준 |

### 4.4 Statistics Collections (2개)

| 컬렉션명 | 문서ID | 갱신 방식 |
|---|---|---|
| `월간통계` | `{YYYY-MM}` | 클라이언트 실시간 계산 |
| `협력사통계` | `{contractorId}` | 클라이언트 실시간 계산 |

### 4.5 Special Collections

| 컬렉션명 | 문서ID | 용도 |
|---|---|---|
| `JSA_DB` | `{jsaId}` | 사전 생성 JSA 데이터셋 (98개 문서, 690개 위험요소) |
| `counters` | `{PREFIX}_{YYYYMMDD}` | 시퀀스 발급 (Transaction용) |
| **`작업장비체크리스트`** | `EC-{YYYYMMDD}-{SEQ3}` | TBM 별첨 1 (Phase 7) |
| **`온열질환진단`** | `HI-{YYYYMMDD}-{SEQ3}` | TBM 별첨 2 (Phase 7, 5~9월) |

---

## 5. 저장소 키 매핑 (임시 → 정식)

### 5.1 localStorage ↔ Firestore

| 데이터 | localStorage (임시) | Firestore (정식) |
|---|---|---|
| 작업 | `safetyDatabase.workHistory[]` | `작업DB` |
| 허가 | `safetyPermits[]` | `작업허가` |
| TBM | `safetyTBM[]` | `TBM` |
| 위험성평가 | `riskAssessments[]` | `위험성평가` |
| 안전퀴즈 | `safetyQuizzes[]` | `안전퀴즈` |
| 긴급조치 | `emergencies[]` | `긴급조치` |
| 안전점검 | `inspections[]` | `안전점검사항` |
| 안전정보제공 | `safetyProvisions[]` | `안전정보제공` |
| 사용자 (임시) | `sessionStorage.userInfo` | `users` (Firestore) |

### 5.2 폐기 예정 키 (마이그레이션 후 제거)

| 폐기 키 | 대체 | 자동 마이그레이션 |
|---|---|---|
| `firebasePermits` | `safetyPermits` | 필요 |
| `safetyInfoDocs` | `safetyProvisions` | ✅ 구현됨 |
| `safetyInfoSigned` | `safetyProvisions.signature` (병합) | ✅ 구현됨 |
| `safetyViolations` | `emergencies` or `inspections` | 필요 |
| `riskDatabase` | `riskAssessments` | ✅ 구현됨 |
| `safetyRiskAssessments` | `riskAssessments` | ✅ 구현됨 |
| `safetyStopWork` | `emergencies.type='stop'` | ✅ 구현됨 |
| `tbmLogs` | `safetyTBM` | ✅ 구현됨 |

**폐기 정책**: v1.0 배포 시 읽기 지원, 6개월 후 완전 제거

### 5.3 한글 컬렉션명 유지 이유

- 배포된 스키마 그대로 (재작업 부담 없음)
- 팀 커뮤니케이션 편함
- Firebase 이관 시 데이터 이관 문서 그대로 사용
- 통합 가이드에 이미 명시됨

---
## 6. 파일명 규약

### 6.1 정식 파일명

| 페이지 | 정식 파일명 |
|---|---|
| 대시보드 | `안전관리플랫폼_대시보드_V6_.html` |
| 안전작업허가서 | `안전작업허가서_v2.html` |
| TBM | `TBM_및_작업중지권_v2.html` |
| AI 위험성평가 | `위험성평가_v2.html` |
| 안전퀴즈 | `포항양극재공장_안전퀴즈.html` |
| 안전정보제공서 (도급인) | `안전정보제공서_도급인용.html` |
| 안전정보제공서 (수급인) | `안전정보제공서_수급인용.html` |
| JSA_DB 업로드 도구 | `firestore_upload.html` |

### 6.2 폐기 파일명 (리다이렉트 대상)

| 폐기 | 대체 |
|---|---|
| `안전관리플랫폼_대시보드_V6_1_.html` | `_V6_.html` |
| `안전관리플랫폼_대시보드_V7_통합.html` | `_V6_.html` |
| `dashboard_v6.html` | `_V6_.html` |
| `안전작업허가서_v2_1_.html` | `_v2.html` |
| `TBM_및_작업중지권_v2_1_.html` | `_v2.html` |
| `안전정보제공서_작성.html` | `_도급인용.html` |

### 6.3 파일명 규약 원칙

- ✅ **한글 파일명 유지** (배포된 상태 보존)
- ✅ 버전 접미어 최대 1개 (`_v2`, `_V6_`)
- ❌ **이중 버전 접미어 금지** (`_v2_1_`, `_V6_1_`, `_V7_통합`)
- ✅ Firebase Hosting 301 리다이렉트로 폐기 파일 커버

### 6.4 firebase.json 리다이렉트 설정

```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "redirects": [
      {
        "source": "/안전관리플랫폼_대시보드_V6_1_.html",
        "destination": "/안전관리플랫폼_대시보드_V6_.html",
        "type": 301
      },
      {
        "source": "/안전관리플랫폼_대시보드_V7_통합.html",
        "destination": "/안전관리플랫폼_대시보드_V6_.html",
        "type": 301
      },
      {
        "source": "/dashboard_v6.html",
        "destination": "/안전관리플랫폼_대시보드_V6_.html",
        "type": 301
      },
      {
        "source": "/안전작업허가서_v2_1_.html",
        "destination": "/안전작업허가서_v2.html",
        "type": 301
      },
      {
        "source": "/TBM_및_작업중지권_v2_1_.html",
        "destination": "/TBM_및_작업중지권_v2.html",
        "type": 301
      },
      {
        "source": "/안전정보제공서_작성.html",
        "destination": "/안전정보제공서_도급인용.html",
        "type": 301
      }
    ]
  }
}
```

---

## 7. URL 파라미터 규약

### 7.1 정식 파라미터명

| 파라미터 | 의미 | 예시 |
|---|---|---|
| `workId` | 작업 ID | `?workId=2025-11-24_5` |
| `permitNo` | 허가서 번호 | `?permitNo=PTW-20260824-001` |
| `riskId` | 위험성평가 번호 | `?riskId=RA-20260824-001` |
| `tbmNo` | TBM 번호 | `?tbmNo=TBM-20260824-001` |
| `safeinfoNo` | 안전정보제공서 번호 | `?safeinfoNo=SIP-20260824-001` |
| `emergencyNo` | 긴급조치 번호 | `?emergencyNo=EM-20260824-001` |
| `mode` | 진입 모드 | `?mode=new` / `?mode=view` |

### 7.2 폐기 파라미터

| 폐기 | 대체 |
|---|---|
| `?doc=SIP-001` | `?safeinfoNo=SIP-001` |

### 7.3 인코딩

모든 파라미터 값은 `encodeURIComponent()` 필수.

```javascript
// ✅ 올바른 방식
const url = `안전작업허가서_v2.html?workId=${encodeURIComponent(workId)}`;

// ❌ 잘못된 방식
const url = `안전작업허가서_v2.html?workId=${workId}`;
```

### 7.4 앱 간 링크 규약

**도급인용 → 수급인용**:
```javascript
var signUrl = baseUrl + '안전정보제공서_수급인용.html?safeinfoNo=' +
  encodeURIComponent(data.safeinfoNo);
```

**허가서 → TBM**:
```javascript
var tbmUrl = 'TBM_및_작업중지권_v2.html?permitNo=' +
  encodeURIComponent(permitNo) + '&workName=' + encodeURIComponent(workName);
```

**허가서 → 위험성평가**:
```javascript
var riskUrl = '위험성평가_v2.html?permitNo=' +
  encodeURIComponent(permitNo) + '&workId=' + encodeURIComponent(workId);
```

**모든 앱 → 대시보드**:
```javascript
window.location.href = '안전관리플랫폼_대시보드_V6_.html';
```

---

## 8. 데이터 상태(Status) 규약

### 8.1 작업 상태 흐름

```
대기중 → 허가진행중 → 허가완료 → 작업중 → 작업완료
                                    ↓
                                작업중지 (특수)
```

### 8.2 저장 값 (한글 유지)

| 컬렉션 | 필드 | 허용 값 |
|---|---|---|
| `작업허가` | `status` | `'대기중'`, `'허가진행중'`, `'허가완료'`, `'작업중'`, `'작업완료'`, `'작업중지'` |
| `안전퀴즈` | `status` | `'합격'`, `'불합격'` |
| `안전점검사항` | `severity` | `'중대'`, `'경미'`, `'권고'` |
| `안전점검사항` | `correctionStatus` | `'미시정'`, `'시정중'`, `'완료'` |
| `위험성평가` | `overallRisk` | `'저위험'`, `'중위험'`, `'고위험'`, `'매우고위험'` |
| `안전정보제공` | `status` | `'발행완료'`, `'서명완료'`, `'반려'` |
| `TBM` | `status` | `'완료'`, `'취소'` |
| `긴급조치` | `type` | `'사고'`, `'중지'`, `'긴급'` |
| `긴급조치` | `status` | `'요청'`, `'조치중'`, `'완료'` |

### 8.3 상태 전환 규약

**안전정보제공서 흐름**:
```
[도급인 발행]
  status: '발행완료'
       ↓
[수급인 서명]
  status: '서명완료'
       ↓
[문제 발견 시]
  status: '반려'
```

**작업허가서 흐름**:
```
[신청]
  status: '대기중'
       ↓
[승인 대기]
  status: '허가진행중'
       ↓
[승인 완료]
  status: '허가완료'
       ↓
[TBM 완료 & 작업 시작]
  status: '작업중'
       ↓
[작업 완료]
  status: '작업완료'
```

### 8.4 폐기 방식

- ❌ `passYN` boolean (안전퀴즈)
- ❌ 영문 상태 값 (`'approved'`, `'working'`)
- ❌ 대소문자 혼용 (`'대기중'` vs `'대기 중'`)

---

## 9. 날짜·시간 규약

### 9.1 저장 형식

| 종류 | 타입 | 예시 | 규칙 |
|---|---|---|---|
| 날짜만 | `string` (KST) | `"2025-11-24"` | 로컬 시간 기반 `YYYY-MM-DD` |
| 날짜+시간 (감사) | Firestore `Timestamp` or ISO string | `Timestamp(...)` or `"2025-11-24T14:30:00.000Z"` | `serverTimestamp()` or `new Date().toISOString()` |
| 시간만 | `string` | `"09:00"` | `HH:mm` |

### 9.2 "오늘" 판정 (KST 기준)

**❌ 잘못된 방식 (UTC 기준)**:
```javascript
new Date().toISOString().split('T')[0]
// UTC 자정~KST 오전 9시 사이는 어제 날짜 반환
```

**✅ 올바른 방식 (KST 기준)**:
```javascript
function fmtDate(d) {
  d = d || new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 사용
const today = fmtDate();  // "2025-11-24"
```

### 9.3 Firestore 저장

```javascript
// ✅ 권장 저장 방식
{
  date: '2025-11-24',                                            // string, 쿼리·표시용
  createdAt: firebase.firestore.FieldValue.serverTimestamp(),   // Timestamp, 감사용
  updatedAt: firebase.firestore.FieldValue.serverTimestamp()    // Timestamp, 감사용
}
```

### 9.4 규약

- ✅ `getFullYear()`, `getMonth()`, `getDate()` (로컬 시간)
- ❌ `toISOString()` (UTC 변환) - 날짜 표시용으로 사용 금지
- ✅ 서버 저장 시에만 UTC Timestamp
- ✅ 표시 시 항상 KST 기준
- ✅ `date` 필드는 항상 오늘 필터용으로 저장 (예: `"2025-11-24"`)

---
## 10. 감사 필드 (Audit Fields)

### 10.1 모든 컬렉션 문서 필수 필드

```javascript
{
  // ... 비즈니스 데이터 ...
 
  // 감사 필드 (필수)
  createdAt: firebase.firestore.FieldValue.serverTimestamp(),  // 또는 ISO 문자열
  createdBy: firebase.auth().currentUser.uid,                  // 또는 사용자명
  updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  updatedBy: firebase.auth().currentUser.uid,
  schemaVersion: 1  // 마이그레이션용
}
```

### 10.2 Soft Delete (선택)

```javascript
{
  deletedAt: null,           // Timestamp | null
  deletedBy: null            // string | null
}
```

### 10.3 로컬 저장 시 대안 (Firebase Auth 미도입 상태)

```javascript
{
  createdAt: new Date().toISOString(),
  createdBy: sessionStorage.getItem('userName') || 'anonymous',
  updatedAt: new Date().toISOString(),
  updatedBy: sessionStorage.getItem('userName') || 'anonymous',
  schemaVersion: 1
}
```

### 10.4 상태 변경 시 감사

**수급인이 서명 시** (안전정보제공서):
```javascript
{
  // 기존 데이터 유지
  ...existingData,
 
  // 서명 정보 추가
  signerName: '홍길동',
  signerPhone: '010-1234-5678',
  signature: 'data:image/png;base64,...',
  signedAt: new Date().toISOString(),
  signedBy: sessionStorage.getItem('userName') || 'anonymous',
  status: '서명완료',  // 발행완료 → 서명완료
 
  // updatedAt/updatedBy는 갱신, createdAt/createdBy는 보존
  updatedAt: new Date().toISOString(),
  updatedBy: sessionStorage.getItem('userName') || 'anonymous'
}
```

---

## 11. Storage 이벤트 & 실시간 동기화

### 11.1 localStorage 갱신 시 이벤트 발생

**표준 방식** (같은 탭 감지 포함):

```javascript
function saveAndBroadcast(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
 
  // 같은 탭에도 알림 (표준 storage 이벤트는 다른 탭만 감지)
  window.dispatchEvent(new CustomEvent('app-data-changed', {
    detail: { key: key, timestamp: Date.now() }
  }));
}

// 사용 예시
function savePermit() {
  const permits = getPermits();
  permits.push(permitData);
  saveAndBroadcast('safetyPermits', permits);
}
```

### 11.2 대시보드에서 리스너 등록

```javascript
// 같은 탭 감지
window.addEventListener('app-data-changed', function(e) {
  const key = e.detail.key;
  if (key === 'safetyPermits') refreshPermitList();
  if (key === 'safetyQuizzes') updateQuizCount();
  if (key === 'safetyProvisions') refreshProvisionCount();
  if (key === 'riskAssessments') refreshRiskCount();
  if (key === 'safetyTBM') refreshTBMCount();
  if (key === 'emergencies') refreshEmergencyCount();
});

// 다른 탭 감지 (표준 storage 이벤트)
window.addEventListener('storage', function(e) {
  // 같은 처리
});
```

### 11.3 Firestore 실시간 리스너 (Firebase 이관 후)

```javascript
db.collection('작업허가')
  .where('startDate', '==', today)
  .onSnapshot(function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
      if (change.type === 'added') {
        console.log('신규 허가서:', change.doc.data());
      }
    });
    refreshPermitList();
  });
```

### 11.4 폐기 방식

```javascript
// ❌ 잘못된 방식 (같은 탭 감지 안 됨)
var event = new Event('storage');
event.key = 'safetyPermits';  // key는 read-only, 무시됨
window.dispatchEvent(event);
```

---

## 12. 협력사 마스터 데이터

### 12.1 정의

| 구분 | 설명 |
|---|---|
| **협력사(contractor)** | 도급 계약 관계인 외부 업체 |
| **내부 조직(internal)** | 직영, 정비섹션 등 자체 조직 |

### 12.2 필드 구조

```javascript
{
  contractorId: 'wonjun',              // 영문 슬러그 (문서ID로도 사용)
  contractorName: '원준',              // 표시명 (짧은 이름)
  contractorNameFull: '원준산업',      // 정식명 (긴 이름)
  contractorType: 'contract',          // 'contract' | 'internal'
  status: 'active',                    // 'active' | 'inactive'
  registrationDate: Timestamp,
  contactInfo: {
    phone: '',
    email: '',
    address: ''
  },
  statistics: {
    totalWorks: 0,
    violations: 0,
    accidents: 0,
    tbmRate: 0
  }
}
```

### 12.3 현재 대시보드 하드코딩 27개 리스트

```javascript
[
  '원준', '유공엔지니어링', '직영', '세광', '에이스테크', '안전공사',
  '남양이엔에스', '태정종합건설', '서원종합건설', '예준산업', '파즈코리아',
  '운강건설', '금강건설', '포스코PR테크', 'PR테크', '위드테크', 'NCH', '우진환경',
  '다산', '엠엔케이', 'KRST대한동방', 'GAFF', 'KRST', '대한동방', '포스코건설',
  '현대건설', '정비섹션'
]
```

### 12.4 이관 절차

1. 각 항목의 `contractorType` 지정
   - `직영`, `정비섹션` → `'internal'`
   - 나머지 → `'contract'`
2. Firestore `협력사관리` 컬렉션에 업로드
3. 대시보드에서 Firestore 조회로 변경

---

## 13. AI 위험성평가 (JSA_DB 방식)

### 13.1 확정된 방식

**❌ Claude API 브라우저 직접 호출** (CORS 차단, 유료)  
**✅ JSA_DB 사전 생성 + Firestore 조회** (무료, 즉시 응답)

### 13.2 JSA_DB 스키마

```javascript
{
  workInfo: {
    jsaId: "JSA-20260821-001-01",
    workName: "3라인 예비소성로 2~5존 수직히터 교체",
    workType: "정비",
    workTypeDetail: "히터 교체"
  },
 
  riskAssessment: [
    {
      stageNo: 4,
      stageName: "에너지 차단",
      equipment: ["수공구", "계측기"],
      materials: ["전기"],
      hazards: [
        {
          originalHazard: "히터 교체 작업 중 감전 위험",
          standardAccidentType: "감전",
          scenario: "전원 차단·확인 미흡 상태에서...",
          severity: 4,
          probability: 2,
          riskScore: 8
        }
      ],
      currentMeasures: ["전원 차단 및 ILS 실시 후 작업"],
      standardMeasures: ["ILS/LOTO 실시"],
      controlAdequacy: "○"
    }
  ],
 
  metadata: {
    jsaId: "JSA-20260821-001-01",
    createdAt: "2026-08-21T12:00:00Z",
    status: "active",
    dataSource: "작업관리대장",
    version: "1.0",
    verified: false
  }
}
```

### 13.3 활용 흐름

```
사용자: "3라인 히터 교체" 입력
      ↓
JSA_DB에서 유사 작업 검색 (키워드 매칭)
      ↓
후보 3개 표시 (유사도 %)
      ↓
사용자 선택
      ↓
위험성평가 폼 자동 채움 (단계·위험요인·대책)
      ↓
사용자 검토·수정
      ↓
Firestore `위험성평가` 컬렉션 저장
      ↓
자동으로 JSA_DB에도 추가 (다음 검색 활용)
```

### 13.4 유사도 검색 코드

```javascript
// 키워드 매칭 기반 유사도 계산
function findSimilarJSA(workName, allJSA) {
  const inputTokens = tokenize(workName);
 
  return allJSA
    .map(jsa => ({
      jsa: jsa,
      score: calculateSimilarity(inputTokens, tokenize(jsa.workInfo.workName))
    }))
    .filter(item => item.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function tokenize(text) {
  return text
    .replace(/[^\uAC00-\uD7A3a-zA-Z0-9]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

function calculateSimilarity(tokensA, tokensB) {
  const common = tokensA.filter(t => tokensB.includes(t));
  return common.length / Math.max(tokensA.length, tokensB.length);
}
```

### 13.5 캐시 정책

```javascript
// 1일 1회 JSA_DB 전체 로드
async function initJSACache() {
  const CACHE_KEY = 'jsa_cache';
  const CACHE_TIME_KEY = 'jsa_cache_at';
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간
 
  const cachedAt = parseInt(localStorage.getItem(CACHE_TIME_KEY) || '0');
  const cached = localStorage.getItem(CACHE_KEY);
 
  if (cached && Date.now() - cachedAt < CACHE_DURATION) {
    return JSON.parse(cached);
  }
 
  // Firestore에서 로드
  const snapshot = await db.collection('JSA_DB').get();
  const data = snapshot.docs.map(d => d.data());
 
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
 
  return data;
}
```

### 13.6 저장 시 참조 정보

위험성평가 저장 시 JSA_DB 참조를 감사용으로 기록:

```javascript
{
  ...riskAssessmentData,
 
  // JSA_DB 참조 정보 (감사용)
  aiSource: 'JSA_DB',                     // 'JSA_DB' | 'manual' | null
  originalJsaId: 'JSA-20260821-001-01',   // 참조한 JSA ID
  similarity: 0.85                         // 유사도 (선택)
}
```

---

## 14. 대시보드 매칭 필드 (앱별 필수)

각 앱이 저장할 때 대시보드가 조회할 수 있도록 반드시 포함해야 하는 필드:

### 14.1 안전퀴즈 (`safetyQuizzes`)

```javascript
{
  quizId: 'QZ-20260824-001',
  respondent: '홍길동',              // ⭐ 응시자 이름
  respondentCompany: '원준',         // ⭐ 소속 회사 (허가서 검증용)
  status: '합격',                    // ⭐ '합격' | '불합격'
  date: '2026-08-24',                // ⭐ 응시 날짜
  score: 95,
  createdAt: '...',
  createdBy: '...'
}
```

### 14.2 위험성평가 (`riskAssessments`)

```javascript
{
  riskId: 'RA-20260824-001',
  workId: '2026-08-24_5',            // ⭐ 원본 작업 매칭
  permitNo: 'PTW-20260824-001',      // ⭐ 허가서 참조 (선택)
  date: '2026-08-24',                // ⭐ 평가 날짜
  overallRisk: '고위험',             // ⭐ '저위험'/'중위험'/'고위험'/'매우고위험'
  overallScore: 12,                  // ⭐ 위험도 점수
  assessor: '홍길동',
  company: '원준',
  createdAt: '...',
  createdBy: '...'
}
```

### 14.3 TBM (`safetyTBM`)

```javascript
{
  tbmNo: 'TBM-20260824-001',
  permitNo: 'PTW-20260824-001',      // ⭐ 허가서 매칭 (필수)
  workId: '2026-08-24_5',            // ⭐ 원본 작업 매칭
  date: '2026-08-24',                // ⭐ 실시 날짜
  status: '완료',                    // ⭐ '완료' | '취소'
  workName: '...',
  supervisor: '...',
  createdAt: '...',
  createdBy: '...'
}
```

### 14.4 안전정보제공 (`safetyProvisions`)

```javascript
{
  safeinfoNo: 'SIP-20260824-001',
  submittedCompany: '원준',          // ⭐ 협력사명 (대시보드 매칭)
  submittedBy: '홍길동',             // ⭐ 도급인 담당자 (허가서 매칭)
  status: '발행완료',                // ⭐ '발행완료' | '서명완료' | '반려'
  date: '2026-08-24',                // ⭐ 발행 날짜
  workName: '...',
  location: '포항양극재 1공장',
  createdAt: '...',
  createdBy: '...'
}
```

### 14.5 긴급조치 (`emergencies`)

```javascript
{
  emergencyNo: 'EM-20260824-001',
  type: 'stop',                      // ⭐ 'accident' | 'stop' | 'urgent'
  permitNo: 'PTW-20260824-001',      // ⭐ 관련 허가서 (있는 경우)
  workId: '2026-08-24_5',            // ⭐ 원본 작업
  date: '2026-08-24',                // ⭐ 발생 날짜
  status: '요청',                    // ⭐ '요청' | '조치중' | '완료'
  reasons: ['화재·폭발 위험'],
  requesterName: '홍길동',
  createdAt: '...',
  createdBy: '...'
}
```

---
## 15. 이메일 발송 규약 (EmailJS + 자동화)

### 15.1 확정된 방식

**개발 단계**: EmailJS + 개인 Gmail (월 200통 무료)  
**폴백**: mailto 링크 (기본 동작)  
**자동화 방식**: **방식 C (하이브리드)** — 관리자가 모바일에서 리모트 발송  
**폐기**: Google Apps Script (URL 미설정, no-cors 문제)

### 15.2 EmailJS 설정

- 서비스: https://www.emailjs.com/
- Gmail 계정 연결
- 도메인 화이트리스트 필수
- Template 종류:
  - `sign_request` — 안전정보제공서 서명 요청 (도급→수급)
  - `sign_complete` — 서명 완료 알림 (수급→도급)
  - `resend` — 재발송
  - **`daily_today`** — 오늘 작업 리포트 (신규)
  - **`daily_tomorrow`** — 내일 작업 리스트 (신규)
  - **`urgent_alert`** — 긴급 알림 (신규)

### 15.3 3-way 폴백 코드 패턴

**SDK 로드**:
```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
<script>
  emailjs.init('YOUR_PUBLIC_KEY');
  window.EMAILJS_CONFIG = {
    serviceId: 'service_xxx',
    templates: {
      signRequest: 'template_sign_request',
      signComplete: 'template_sign_complete',
      resend: 'template_resend',
      dailyToday: 'template_daily_today',        // 신규
      dailyTomorrow: 'template_daily_tomorrow',  // 신규
      urgentAlert: 'template_urgent'              // 신규
    }
  };
</script>
```

**발송 함수 표준 패턴**:
```javascript
async function sendEmail(templateType, to, params) {
  const templates = window.EMAILJS_CONFIG.templates;
  const templateId = templates[templateType];
 
  if (!templateId) {
    console.error('알 수 없는 템플릿:', templateType);
    return { ok: false, error: 'Unknown template' };
  }
 
  // 1순위: EmailJS
  if (typeof emailjs !== 'undefined' && window.EMAILJS_CONFIG) {
    try {
      const response = await emailjs.send(
        window.EMAILJS_CONFIG.serviceId,
        templateId,
        { to_email: to, ...params }
      );
      return { ok: true, response };
    } catch (error) {
      console.error('EmailJS 발송 실패:', error);
      // 폴백으로 mailto 시도
    }
  }
 
  // 2순위: mailto (폴백)
  return sendViaMailto(to, params, templateType);
}
```

### 15.4 mailto 폴백 예시

```javascript
function sendViaMailto(to, params, templateType) {
  const subjects = {
    signRequest: '[안전정보제공서] ' + params.safeinfoNo + ' 서명 요청',
    dailyToday: '[POSCO FM] ' + params.date + ' 오늘 작업 리포트',
    dailyTomorrow: '[POSCO FM] ' + params.date + ' 내일 작업 준비 안내',
    urgentAlert: '🚨 [POSCO FM] 긴급 알림 - ' + params.title
  };
 
  const subject = encodeURIComponent(subjects[templateType] || '알림');
  const body = encodeURIComponent(generateEmailBody(templateType, params));
 
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  return { ok: true, method: 'mailto' };
}
```

### 15.5 발송 이력 저장 규약

**모든 발송은 `이메일로그` 컬렉션에 기록**:

```javascript
async function logEmailSent(logData) {
  const log = {
    logId: 'LOG-' + fmtDate(new Date()).replace(/-/g, '') + '-' + getNextSeq(),
    type: logData.type,                    // 'sign_request' | 'daily_today' | ...
    templateId: logData.templateId,
    sentAt: firebase.firestore.FieldValue.serverTimestamp(),
    sentBy: firebase.auth().currentUser?.uid || 'anonymous',
    recipients: logData.recipients,        // [{ email, name, status }]
    totalSent: logData.totalSent,
    totalFailed: logData.totalFailed,
    metadata: logData.metadata,            // 리포트 요약 등
    schemaVersion: 1
  };
 
  await db.collection('이메일로그').add(log);
}
```

### 15.6 발송 실패 처리 규약

**실패 시 재시도 정책**:
```
1차 실패 → 5초 후 재시도
2차 실패 → 30초 후 재시도
3차 실패 → 실패 로그 저장 후 관리자 알림
```

```javascript
async function sendWithRetry(templateType, to, params, maxRetries = 3) {
  const delays = [0, 5000, 30000]; // 0초, 5초, 30초
 
  for (let i = 0; i < maxRetries; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, delays[i]));
   
    const result = await sendEmail(templateType, to, params);
    if (result.ok) return result;
   
    console.warn(`발송 실패 (시도 ${i+1}/${maxRetries}):`, result.error);
  }
 
  // 최종 실패
  await logFailure(templateType, to, params);
  return { ok: false, error: '최대 재시도 초과' };
}
```

### 15.7 보안 & 개인정보

**⚠️ 필수 준수 사항**:
- ✅ EmailJS Public Key는 코드에 노출 가능 (도메인 화이트리스트로 보호)
- ✅ 도메인 화이트리스트 설정 필수
- ✅ 수신 동의 확인 (`users.receiveReports` 활성 여부)
- ✅ 개인정보보호법 준수
- ✅ 발송 이력 6개월 보관 후 자동 삭제

### 15.8 폐기 방식

- ❌ **Google Apps Script + `no-cors`** (성공/실패 판정 불가)
- ❌ 이메일 서버 직접 구축 (관리 부담)
- ❌ 서드파티 대량 발송 서비스 (스팸 위험)

---

## 16. MSDS 데이터 (34종)

### 16.1 카테고리 구성

| 카테고리 | 개수 | 설명 |
|---|---|---|
| **완제품** (`product`) | 4종 | NCMA, NCA, LFP 완제품/반제품 |
| **전구체** (`precursor`) | 4종 | Ni/Co/Mn 수산화물/이산화물 등 |
| **원료** (`material`) | 16종 | 리튬화합물, 금속산화물, 강산염기, 가스, 세라믹, 유기용제 |
| **유틸리티** (`utility`) | 10종 | 접착제, 세척제, 방청제, 미생물제거제 등 |
| **총합** | **34종** | |

### 16.2 데이터 구조

```javascript
{
  id: 'MSDS-001',
  name: 'NCMA (양극활물질)',                        // 표시명 (간결)
  substance: 'Lithium Nickel Manganese Cobalt Oxide', // 물질명
  cas: '182442-95-1',                              // CAS 번호
  msdsNo: 'AA00786-0000000363',                    // MSDS 등록번호 (KOSHA)
  category: 'product'                              // 카테고리
}
```

### 16.3 규약

- ✅ **공급사 정보 제거** (표시명 간결)
- ✅ **동일 CAS+MSDS 번호 중복 제거**
- ✅ **표시명 간단히** (예: "NCMA (양극활물질)")
- ✅ **CAS + MSDS 등록번호로 원본 문서 조회 가능**
- ✅ **상세 유해성/보호구/응급조치는 원본 MSDS 참조** (자체 정리 안 함)

### 16.4 34종 리스트 (요약)

**완제품 (4)**:
- NCMA (양극활물질) - CAS: 182442-95-1
- NCA (양극활물질) - CAS: 177997-13-6
- LFP 완제품
- LFP 반제품

**전구체 (4)**:
- 전구체 (수산화물) - CAS: 189139-63-7
- 전구체 (이산화물) - CAS: 58591-45-0
- 전구체 (Ni/Co/Mn 3종)
- 전구체 (Ni/Co 산화물)

**원료 (16)**:
- 리튬 화합물: 수산화리튬 (LiOH·H₂O), 무수수산화리튬
- 금속 산화물/수산화물: 수산화코발트, 수산화알루미늄, 산화이트륨, 산화지르코늄, 황산코발트, 탄산마그네슘
- 강산/강염기: 수산화나트륨 25%, 붕산
- 가스: 질소, 산소, 천연가스
- 세라믹: Sagger 형A, 형B
- 유기용제: 에탄올 94.5%

**유틸리티 (10)**:
- 가스켓 리무버, 접착제, 경화제, 중화제, 차염소산나트륨, 스케일방지제, 윤활제, 부식방지제, 세척제, 미생물제거제

### 16.5 향후 활용

- **지금**: 안전정보(도급인) HTML에 하드코딩
- **다음**: 다른 앱들도 참조 (수급인용, 위험성평가, TBM)
- **Phase 6**: Firestore `MSDS` 컬렉션으로 이관
- **Phase 7**: 원본 MSDS PDF 링크 추가 (선택)

---

## 17. 공장 안전정보 (2개 사업장)

### 17.1 사업장 구성

| 사업장 | 특징 |
|---|---|
| **포항양극재 1공장** | A동 (1단계) |
| **포항양극재 2공장** | B동 (2-1단계) + C동 (2-2단계) |

### 17.2 데이터 구조

```javascript
{
  '포항양극재 1공장': {
    emergencyContact: '통합운전실 054-240-5191 / 119',
    emergencyExit: '각 건물별 지정 비상구 (안내판 확인)',
    firstAid: '1층 안전관리실, 각 층 승강기 앞 안전보호함 (총 34개소)',
    aedLocations: '1,2 사무동 1층, 품질분석실 입구, A동 1·2층 승강기 앞 (총 11대)',
    emergencyProcedure:
      '1. 최초 목격자는 주변 소화전 발신기 동작, 통합운전실(054-240-5191)에 연락\n' +
      '2. 운전실 근무자는 비상방송(대피, 화재발생, 소화펌프 전개) 실시\n' +
      '3. 관리감독자는 119에 신고 및 계통 보고\n' +
      '4. 자위소방대 투입하여 초기진화 및 유도자 배치\n' +
      '5. 지정된 집결장소로 신속히 대피',
    safetyManagerPhone: '054-240-5131 (안전관리자) / HP 010-3060-0909'
  },
  '포항양극재 2공장': {
    // 동일 (AED 위치만 C동으로 다름)
  }
}
```

### 17.3 자동 채우기 규약

**작업장소 선택 시 자동 채움 필드**:
- 비상연락처
- 비상구 위치
- 구급약품 위치
- AED 위치
- 비상상황 대응 절차 (5단계)
- 안전관리자 연락처

**적용 앱**:
- ✅ 안전정보제공서 (도급인용)
- ⏳ 향후: 위험성평가, TBM

### 17.4 필드 처리

**표시**: 자동 채움된 필드는 `readonly`로 표시 (파란색 배경)
```html
<input class="f-input auto-filled" id="emergency-contact" readonly>
```

**저장**: 자동 채움된 값 그대로 저장 (규약 준수)

### 17.5 향후 확장

- **Phase 6**: Firestore `공장안전정보` 컬렉션으로 이관
- **Phase 7**: 관리자 UI로 공장 정보 편집 기능
- **필요 시**: 추가 사업장 (광양양극재, 포항음극재 등)

---

## 18. 폐기 예정 항목 총정리

### 18.1 localStorage 키

| 폐기 키 | 대체 | 자동 마이그레이션 | 폐기 시점 |
|---|---|---|---|
| `firebasePermits` | `safetyPermits` → Firestore | ⏳ 필요 | v1.1 |
| `safetyInfoDocs` | `safetyProvisions` | ✅ 구현됨 | v1.1 |
| `safetyInfoSigned` | `safetyProvisions.signature` (병합) | ✅ 구현됨 | v1.1 |
| `safetyViolations` | `emergencies` or `inspections` | ⏳ 필요 | v1.1 |
| `riskDatabase` | `riskAssessments` | ✅ 구현됨 | v1.1 |
| `safetyRiskAssessments` | `riskAssessments` | ✅ 구현됨 | v1.1 |
| `safetyStopWork` | `emergencies.type='stop'` | ✅ 구현됨 | v1.1 |
| `tbmLogs` | `safetyTBM` → `TBM` (Firestore) | ✅ 구현됨 | v1.1 |

### 18.2 코드 패턴

| 폐기 | 대체 |
|---|---|
| Claude API 브라우저 직접 호출 | JSA_DB Firestore 조회 |
| Google Apps Script + `no-cors` | EmailJS |
| `sessionStorage.userInfo.role` | Firebase Auth Custom Claims |
| `Math.random()` 시퀀스 | Firestore Transaction |
| `new Date().toISOString()` (UTC) | 로컬 시간 기반 `fmtDate()` |
| `new Event('storage')` | `CustomEvent('app-data-changed')` |
| `w.date + '_' + (originalNo\|\|i)` | `originalNo` 필수 (없으면 skip) |
| `'TBM-' + Date.now()` | Firestore Transaction 시퀀스 (또는 로컬 순차) |
| MSDS 하드코딩 12종 | MSDS 34종 하드코딩 (→ Firestore) |

### 18.3 파일명

| 폐기 | 대체 |
|---|---|
| `_v2_1_.html` | `_v2.html` |
| `_V6_1_.html` | `_V6_.html` |
| `_V7_통합.html` | `_V6_.html` |
| `dashboard_v6.html` | `안전관리플랫폼_대시보드_V6_.html` |
| `안전정보제공서_작성.html` | `안전정보제공서_도급인용.html` |

### 18.4 role 값

| 폐기 | 대체 |
|---|---|
| `'USER'` (대문자) | `'worker'` |
| `'ADMIN'` (대문자) | `'admin'` |
| `'Worker'` (파스칼) | `'worker'` |
| `'Manager'` (파스칼) | `'manager'` |
| `'Admin'` (파스칼) | `'admin'` |

### 18.5 URL 파라미터

| 폐기 | 대체 |
|---|---|
| `?doc=SIP-001` | `?safeinfoNo=SIP-001` |

### 18.6 공장 옵션

| 폐기 | 대체 |
|---|---|
| 5개 옵션 (1공장, 2공장, 광양양극재, 포항음극재, 기타) | **2개 옵션** (포항양극재 1공장, 2공장) |

---

## 19. 개선 완료 현황 (v2.0)

### 19.1 완료된 5개 앱

| # | 파일 | 개선 내용 |
|---|---|---|
| 1 | 포항양극재공장_안전퀴즈.html | localStorage 저장 로직 추가 (`safetyQuizzes`) |
| 2 | 위험성평가_v2.html | 규약 준수 개편 (`riskAssessments`, `RA-` 형식, 감사 필드) |
| 3 | TBM_및_작업중지권_v2.html | 규약 준수 개편 (`safetyTBM`, `TBM-YYYYMMDD-SEQ3`, `emergencies` 통합) |
| 4 | 안전정보제공서_도급인용.html | 대개편 (MSDS 34종, 공장 자동채움, `safetyProvisions`) |
| 5 | 안전정보제공서_수급인용.html | 대개편 (`?safeinfoNo=`, 도급인 서명 표시, 페어링) |

### 19.2 각 앱의 규약 준수 여부

| 앱 | 저장 키 | 자연키 형식 | 감사 필드 | 대시보드 매칭 |
|---|---|---|---|---|
| 안전퀴즈 | ✅ | ✅ | ✅ | ✅ |
| 위험성평가 | ✅ | ✅ | ✅ | ✅ |
| TBM | ✅ | ✅ | ✅ | ✅ |
| 안전정보(도급) | ✅ | ✅ | ✅ | ✅ |
| 안전정보(수급) | ✅ | ✅ | ✅ | ✅ |

### 19.3 남은 작업

- ⏳ **대시보드 P0 버그 수정** (5개 앱 데이터를 실제로 표시)
- ⏳ 파일명 통일 & Firebase Hosting 리다이렉트
- ⏳ Firebase 보안 조치 (데스크톱)
- ⏳ 통합 테스트
- ⏳ Firestore 이관 (Phase 6+)

---

## 20. 관련 문서

| 문서 | 역할 |
|---|---|
| **PROJECT_CONVENTIONS.md** (이 문서) | ⭐ 최우선 규약 |
| PROJECT_HANDOVER.md | 프로젝트 인수인계 (진행 상황) |
| IMPROVEMENT_PLAN.md | 전체 개선 계획 |
| DB_SCHEMA.md | 컬렉션 상세 필드 명세 |
| FIRESTORE_SECURITY_RULES.md | 보안 규칙 코드 |
| DATA_MIGRATION_GUIDE.md | 마이그레이션 절차 |
| JSA_DB_STRUCTURE.md | JSA_DB 상세 구조 |
| docs/attachments/README.md | TBM 별첨 자료 안내 |
---

## 21. 리포트 템플릿 규약

### 21.1 오늘 작업 리포트 템플릿 (`daily_today`)

**발송 시점**: 매일 오전 (관리자가 대시보드에서 클릭)  
**발송 대상**: 안전관리자, 팀장, 오늘 작업 있는 협력사

**EmailJS 파라미터**:
```javascript
{
  to_email: '수신자 이메일',
  to_name: '수신자 이름',
  date: '2026-08-24',                    // YYYY-MM-DD
  day_of_week: '월요일',
  total_works: 12,
  high_risk_count: 3,
  normal_count: 9,
  high_risk_list: '[HTML 형식 목록]',    // 고위험 작업 상세
  normal_list: '[HTML 형식 목록]',       // 일반 작업 상세
  safety_focus: '[HTML 형식 안전 포커스]',
  weekly_summary: '[HTML 형식 지난주 실적]',
  contact_phone: '054-240-5131',
  emergency_phone: '054-240-5191'
}
```

**표준 제목**:
```
[POSCO FM] {date} 오늘 작업 리포트
```

**표준 본문 구조**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━
📅 날짜: {date} ({day_of_week})
📋 총 작업: {total_works}건
🔴 고위험: {high_risk_count}건 ⚠️
🟢 일반: {normal_count}건
━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 고위험 작업 (특별 관리 필요)

{high_risk_list}

━━━━━━━━━━━━━━━━━━━━━━━━━

📋 일반 작업

{normal_list}

━━━━━━━━━━━━━━━━━━━━━━━━━

📌 오늘의 안전 포커스

{safety_focus}

━━━━━━━━━━━━━━━━━━━━━━━━━

📊 지난 주 실적

{weekly_summary}

━━━━━━━━━━━━━━━━━━━━━━━━━

📱 문의 사항
안전관리자: {contact_phone}
통합운전실: {emergency_phone}

포스코퓨처엠 안전관리팀
```

---

### 21.2 내일 작업 리스트 템플릿 (`daily_tomorrow`)

**발송 시점**: 매일 오후 (관리자가 퇴근 전 클릭)  
**발송 대상**: 안전관리자, 내일 작업 있는 협력사

**EmailJS 파라미터**:
```javascript
{
  to_email: '수신자 이메일',
  to_name: '수신자 이름',
  target_date: '2026-08-25',              // 내일 날짜
  target_day: '화요일',
  total_works: 8,
  contractor_lists: '[HTML 형식 협력사별]',  // 협력사별 준비 사항
  employer_todo: '[HTML 형식 도급인 TODO]',   // 도급인 준비 사항
  contact_phone: '054-240-5131'
}
```

**표준 제목**:
```
[POSCO FM] {target_date} 내일 작업 준비 안내
```

**표준 본문 구조**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━
📅 예정일: {target_date} ({target_day})
📋 예정 작업: {total_works}건
━━━━━━━━━━━━━━━━━━━━━━━━━

🏢 협력사별 준비 사항

{contractor_lists}

━━━━━━━━━━━━━━━━━━━━━━━━━

📌 도급인 준비 사항

{employer_todo}

━━━━━━━━━━━━━━━━━━━━━━━━━

📱 문의: {contact_phone}

포스코퓨처엠 안전관리팀
```

---

### 21.3 긴급 알림 템플릿 (`urgent_alert`)

**발송 시점**: 사고/작업중지 발생 시 즉시  
**발송 대상**: 전체 관리자 + 팀장

**EmailJS 파라미터**:
```javascript
{
  to_email: '수신자 이메일',
  to_name: '수신자 이름',
  alert_type: 'accident' | 'work_stop' | 'other',
  title: '작업중지 발생',
  occurred_at: '2026-08-24 14:30',
  location: '2공장 3라인',
  description: '가스 누출 감지',
  reporter_name: '홍길동',
  reporter_phone: '010-1234-5678',
  action_required: '즉시 현장 확인 필요',
  dashboard_url: 'https://safety-management-platfo-5f413.web.app/...'
}
```

**표준 제목**:
```
🚨 [POSCO FM] 긴급 알림 - {title}
```

**표준 본문 구조**:
```
🚨🚨🚨 긴급 알림 🚨🚨🚨

━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 발생 상황
{title}

📅 발생 시각: {occurred_at}
📍 발생 위치: {location}

📝 상세 내용
{description}

━━━━━━━━━━━━━━━━━━━━━━━━━

👤 신고자
- 이름: {reporter_name}
- 연락처: {reporter_phone}

━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 즉시 조치 필요
{action_required}

🔗 대시보드 확인:
{dashboard_url}

━━━━━━━━━━━━━━━━━━━━━━━━━

📱 긴급 연락처
- 통합운전실: 054-240-5191
- 안전관리자: 054-240-5131
- 119 (화재/응급)

포스코퓨처엠 안전관리팀
```

---

### 21.4 리포트 생성 규약

**리포트 생성 함수는 반드시 이 형식으로**:

```javascript
async function generateDailyTodayReport(targetDate) {
  // 1. 오늘 작업 조회
  const works = await getWorksByDate(targetDate);
 
  // 2. 고위험/일반 분리
  const highRisk = works.filter(w => w.risk === '고위험');
  const normal = works.filter(w => w.risk !== '고위험');
 
  // 3. HTML 리스트 생성
  const highRiskList = generateWorkListHtml(highRisk, 'high');
  const normalList = generateWorkListHtml(normal, 'normal');
 
  // 4. 안전 포커스 생성 (선택 사항)
  const safetyFocus = generateSafetyFocus(works);
 
  // 5. 지난 주 실적
  const weeklySummary = await generateWeeklySummary();
 
  return {
    date: targetDate,
    day_of_week: getDayOfWeek(targetDate),
    total_works: works.length,
    high_risk_count: highRisk.length,
    normal_count: normal.length,
    high_risk_list: highRiskList,
    normal_list: normalList,
    safety_focus: safetyFocus,
    weekly_summary: weeklySummary,
    contact_phone: '054-240-5131',
    emergency_phone: '054-240-5191'
  };
}
```

### 21.5 리포트 표준 규약

**모든 리포트 공통**:
- ✅ 발신자 명확 표시 (`포스코퓨처엠 안전관리팀`)
- ✅ 문의 연락처 포함
- ✅ 데이터 근거 표시 (총 작업 수, 통계)
- ✅ 스팸 방지 (자연스러운 제목/본문)
- ✅ 모바일 친화적 (짧은 줄바꿈)

**금지 사항**:
- ❌ 개인정보 과다 노출 (전화번호는 담당자만)
- ❌ 첨부파일 대량 발송
- ❌ 발송자 위장

---

## 22. 수신자 관리 규약

### 22.1 users 컬렉션 확장

기존 `users` 컬렉션에 **수신 설정** 필드 추가:

```javascript
{
  uid: 'xxx',
  email: 'user@posco.com',
  role: 'manager',
  displayName: '홍길동',
  department: '안전환경그룹',
 
  // ⭐ 신규: 리포트 수신 설정
  receiveReports: {
    dailyToday: true,       // 오늘 리포트 수신 여부
    dailyTomorrow: true,    // 내일 리스트 수신 여부
    urgent: true,           // 긴급 알림 수신 여부
    weekly: false,          // 주간 리포트 수신 여부
    lastUpdated: Timestamp  // 설정 마지막 변경
  },
 
  // 감사 필드 (기존)
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 22.2 협력사관리 컬렉션 확장

기존 `협력사관리` 컬렉션에 **담당자 정보** 필드 추가:

```javascript
{
  contractorId: 'wonjun',
  contractorName: '원준',
  contractorNameFull: '원준산업',
  contractorType: 'contract',
  status: 'active',
 
  // ⭐ 신규/확장: 담당자 정보
  contactInfo: {
    email: 'wonjun@example.com',
    manager: '홍길동',
    phone: '010-1234-5678',
    receiveDailyReport: true,      // 오늘/내일 리포트 수신
    receiveUrgent: true,            // 긴급 알림 수신
    lastVerified: Timestamp        // 정보 검증 시각
  },
 
  // 통계 (기존)
  statistics: {
    totalWorks: 0,
    violations: 0,
    accidents: 0,
    tbmRate: 0
  }
}
```

### 22.3 수신자 조회 표준 로직

**오늘 리포트 수신자 조회**:
```javascript
async function getRecipientsForDailyToday() {
  const recipients = [];
 
  // 1. 활성 users 조회 (dailyToday=true)
  const usersSnap = await db.collection('users')
    .where('receiveReports.dailyToday', '==', true)
    .where('status', '==', '활성')
    .get();
 
  usersSnap.forEach(doc => {
    const user = doc.data();
    recipients.push({
      email: user.email,
      name: user.displayName,
      role: user.role,
      source: 'users'
    });
  });
 
  // 2. 오늘 작업 있는 협력사 담당자
  const todayWorks = await getWorksByDate(fmtDate(new Date()));
  const contractorIds = [...new Set(todayWorks.map(w => w.company))];
 
  for (const cid of contractorIds) {
    const contractorDoc = await db.collection('협력사관리').doc(cid).get();
    if (contractorDoc.exists) {
      const c = contractorDoc.data();
      if (c.contactInfo?.receiveDailyReport && c.contactInfo?.email) {
        recipients.push({
          email: c.contactInfo.email,
          name: c.contactInfo.manager,
          role: 'contractor',
          contractorName: c.contractorName,
          source: 'contractor'
        });
      }
    }
  }
 
  // 3. 중복 제거 (이메일 기준)
  const uniqueRecipients = [];
  const seenEmails = new Set();
  for (const r of recipients) {
    if (!seenEmails.has(r.email)) {
      seenEmails.add(r.email);
      uniqueRecipients.push(r);
    }
  }
 
  return uniqueRecipients;
}
```

### 22.4 수신 동의 관리

**옵트인 원칙**:
- ✅ 기본값: 모든 알림 **비활성** (`false`)
- ✅ 사용자가 명시적으로 활성화
- ✅ 언제든 옵트아웃 가능

**동의 기록**:
```javascript
{
  uid: 'xxx',
  receiveReports: {
    dailyToday: true,
    dailyToday_consentedAt: Timestamp,  // 동의 시각
    dailyToday_consentedBy: 'self',      // 'self' | 'admin'
    // ...
  }
}
```

### 22.5 발송 전 검증

**모든 발송 전 필수 검증**:
```javascript
async function validateRecipient(recipient, type) {
  // 1. 이메일 형식
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) {
    return { valid: false, reason: 'invalid_email' };
  }
 
  // 2. 수신 동의
  if (recipient.source === 'users') {
    const user = await getUser(recipient.uid);
    if (!user.receiveReports?.[type]) {
      return { valid: false, reason: 'no_consent' };
    }
  }
 
  // 3. 발송 이력 (스팸 방지)
  const recentLogs = await getRecentLogs(recipient.email, type, 60); // 60분 이내
  if (recentLogs.length > 0) {
    return { valid: false, reason: 'too_frequent' };
  }
 
  return { valid: true };
}
```

---

## 23. 자동화 컬렉션 규약

### 23.1 이메일로그 컬렉션

**용도**: 모든 이메일 발송 이력 기록

**컬렉션명**: `이메일로그`  
**문서 ID**: `LOG-{YYYYMMDD}-{SEQ4}` (예: `LOG-20260824-0001`)

**스키마**:
```javascript
{
  logId: 'LOG-20260824-0001',
  type: 'daily_today',              // 발송 종류
  templateId: 'template_xxx',        // EmailJS 템플릿 ID
 
  // 발송 정보
  sentAt: Timestamp,
  sentBy: 'admin_uid',              // 발송자 (관리자)
  sentByName: '홍길동',
 
  // 수신자 (배열)
  recipients: [
    {
      email: 'user1@posco.com',
      name: '김철수',
      status: 'sent',                // 'sent' | 'failed' | 'pending'
      sentAt: Timestamp,
      error: null                    // 실패 시 에러 메시지
    },
    {
      email: 'wonjun@example.com',
      name: '박영희',
      status: 'failed',
      error: 'Invalid email format'
    }
  ],
 
  // 통계
  totalRecipients: 15,
  totalSent: 14,
  totalFailed: 1,
 
  // 리포트 메타데이터
  reportSummary: {
    targetDate: '2026-08-24',
    totalWorks: 12,
    highRiskWorks: 3,
    contractorCount: 5
  },
 
  // 감사 필드
  createdAt: Timestamp,
  schemaVersion: 1
}
```

### 23.2 발송 상태 코드

| 코드 | 의미 |
|---|---|
| `sent` | 발송 성공 |
| `failed` | 발송 실패 (최대 재시도 초과) |
| `pending` | 발송 대기 중 |
| `retry` | 재시도 대기 |
| `cancelled` | 취소됨 (사용자가 중단) |

### 23.3 데이터 보존 기간

**정책**:
- ✅ **이메일로그**: 6개월 보관 후 자동 삭제
- ✅ **감사용 요약**: 별도 컬렉션에 통계만 영구 보관
- ✅ **긴급 알림 로그**: 1년 보관 (사고 대응 감사)

**자동 삭제 로직** (관리자가 수동 실행 or 스크립트):
```javascript
async function cleanupOldLogs() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
 
  const oldLogs = await db.collection('이메일로그')
    .where('sentAt', '<', sixMonthsAgo)
    .where('type', '!=', 'urgent_alert')  // 긴급은 1년 보관
    .get();
 
  const batch = db.batch();
  oldLogs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
 
  console.log(`✅ ${oldLogs.size}건의 오래된 로그 삭제됨`);
}
```

### 23.4 리포트 통계 컬렉션 (선택)

**컬렉션명**: `리포트통계`  
**문서 ID**: `{YYYY-MM}` (예: `2026-08`)

**스키마**:
```javascript
{
  month: '2026-08',
  totalReports: {
    dailyToday: 30,        // 이번 달 발송 횟수
    dailyTomorrow: 30,
    urgent: 5
  },
  totalRecipients: 1250,   // 총 수신자 (중복 포함)
  uniqueRecipients: 45,    // 고유 수신자
  successRate: 0.98,       // 성공률
  avgResponseTime: 3.2,    // 평균 응답 시간 (초)
 
  updatedAt: Timestamp
}
```

---



## 📅 변경 이력

| 버전 | 날짜 | 변경 사항 |
|---|---|---|
| 1.0 | 2025-11-24 | 초기 규약 확정 |
| **2.0** | **2026-08-24** | **5개 앱 개선 완료 반영 (MSDS 34종, 공장 2개, 도급/수급 페어링)** |

---

## 🔗 프로젝트 정보

| 항목 | 값 |
|---|---|
| **프로젝트 ID** | `safety-management-platfo-5f413` |
| **배포 URL** | https://safety-management-platfo-5f413.web.app |
| **GitHub** | https://github.com/safety99999/safety-management-platform |
| **Firebase Console** | https://console.firebase.google.com/project/safety-management-platfo-5f413 |

---

**⚠️ 이 문서와 상충하는 모든 코드·문서는 이 문서에 맞춰 수정해야 합니다.**

**끝.**
