# 📁 외부 파일 저장 가이드 

**POSCO FM 포항양극재공장 안전관리 플랫폼**

프로젝트에서 관리하는 HTML 외의 파일들을 저장·관리하는 방법을 정리한 가이드입니다.

**작성일**: 2026-08-24  
**대상**: 모바일/데스크톱 개발 환경 모두

---

## 📋 관리 대상 파일 목록

### 우선순위 A: 지금 저장 필요
| # | 파일 | 위치 | 용도 |
|---|---|---|---|
| 1 | `PROJECT_HANDOVER.md` | `docs/` | 프로젝트 인수인계 |
| 2 | `PROJECT_CONVENTIONS.md` | `docs/` | 규약 문서 (최종본) |
| 3 | `FILE_STORAGE_GUIDE.md` | `docs/` | 이 문서 |

### 우선순위 B: 다음 세션에서 저장
| # | 파일 | 위치 | 용도 |
|---|---|---|---|
| 4 | `firebase.json` | 루트 | Hosting 리다이렉트 |
| 5 | `data/msds_database.js` | `data/` | MSDS 34종 (JS 파일) |
| 6 | `data/factory_safety_info.js` | `data/` | 공장 비상정보 (JS 파일) |
| 7 | `docs/attachments/README.md` | `docs/attachments/` | 별첨 자료 안내 |

### 우선순위 C: Phase 6에서 저장 (Firestore 이관 시)
| # | 파일 | 위치 | 용도 |
|---|---|---|---|
| 8 | `docs/attachments/emergency_response_diagram.png` | `docs/attachments/` | 비상상황체계도 이미지 |
| 9 | `docs/attachments/equipment_checklist_v1.png` | `docs/attachments/` | 작업장비 체크리스트 |
| 10 | `docs/attachments/heat_illness_selfcheck_v1.png` | `docs/attachments/` | 온열질환 자율진단 |

---

## 🎯 저장 방법 (모바일 우선)

### 방법 A: **GitHub 웹 편집기** ⭐ 강력 추천

**장점**:
- ✅ 모바일/데스크톱 모두 사용 가능
- ✅ Fasoo DRM 영향 없음
- ✅ 파일 확장자 문제 없음
- ✅ 자동으로 폴더 생성
- ✅ UTF-8 인코딩 자동
- ✅ 저장 즉시 커밋

**단점**:
- ⚠️ 인터넷 연결 필요
- ⚠️ GitHub 계정 필요

### 방법 B: 로컬 저장 후 커밋 (데스크톱)

**장점**:
- ✅ 여러 파일 일괄 처리
- ✅ VS Code 등 편집 도구 활용

**단점**:
- ⚠️ Windows 메모장은 파일 확장자 실수 가능
- ⚠️ Fasoo DRM 환경에서 문제 발생 가능

---

## 📱 방법 A: GitHub 웹 편집기 사용법

### Step 1: GitHub 저장소 접속

**URL**:
```
https://github.com/safety99999/safety-management-platform
```

### Step 2: 새 파일 생성

#### 신규 파일 만들기
1. 저장소 메인에서 **"Add file"** 버튼 클릭
2. **"Create new file"** 선택

#### 폴더와 함께 생성
파일명 입력란에 **경로 포함**해서 입력:
```
docs/PROJECT_HANDOVER.md
```
👉 `/`를 넣으면 자동으로 `docs` 폴더 생성됨!

### Step 3: 내용 입력

내용 영역에 붙여넣기 (Ctrl+V 또는 모바일 붙여넣기)

### Step 4: 저장 (Commit)

페이지 하단으로 스크롤:

1. **Commit message** 입력 (예: `docs: PROJECT_HANDOVER.md 최초 작성`)
2. **Extended description** (선택)
3. **"Commit new file"** 클릭

---

### Step 5: 기존 파일 편집

이미 있는 파일 수정 시:

1. 저장소에서 해당 파일 클릭
2. 우측 상단 **연필 아이콘 (✏️)** 클릭
3. 내용 수정
4. 하단 **"Commit changes"** 클릭

---

## 💻 방법 B: 로컬 저장 (데스크톱)

### Windows 메모장 사용 시 ⚠️ 주의사항

**파일 형식을 반드시 "모든 파일"로 선택하세요!**

1. **파일 → 다른 이름으로 저장**
2. 창 하단의 **파일 형식** 드롭다운:
   - ❌ "텍스트 문서 (*.txt)" — 잘못됨!
   - ✅ **"모든 파일 (*.*)"** — 이걸로 선택!
3. **파일 이름**: `msds_database.js` (확장자 포함)
4. **인코딩**: **UTF-8**
5. 저장

**만약 실수로 `.txt`로 저장된 경우**:
- 파일 이름을 우클릭 → 이름 변경
- `.txt` 부분을 `.js` 등으로 변경
- 확장자 변경 경고 시 "예" 클릭

### VS Code / Notepad++ 사용 시 (권장)

1. 새 파일 (Ctrl+N)
2. 내용 붙여넣기
3. **파일 → 저장 (Ctrl+S)**
4. 파일명 입력: `msds_database.js` (자동 인식)
5. 인코딩 확인: UTF-8

### Fasoo DRM 환경 대응

**증상**:
- 파일 저장 시 이상한 이름으로 저장됨 (예: `script src=datamsds_database.jsscri.HTML`)
- 파일이 암호화됨
- HTML로 잘못 저장됨

**해결책**:
1. ⭐ **GitHub 웹 편집기 사용** (방법 A) - 가장 안전
2. Fasoo DRM 영향 없는 폴더에 저장 (외부 저장소, USB 등)
3. 이메일로 자신에게 보낸 후 다운로드
4. 관리자에게 예외 처리 요청

---

## 🗂️ 폴더 구조 설정

### 최종 목표 구조

```
safety-management-platform/
├── index.html
├── 안전관리플랫폼_대시보드_V6_.html
├── 안전작업허가서_v2.html
├── TBM_및_작업중지권_v2.html
├── 위험성평가_v2.html
├── 포항양극재공장_안전퀴즈.html
├── 안전정보제공서_도급인용.html
├── 안전정보제공서_수급인용.html
├── firestore_upload.html
├── firebase-config.js
├── firebase.json                       ⭐ 신규 (Hosting 설정)
│
├── data/                               ⭐ 신규 폴더
│   ├── msds_database.js               ⭐ MSDS 34종
│   ├── factory_safety_info.js         ⭐ 공장 비상정보
│   └── jsa_db_data.json               (기존)
│
└── docs/
    ├── PROJECT_HANDOVER.md            ⭐ 신규
    ├── PROJECT_CONVENTIONS.md         ⭐ 신규 (v2.0)
    ├── FILE_STORAGE_GUIDE.md          ⭐ 신규 (이 문서)
    ├── IMPROVEMENT_PLAN.md            (기존)
    ├── DB_SCHEMA.md                   (기존)
    ├── FIRESTORE_SECURITY_RULES.md    (기존)
    ├── DATA_MIGRATION_GUIDE.md        (기존)
    ├── JSA_DB_STRUCTURE.md            (기존)
    ├── COMPLETE_PROJECT_GUIDE.md      (기존)
    │
    └── attachments/                    ⭐ 신규 폴더
        ├── README.md                   ⭐ 별첨 자료 안내
        ├── emergency_response_diagram.png       (비상상황체계도)
        ├── equipment_checklist_v1.png           (작업장비 체크리스트)
        └── heat_illness_selfcheck_v1.png        (온열질환 자율진단)
```

### 폴더 생성 방법 (GitHub 웹)

**한 번에 폴더 + 파일 만들기**:
1. Create new file 클릭
2. 파일명 입력: `data/msds_database.js`
   - `data/`를 입력하면 자동으로 폴더 생성됨
3. 내용 입력
4. Commit

**폴더만 먼저 만들기 (빈 폴더 방지용)**:
GitHub는 빈 폴더를 지원하지 않으므로, **`.gitkeep`** 파일로 시작:
1. 파일명: `data/.gitkeep`
2. 내용: (비워둠)
3. Commit
4. 나중에 진짜 파일 추가

---

## 📄 파일별 저장 상세 가이드

### 파일 1-3: 마크다운 문서 (PROJECT_HANDOVER, CONVENTIONS, FILE_STORAGE_GUIDE)

**형식**: 마크다운 (`.md`)  
**인코딩**: UTF-8  
**저장 위치**: `docs/`

**GitHub 웹으로 저장**:
```
1. Add file → Create new file
2. 파일명: docs/PROJECT_HANDOVER.md
3. 내용 붙여넣기 (파트 1~3 조합)
4. Commit message: "docs: PROJECT_HANDOVER.md 최초 작성"
5. Commit new file
```

**주의사항**:
- 마크다운 코드 블록(```) 안의 내용도 정확히 유지
- 한글 파일명이 아닌 영문 파일명 사용
- 확장자는 반드시 `.md`

---

### 파일 4: `firebase.json` (Hosting 리다이렉트)

**형식**: JSON  
**저장 위치**: 루트 (프로젝트 최상위)  
**이미 있을 수 있음**: 있으면 기존 내용에 `redirects` 배열 추가

**기존 파일 확인 방법**:
1. GitHub 저장소 메인 페이지
2. `firebase.json` 파일이 이미 있는지 확인
3. 있으면 편집, 없으면 신규 생성

**전체 내용 예시**:
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

**주의사항**:
- JSON 문법 오류 조심 (콤마, 중괄호)
- `"type": 301` — 영구 리다이렉트
- 배포 후 캐시 갱신 시간 필요 (10~30분)

---

### 파일 5-6: `data/*.js` (MSDS, 공장정보)

**형식**: JavaScript (`.js`)  
**저장 위치**: `data/`  
**⚠️ 중요**: 파일 확장자가 반드시 `.js`

**저장 순서**:
1. **GitHub 웹 편집기**에서 신규 생성
2. 파일명: `data/msds_database.js`
3. 내용 붙여넣기 (파트 1 + 파트 2 조합)
4. Commit

**Fasoo DRM 환경 주의**:
- 로컬 메모장 저장 시 `.HTML`로 잘못 저장될 수 있음
- **반드시 GitHub 웹 편집기 사용 권장**

**사용 방법 (각 HTML에서)**:
```html
<head>
  <!-- 기존 태그들 -->
  <script src="data/msds_database.js"></script>
  <script src="data/factory_safety_info.js"></script>
</head>

<script>
  var MSDS_LIST = window.MSDS_DATABASE.items;
  var FACTORY_INFO = window.FACTORY_SAFETY_INFO;
</script>
```

---
### 파일 7: `docs/attachments/README.md` (별첨 자료 안내)

**형식**: 마크다운 (`.md`)  
**저장 위치**: `docs/attachments/README.md`

**용도**:
- TBM 별첨 자료 3종의 상세 안내
- Firestore 이관 계획 (Phase 6~7)

**저장 방법**:
1. GitHub 웹 편집기
2. `docs/attachments/README.md` 생성
3. 별첨 자료 상세 내용 (이전 세션에서 작성 완료된 내용)

**참고**: 이미 이전 세션에서 내용 작성됨. 별도 저장 필요.

---

### 파일 8-10: 별첨 이미지 파일 (Phase 6~7)

**형식**: PNG 이미지  
**저장 위치**: `docs/attachments/`

**파일 목록**:
- `emergency_response_diagram.png` (비상상황체계도)
- `equipment_checklist_v1.png` (작업장비 체크리스트)
- `heat_illness_selfcheck_v1.png` (온열질환 자율진단)

**저장 방법 (GitHub 웹)**:
1. GitHub 저장소 → `docs/attachments/` 폴더 진입
2. **"Add file"** → **"Upload files"** 클릭
3. 이미지 파일 여러 개 동시 드래그 앤 드롭
4. Commit message: `docs: TBM 별첨 자료 이미지 3종 추가`
5. **"Commit changes"** 클릭

**주의사항**:
- 파일 크기 100MB 이하 (GitHub 제한)
- 각 이미지 파일명 정확히 지정
- 이미지 압축 필요 시 [TinyPNG](https://tinypng.com/) 활용

**모바일에서 이미지 업로드**:
- GitHub 모바일 앱은 이미지 업로드 지원 안 함
- **모바일 브라우저**로 GitHub 접속 → 데스크톱 뷰
- 또는 데스크톱에서 나중에 진행

---

### 파일 추가: JSA_DB 관련 (Phase 6 이후)

#### `data/jsa_database.json` (JSA_DB 마스터 데이터)

**형식**: JSON  
**저장 위치**: `data/`  
**용도**: 위험성평가 시 유사 작업 검색 (98개 JSA 문서)

**저장 방법**:
1. Excel 데이터를 JSON으로 변환 (다음 세션에서 진행)
2. GitHub 웹 편집기로 저장
3. 파일명: `data/jsa_database.json`

**변환 예시**:
```javascript
{
  "version": "1.0",
  "lastUpdated": "2026-08-24",
  "source": "위험성평가 마스터 리스트",
  "totalCount": 98,
  "items": [
    {
      "jsaId": "JSA-20260821-001-01",
      "workType": "정비",
      "workTypeDetail": "히터 교체",
      "workName": "3라인 예비소성로 2~5존 수직히터 교체",
      "stageNo": 4,
      "stageName": "에너지 차단",
      "equipment": ["수공구", "계측기"],
      "materials": ["전기"],
      "hazards": [{
        "originalHazard": "히터 교체 작업 중 감전 위험",
        "accidentType": "감전",
        "scenario": "전원 차단·확인 미흡...",
        "severity": 4,
        "probability": 2,
        "riskScore": 8
      }],
      "currentMeasures": ["전원 차단 및 ILS 실시 후 작업"],
      "standardMeasures": ["ILS/LOTO 실시", "무전압 확인", ...],
      "controlAdequacy": "○",
      "note": "ILS Point 확인 필요"
    }
  ]
}
```

#### `firestore_upload.html` (JSA_DB 업로드 도구)

**형식**: HTML  
**저장 위치**: 루트  
**용도**: JSON 파일을 Firestore `JSA_DB` 컬렉션으로 업로드

**참고**:
- 기존에 만들어진 파일이 있을 수 있음 (통합 가이드 참조)
- 없으면 Phase 6에서 신규 생성

---

## 🔧 자주 발생하는 저장 문제

### 문제 1: **파일이 HTML로 저장됨** ⚠️

**증상**:
- 파일명: `script src=datamsds_database.jsscri.HTML`
- 브라우저에서 이상한 텍스트 표시
- Fasoo DRM 암호화 메시지

**원인**:
- Windows 메모장이 자동으로 `.txt` 또는 `.html` 확장자 추가
- Fasoo DRM 시스템이 파일 저장 방해

**해결책**:
1. ⭐ **GitHub 웹 편집기 사용** (가장 안전)
2. VS Code나 Notepad++ 사용
3. 파일 형식을 반드시 **"모든 파일 (*.*)"** 로 선택

---

### 문제 2: **Console에 'Unsafe attempt to load URL' 경고**

**증상**:
```
Unsafe attempt to load URL file:///C:/...
from frame with URL file:///C:/...
'file:' URLs are treated as unique security origins.
```

**원인**:
- 브라우저가 로컬 파일(`file://`) 실행 시 파일 간 이동 차단
- 보안 정책상 정상 동작

**해결책**:
- ⭐ **무시해도 됨** (개발 단계에서는 문제없음)
- Firebase Hosting 배포 후 자동 해결
- 저장 기능에는 영향 없음

---

### 문제 3: **`allow pasting` 경고**

**증상**:
```
Don't paste code into the DevTools Console
that you don't understand or haven't reviewed yourself.
```

**해결책**:
1. Console에 `allow pasting` 입력 후 Enter
2. 이후 정상 붙여넣기 가능
3. **해당 탭 세션 동안만 유효** (탭 닫으면 다시 필요)

---

### 문제 4: **한글 파일명 URL 인코딩**

**증상**:
```
URL: /%EC%95%88%EC%A0%84%EC%A0%95%EB%B3%B4...
```

**원인**:
- 한글 파일명은 URL에서 자동 인코딩됨
- 정상 동작이지만 URL이 길어짐

**해결책**:
- 무시 (기능상 문제 없음)
- 향후 영문 파일명으로 변경 고려 (선택)

---

### 문제 5: **GitHub 커밋 실패**

**증상**:
- "Commit failed" 오류
- 파일이 저장 안 됨

**원인**:
- 인터넷 연결 문제
- 브라우저 세션 만료
- GitHub 서버 문제

**해결책**:
1. 새로고침 후 다시 시도
2. GitHub 로그인 상태 확인
3. 다른 브라우저 사용
4. GitHub 상태 페이지 확인: https://www.githubstatus.com/

---

### 문제 6: **파일 크기 초과**

**증상**:
- "File too large" 오류 (100MB 초과)

**해결책**:
1. 이미지 압축: [TinyPNG](https://tinypng.com/)
2. Git LFS 사용 (대용량 파일 관리)
3. 파일 분할

---

## ✅ 저장 완료 체크리스트

### 우선순위 A (지금 세션 완료)
- [ ] `docs/PROJECT_HANDOVER.md` 저장
- [ ] `docs/PROJECT_CONVENTIONS.md` v2.0 저장
- [ ] `docs/FILE_STORAGE_GUIDE.md` (이 문서) 저장

### 우선순위 B (다음 세션)
- [ ] `firebase.json` 리다이렉트 설정
- [ ] `data/msds_database.js` (또는 HTML에 하드코딩 유지)
- [ ] `data/factory_safety_info.js`
- [ ] `docs/attachments/README.md`

### 우선순위 C (Phase 6+)
- [ ] `docs/attachments/*.png` (이미지 3종)
- [ ] `data/jsa_database.json` (JSA_DB 마스터)
- [ ] `firestore_upload.html`

---

## 📊 최종 파일 목록

### 지금 필요한 것 (3개 문서)
| 파일 | 위치 | 우선순위 |
|---|---|---|
| PROJECT_HANDOVER.md | `docs/` | ⭐⭐⭐ |
| PROJECT_CONVENTIONS.md | `docs/` | ⭐⭐⭐ |
| FILE_STORAGE_GUIDE.md | `docs/` | ⭐⭐⭐ |

### 나중 세션에서 진행 (7개)
| 파일 | 위치 | 시점 |
|---|---|---|
| firebase.json | 루트 | 파일명 통일 시 |
| data/msds_database.js | `data/` | 선택 (지금은 HTML 하드코딩) |
| data/factory_safety_info.js | `data/` | 선택 |
| docs/attachments/README.md | `docs/attachments/` | 별첨 관리 시 |
| docs/attachments/*.png (3개) | `docs/attachments/` | Phase 6 |
| data/jsa_database.json | `data/` | Phase 6 |
| firestore_upload.html | 루트 | Phase 6 |

---

## 🎯 이 가이드 활용 시나리오

### 새 세션 시작 시
1. 이 가이드 확인
2. GitHub에 접속
3. 필요한 파일 순서대로 저장

### 파일 저장 실패 시
1. "자주 발생하는 저장 문제" 섹션 확인
2. 해당 문제 해결책 적용
3. 재시도

### Phase 6 진행 시 (Firestore 이관)
1. `data/jsa_database.json` 준비
2. `firestore_upload.html`로 업로드
3. 각 앱에서 Firestore 조회로 전환

---

## 📅 변경 이력

| 버전 | 날짜 | 변경 사항 |
|---|---|---|
| 1.0 | 2026-08-24 | 최초 작성 (외부 파일 저장 가이드) |

---

---

**끝.**

이 가이드를 활용하여 프로젝트 파일을 안전하고 체계적으로 관리하세요! 📁

