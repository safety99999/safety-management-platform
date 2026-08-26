# Firestore DB 스키마 설계서

문서명: DB_SCHEMA.md  
버전: 2.0  
상태: 초안 검토  
작성 기준일: 2026-08-27  
적용 대상: POSCO FM 포항양극재공장 안전관리 플랫폼  
최종 확정자: 현업 담당자 및 안전보건 담당자

---

## 1. 문서 목적

이 문서는 안전관리 플랫폼의 localStorage 및 Firestore 데이터 구조를 정의한다.

주요 목적은 다음과 같다.

- 앱별 필드명 통일
- 문서 간 참조관계 통일
- 종이 안전서식의 필수항목 보존
- 안전정보제공서부터 작업완료까지 업무 흐름 연결
- JSA_DB 기반 위험성평가 지원
- 고위험작업 사전승인과 작업 중 점검
- 허가 전 ILS 완료 확인
- 작업 종료 시 ILS 해제 완료 확인
- 안전퀴즈 합격자 출입 검증
- TBM과 작업중지권 분리
- 감사·변경·승인 이력 보존
- 향후 Firestore 이관 지원

이 문서의 스키마는 최종 구현 전 현행 코드, 사내기준, 보안정책 및 개인정보 처리기준과 비교하여 확정한다.

---

## 2. 적용 우선순위

문서 간 내용이 충돌할 경우 다음 우선순위를 적용한다.

1. PROJECT_CONVENTIONS.md
2. HIGH_RISK_WORK_POLICY.md
3. PAPER_FORM_DIGITAL_MAPPING.md
4. JSA_DB_STRUCTURE.md
5. JSA_DB_PROMPT.md
6. DB_SCHEMA.md
7. PROJECT_HANDOVER.md
8. 기타 참고문서

다만 실제 법령과 최신 사내기준은 프로젝트 문서보다 우선하며 담당부서의 확인을 거쳐 반영한다.

---

## 3. 데이터 저장 단계

### 3.1 개발 단계

개발·시험 단계에서는 다음 저장소를 사용한다.

| 데이터 | localStorage 키 |
|---|---|
| 작업 | safetyDatabase.workHistory |
| 안전정보제공 | safetyProvisions |
| 안전퀴즈 | safetyQuizzes |
| 위험성평가 | riskAssessments |
| 작업허가 | safetyPermits |
| TBM | safetyTBM |
| 작업중지·긴급조치 | emergencies |
| 작업 중 점검 | inspections |
| JSA_DB 캐시 | jsa_database |
| JSA_DB 캐시 시각 | jsa_database_at |

localStorage는 개발 및 기능시험 용도이다.

다음 자료의 정식 장기 보존수단으로 사용하지 않는다.

- 안전작업허가 기록
- 승인 기록
- 서명
- 산소·유해가스 측정기록
- 작업중지 및 재개 기록
- 고위험작업 점검기록
- 개인정보
- 건강정보

### 3.2 정식 운영 단계

정식 운영 단계에서는 Firestore 컬렉션을 사용한다.

Firebase Spark 무료 플랜을 유지하며 Cloud Functions는 사용하지 않는다.

클라이언트 직접 저장이 필요한 경우 Firestore Security Rules와 Firebase Auth를 통해 권한을 제한한다.

---

## 4. 공통 식별번호

| 데이터 | 필드 | 형식 예시 |
|---|---|---|
| 작업 | workId | 2026-08-27_5 |
| 안전정보제공 | safeinfoNo | SIP-20260827-001 |
| 안전퀴즈 | quizId | QZ-20260827-001 |
| 위험성평가 | riskId | RA-20260827-001 |
| 안전작업허가 | permitNo | PTW-20260827-001 |
| TBM | tbmNo | TBM-20260827-001 |
| 작업중지·긴급조치 | emergencyNo | EM-20260827-001 |
| 작업 중 점검 | inspectionNo | IN-20260827-001 |
| JSA_DB | jsaId | JSA-WRK-000001 |
| 허가 연장 | extensionId | EXT-1724678400000 |
| 재TBM | reTbmNo | RTBM-20260827-001 |
| 고위험 사전승인 | approvalNo | HRA-20260827-001 |

### 4.1 공통 원칙

- 자연키를 Firestore 문서 ID로 사용한다.
- `riskId`를 사용하고 `raNo`는 사용하지 않는다.
- jsaId는 JSON 변환 또는 등록 단계에서 발급한다.
- Math.random 기반 번호를 사용하지 않는다.
- Date.now 기반 번호는 임시 호환 ID 외에는 사용하지 않는다.
- Firestore 이관 후 시퀀스는 Transaction으로 발급한다.
- 삭제된 번호를 재사용하지 않는다.
- 문서 ID와 내부 자연키 필드는 동일해야 한다.

---

## 5. 공통 감사 필드

모든 업무 문서에는 다음 필드를 둔다.

| 필드 | 타입 | 필수 | 설명 |
|---|---|:---:|---|
| createdAt | Timestamp 또는 ISO string | 필수 | 최초 생성 시각 |
| createdBy | string | 필수 | 최초 생성자 |
| updatedAt | Timestamp 또는 ISO string | 필수 | 최종 수정 시각 |
| updatedBy | string | 필수 | 최종 수정자 |
| schemaVersion | number | 필수 | 스키마 버전 |

필요한 문서에는 다음 필드를 추가한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| deletedAt | Timestamp 또는 null | 논리 삭제 시각 |
| deletedBy | string 또는 null | 논리 삭제자 |
| version | number | 문서 업무 버전 |
| statusHistory | array | 상태 변경 이력 |
| reviewedAt | Timestamp 또는 null | 검토 시각 |
| reviewedBy | string 또는 null | 검토자 |
| approvedAt | Timestamp 또는 null | 승인 시각 |
| approvedBy | string 또는 null | 승인자 |

### 5.1 날짜·시간 원칙

- 업무 날짜는 KST 기반 `YYYY-MM-DD` 문자열로 저장한다.
- 시간은 `HH:mm` 문자열로 저장할 수 있다.
- 감사시각은 Firestore Timestamp를 우선 사용한다.
- localStorage 단계에서는 ISO 문자열을 사용할 수 있다.
- 화면의 오늘 날짜 계산에 UTC 변환값을 사용하지 않는다.

---

## 6. 공통 출처 구조

자동 채움 또는 다른 문서에서 가져온 정보에는 출처를 기록한다.

권장 구조:

    {
      "sourceType": "permit",
      "sourceId": "PTW-20260827-001",
      "sourceField": "workName",
      "filledAt": "2026-08-27T09:00:00Z",
      "modifiedByUser": false
    }

sourceType 예:

- work
- safetyProvision
- quiz
- riskAssessment
- permit
- tbm
- emergency
- jsa
- user
- ai

사용자가 자동 채움 정보를 수정하면 `modifiedByUser`를 true로 변경하고 수정 이력을 남긴다.

---

## 7. 주요 컬렉션

### 7.1 마스터·기준 데이터

- users
- 협력사관리
- 작업자관리
- MSDS
- 공장안전정보
- 사내안전기준
- JSA_DB
- 안전철칙
- 체크리스트마스터

### 7.2 업무 데이터

- 작업DB
- 안전정보제공
- 안전퀴즈
- 위험성평가
- 고위험작업승인
- 작업허가
- TBM
- 작업중지
- 작업중점검
- 가스측정기록
- 작업장비체크리스트
- 온열질환진단

### 7.3 운영 데이터

- counters
- 이메일로그
- 월간통계
- 협력사통계

컬렉션 수는 고정값으로 관리하지 않는다.

새 컬렉션을 추가할 때는 목적, 문서 ID, 접근권한, 보존기간 및 기존 컬렉션과의 관계를 문서화한다.

---

## 8. 문서 관계

### 8.1 작업 전·중·후 흐름

    작업DB
      ├─ 안전정보제공
      ├─ 안전퀴즈 검증
      ├─ 위험성평가
      └─ 작업허가
            ├─ 고위험작업승인
            ├─ 가스측정기록
            ├─ TBM
            ├─ 작업중점검
            ├─ 작업중지
            └─ 작업완료·ILS 해제 확인

### 8.2 중심키

- 작업 원본 중심: workId
- 허가 및 통합 리포트 중심: permitNo
- 위험성평가 문서: riskId
- TBM 문서: tbmNo
- 작업중지 문서: emergencyNo
- 안전 지식 출처: jsaId

### 8.3 참조 원칙

- 다른 문서의 전체 내용을 불필요하게 복제하지 않는다.
- 표시와 하위 호환에 필요한 요약정보만 복제할 수 있다.
- 상세 원본은 식별번호로 조회한다.
- 참조 당시의 핵심 요약과 버전은 감사 목적으로 저장할 수 있다.
- 원본이 변경되어도 완료된 과거 기록의 의미가 바뀌지 않도록 한다.

---

## 9. users 컬렉션

### 9.1 문서 ID

Firebase Auth UID

### 9.2 스키마

    {
      "uid": "firebase-auth-uid",
      "email": "user@example.com",
      "displayName": "담당자",
      "role": "manager",
      "department": "안전환경부서",
      "status": "활성",
      "receiveReports": {
        "dailyToday": false,
        "dailyTomorrow": false,
        "urgent": false,
        "weekly": false,
        "consentedAt": null,
        "updatedAt": null
      },
      "createdAt": null,
      "createdBy": "system",
      "updatedAt": null,
      "updatedBy": "system",
      "schemaVersion": 2
    }

### 9.3 역할값

- admin
- manager
- worker

역할값은 소문자로 저장한다.

Custom Claims를 사용할 경우 역할 부여는 신뢰할 수 있는 관리자 환경에서 수행한다.

일반 브라우저 클라이언트가 관리자 역할을 직접 부여할 수 없어야 한다.

---

## 10. 작업DB 컬렉션

### 10.1 문서 ID

workId

예:

    2026-08-27_5

### 10.2 역할

원본 작업계획과 작업 일정의 기준정보를 관리한다.

### 10.3 스키마

    {
      "workId": "2026-08-27_5",
      "originalNo": "5",
      "date": "2026-08-27",
      "workName": "소성로 히터 교체",
      "workNameFull": "3라인 소성로 히터 교체 및 점검",
      "workDescription": "",
      "location": {
        "factory": "포항양극재 1공장",
        "building": "",
        "line": "3",
        "floor": "",
        "detail": "예비소성로"
      },
      "company": "협력사명",
      "manager": "작업책임자",
      "workerIds": [],
      "workerCount": 5,
      "workTypes": [
        "electricalDeenergized",
        "maintenance"
      ],
      "materials": [],
      "equipment": [],
      "energySources": [
        "electrical"
      ],
      "highRisk": {
        "applicable": false,
        "categories": [],
        "reasons": [],
        "status": "미판정"
      },
      "permitNo": "",
      "riskId": "",
      "tbmNo": "",
      "status": "대기중",
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

### 10.4 규칙

- originalNo가 없는 작업은 정식 workId를 생성하지 않는다.
- 배열 인덱스를 originalNo 대신 사용하지 않는다.
- 상태는 작업허가 상태와 동기화한다.
- 작업자 상세 이력 전체를 작업자 문서에 중복 저장하지 않는다.

---

## 11. 안전정보제공 컬렉션

### 11.1 문서 ID

safeinfoNo

예:

    SIP-20260827-001

### 11.2 역할

도급인이 안전정보를 제공하고 수급인이 확인·서명하는 전체 흐름을 하나의 문서로 관리한다.

### 11.3 스키마

    {
      "safeinfoNo": "SIP-20260827-001",
      "workId": "2026-08-27_5",
      "permitNo": "",
      "date": "2026-08-27",
      "workName": "화학물질 배관 정비",
      "location": "포항양극재 1공장",
      "detailLocation": "",
      "workPeriod": {
        "startDateTime": "",
        "endDateTime": ""
      },
      "employer": {
        "company": "",
        "department": "",
        "issuerId": "",
        "issuerName": "",
        "issuedAt": null,
        "signatureRef": ""
      },
      "contractor": {
        "company": "",
        "signerId": "",
        "signerName": "",
        "signedAt": null,
        "signatureRef": ""
      },
      "siteHazards": [],
      "hazardousEquipment": [],
      "chemicals": [
        {
          "msdsId": "",
          "name": "",
          "cas": "",
          "confirmed": false
        }
      ],
      "msdsReferences": [],
      "restrictions": [],
      "requiredPPE": [],
      "requiredDocuments": [],
      "emergencyInfo": {},
      "contractorReview": {
        "workInfoMatched": null,
        "locationMatched": null,
        "informationSufficient": null,
        "msdsConfirmed": null,
        "additionalRequest": "",
        "rejectionReason": ""
      },
      "status": "발행완료",
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

### 11.4 상태값

- 발행완료
- 서명완료
- 반려

### 11.5 허가 게이트

필수 안전정보제공 대상 작업은 다음 조건을 충족해야 한다.

- 도급인 발행 완료
- 수급인 확인·서명 완료
- 반려사항 없음
- 작업명·업체·장소 일치
- 필요한 MSDS 확인
- 추가 요청사항 처리 완료

---

## 12. 안전퀴즈 컬렉션

### 12.1 문서 ID

quizId

예:

    QZ-20260827-001

### 12.2 역할

작업현장 출입자와 작업 참여자의 필수 안전지식 확인 기록을 관리한다.

### 12.3 스키마

    {
      "quizId": "QZ-20260827-001",
      "respondentId": "",
      "respondent": "응시자",
      "respondentCompany": "협력사명",
      "date": "2026-08-27",
      "startedAt": null,
      "completedAt": null,
      "quizVersion": "1.0",
      "totalQuestions": 10,
      "correctAnswers": 10,
      "score": 100,
      "status": "합격",
      "validFrom": "2026-08-27",
      "validUntil": "2026-08-27",
      "attemptNo": 1,
      "acknowledgement": {
        "confirmed": true,
        "confirmedAt": null,
        "signatureRef": ""
      },
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

### 12.4 상태값

- 합격
- 불합격

### 12.5 출입·작업 참여 게이트

TBM 참석자와 작업자는 다음 조건을 충족해야 한다.

- 유효한 퀴즈 기록 존재
- 합격 상태
- 유효기간 이내
- 필요한 퀴즈 버전 충족
- 응시자 식별정보 일치
- 소속 회사 일치

미응시·불합격·기간만료·신원 불일치자는 작업 참여를 제한한다.

위험 신고와 작업중지 요청은 안전퀴즈 상태로 제한하지 않는다.

### 12.6 미확정 정책

다음 값은 사내 출입·교육 기준을 확인한 후 확정한다.

- 합격 점수
- 필수문항 오답 허용 여부
- 유효기간
- 재응시 제한
- 방문자·감독자 예외
- 본인 식별 방법

---

## 13. JSA_DB 컬렉션

### 13.1 문서 ID

jsaId

예:

    JSA-WRK-000001

### 13.2 역할

위험성평가에 위험요인·사고시나리오·안전대책을 제공하는 승인된 안전 지식 데이터베이스이다.

JSA_DB는 실제 위험성평가 기록과 구분한다.

### 13.3 핵심 스키마

    {
      "jsaId": "JSA-WRK-000001",
      "no": 1,
      "classCode": "WRK",
      "sheet": "원문",
      "workType": "밀폐공간",
      "workSubType": "로 내부 정비",
      "workName": "RHK ROLLER BLANKET 및 ROLLER 조립",
      "workStage": "준비·진입·작업",
      "equipment": "송풍팬, 가스검지기, 무전기",
      "materials": "1. 산소결핍 / 2. 유해가스 / 3. 분진",
      "originalHazard": "",
      "accidentType": "",
      "scenario": "",
      "detailedMeasures": "",
      "standardMeasures": "",
      "controlAdequacy": "○",
      "remark": "",
      "workInfo": {},
      "hazards": [],
      "measures": [],
      "quality": {},
      "metadata": {},
      "schemaVersion": 3
    }

상세 구조는 JSA_DB_STRUCTURE.md를 따른다.

### 13.4 검색 대상

기본 추천에는 다음 자료만 사용한다.

- metadata.status가 approved
- retired 상태가 아님
- 현재 유효 버전
- 품질등급 A 또는 B
- 출처와 적용조건이 확인됨

개발 단계의 review 자료는 승인 자료와 구분하여 표시한다.

### 13.5 등록 절차

위험성평가 결과를 JSA_DB에 자동 등록하지 않는다.

다음 절차를 따른다.

1. 후보 등록
2. 중복 확인
3. 위험·대책 구조 검토
4. 출처 검토
5. 현업 검토
6. 안전보건 검토
7. 승인
8. 검색·추천에 사용

---

## 14. 위험성평가 컬렉션

### 14.1 문서 ID

riskId

예:

    RA-20260827-001

### 14.2 역할

현재 작업조건에 따른 위험요인별 위험도와 안전대책을 평가한다.

JSA_DB의 과거 위험도는 참고만 하며 현재 작업의 위험도로 자동 적용하지 않는다.

### 14.3 스키마

    {
      "riskId": "RA-20260827-001",
      "previousRiskId": "",
      "assessmentVersion": 1,
      "workId": "2026-08-27_5",
      "permitNo": "PTW-20260827-001",
      "linkedPermitNo": "PTW-20260827-001",
      "date": "2026-08-27",
      "workName": "소성로 히터 교체",
      "location": "포항양극재 1공장",
      "detailLocation": "3라인 예비소성로",
      "company": "협력사명",
      "workerCount": 5,
      "primaryWorkType": "전기작업",
      "workTypes": [
        "전기작업",
        "정비작업"
      ],
      "workStages": [
        "차단",
        "점검",
        "교체",
        "복구"
      ],
      "workDescription": "",
      "equipment": [],
      "materials": [],
      "energySources": [],
      "assessor": "",
      "participants": [],
      "referencedJSAs": [],
      "riskItems": [],
      "highRisk": {
        "applicable": false,
        "categories": [],
        "reasons": [],
        "criteria": [],
        "exceptionApplied": false,
        "exceptionReason": "",
        "checklistRequired": false,
        "executiveApprovalRequired": false,
        "lifeKeeperRequired": false,
        "ilsRequired": false,
        "status": "미판정"
      },
      "overallInitialRisk": {
        "score": 0,
        "level": ""
      },
      "overallResidualRisk": {
        "score": 0,
        "level": ""
      },
      "overallScore": 0,
      "overallRisk": "",
      "controlAdequacy": "",
      "controlAdequacyRecommended": "",
      "controlAdequacyReason": "",
      "unresolvedRiskCount": 0,
      "selectedMeasures": [],
      "userMeasures": [],
      "allMeasures": [],
      "aiReviews": [],
      "opinion": "",
      "status": "평가완료",
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 3
    }

### 14.4 하위 호환 필드

현재 위험성평가 v2와 대시보드 호환을 위해 다음 필드를 일정 기간 유지할 수 있다.

- frequency
- severity
- overallScore
- overallRisk
- controlAdequacy
- referencedJSA
- selectedMeasures
- userMeasures
- allMeasures

신규 구조에서는 위험요인별 `riskItems`를 우선 사용한다.

### 14.5 riskItems 구조

    {
      "riskItemId": "RI01",
      "hazardText": "전원 미차단 상태에서 충전부 접촉 감전 위험",
      "hazardSource": "JSA_DB",
      "sourceJsaId": "JSA-WRK-000003",
      "sourceHazardId": "H01",
      "workStage": "교체",
      "energySources": [
        "전기에너지"
      ],
      "accidentTypes": [
        "감전"
      ],
      "scenario": "전원 미차단 감전 가능",
      "initialRisk": {
        "frequency": 3,
        "severity": 4,
        "score": 12,
        "level": "고위험"
      },
      "selectedMeasures": [
        {
          "measureId": "M01",
          "text": "전원 차단 및 ILS 실시",
          "standardName": "ILS 실시",
          "source": "INT",
          "hierarchy": "administrative",
          "required": true,
          "verificationMethod": "기존 ILS 시스템의 완료상태 확인",
          "sourceJsaId": "JSA-INT-000001"
        }
      ],
      "residualRisk": {
        "frequency": 1,
        "severity": 4,
        "score": 4,
        "level": "저위험"
      },
      "controlAdequacy": "○",
      "adequacyReason": "에너지원 차단과 ILS 완료상태 확인",
      "unresolved": false,
      "actionOwner": "",
      "dueDate": ""
    }

### 14.6 위험요인 출처

hazardSource 허용값:

- WORK
- SAFETY_INFO
- JSA_DB
- INT
- SOP
- ACC
- NMS
- EXT
- AI
- USER

AI가 제안한 위험요인은 기본 미선택 상태로 표시한다.

### 14.7 최초·잔여 위험도

각 위험요인마다 다음을 구분한다.

- initialRisk: 대책 적용 전
- residualRisk: 대책 적용 후

현재 기존 앱의 단일 매트릭스 점수는 하위 호환용 종합값으로 유지할 수 있다.

### 14.8 통제 적정성

통제 적정성은 다음 정보를 함께 관리한다.

- 시스템 추천값
- 사용자 최종값
- 판정 사유
- 필수대책 누락
- PPE 중심 여부
- 상위 통제수단 포함 여부
- 미해결 위험

사용자가 추천값을 변경하면 변경 사유를 기록한다.

### 14.9 재평가

공식 재평가는 기존 문서를 덮어쓰지 않는다.

새 riskId를 발급하고 다음을 연결한다.

- previousRiskId
- assessmentVersion
- reassessmentReason
- 변경된 위험요인
- 변경된 대책
- 재평가자
- 재평가 시각

단순 오탈자 수정과 공식 재평가를 구분한다.

---

## 15. Part 1 완료 범위

Part 1에서는 다음 내용을 정의하였다.

- 공통 식별번호
- 감사 필드
- 컬렉션 분류
- 데이터 관계
- users
- 작업DB
- 안전정보제공
- 안전퀴즈
- JSA_DB
- 위험성평가
- 위험요인별 최초·잔여 위험도
- 고위험 판정
- 복수 JSA 참조
- 재평가 이력

Part 2에서는 다음 내용을 정의한다.

- 고위험작업승인
- 작업허가
- 허가 전 ILS 확인
- 가스측정기록
- TBM
- 재TBM
- 작업중지권
- 작업 중 점검
- 작업장비 체크리스트
- 온열질환진단
- 작업 종료 및 ILS 해제 확인

---

## 16. 고위험작업승인 컬렉션

### 16.1 문서 ID

approvalNo

예:

    HRA-20260827-001

### 16.2 역할

고위험작업의 판정, 합동 사전검토, 맞춤 체크리스트 및 담당 임원·실장 사전승인 결과를 관리한다.

고위험작업승인은 일반 위험성평가와 작업허가를 대체하지 않는다.

### 16.3 스키마

    {
      "approvalNo": "HRA-20260827-001",
      "workId": "2026-08-27_5",
      "permitNo": "PTW-20260827-001",
      "riskId": "RA-20260827-001",
      "date": "2026-08-27",
      "workName": "소성로 내부 화기작업",
      "location": "포항양극재 1공장",
      "company": "협력사명",
      "highRisk": {
        "applicable": true,
        "categories": [
          "밀폐공간",
          "화재·폭발"
        ],
        "reasons": [
          "밀폐공간 내부 작업",
          "밀폐공간 내부 용접작업"
        ],
        "criteria": [],
        "exceptionApplied": false,
        "exceptionReason": "",
        "assessedBy": "",
        "assessedAt": null
      },
      "jointReview": {
        "status": "검토완료",
        "operationDepartment": {
          "reviewerId": "",
          "reviewerName": "",
          "reviewedAt": null
        },
        "maintenanceDepartment": {
          "reviewerId": "",
          "reviewerName": "",
          "reviewedAt": null
        },
        "contractor": {
          "reviewerId": "",
          "reviewerName": "",
          "reviewedAt": null
        },
        "safetyDepartment": {
          "reviewerId": "",
          "reviewerName": "",
          "reviewedAt": null
        },
        "comments": []
      },
      "requiredDocuments": [
        {
          "documentType": "작업계획서",
          "documentId": "",
          "required": true,
          "submitted": true,
          "verified": true
        },
        {
          "documentType": "위험성평가",
          "documentId": "RA-20260827-001",
          "required": true,
          "submitted": true,
          "verified": true
        }
      ],
      "customChecklist": {
        "checklistId": "",
        "prepared": true,
        "itemCount": 0,
        "sourceRiskId": "RA-20260827-001"
      },
      "lifeKeeper": {
        "required": true,
        "assigned": true,
        "workerId": "",
        "name": "",
        "company": "",
        "assignedAt": null
      },
      "ils": {
        "required": true,
        "planConfirmed": true,
        "referenceNo": "",
        "confirmedBy": "",
        "confirmedAt": null
      },
      "approval": {
        "required": true,
        "status": "승인",
        "approverId": "",
        "approverName": "",
        "approverPosition": "",
        "approvedAt": null,
        "comment": "",
        "rejectionReason": ""
      },
      "status": "승인",
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

### 16.4 상태값

- 승인불필요
- 승인대기
- 보완요청
- 승인
- 반려
- 재승인필요

### 16.5 허가 제한

다음 조건에서는 고위험작업의 최종 허가를 제한한다.

- 고위험 판정 미완료
- 합동 사전검토 미완료
- 위험성평가 미완료
- 맞춤 체크리스트 미작성
- 필수 작업계획서 미제출
- 생명지킴이 미지정
- ILS 계획 또는 적용 여부 미확인
- 담당 임원·실장 승인 미완료
- 미해결 중대위험 존재
- 예외 적용 근거 미확인

---

## 17. 작업허가 컬렉션

### 17.1 문서 ID

permitNo

예:

    PTW-20260827-001

### 17.2 역할

안전작업허가의 신청, 검토, 승인, 연장, 변경, 작업 중 확인 및 작업 종료를 관리한다.

작업자의 제출과 허가자의 최종 승인을 구분한다.

### 17.3 핵심 스키마

    {
      "permitNo": "PTW-20260827-001",
      "workId": "2026-08-27_5",
      "riskId": "RA-20260827-001",
      "safeinfoNo": "SIP-20260827-001",
      "highRiskApprovalNo": "HRA-20260827-001",
      "tbmNo": "",
      "woNumber": "",
      "date": "2026-08-27",
      "workName": "소성로 히터 교체",
      "workDescription": "",
      "location": "포항양극재 1공장",
      "detailLocation": "3라인 예비소성로",
      "companyName": "협력사명",
      "workerCount": 5,
      "workerIds": [],
      "supervisor": {
        "workerId": "",
        "name": "",
        "company": "",
        "phone": ""
      },
      "workTypes": [
        "electricalDeenergized",
        "maintenance"
      ],
      "startDate": "2026-08-27",
      "startTime": "09:00",
      "endDate": "2026-08-27",
      "endTime": "18:00",
      "requiredDocuments": [],
      "requiredPPE": [],
      "checklist": [],
      "riskSummary": {},
      "highRisk": {},
      "ils": {},
      "gasMeasurementSummary": {},
      "approvals": {},
      "validity": {},
      "implementationChecks": [],
      "closeout": {},
      "status": "허가진행중",
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

---

## 18. 작업허가 위험성평가 요약

### 18.1 riskSummary 구조

    {
      "riskId": "RA-20260827-001",
      "assessmentVersion": 1,
      "overallInitialRisk": {
        "score": 12,
        "level": "고위험"
      },
      "overallResidualRisk": {
        "score": 4,
        "level": "저위험"
      },
      "overallScore": 4,
      "overallRisk": "저위험",
      "controlAdequacy": "○",
      "majorHazards": [
        {
          "riskItemId": "RI01",
          "text": "전원 미차단 상태에서 충전부 접촉 감전 위험",
          "scenario": "전원 미차단 감전 가능",
          "unresolved": false
        }
      ],
      "approvedMeasures": [
        {
          "riskItemId": "RI01",
          "measureId": "M01",
          "text": "전원 차단 및 ILS 실시",
          "source": "INT",
          "required": true,
          "verificationMethod": "기존 ILS 시스템 완료상태 확인"
        }
      ],
      "referencedJsaIds": [
        "JSA-WRK-000003"
      ],
      "aiMeasureIncluded": false,
      "unresolvedRiskCount": 0,
      "assessedAt": null
    }

### 18.2 저장 원칙

- 위험성평가 상세 원본은 위험성평가 컬렉션에 저장한다.
- 작업허가에는 승인과 현장 확인에 필요한 요약만 저장한다.
- 필수대책을 임의 개수 제한으로 삭제하지 않는다.
- `riskMeasures` 문자열 배열은 기존 TBM 호환을 위해 임시 유지할 수 있다.
- 신규 구조에서는 `riskSummary.approvedMeasures`를 우선 사용한다.
- 위험성평가가 변경되면 허가서에 자동 덮어쓰지 않고 재확인 상태로 변경한다.

---

## 19. 허가 전 ILS 확인

### 19.1 운영 원칙

상세 ILS 잠금·해제 절차는 기존 ILS 시스템에서 관리한다.

안전관리 플랫폼은 다음 두 시점의 상태를 확인한다.

1. 작업허가 전 ILS 실시 완료
2. 작업 종료 후 ILS 잠금 해제 완료

### 19.2 ils 구조

    {
      "applicable": true,
      "notApplicableReason": "",
      "mode": "일반",
      "referenceNo": "ILS-REFERENCE-NO",
      "mechanicalReferenceNo": "",
      "electricalReferenceNo": "",
      "gibNo": "",
      "targetEquipment": "소성로 히터",
      "preApproval": {
        "status": "완료확인",
        "externalSystemChecked": true,
        "equipmentMatched": true,
        "verifiedBy": "",
        "verifiedAt": null,
        "comment": ""
      },
      "closeout": {
        "status": "해제대기",
        "workersCleared": false,
        "toolsCleared": false,
        "guardsRestored": false,
        "personalLocksReleased": false,
        "externalSystemChecked": false,
        "releaseVerifiedBy": "",
        "releaseVerifiedAt": null,
        "equipmentHandedOver": false,
        "restartApproved": false,
        "comment": ""
      }
    }

### 19.3 mode 허용값

- 일반
- 가동Test·미세조정
- 비대상

### 19.4 preApproval.status 허용값

- 확인대기
- 진행중
- 완료확인
- 불일치
- 재확인필요
- 비대상

### 19.5 closeout.status 허용값

- 해제대기
- 해제진행중
- 해제완료확인
- 불일치
- 재확인필요
- 비대상

### 19.6 허가 제한

ILS 대상 작업은 다음 조건을 충족하지 못하면 `허가완료`로 전환하지 않는다.

- 기존 ILS 시스템 완료상태 확인
- 참조번호 입력
- 작업 대상 설비 일치
- 확인자 입력
- 확인 시각 기록
- 가동 Test·미세조정이면 승인 근거 확인

### 19.7 작업완료 제한

ILS 대상 작업은 다음 조건을 충족하지 못하면 `작업완료`로 전환하지 않는다.

- 작업자 전원 철수
- 공구·자재 제거
- 방호장치 복구
- 개인잠금 해제 확인
- 기존 ILS 시스템 해제 완료 확인
- 설비운영부서 인계
- 필요한 재가동 승인

---

## 20. 작업허가 승인정보

### 20.1 approvals 구조

    {
      "applicant": {
        "userId": "",
        "name": "",
        "company": "",
        "submittedAt": null,
        "signatureRef": ""
      },
      "workSupervisor": {
        "userId": "",
        "name": "",
        "company": "",
        "status": "확인대기",
        "confirmedAt": null,
        "signatureRef": "",
        "comment": ""
      },
      "permitApprover": {
        "userId": "",
        "name": "",
        "department": "",
        "status": "승인대기",
        "approvedAt": null,
        "signatureRef": "",
        "comment": "",
        "rejectionReason": ""
      }
    }

### 20.2 승인 상태

작업책임자 확인 상태:

- 확인대기
- 확인완료
- 보완요청

허가자 상태:

- 승인대기
- 승인
- 반려
- 재승인필요

### 20.3 작업허가 상태

- 대기중
- 허가진행중
- 허가완료
- 작업중
- 작업중지
- 작업완료

작업자가 제출하거나 서명한 것만으로 `허가완료` 처리하지 않는다.

운영부서 허가자의 최종 승인이 완료된 후 `허가완료`로 전환한다.

---

## 21. 작업허가 유효기간·연장

### 21.1 validity 구조

    {
      "shiftType": "주간",
      "isNight": false,
      "originalEndDateTime": "2026-08-27T18:00",
      "currentEndDateTime": "2026-08-27T18:00",
      "maxEndDateTime": "2026-08-28T00:00",
      "extensionCount": 0,
      "extensionStatus": "없음",
      "extensions": []
    }

### 21.2 extensions 구조

    {
      "extensionId": "EXT-1724678400000",
      "requestedAt": null,
      "requestedBy": "",
      "previousEndDateTime": "",
      "requestedEndDateTime": "",
      "approvedEndDateTime": "",
      "reason": "",
      "changeCheck": {
        "workersChanged": false,
        "approverChanged": false,
        "workContentChanged": false,
        "locationChanged": false,
        "equipmentChanged": false,
        "materialChanged": false,
        "energySourceChanged": false
      },
      "riskAssessmentStillValid": false,
      "highRiskApprovalStillValid": false,
      "ilsStillValid": false,
      "gasMeasurementStillValid": false,
      "reTbmRequired": false,
      "status": "승인대기",
      "approvedBy": "",
      "approvedAt": null,
      "comment": ""
    }

### 21.3 extensionStatus 허용값

- 없음
- 승인대기
- 승인
- 반려
- 재허가필요

### 21.4 연장 원칙

- 연장 요청과 승인을 분리한다.
- 작업내용·범위·설비·물질·에너지원 변경 시 재허가를 검토한다.
- ILS가 현재 유효한지 다시 확인한다.
- 밀폐공간 측정결과가 유효한지 확인한다.
- 고위험작업 사전승인이 계속 유효한지 확인한다.
- 작업조건 변경 시 위험성평가와 TBM을 다시 검토한다.
- 만료된 허가의 연장 가능 여부는 사내기준에 따라 제한한다.

---

## 22. 가스측정기록 컬렉션

### 22.1 문서 ID

측정기록 ID

권장 예:

    GAS-20260827-0001

문서 ID 형식은 Firestore 이관 전에 최종 확정한다.

### 22.2 역할

밀폐공간 및 가스측정 필요 작업의 위치별·시간별 측정 결과를 관리한다.

### 22.3 스키마

    {
      "measurementId": "GAS-20260827-0001",
      "permitNo": "PTW-20260827-001",
      "workId": "2026-08-27_5",
      "riskId": "RA-20260827-001",
      "tbmNo": "TBM-20260827-001",
      "measurementType": "최초",
      "measuredAt": null,
      "location": "소성로 내부",
      "measurementPoint": "하부 작업자 호흡위치",
      "positionType": "하부",
      "depthOrHeight": "",
      "breathingZone": true,
      "values": {
        "oxygen": 20.9,
        "carbonMonoxide": 0,
        "carbonDioxide": 0.04,
        "hydrogenSulfide": 0,
        "lel": 0
      },
      "limitsApplied": {
        "oxygenMinimum": 18,
        "oxygenMaximumExclusive": 23.5,
        "carbonMonoxideMaximumExclusive": 30,
        "carbonDioxideMaximumExclusive": 1.5,
        "hydrogenSulfideMaximumExclusive": 10,
        "lelMaximumExclusive": 10,
        "criteriaType": "밀폐공간 적정공기"
      },
      "result": "적합",
      "measuredBy": {
        "userId": "",
        "name": "",
        "department": "",
        "trainedEvaluator": true
      },
      "initialJointConfirmation": {
        "required": true,
        "confirmationType": "3자",
        "contractorSupervisor": {},
        "operationEvaluator": {},
        "maintenanceRepresentative": {}
      },
      "instrument": {
        "instrumentId": "",
        "model": "",
        "calibrationChecked": true,
        "alarmSettingChecked": true
      },
      "correctiveAction": "",
      "remeasurementRequired": false,
      "nextMeasurementDueAt": null,
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

### 22.4 measurementType 허용값

- 최초
- 작업중
- 교대전
- 재진입전
- 이상발생
- 작업재개전

### 22.5 result 허용값

- 적합
- 부적합
- 재측정필요

### 22.6 기본 측정주기

밀폐공간 연속작업의 공식 측정주기는 현재 확인된 사내기준에 따라 1시간으로 관리한다.

사업장 프로그램과 현장조건에 따라 간격을 단축한 경우 다음을 추가로 기록한다.

- 단축 주기
- 단축 사유
- 적용 기준
- 승인자

### 22.7 저장 원칙

- 첫 번째 측정행만 저장하지 않는다.
- 모든 위치와 모든 측정시각의 값을 저장한다.
- 위치별 결과를 개별 보존한다.
- 한 위치라도 부적합하면 작업 시작 또는 계속 여부를 재검토한다.
- 부적합 측정값을 삭제하거나 적합값으로 덮어쓰지 않는다.
- 조치 후 재측정값은 별도 기록으로 저장한다.
- 측정기록의 사내 보존기간을 준수한다.

---

## 23. TBM 컬렉션

### 23.1 문서 ID

tbmNo

예:

    TBM-20260827-001

### 23.2 파일 분리

TBM 전용 화면과 실제 작업중지 요청 화면을 분리한다.

- TBM: `TBM_v2.html`
- 작업중지 요청: `작업중지권_v2.html`

기존 통합 파일은 신규 파일 검증 전까지 유지한다.

### 23.3 역할

TBM은 다음 기능을 관리한다.

- 작업 기본정보 확인
- 위험성평가의 위험·대책 전달
- 조치 예정자 지정
- 참석자 안전퀴즈 검증
- 허가서의 ILS 상태 확인
- 작업중지권 고지
- 참석자 서명
- 조건부 별지
- 재TBM

### 23.4 스키마

    {
      "tbmNo": "TBM-20260827-001",
      "parentTbmNo": "",
      "revisionNo": 0,
      "reTbmReason": "",
      "permitNo": "PTW-20260827-001",
      "workId": "2026-08-27_5",
      "riskId": "RA-20260827-001",
      "emergencyNo": "",
      "date": "2026-08-27",
      "conductedAt": null,
      "workName": "소성로 히터 교체",
      "location": "포항양극재 1공장 3라인",
      "company": "협력사명",
      "workerCount": 5,
      "supervisor": "",
      "conductedBy": "",
      "workTypes": [],
      "highRisk": {},
      "hazards": [],
      "ilsConfirmation": {},
      "attendees": [],
      "quizValidation": {},
      "stopNotice": {},
      "attachments": [],
      "emergencyInfo": {},
      "status": "작성중",
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

### 23.5 상태값

- 작성중
- 완료
- 취소
- 재TBM필요

---

## 24. TBM 위험요인 구조

### 24.1 hazards 구조

    {
      "tbmHazardId": "TH01",
      "riskItemId": "RI01",
      "sourceRiskId": "RA-20260827-001",
      "sourceJsaId": "JSA-WRK-000003",
      "hazard": "전원 미차단 상태에서 충전부 접촉 감전 위험",
      "scenario": "전원 미차단 감전 가능",
      "measures": [
        {
          "measureId": "M01",
          "text": "전원 차단 및 ILS 실시",
          "source": "INT",
          "required": true
        },
        {
          "measureId": "M02",
          "text": "무전압 확인",
          "source": "AI",
          "required": true
        }
      ],
      "actionOwner": "작업책임자",
      "verificationMethod": "ILS 완료상태와 현장 차단상태 확인",
      "confirmed": false,
      "confirmedAt": null,
      "autoFilled": true,
      "autoFilledFrom": "RA-20260827-001"
    }

### 24.2 원칙

- 위험요인과 안전대책을 같은 객체 안에서 연결한다.
- `위험성평가에서 도출`이라는 일반 문구만 위험요인으로 저장하지 않는다.
- 동일한 riskItemId와 measureId를 기준으로 중복을 방지한다.
- 위험성평가 변경 시 기존 TBM을 자동 덮어쓰지 않는다.
- 최신 평가를 다시 불러올 때 변경내용을 기록한다.
- 사용자 수정사항과 자동 채움 내용을 구분한다.

---

## 25. TBM 참석자·안전퀴즈 검증

### 25.1 attendees 구조

    {
      "participantId": "",
      "name": "",
      "company": "",
      "role": "작업자",
      "quizId": "",
      "quizStatus": "합격",
      "quizVersion": "1.0",
      "quizValidUntil": "2026-08-27",
      "quizValidated": true,
      "quizValidatedAt": null,
      "signatureRef": "",
      "signedAt": null
    }

### 25.2 quizValidation 구조

    {
      "required": true,
      "totalParticipants": 5,
      "validParticipants": 5,
      "invalidParticipants": 0,
      "allPassed": true,
      "validatedAt": null,
      "validatedBy": "",
      "issues": []
    }

### 25.3 참여 제한

다음 대상자는 작업 참여를 제한한다.

- 미응시
- 불합격
- 유효기간 만료
- 필요한 퀴즈 버전 불충족
- 신원 불일치
- 소속 불일치

위험 신고와 작업중지 요청은 안전퀴즈 결과로 제한하지 않는다.

---

## 26. TBM ILS 확인

### 26.1 ilsConfirmation 구조

    {
      "applicable": true,
      "status": "완료확인",
      "referenceNo": "ILS-REFERENCE-NO",
      "mechanicalReferenceNo": "",
      "electricalReferenceNo": "",
      "gibNo": "",
      "verifiedInPermit": true,
      "permitVerifiedBy": "",
      "permitVerifiedAt": null,
      "confirmedInTbm": true,
      "confirmedBy": "",
      "confirmedAt": null,
      "readOnly": true
    }

### 26.2 원칙

- TBM에서 상세 ILS 정보를 다시 입력하지 않는다.
- 작업허가서의 ILS 확인 결과를 읽기 전용으로 표시한다.
- ILS 상태가 변경되거나 불일치하면 TBM 완료를 제한한다.
- 별도 ILS 시스템의 원본정보를 이 플랫폼에서 임의 수정하지 않는다.

---

## 27. TBM 작업중지권 고지

### 27.1 stopNotice 구조

    {
      "participants": [
        "참석자1",
        "참석자2"
      ],
      "participantsText": "참석자1, 참석자2",
      "representativeName": "참석자1",
      "representativeSigRef": "",
      "noticedAt": null,
      "legalBasis": "산업안전보건법 제52조",
      "noticeVersion": "1.0",
      "confirmed": true
    }

### 27.2 필수조건

- 참석자 명단
- 대표자 이름
- 대표자 서명 또는 전자확인
- 고지 시각
- 법적 근거
- 고지 문구 버전
- 확인 결과

법령 문구는 최신성 확인 후 사용한다.

---

## 28. 재TBM

### 28.1 문서 관리

재TBM은 기존 TBM 문서를 덮어쓰지 않는다.

신규 tbmNo 또는 reTbmNo를 발급하고 원본 TBM과 연결한다.

### 28.2 재TBM 필요조건

- 작업방법 변경
- 작업장소 변경
- 작업범위 변경
- 작업자·작업팀 변경
- 설비·장비 변경
- 물질 변경
- 에너지원 변경
- 새로운 위험 발견
- 위험성평가 변경
- 작업중지 후 재개
- 허가조건 변경
- ILS 상태 변경
- 장시간 작업중단 후 재개
- 고위험 분류 변경

### 28.3 재TBM 추가정보

- parentTbmNo
- revisionNo
- reTbmReason
- relatedEmergencyNo
- previousRiskId
- currentRiskId
- changedHazards
- changedMeasures
- conductedAt
- attendees
- quizValidation
- stopNotice
- approvals

---

## 29. 작업중지 컬렉션

### 29.1 컬렉션명

작업중지

기존 localStorage 단계에서는 `emergencies`를 사용한다.

기존 `긴급조치` 컬렉션과 통합 유지가 필요하면 다음처럼 구분할 수 있다.

- 컬렉션명: 긴급조치
- type: 중지

Firestore 이관 전 최종 컬렉션명을 확정한다.

### 29.2 문서 ID

emergencyNo

예:

    EM-20260827-001

### 29.3 역할

실제 위험 발견 후 작업중지, 개선조치, 재점검 및 작업 재개 승인을 관리한다.

TBM의 작업중지권 사전 고지와 구분한다.

### 29.4 스키마

    {
      "emergencyNo": "EM-20260827-001",
      "type": "중지",
      "permitNo": "PTW-20260827-001",
      "workId": "2026-08-27_5",
      "riskId": "RA-20260827-001",
      "tbmNo": "TBM-20260827-001",
      "date": "2026-08-27",
      "requestedAt": null,
      "stoppedAt": null,
      "workName": "소성로 히터 교체",
      "location": "포항양극재 1공장 3라인",
      "company": "협력사명",
      "requester": {
        "userId": "",
        "name": "",
        "company": "",
        "role": "",
        "signatureRef": ""
      },
      "hazard": {
        "workStage": "",
        "hazardText": "",
        "accidentTypes": [],
        "description": "",
        "immediateEvacuation": false,
        "areaControlled": false,
        "relatedSafetyRules": [],
        "ilsRelated": false
      },
      "immediateActions": [],
      "correctiveActions": [],
      "verification": {},
      "reassessment": {},
      "permitReview": {},
      "ilsReconfirmation": {},
      "reTbm": {},
      "restartApproval": {},
      "status": "요청",
      "detailStatus": "요청접수",
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

### 29.5 상위 상태

- 요청
- 조치중
- 완료

### 29.6 세부 상태

- 요청접수
- 작업중지
- 현장확인
- 조치중
- 재점검
- 재개검토
- 재개승인
- 완료

### 29.7 요청 시 자동 연동

작업중지 요청이 저장되면 다음을 수행한다.

- 작업허가 상태를 `작업중지`로 변경
- 작업DB 상태를 `작업중지`로 변경
- 관련 TBM에 emergencyNo 연결
- 위험성평가를 `재검토필요`로 표시
- 대시보드에 작업중지 상태 표시

기존 위험성평가와 TBM의 원본을 자동으로 덮어쓰지 않는다.

---

## 30. 작업중지 개선조치·재개

### 30.1 correctiveActions 구조

    {
      "actionId": "CA01",
      "description": "손상된 케이블 교체",
      "actionOwner": "",
      "dueAt": null,
      "completedAt": null,
      "completedBy": "",
      "evidenceRef": "",
      "status": "조치중"
    }

### 30.2 verification 구조

    {
      "verified": false,
      "verifiedBy": "",
      "verifiedAt": null,
      "result": "",
      "unresolvedHazards": [],
      "comment": ""
    }

### 30.3 reassessment 구조

    {
      "required": false,
      "previousRiskId": "",
      "newRiskId": "",
      "completed": false,
      "completedAt": null
    }

### 30.4 permitReview 구조

    {
      "required": false,
      "action": "재확인",
      "permitNo": "",
      "completed": false,
      "completedBy": "",
      "completedAt": null
    }

action 허용값:

- 재확인
- 재허가
- 불필요

### 30.5 restartApproval 구조

    {
      "requested": false,
      "requestedAt": null,
      "approved": false,
      "approvedBy": "",
      "approvedAt": null,
      "comment": ""
    }

### 30.6 재개 조건

다음 조건을 모두 충족한 후 작업을 재개한다.

- 즉시조치 완료
- 추가조치 완료
- 재점검 완료
- 미해결 중대위험 없음
- 필요한 위험성평가 재작성 완료
- 허가 재확인 또는 재허가 완료
- ILS 상태 재확인
- 재TBM 완료
- 변경사항 작업자 전달
- 권한 있는 재개 승인자 승인

---

## 31. 작업중점검 컬렉션

### 31.1 문서 ID

inspectionNo

예:

    IN-20260827-001

### 31.2 역할

일반 허가 이행점검과 고위험작업 주기별 점검을 관리한다.

### 31.3 스키마

    {
      "inspectionNo": "IN-20260827-001",
      "permitNo": "PTW-20260827-001",
      "workId": "2026-08-27_5",
      "riskId": "RA-20260827-001",
      "tbmNo": "TBM-20260827-001",
      "date": "2026-08-27",
      "inspectionType": "고위험작업",
      "highRiskCategories": [
        "중량물"
      ],
      "checklistType": "중량물작업",
      "inspectionRole": "생명지킴이",
      "scheduledAt": null,
      "inspectedAt": null,
      "inspector": {
        "userId": "",
        "name": "",
        "department": "",
        "role": ""
      },
      "delegation": {
        "delegated": false,
        "originalInspector": "",
        "delegate": "",
        "reason": "",
        "authorizedBy": "",
        "authorizedAt": null
      },
      "items": [],
      "overallResult": "양호",
      "findings": [],
      "workStopped": false,
      "emergencyNo": "",
      "status": "양호",
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }
### 31.3A 모든 허가작업의 3시간 이내 확인 필드

일반 허가 이행점검에는 다음 필드를 사용한다.

    {
      "inspectionType": "일반허가",
      "inspectionRole": "작업수행사 관리감독자",
      "dueRule": "작업시작후3시간이내",
      "workStartedAt": null,
      "dueAt": null,
      "inspectedAt": null,
      "overdue": false,
      "delayMinutes": 0,
      "delayReason": "",
      "inspector": {
        "userId": "",
        "department": "",
        "position": "",
        "name": ""
      },
      "items": [],
      "overallResult": "양호",
      "opinion": "",
      "findings": [],
      "correctiveActions": [],
      "workStopped": false,
      "emergencyNo": "",
      "status": "예정"
    }

dueAt은 실제 작업 시작시각을 기준으로 설정한다.

작업 예정 시작시각과 실제 작업 시작시각이 다르면 실제 작업 시작시각을 우선한다.

점검기한 초과 여부는 다음 정보를 비교하여 계산한다.

- workStartedAt
- dueAt
- inspectedAt

기한 초과 기록을 삭제하거나 정상 점검으로 덮어쓰지 않는다.


### 31.4 inspectionType 허용값

- 일반허가
- 고위험작업
- 재점검
- 종료점검

### 31.5 status 허용값

- 예정
- 점검중
- 양호
- 미흡
- 조치중
- 재점검완료
- 미실시

### 31.6 items 구조

    {
      "itemId": "CHK-001",
      "label": "작업반경 출입통제",
      "source": "INT",
      "sourceId": "",
      "riskItemId": "RI01",
      "measureId": "M01",
      "required": true,
      "result": "○",
      "notApplicableReason": "",
      "finding": "",
      "immediateAction": "",
      "actionOwner": "",
      "reinspectionResult": ""
    }
### 31.7 모든 허가작업의 기본 점검주기

모든 허가 대상 작업은 작업 시작 후 3시간 이내에 작업수행사 관리감독자가 안전 이행상태를 확인한다.

이 점검은 고위험작업 여부와 관계없이 적용한다.

확인결과에는 다음을 포함한다.

- 허가조건 이행
- 위험성평가 대책 이행
- 작업조건 변경
- ILS 상태 유지
- 보호구·작업구역·장비 상태
- 신규 위험
- 점검 의견
- 미흡사항 및 조치결과

Audit 부서 확인란은 별도 사내기준에 따라 적용한다.

### 31.8 고위험 점검주기

- 생명지킴이: 2시간마다
- 정비부서 담당자: 오전·오후 각 1회
- 운영부서 관리감독자: 오전·오후 각 1회
- 안전환경부서: 오전·오후 각 1회

Cloud Functions를 사용하지 않으므로 초기 구현에서는 다음 방식을 사용한다.

- 작업 시작 시 예정 점검시간 계산
- 대시보드에 다음 점검시간 표시
- 화면 진입 시 미실시 점검 경고
- 관리자 수동 확인
- 실제 점검시각 기록

백그라운드 자동 실행을 전제로 설계하지 않는다.

---

## 32. 작업장비체크리스트 컬렉션

### 32.1 문서 ID

권장 형식:

    EC-20260827-001

### 32.2 역할

TBM 별지의 장비별 안전점검 결과를 관리한다.

### 32.3 스키마

    {
      "equipmentCheckId": "EC-20260827-001",
      "permitNo": "PTW-20260827-001",
      "tbmNo": "TBM-20260827-001",
      "workId": "2026-08-27_5",
      "date": "2026-08-27",
      "equipmentType": "이동식 크레인",
      "equipmentId": "",
      "equipmentName": "",
      "items": [],
      "overallResult": "양호",
      "findings": [],
      "checkedBy": "",
      "checkedAt": null,
      "status": "완료",
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

### 32.4 장비군

- 핸드 그라인더
- 고속절단기
- 비계
- 와이어로프
- 슬링벨트
- 체인블록
- 체인슬링
- 샤클
- 이동식 사다리
- 이동식 비계
- 크레인
- 호이스트
- 용접기
- 이동전기기구
- 전동·회전공구
- 목재가공기계
- 기타

필수 안전장치가 미흡하면 TBM 완료와 작업 시작을 제한한다.

---

## 33. TBM 별지 참조

TBM 문서의 attachments에는 별지 원본 전체를 복제하지 않고 참조정보를 저장한다.

    {
      "attachmentType": "가스측정기록",
      "required": true,
      "documentId": "GAS-20260827-0001",
      "status": "완료",
      "verifiedBy": "",
      "verifiedAt": null
    }

attachmentType 예:

- 밀폐공간체크리스트
- 가스측정기록
- 밀폐공간출입현황
- 방사선측정
- 작업장비체크리스트
- 고위험작업점검
- 온열질환진단
- 비상정보확인
- 기타

---

## 34. 온열질환진단 컬렉션

### 34.1 문서 ID

권장 형식:

    HI-20260827-001

### 34.2 역할

하절기 및 고온작업의 온열질환 위험평가와 휴식·조치 기록을 관리한다.

### 34.3 스키마

    {
      "heatIllnessId": "HI-20260827-001",
      "permitNo": "PTW-20260827-001",
      "tbmNo": "TBM-20260827-001",
      "workId": "2026-08-27_5",
      "date": "2026-08-27",
      "workName": "",
      "location": "",
      "supervisor": "",
      "assessment": [],
      "measurements": [
        {
          "measuredAt": null,
          "apparentTemperature": 0,
          "workIntensity": "",
          "restRequired": false,
          "restMinutes": 0,
          "action": ""
        }
      ],
      "workerChecks": [],
      "supervisorConfirmation": {},
      "status": "완료",
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

### 34.4 개인정보 보호

- 작업자 건강상태는 최소한으로 저장한다.
- 불필요한 질병명과 상세 증상을 수집하지 않는다.
- 접근권한을 제한한다.
- 공개 리포트에 개인 건강정보를 포함하지 않는다.
- 협력사 평가에 개인 건강정보를 사용하지 않는다.
- 보존기간은 사내 개인정보 처리기준에 따라 확정한다.

---

## 35. 작업 종료 구조

### 35.1 closeout 구조

작업허가 문서의 closeout 필드에서 작업 종료를 관리한다.

    {
      "status": "종료확인중",
      "workCompleted": false,
      "allWorkersCleared": false,
      "confinedSpaceEntryCleared": true,
      "toolsAndMaterialsCleared": false,
      "temporaryEquipmentRemoved": false,
      "guardsRestored": false,
      "workAreaCleaned": false,
      "fireWatchCompleted": true,
      "chemicalResidueChecked": true,
      "allFindingsClosed": false,
      "allInspectionsCompleted": false,
      "ilsReleaseRequired": true,
      "ilsReleaseConfirmed": false,
      "equipmentHandedOver": false,
      "restartApproved": false,
      "confirmedBy": "",
      "confirmedAt": null,
      "comment": ""
    }

### 35.2 closeout.status 허용값

- 작업중
- 종료확인중
- 미흡조치중
- ILS해제대기
- 설비인계대기
- 종료완료

### 35.3 최종 완료 조건

다음 조건을 모두 충족해야 작업허가 상태를 `작업완료`로 변경한다.

- 실제 작업 완료
- 작업자 전원 철수
- 밀폐공간 출입자 전원 퇴실
- 공구·자재 제거
- 임시 설치물 제거
- 방호장치 복구
- 작업장 정리정돈
- 화기작업 잔불 확인
- 화학물질 잔류·누출 확인
- 모든 미흡사항 종결
- 필수 점검기록 완료
- ILS 대상이면 해제 완료 확인
- 설비운영부서 인계
- 필요한 재가동 승인

---

## 36. Part 2 완료 범위

Part 2에서는 다음 내용을 정의하였다.

- 고위험작업 사전승인
- 작업허가 핵심 구조
- 위험성평가 요약
- 허가 전 ILS 완료 확인
- 작업 종료 시 ILS 해제 확인
- 작업허가 승인 단계
- 작업허가 연장
- 가스측정기록
- TBM
- TBM 위험요인·대책 연결
- 참석자 안전퀴즈 검증
- TBM ILS 확인
- 작업중지권 고지
- 재TBM
- 작업중지
- 개선조치·재개
- 작업 중 점검
- 작업장비 체크리스트
- TBM 별지
- 온열질환진단
- 작업 종료

---

## 37. 상태 변경 이력

### 37.1 목적

상태 변경 이력은 문서의 현재 상태만 저장하여 과거 처리과정이 사라지는 문제를 방지하기 위해 사용한다.

다음 문서는 원칙적으로 상태 변경 이력을 관리한다.

- 안전정보제공
- 위험성평가
- 고위험작업승인
- 작업허가
- TBM
- 작업중지·긴급조치
- 작업중점검
- 작업 종료

### 37.2 statusHistory 구조

    {
      "historyId": "SH-001",
      "fromStatus": "허가진행중",
      "toStatus": "허가완료",
      "reason": "운영부서 허가자 최종 승인",
      "changedAt": null,
      "changedBy": "",
      "changedByName": "",
      "changedByRole": "manager",
      "relatedDocumentType": "",
      "relatedDocumentId": "",
      "comment": ""
    }

### 37.3 상태 변경 원칙

- 기존 상태 변경기록을 삭제하지 않는다.
- 현재 상태와 마지막 상태 이력은 일치해야 한다.
- 승인·반려·작업중지·재개·작업완료에는 변경사유를 기록한다.
- 자동 상태 변경은 `changedBy`를 `system`으로 기록할 수 있다.
- 자동 변경의 원인이 된 문서 ID를 기록한다.
- 잘못된 상태 변경을 수정할 때 기존 기록을 삭제하지 않고 정정 이력을 추가한다.

### 37.4 작업허가 상태 흐름

    대기중
      → 허가진행중
      → 허가완료
      → 작업중
      → 작업완료

특수 흐름:

    허가완료 또는 작업중
      → 작업중지
      → 조치중
      → 재개검토
      → 허가 재확인 또는 재허가
      → 재TBM
      → 작업중

작업자 제출만으로 `허가완료` 상태로 전환하지 않는다.

---

## 38. 체크리스트마스터 컬렉션

### 38.1 문서 ID

checklistItemId

권장 형식:

    CHK-FIRE-0001
    CHK-CONFINED-0001
    CHK-ELECTRIC-0001
    CHK-HEIGHT-0001
    CHK-LIFTING-0001
    CHK-CHEMICAL-0001

### 38.2 역할

종이 허가서, 고위험작업 점검표, TBM 별지 및 사내기준에서 도출된 점검항목을 표준화하여 관리한다.

체크리스트마스터는 실제 점검 결과가 아니라 점검 기준을 저장한다.

### 38.3 스키마

    {
      "checklistItemId": "CHK-CONFINED-0001",
      "category": "밀폐공간",
      "subCategory": "가스측정",
      "label": "작업 개시 전 산소 및 유해가스 농도 측정",
      "description": "",
      "sourceType": "INT",
      "sourceDocumentId": "",
      "sourceVersion": "",
      "applicableWorkTypes": [
        "confined"
      ],
      "applicableHighRiskCategories": [
        "밀폐공간"
      ],
      "conditions": [
        "밀폐공간 내부에 작업자가 진입하는 경우"
      ],
      "required": true,
      "allowNotApplicable": false,
      "verificationMethod": "측정기록과 측정자 확인",
      "inspectionRoles": [
        "작업수행사 관리감독자",
        "운영부서 지정 측정·평가자"
      ],
      "inspectionFrequency": "작업개시전",
      "stopWorkOnFailure": true,
      "relatedHazardTypes": [
        "질식",
        "중독",
        "화재",
        "폭발"
      ],
      "relatedControlFunctions": [
        "detection"
      ],
      "status": "review",
      "version": 1,
      "effectiveFrom": null,
      "retiredAt": null,
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

### 38.4 상태값

- draft
- review
- approved
- retired

승인된 항목만 일반 작업의 자동 체크리스트 생성에 사용한다.

### 38.5 체크리스트 생성 원칙

맞춤 체크리스트는 다음 자료를 결합하여 생성한다.

1. 공통 안전항목
2. 작업유형별 승인 항목
3. 고위험 분류별 승인 항목
4. 위험성평가에서 선택한 필수대책
5. 작업허가 조건
6. 재해·아차사고 재발방지 항목
7. 현장 담당자의 추가항목

중복 항목은 통합할 수 있으나 다음 정보는 유지한다.

- 원래 출처
- 관련 위험요인
- 관련 안전대책
- 필수 여부
- 점검주체
- 점검주기

---

## 39. 안전철칙 컬렉션

### 39.1 문서 ID

ruleId

권장 형식:

    RULE-0001

### 39.2 역할

작업중지권 서식과 TBM에서 사용하는 안전철칙을 버전별로 관리한다.

### 39.3 스키마

    {
      "ruleId": "RULE-0001",
      "ruleNo": 1,
      "title": "가동설비 접근 및 점검·수리 금지",
      "description": "",
      "applicableWorkTypes": [],
      "relatedAccidentTypes": [
        "끼임"
      ],
      "sourceDocumentName": "",
      "sourceDocumentVersion": "",
      "effectiveFrom": null,
      "effectiveTo": null,
      "status": "review",
      "version": 1,
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

### 39.4 운영 원칙

- 안전철칙 문구를 앱에만 하드코딩하지 않는다.
- 과거 작업중지 기록에는 당시 적용한 철칙 버전을 보존한다.
- 개정된 철칙이 과거 기록의 의미를 변경하지 않도록 한다.
- 최신성이 확인되지 않은 문구는 review 상태로 관리한다.
- 법령과 사내기준 문구를 혼동하지 않는다.

---

## 40. 사내안전기준 컬렉션

### 40.1 문서 ID

standardNo

예:

    STD-CONFINED-001

### 40.2 역할

사내 안전기준, 지침, 절차 및 운영규정을 관리한다.

JSA_DB는 사내안전기준에서 도출된 위험과 대책을 참조하지만 원본 기준을 대체하지 않는다.

### 40.3 스키마

    {
      "standardNo": "STD-CONFINED-001",
      "title": "밀폐공간 작업 안전기준",
      "category": "밀폐공간",
      "department": "",
      "applicableAreas": [],
      "purpose": "",
      "scope": "",
      "definitions": [],
      "requirements": [],
      "procedures": [],
      "checklistItemIds": [],
      "relatedRegulations": [],
      "attachmentRefs": [],
      "version": "",
      "effectiveDate": null,
      "reviewDate": null,
      "sourceVerified": false,
      "status": "review",
      "approvedBy": "",
      "approvedAt": null,
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

### 40.4 관리 원칙

- 문서명·문서번호·개정번호·시행일을 확인한다.
- 이미지 발췌본만 있는 자료는 review 상태로 관리한다.
- 최신 유효본이 확인된 자료만 approved로 변경한다.
- 기준이 폐기되면 삭제하지 않고 retired 상태로 관리한다.
- 새 기준이 기존 기준을 대체하면 대체 관계를 기록한다.
- 법령 자료와 사내기준 자료를 구분한다.

---

## 41. MSDS 컬렉션

### 41.1 문서 ID

msdsId

예:

    MSDS-001

### 41.2 역할

화학물질의 식별정보와 원본 MSDS 참조정보를 관리한다.

플랫폼의 요약정보가 원본 MSDS를 대체하지 않는다.

### 41.3 권장 스키마

    {
      "msdsId": "MSDS-001",
      "name": "수산화리튬",
      "substance": "Lithium Hydroxide",
      "cas": "",
      "msdsNo": "",
      "category": "material",
      "physicalForm": "분말",
      "sourceDocumentUrl": "",
      "sourceDocumentVersion": "",
      "sourceDocumentDate": null,
      "lastVerifiedAt": null,
      "status": "active",
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

### 41.4 category 허용값

- product
- precursor
- material
- utility
- other

### 41.5 적용 원칙

- CAS 번호와 MSDS 등록번호를 확인한다.
- 공급자별 MSDS 차이가 있는 경우 원본 문서를 구분한다.
- 상세 유해성·응급조치·보호구는 원본 MSDS를 우선 확인한다.
- 오래된 요약정보를 최신 정보로 오인하지 않도록 한다.
- 물질별 조치가 확인되지 않은 경우 일반 대책을 자동 적용하지 않는다.
- 물걸레, 물 세척, 중화제 및 진공청소기 사용을 모든 물질에 공통 적용하지 않는다.

---

## 42. 공장안전정보 컬렉션

### 42.1 문서 ID

factoryId

권장 예:

    POHANG-CATHODE-1
    POHANG-CATHODE-2

### 42.2 역할

공장별 비상연락, 대피, AED, 구급함 및 비상시설 정보를 관리한다.

### 42.3 스키마

    {
      "factoryId": "POHANG-CATHODE-1",
      "factoryName": "포항양극재 1공장",
      "location": "",
      "emergencyContacts": [],
      "emergencyProcedure": [],
      "emergencyExits": [],
      "assemblyPoints": [],
      "aedLocations": [],
      "firstAidLocations": [],
      "rescueEquipmentLocations": [],
      "fireTruckAccessPoints": [],
      "restrictedAreas": [],
      "safetyFacilities": [],
      "lastVerifiedAt": null,
      "verifiedBy": "",
      "status": "active",
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

### 42.4 보안 원칙

- 공개 저장소에 실제 개인 휴대전화번호를 저장하지 않는다.
- 내부 연락망과 민감한 시설 위치는 인증된 사용자만 조회하도록 검토한다.
- 화면에는 마지막 확인일을 표시한다.
- 변경된 연락처와 위치정보는 승인 후 반영한다.

---

## 43. 협력사관리 컬렉션

### 43.1 문서 ID

contractorId

### 43.2 스키마

    {
      "contractorId": "contractor-slug",
      "contractorName": "협력사명",
      "contractorNameFull": "",
      "contractorType": "contract",
      "status": "active",
      "contactInfo": {
        "manager": "",
        "phone": "",
        "email": "",
        "receiveDailyReport": false,
        "receiveUrgent": false,
        "lastVerifiedAt": null
      },
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

### 43.3 contractorType 허용값

- contract
- internal

### 43.4 통계 처리

협력사 문서 안에 상세 작업·사고·위반 이력을 배열로 계속 누적하지 않는다.

통계는 원본 업무 문서를 기준으로 계산한다.

필요한 경우 요약값만 캐시할 수 있다.

---

## 44. 작업자관리 컬렉션

### 44.1 문서 ID

workerId

### 44.2 스키마

    {
      "workerId": "WORKER-000001",
      "name": "작업자",
      "companyId": "contractor-slug",
      "companyName": "협력사명",
      "position": "",
      "status": "active",
      "contact": {
        "phone": "",
        "email": ""
      },
      "qualificationRefs": [],
      "educationRefs": [],
      "quizSummary": {
        "latestQuizId": "",
        "status": "",
        "validUntil": ""
      },
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

### 44.3 개인정보 원칙

- 이름만으로 작업자를 식별하지 않는다.
- 전화번호와 이메일은 필요한 경우에만 저장한다.
- 작업·사고·위반 이력 전체를 작업자 문서에 복제하지 않는다.
- 관련 업무 컬렉션에서 workerId로 조회한다.
- 권한 없는 사용자가 전체 작업자 명단을 조회하지 못하도록 한다.
- 퇴사·계약종료 후 보존과 삭제정책을 별도로 정한다.

---

## 45. 밀폐공간 출입기록

### 45.1 저장 방식

밀폐공간 출입기록은 TBM 별지 또는 별도 컬렉션으로 관리할 수 있다.

자료 증가와 장기 보존을 고려하면 별도 컬렉션을 권장한다.

권장 컬렉션명:

    밀폐공간출입기록

### 45.2 문서 ID

권장 형식:

    CSE-20260827-0001

### 45.3 스키마

    {
      "entryRecordId": "CSE-20260827-0001",
      "permitNo": "PTW-20260827-001",
      "tbmNo": "TBM-20260827-001",
      "workId": "2026-08-27_5",
      "workerId": "",
      "name": "",
      "company": "",
      "enteredAt": null,
      "exitedAt": null,
      "entryConfirmedBy": "",
      "exitConfirmedBy": "",
      "status": "입실",
      "comment": "",
      "createdAt": null,
      "createdBy": "",
      "updatedAt": null,
      "updatedBy": "",
      "schemaVersion": 2
    }

### 45.4 상태값

- 입실
- 퇴실
- 확인필요

### 45.5 종료 게이트

밀폐공간 출입자 중 퇴실이 확인되지 않은 사람이 있으면 다음 처리를 제한한다.

- ILS 해제 완료 확인
- 설비 인계
- 작업허가 최종 종료

---

## 46. 이메일로그 컬렉션

### 46.1 문서 ID

logId

권장 형식:

    LOG-20260827-0001

### 46.2 역할

EmailJS 또는 mailto를 이용한 리포트·알림 발송 이력을 관리한다.

### 46.3 스키마

    {
      "logId": "LOG-20260827-0001",
      "type": "daily_today",
      "templateId": "",
      "sentAt": null,
      "sentBy": "",
      "sentByName": "",
      "recipients": [],
      "totalRecipients": 0,
      "totalSent": 0,
      "totalFailed": 0,
      "reportSummary": {},
      "status": "sent",
      "createdAt": null,
      "createdBy": "",
      "schemaVersion": 2
    }

### 46.4 type 허용값

- sign_request
- sign_complete
- resend
- daily_today
- daily_tomorrow
- urgent_alert

### 46.5 status 허용값

- sent
- failed
- pending
- retry
- cancelled

### 46.6 운영 제약

Cloud Functions를 사용하지 않으므로 다음 기능은 자동 백그라운드 실행을 전제로 하지 않는다.

- 예약 발송
- 서버 기반 재시도
- 자동 로그 정리
- 자동 통계 집계

관리자가 모바일 또는 데스크톱 화면에서 발송을 실행하는 하이브리드 방식을 사용한다.

---

## 47. 통계 컬렉션

### 47.1 기본 원칙

통계의 원본은 업무 컬렉션이다.

월간통계와 협력사통계는 원본을 대체하지 않는다.

초기 단계에서는 클라이언트에서 필요한 통계를 계산하는 방식을 우선한다.

### 47.2 월간통계

문서 ID:

    YYYY-MM

권장 요약필드:

- totalWorks
- totalPermits
- totalRiskAssessments
- totalTBM
- totalStops
- totalHighRiskWorks
- riskLevelCounts
- inspectionCounts
- quizPassRate
- updatedAt

### 47.3 협력사통계

문서 ID:

    contractorId

권장 요약필드:

- totalWorks
- completedWorks
- permitCompletionRate
- tbmCompletionRate
- quizPassRate
- stopWorkCount
- inspectionFindingCount
- highRiskWorkCount
- updatedAt

### 47.4 주의사항

- 통계문서만 보고 원본 안전기록을 변경하지 않는다.
- 통계 재계산이 가능해야 한다.
- 개인 건강정보를 통계에 포함하지 않는다.
- 작업중지권 행사 건수를 단순 불이익 지표로 사용하지 않는다.
- 안전 신고 활성도를 부정적 평가로 해석하지 않는다.

---

## 48. 첨부파일·서명 참조 구조

### 48.1 공통 참조 구조

    {
      "attachmentId": "",
      "type": "signature",
      "fileName": "",
      "storagePath": "",
      "downloadUrl": "",
      "contentType": "",
      "fileSize": 0,
      "uploadedAt": null,
      "uploadedBy": "",
      "containsPersonalData": true,
      "accessLevel": "restricted",
      "retentionCategory": ""
    }

### 48.2 운영 원칙

- 큰 Base64 값을 업무 본문에 반복 저장하지 않는다.
- 서명·사진·첨부자료는 메타데이터와 분리한다.
- Firebase Storage 사용 여부는 비용·보안·권한 정책을 검토한 후 확정한다.
- Storage를 사용하지 않는 단계에서는 서명 데이터 크기를 제한한다.
- 목록 조회 시 서명·사진 전체가 자동 다운로드되지 않도록 한다.
- 삭제와 보존기간을 관리할 수 있어야 한다.
- 공개 URL을 무제한 노출하지 않는다.

---

## 49. 개인정보 및 민감정보

### 49.1 개인정보 범위

- 이름
- 소속
- 직책
- 전화번호
- 이메일
- 서명
- 작업자 식별값
- 교육·퀴즈 이력
- 작업·점검 이력

### 49.2 민감하게 관리할 정보

- 온열질환 자율진단
- 건강상태
- 부상정보
- 사고 관련 개인기록
- 위치·출입이력
- 서명 이미지

### 49.3 최소수집 원칙

- 업무 목적에 필요한 정보만 수집한다.
- IP 주소는 필요성과 근거가 확정되지 않으면 수집하지 않는다.
- 개인 연락처를 공개 리포트에 표시하지 않는다.
- 건강정보를 협력사 성과평가에 사용하지 않는다.
- 작업중지권 행사자를 불이익 평가에 사용하지 않는다.
- 실제 개인정보를 Public GitHub에 저장하지 않는다.
- 테스트 데이터에는 가명과 예시 연락처를 사용한다.

---

## 50. 기록 보존정책

### 50.1 기본 원칙

보존기간은 법령, 사내기준, 개인정보 처리기준 및 문서관리 기준을 확인한 후 확정한다.

스키마는 다음 필드를 지원한다.

- retentionCategory
- retentionUntil
- legalHold
- archivedAt
- disposalReviewedAt
- disposalReviewedBy
- deletedAt
- deletedBy

### 50.2 우선 확인 대상

- 안전작업허가서
- 위험성평가
- TBM
- 작업중지권
- 산소·유해가스 측정기록
- 고위험작업 점검
- 서명
- 안전퀴즈
- 안전정보제공서
- 온열질환 자율진단
- 이메일 발송기록

### 50.3 밀폐공간 측정기록

현재 확보된 사내기준에는 산소·유해가스 측정 및 평가 기록을 3년간 보존하도록 명시되어 있다.

정식 적용 전 다음을 확인한다.

- 기준 문서 최신성
- 보존 시작일
- 보존 대상 필드
- 전자기록 인정요건
- 접근권한
- 삭제 제한
- 백업 및 내보내기 방법

### 50.4 자동 삭제 제약

Cloud Functions를 사용하지 않으므로 자동 삭제를 전제로 하지 않는다.

다음 방식 중 하나를 사용한다.

- 관리자 정리 화면
- 승인된 수동 정리 절차
- 데스크톱 관리 스크립트
- 향후 서버 환경 도입 시 자동화

삭제 전 보존기간과 법적 보존 필요성을 확인한다.

---

## 51. Firestore 보안 원칙

### 51.1 공통 원칙

- 모든 운영 컬렉션의 무인증 읽기·쓰기를 금지한다.
- 최소권한 원칙을 적용한다.
- 화면에서 버튼을 숨기는 것만으로 권한을 통제하지 않는다.
- Firestore Security Rules에서 권한을 검증한다.
- 일반 사용자가 역할값과 승인정보를 직접 변경할 수 없어야 한다.
- 일반 사용자가 JSA_DB 승인상태를 변경할 수 없어야 한다.
- 생성자와 승인자의 역할을 필요한 경우 분리한다.

### 51.2 역할별 기본 권한

| 역할 | 기본 권한 |
|---|---|
| worker | 본인 관련 조회·작성·TBM 확인·작업중지 요청 |
| manager | 위험성평가·허가 검토·점검·조치·재개 검토 |
| admin | 기준·권한·승인·폐기·마이그레이션 관리 |

구체 권한은 업무 역할과 사내 승인체계에 따라 세분화한다.

### 51.3 중요 보호대상

- users.role
- JSA_DB.metadata.status
- 사내안전기준.status
- 고위험작업승인.approval
- 작업허가.approvals
- 작업허가.ils
- 작업허가.closeout
- 작업중지.restartApproval
- 건강정보
- 서명
- 개인정보

### 51.4 Custom Claims 주의

Firebase Auth Custom Claims는 일반 웹 브라우저에서 임의 설정하지 않는다.

역할 부여는 신뢰할 수 있는 관리자 환경에서 수행한다.

Cloud Functions를 사용하지 않는 현재 정책에서는 다음 운영방법을 별도로 확정해야 한다.

- 관리자 PC의 Admin SDK 도구
- 승인된 관리 스크립트
- 별도 신뢰 서버
- 초기 Firestore 사용자 문서 방식 후 전환

운영방법이 확정되기 전까지 브라우저에서 관리자 역할을 부여하는 기능을 구현하지 않는다.

---

## 52. Firestore 쿼리·인덱스 원칙

### 52.1 기본 조회키

| 컬렉션 | 주요 조회키 |
|---|---|
| 작업DB | date, status, company |
| 안전정보제공 | workId, permitNo, status, date |
| 안전퀴즈 | respondentId, respondentCompany, status, validUntil |
| 위험성평가 | workId, permitNo, date, status |
| 고위험작업승인 | permitNo, riskId, status |
| 작업허가 | workId, date, status, companyName |
| TBM | permitNo, workId, riskId, date, status |
| 작업중지·긴급조치 | permitNo, workId, date, status |
| 작업중점검 | permitNo, scheduledAt, status, inspectionRole |
| 가스측정기록 | permitNo, measuredAt, measurementType |
| JSA_DB | metadata.status, classCode, workType |
| 작업장비체크리스트 | permitNo, tbmNo, equipmentType |
| 온열질환진단 | permitNo, date, status |

### 52.2 인덱스 후보

실제 쿼리를 기준으로 필요한 복합 인덱스를 추가한다.

예:

- 작업허가: date + status
- 작업허가: companyName + date
- 위험성평가: workId + date
- TBM: permitNo + status
- 안전퀴즈: respondentId + status + validUntil
- 작업중지: permitNo + status
- 작업중점검: permitNo + scheduledAt
- 작업중점검: inspectionRole + status + scheduledAt
- 가스측정기록: permitNo + measuredAt
- JSA_DB: metadata.status + classCode
- JSA_DB: metadata.status + workType

불필요한 인덱스를 미리 대량 생성하지 않는다.

Firestore에서 실제 쿼리 오류가 발생하거나 조회 패턴이 확정된 후 필요한 인덱스를 추가한다.

### 52.3 JSA 유사도 검색

Firestore의 단순 접두어 쿼리를 유사작업 검색의 핵심 기능으로 사용하지 않는다.

현재 데이터 규모에서는 다음 방식을 권장한다.

1. 승인된 JSA_DB 로드
2. 버전 기반 로컬 캐시
3. 클라이언트에서 다중 필드 유사도 계산
4. 유사 작업·사내기준·재해·아차 자료 구분
5. 상위 후보 표시
6. 사용자 선택

---

## 53. JSA_DB 캐시 정책

### 53.1 캐시 데이터

- 승인된 JSA 데이터
- 데이터셋 버전
- 캐시 생성시각
- 마지막 확인시각

### 53.2 캐시 키

개발 단계:

- jsa_database
- jsa_database_at
- jsa_database_version

### 53.3 무효화 원칙

24시간만으로 캐시 유효성을 판단하지 않는다.

다음 중 하나가 변경되면 캐시를 갱신한다.

- 데이터셋 버전
- 승인된 JSA 개수
- 최종 배포시각
- 사용자의 수동 새로고침
- JSON 파싱 오류
- 스키마 버전 변경

### 53.4 로딩 상태

앱은 다음 상태를 구분한다.

- 로딩 전
- 로딩 중
- 캐시 사용
- 신규 로드 완료
- 로드 실패
- 버전 불일치

JSA_DB 로드가 끝나기 전에 검색을 실행하여 데이터 없음으로 오인하지 않도록 한다.

---

## 54. localStorage 마이그레이션

### 54.1 마이그레이션 대상

| 폐기 키 | 정식 키 |
|---|---|
| firebasePermits | safetyPermits |
| safetyInfoDocs | safetyProvisions |
| safetyInfoSigned | safetyProvisions 내부 서명 |
| riskDatabase | riskAssessments |
| safetyRiskAssessments | riskAssessments |
| safetyStopWork | emergencies |
| tbmLogs | safetyTBM |

### 54.2 기본 절차

1. 정식 키 데이터 읽기
2. 폐기 키 존재 여부 확인
3. JSON 파싱
4. 자연키 기준 중복 확인
5. 구형 필드 변환
6. 정식 키에 병합
7. 병합 결과 검증
8. 마이그레이션 이력 기록
9. 성공 확인 후 폐기 키 제거
10. 실패 시 원본 유지

### 54.3 주의사항

- 파싱 실패 시 원본 키를 삭제하지 않는다.
- riskId가 없는 과거 위험성평가를 자동 승인자료로 만들지 않는다.
- 같은 workId의 재평가 기록을 하나로 덮어쓰지 않는다.
- 서명·이미지 데이터 크기를 확인한다.
- 상태값을 한글 정식값으로 변환한다.
- 긴급조치 type의 영문값을 한글값으로 변환한다.

권장 변환:

| 구형 값 | 정식 값 |
|---|---|
| accident | 사고 |
| stop | 중지 |
| urgent | 긴급 |
| approved | 허가완료 |
| working | 작업중 |
| completed | 작업완료 |

---

## 55. Firestore 이관 순서

### Phase A: 기준·마스터 데이터

1. 공장안전정보
2. MSDS
3. 협력사관리
4. 작업자관리
5. 사내안전기준
6. 안전철칙
7. 체크리스트마스터
8. JSA_DB

### Phase B: 작업 전 업무 데이터

9. 작업DB
10. 안전정보제공
11. 안전퀴즈
12. 위험성평가
13. 고위험작업승인
14. 작업허가

### Phase C: 작업 실행 데이터

15. TBM
16. 가스측정기록
17. 밀폐공간출입기록
18. 작업장비체크리스트
19. 작업중점검
20. 작업중지·긴급조치
21. 온열질환진단

### Phase D: 운영 데이터

22. 이메일로그
23. 월간통계
24. 협력사통계
25. counters

참조 대상 마스터와 상위 업무 문서를 먼저 이관한다.

---

## 56. 마이그레이션 검증

컬렉션별로 다음을 확인한다.

### 식별번호

- 문서 ID와 자연키 일치
- 중복 없음
- 빈 ID 없음
- 폐기된 임시 ID 없음

### 참조관계

- workId 존재
- permitNo 존재
- riskId 존재
- tbmNo 존재
- jsaId 존재
- 참조 대상 문서 존재

### 필수필드

- 상태값
- 업무 날짜
- 작성자
- 생성·수정 시각
- schemaVersion

### 업무 규칙

- 작업자 제출만으로 허가완료가 되지 않음
- ILS 미확인 상태에서 허가완료가 되지 않음
- 퀴즈 미합격자가 작업 참여자로 확정되지 않음
- 고위험 사전승인 전 허가완료가 되지 않음
- ILS 해제 확인 전 작업완료가 되지 않음
- 승인되지 않은 JSA가 일반 추천에 사용되지 않음

### 개인정보

- 실제 개인정보가 테스트 데이터에 포함되지 않음
- 공개 저장소에 서명·연락처가 없음
- 건강정보 접근권한이 제한됨
- 불필요한 IP 주소가 저장되지 않음

---

## 57. 데이터 검증 오류 처리

검증에 실패한 문서는 자동 삭제하지 않는다.

다음 상태 중 하나로 분류한다.

- migration_pending
- migration_error
- review_required
- duplicate_candidate
- missing_reference
- invalid_status
- invalid_schema

오류 기록에는 다음을 포함한다.

- 문서 종류
- 원본 키 또는 문서 ID
- 오류 코드
- 오류 설명
- 확인 필요 필드
- 발생 시각
- 처리 상태
- 처리자
- 처리 시각

---

## 58. 트랜잭션 및 동시성

### 58.1 시퀀스

Firestore 이관 후 번호 발급은 counters 컬렉션과 Transaction을 사용한다.

### 58.2 상태 변경

허가승인, 작업중지, 작업재개, 작업완료 등 여러 문서를 동시에 변경해야 하는 경우 가능한 범위에서 Transaction 또는 Batch를 사용한다.

예:

작업중지 요청 시:

- 긴급조치 생성
- 작업허가 상태 변경
- 작업DB 상태 변경
- 관련 문서 상태 표시

### 58.3 localStorage 제약

localStorage 단계에서는 완전한 동시성 제어가 불가능하다.

따라서 개발 단계에서 발급된 시퀀스와 상태변경 기록은 정식 운영 전 중복검사를 수행한다.

---

## 59. 오프라인·실패 처리

### 59.1 저장 실패

저장 실패 시 성공 화면을 먼저 표시하지 않는다.

다음 정보를 사용자에게 안내한다.

- 저장 실패
- 재시도 가능 여부
- 로컬 임시저장 여부
- 중복 제출 방지 상태

### 59.2 부분 저장 방지

여러 문서를 변경하는 과정에서 일부만 성공한 경우 상태를 확인할 수 있어야 한다.

예:

- 위험성평가는 저장됐지만 허가서 연결 실패
- 작업중지는 저장됐지만 허가 상태 변경 실패
- 작업완료는 저장됐지만 ILS 해제 확인 누락

이 경우 `syncStatus`를 사용할 수 있다.

허용값 예:

- synced
- pending
- partial
- failed

### 59.3 중복 제출 방지

제출 버튼을 누른 뒤 저장이 완료될 때까지 버튼을 비활성화한다.

동일 자연키의 중복 문서가 생성되지 않도록 한다.

---

## 60. 스키마 버전 관리

### 60.1 버전 원칙

- 구형 데이터는 즉시 삭제하지 않는다.
- 앱은 마이그레이션 기간 동안 이전 버전을 읽을 수 있어야 한다.
- 신규 저장은 최신 스키마를 사용한다.
- 변환 완료 여부를 기록한다.
- 스키마 버전과 업무 문서 버전을 구분한다.

### 60.2 주요 버전

| 데이터 | 현재·목표 버전 |
|---|---|
| JSA_DB 평면 샘플 | v2 또는 레거시 |
| JSA_DB 구조화 | v3 |
| 위험성평가 기존 | v2 |
| 위험성평가 위험항목 구조화 | v3 |
| 작업허가 목표 | v2 |
| TBM 목표 | v2 |
| 작업중지 목표 | v2 |

### 60.3 하위 호환

- 기존 `referencedJSA`를 읽을 수 있다.
- 신규 저장은 `referencedJSAs`를 우선한다.
- 기존 `riskMeasures`를 읽을 수 있다.
- 신규 저장은 구조화된 위험·대책을 우선한다.
- 기존 TBM 위험요인 문자열을 읽을 수 있다.
- 신규 저장은 `riskItemId` 기반 구조를 우선한다.
- 구형 데이터가 있다는 이유로 신규 데이터를 구형 구조로 저장하지 않는다.

---

## 61. 통합 리포트

### 61.1 중심키

permitNo를 기준으로 관련 문서를 조회한다.

### 61.2 포함 대상

- 작업정보
- 안전정보제공서
- 작업자 안전퀴즈 검증 요약
- 위험성평가
- 참조 JSA
- 고위험 판정
- 고위험 사전승인
- 안전작업허가서
- 허가 전 ILS 확인
- 산소·유해가스 측정
- TBM
- 작업중지권 고지
- 작업장비 체크리스트
- 밀폐공간 출입기록
- 고위험작업 점검
- 작업중지·개선조치·재개
- 재TBM
- 작업 종료 확인
- ILS 해제 확인
- 설비 인계
- 상태 변경 이력

### 61.3 개인정보 표시

통합 리포트는 사용자 권한에 따라 개인정보 표시 범위를 제한한다.

일반 조회 화면에서는 다음을 최소화한다.

- 전화번호
- 이메일
- 서명
- 건강정보
- 개인별 사고·위반 이력

---

## 62. 테스트 데이터 원칙

- 실제 이름을 사용하지 않는다.
- 실제 전화번호를 사용하지 않는다.
- 실제 이메일을 사용하지 않는다.
- 실제 서명 이미지를 사용하지 않는다.
- 민감한 설비 위치를 상세히 공개하지 않는다.
- 테스트 문서에는 `TEST` 또는 `SAMPLE` 표시를 한다.
- 테스트 데이터가 운영 통계에 포함되지 않도록 한다.
- 테스트 완료 후 삭제 또는 별도 분리한다.

---

## 63. 필수 통합 테스트

### 63.1 안전정보제공

- 도급인 발행
- 수급인 확인·서명
- 반려
- 보완 후 재서명
- 허가서 연결

### 63.2 안전퀴즈

- 합격자 작업 참여
- 불합격자 참여 제한
- 미응시자 참여 제한
- 유효기간 만료자 재응시
- 소속 불일치 확인
- 작업중지 신고는 허용

### 63.3 위험성평가

- 복수 JSA 참조
- 위험요인 선택
- 사용자 위험 추가
- AI 위험 분리
- 위험별 최초 위험도
- 위험별 대책
- 위험별 잔여 위험도
- 통제 적정성
- 재평가 이력

### 63.4 고위험작업

- 복합 고위험 판정
- 예외 적용
- 합동 사전검토
- 맞춤 체크리스트
- 사전승인
- 생명지킴이 배치

### 63.5 작업허가

- 제출과 최종 승인 분리
- 필수자료 검증
- ILS 완료 확인
- 밀폐공간 최초 측정
- 고위험 승인 검증
- 연장 요청·승인
- 변경·재허가

### 63.6 TBM

- permitNo 조회
- 위험성평가 자동 반영
- 위험과 대책 연결
- 조치 예정자
- 안전퀴즈 검증
- ILS 읽기 전용 확인
- 작업중지권 고지
- 조건부 별지
- 재TBM

### 63.7 작업중지

- 작업중지 요청
- 허가 상태 변경
- 작업DB 상태 변경
- 개선조치
- 재점검
- 위험성평가 재검토
- 허가 재확인
- 재TBM
- 재개 승인

### 63.8 작업 중 점검

- 예정시간 생성
- 생명지킴이 2시간 점검
- 부서별 오전·오후 점검
- 대리점검
- 미흡·조치·재점검
- 미실시 경고

### 63.9 작업 종료

- 작업자 철수
- 밀폐공간 퇴실 확인
- 공구·자재 제거
- 방호장치 복구
- 미흡사항 종결
- ILS 해제 완료 확인
- 설비 인계
- 최종 작업완료

---

## 64. 전체 완료 기준

DB 스키마 개정은 다음 조건을 충족할 때 완료로 판단한다.

- 모든 업무 문서의 자연키가 통일됨
- 문서 ID와 내부 자연키가 일치함
- workId와 permitNo 관계가 명확함
- JSA_DB와 실제 위험성평가가 구분됨
- JSA_DB 위험요인과 대책이 구조화됨
- 위험성평가가 위험요인별로 저장됨
- 최초·잔여 위험도가 구분됨
- 복수 JSA 참조가 가능함
- 작업유형과 고위험작업 여부가 분리됨
- 고위험 사전승인이 관리됨
- 안전퀴즈 합격이 작업 참여조건으로 적용됨
- 허가 전 ILS 완료상태가 확인됨
- 밀폐공간 측정이 위치·시간별로 저장됨
- TBM에 위험·대책·조치자가 연결됨
- TBM과 실제 작업중지 요청이 분리됨
- 작업중지 후 재개 절차가 기록됨
- 작업 중 점검과 미흡조치가 관리됨
- 작업 종료 시 철수·복구가 확인됨
- ILS 해제 완료 전 작업완료가 제한됨
- permitNo 기준 통합 리포트가 가능함
- 개인정보와 건강정보가 최소화됨
- 승인·상태·변경 이력이 보존됨
- localStorage 데이터를 Firestore로 안전하게 이관할 수 있음

---

## 65. 구현 우선순위

### P0: 문서·규약

1. PROJECT_CONVENTIONS.md 최신화
2. JSA_DB_PROMPT.md 저장
3. JSA_DB_STRUCTURE.md 저장
4. PAPER_FORM_DIGITAL_MAPPING.md 저장
5. HIGH_RISK_WORK_POLICY.md 저장
6. DB_SCHEMA.md v2 저장
7. 문서 간 용어·상태·필드 충돌 검토

### P1: 필수 안전 게이트

8. 안전퀴즈 출입 필수조건
9. 허가 제출·승인 분리
10. 허가 전 ILS 완료 확인
11. 밀폐공간 전체 측정행 저장·검증
12. 작업 종료 및 ILS 해제 확인
13. 고위험 판정과 사전승인

### P2: 위험성평가 고도화

14. 위험요인 선택·추가
15. 복수 JSA 참조
16. 위험요인과 대책 연결
17. 최초·잔여 위험도
18. 통제 적정성 추천과 판정 사유
19. 맞춤 체크리스트 생성
20. 재평가 이력

### P3: TBM·작업중지·현장점검

21. TBM과 작업중지권 파일 분리
22. 위험·대책·조치자 자동 반영
23. 참석자 안전퀴즈 검증
24. 조건부 별지
25. 재TBM
26. 작업 중 주기점검
27. 미흡·작업중지·조치·재개

### P4: 운영 전환

28. 통합 리포트
29. Firestore 보안규칙
30. 기준·마스터 데이터 이관
31. 업무 데이터 이관
32. 역할별 권한
33. 기록 보존 및 개인정보 보호
34. 운영 테스트

---

## 66. 미확정 항목

다음 항목은 담당부서의 추가 확인이 필요하다.

- 안전퀴즈 합격점수
- 안전퀴즈 유효기간
- 안전퀴즈 적용 대상과 예외
- 고위험작업 기준 문서의 문서번호·버전·시행일
- 고위험작업 예외의 정확한 적용범위
- CCTV 적용범위
- 생명지킴이 자격과 대리 가능 여부
- 오전·오후 점검의 시간대
- 화기작업 LEL 0% 기준 적용범위
- 화재감시자 거리·감시범위
- 잔불 확인시간
- 사다리 높이·작업높이·용도별 기준
- 밀폐공간 종이 별지의 측정주기 표기
- 산소 측정값의 위치별 최종 판정방식
- 전기작업 기준의 최신 법령 적용범위
- ILS 기존 시스템 연동방법
- ILS 참조번호 형식
- 작업중지 재개 승인권자
- 서명·사진 저장방식
- 개인정보·건강정보 보존기간
- Firestore Auth 역할 부여 운영방법
- 통계문서 갱신방식

미확정 항목은 코드에 하드코딩하지 않는다.

필요한 경우 설정값 또는 기준 마스터에서 관리한다.

---

## 67. 변경 이력

| 버전 | 날짜 | 변경내용 |
|---|---|---|
| 1.0 | 2026-08-22 | 초기 16개 컬렉션 설계 |
| 2.0 | 2026-08-27 | JSA_DB v3, 위험요인별 평가, 고위험작업, ILS 확인, 안전퀴즈 게이트, TBM 분리, 작업중지·종료 구조 반영 |

---

## 68. 최종 원칙

이 스키마는 다음 전체 흐름을 하나의 연결된 안전관리 프로세스로 관리한다.

> 안전정보 제공 → 안전퀴즈 합격 → 위험성평가 → 고위험작업 사전승인 → 안전작업허가 → ILS 완료 확인 → TBM → 작업 중 점검 → 작업중지·개선조치 → 재평가·재허가·재TBM → 작업 종료 → ILS 해제 확인 → 설비 인계 → 통합 보관

JSA_DB와 AI는 위험요인과 안전대책을 제안하고 누락을 확인하는 보조수단이다.

별도 ILS 시스템은 잠금·해제 상세기록의 원본 시스템으로 유지한다.

안전관리 플랫폼은 ILS 실시 완료와 해제 완료 사실을 확인하고 작업허가 및 작업완료의 필수 게이트로 사용한다.

최종 위험성평가, 고위험 승인, 작업허가, 작업중지 후 재개 및 작업완료는 권한 있는 사람이 현장조건을 확인한 후 결정한다.
