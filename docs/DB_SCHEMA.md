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
