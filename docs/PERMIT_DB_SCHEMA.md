# 작업허가서 DB 스키마 확정안

문서명: PERMIT_DB_SCHEMA.md  
버전: 1.0  
상태: 확정 초안  
작성 기준일: 2026-08-27  
적용 대상: 안전작업허가서_v2, 작업허가 컬렉션, 위험성평가·TBM·작업중지 연계

---

## 1. 목적

이 문서는 안전작업허가서(PTW)의 저장 구조를 정의한다.

작업허가서는 다음 목적에 사용한다.

- 작업허가 신청
- 허가 상태 관리
- 작업 시작 전 안전조치 확인
- ILS 필요 여부 및 확인 결과 관리
- 위험성평가 연결
- TBM 연결
- 작업중지 상태 연계
- 연장 및 유효기간 관리
- 작업 종료 및 통합 리포트 연결

작업허가서는 작업 원본을 참조하여 생성되는 **실행 허가 문서**이다.

작업허가서는 작업관리대장 원본을 대체하지 않는다.

---

## 2. 저장 계층

### 2.1 개발/현행 계층

localStorage 키:

    safetyPermits

### 2.2 운영/이관 계층

Firestore 컬렉션:

    작업허가

문서 ID:

    permitNo

---

## 3. 식별 규칙

### 3.1 permitNo

형식:

    PTW-YYYYMMDD-SEQ3

예:

    PTW-20260827-001

### 3.2 원칙

- permitNo는 작업허가 문서의 정식 식별번호이다.
- Firestore 문서 ID와 내부 permitNo는 동일해야 한다.
- permitNo는 통합 리포트의 중심키로 사용한다.
- permitNo는 위험성평가, TBM, 작업중지 등 실행 문서의 연결 기준이 된다.
- 별도의 `PERMIT-Date.now()` 방식은 운영 문서 식별번호로 사용하지 않는다.

---

## 4. 상위 원본 참조

작업허가서는 반드시 작업 원본을 참조한다.

### 4.1 필수 참조 필드

- workId

예:

```json
{
  "workId": "2026-07-01_1",
  "permitNo": "PTW-20260701-001"
}
4.2 원칙
workId 는 permit의 상위 원본 연결키이다.
permit는 workId 없이 생성하지 않는 것을 원칙으로 한다.
permit는 원본 작업을 참조하지만, workId가 permitNo를 대체하지 않는다.
permit는 하나의 workId를 참조할 수 있다.
하나의 workId에 대해 여러 permitNo가 발생할 수 있다.
5. 입력원 정책
permit는 원본 작업정보의 입력원을 보존할 수 있다.

5.1 sourceType 허용값
excel-paste
excel-upload
company-server
manual
migration
5.2 원칙
현재는 excel-paste / excel-upload 기반 workId를 참조할 수 있다.
향후 회사 서버 연동 시 company-server를 사용한다.
sourceType은 permit 원본의 출처 추적용이다.
sourceType이 달라도 permit 스키마는 동일하다.
6. permit 문서 구조
{
  "permitNo": "PTW-20260701-001",

  "workId": "2026-07-01_1",
  "sourceType": "excel-paste",
  "sourceRecordId": "",

  "woNumber": "WO10975076",
  "workName": "4라인 단결정 RHK ROLLER BLANKET 및 ROLLER 조립",
  "location": "1공장",
  "detailLocation": "공장2층",
  "workDescription": "정기수리 중 4라인 단결정 RHK ROLLER BLANKET 및 ROLLER 조립 작업",

  "operationDept": "공장",
  "instructionDept": "정비섹션",
  "companyName": "직영",
  "subcontractCompany": "",
  "workerCount": 2,
  "supervisor": "배서준",
  "contractorManager": "",

  "startDate": "2026-07-01",
  "startTime": "08:00",
  "endDate": "2026-07-01",
  "endTime": "17:00",
  "workTimeRaw": "08:00~17:00",

  "workTypes": ["confined"],
  "psmFacility": "일반 설비",

  "requiredPlans": ["밀폐작업 계획서"],
  "workPlaceRaw": "공장2층",
  "permitPlace": "공장B-2F",
  "permitApprover": "이치종",
  "permitExecutionFlag": "○",

  "ilsMemoRaw": "시스템 미지정, 단결정 메인 산소 차단, IL144240, IL144253 차단 요청",
  "ils": {
    "required": true,
    "confirmed": false,
    "referenceNo": "",
    "confirmedAt": "",
    "confirmedBy": "",
    "machineIlsRefNo": "",
    "electricIlsRefNo": "",
    "gibNo": "",
    "targetMatched": false,
    "closeoutConfirmed": false,
    "closeoutConfirmedAt": "",
    "closeoutConfirmedBy": ""
  },

  "checklist": {},
  "checklistReasons": {},
  "ILSChecklist": {},
  "ILSReasons": {},
  "questions": {},
  "questionReasons": {},

  "workerSignature": "",
  "supervisorName": "배서준",
  "supervisorPhone": "",
  "supervisorEmail": "",

  "status": "허가진행중",
  "statusHistory": [],

  "riskId": null,
  "tbmNo": null,
  "emergencyNo": null,
  "inspectionNos": [],

  "validity": {
    "isNight": false,
    "originalEndDateTime": "2026-07-01T17:00",
    "currentEndDateTime": "2026-07-01T17:00",
    "extensionCount": 0,
    "extensions": []
  },

  "approvals": {
    "requestedAt": "",
    "requestedBy": "",
    "requestComment": "",
    "supervisorApprovedAt": "",
    "supervisorApprovedBy": "",
    "finalApprovedAt": "",
    "finalApprovedBy": "",
    "approvalComment": "",
    "rejectedAt": "",
    "rejectedBy": "",
    "rejectionReason": ""
  },

  "closeout": {
    "workersCleared": false,
    "toolsRemoved": false,
    "areaCleaned": false,
    "guardsRestored": false,
    "facilityHandedOver": false,
    "closeoutComment": ""
  },

  "createdAt": "",
  "updatedAt": "",
  "createdBy": "",
  "updatedBy": "",
  "schemaVersion": 1
}
7. 필드 분류
permit 문서의 필드는 4개 그룹으로 나눈다.

7.1 원본 연결 필드
permitNo
workId
sourceType
sourceRecordId
7.2 원본 스냅샷 필드
woNumber
workName
location
detailLocation
workDescription
operationDept
instructionDept
companyName
subcontractCompany
workerCount
supervisor
contractorManager
startDate
startTime
endDate
endTime
workTimeRaw
workTypes
requiredPlans
workPlaceRaw
permitPlace
permitApprover
permitExecutionFlag
ilsMemoRaw
7.3 실행 허가 필드
status
checklist
checklistReasons
ILSChecklist
ILSReasons
questions
questionReasons
ils
approvals
validity
riskId
tbmNo
emergencyNo
inspectionNos
closeout
7.4 감사 필드
createdAt
updatedAt
createdBy
updatedBy
schemaVersion
statusHistory
8. 상태값 규약
허가서 상태는 다음 값만 사용한다.

대기중
허가진행중
허가완료
작업중
작업중지
작업완료
8.1 상태 전환 원칙
작업자 입력 완료 = 자동으로 허가완료가 아님
작업자 입력 및 제출 = 허가진행중
권한 있는 허가자 승인 완료 = 허가완료
TBM 완료 후 실제 작업 시작 = 작업중
작업중지 요청 발생 = 작업중지
종료 및 ILS 해제 확인까지 완료 = 작업완료
8.2 statusHistory
상태 변경은 현재값만 덮어쓰지 않고 이력을 남길 수 있어야 한다.

예:

[
  {
    "from": "허가진행중",
    "to": "허가완료",
    "changedAt": "",
    "changedBy": "",
    "reason": "최종 승인 완료"
  }
]
9. validity 구조
허가서의 연장/유효기간 관리는 validity 객체로 관리한다.

{
  "isNight": false,
  "originalEndDateTime": "2026-07-01T17:00",
  "currentEndDateTime": "2026-07-01T22:00",
  "extensionCount": 1,
  "extensions": []
}
9.1 필드 설명
필드	설명
isNight	야간 작업 여부
originalEndDateTime	최초 종료 예정 시각
currentEndDateTime	현재 유효 종료 시각
extensionCount	누적 연장 횟수
extensions	연장 이력 배열
9.2 원칙
최초 종료 시각은 보존한다.
현재 유효 종료 시각은 갱신한다.
연장 이력은 삭제하지 않는다.
연장 전/후 시각과 사유, 승인자를 기록한다.

---

## 🔹 PART 2 / 3

```md
## 10. extensions 구조

각 연장 이력은 다음 구조를 가진다.

```json
{
  "extensionId": "EXT-1724678400000",
  "requestedAt": "",
  "requestedBy": "",
  "previousEndTime": "2026-07-01T17:00",
  "newEndTime": "2026-07-01T22:00",
  "reason": "작업 지연",
  "confirmations": {
    "worker": true,
    "approver": true,
    "content": true
  },
  "approverSignature": "",
  "approvedBy": ""
}
11. checklist 구조
permit 단계 체크리스트 결과를 저장한다.

예:

{
  "fire-1.1": "ok",
  "fire-1.2": "ok",
  "height-3.1": "ok",
  "height-3.2": "na"
}
허용값:

ok
no
na
11.1 checklistReasons
na 또는 별도 사유가 필요한 항목은 checklistReasons 에 저장한다.

{
  "height-3.2": "해당 장비 미사용"
}
12. ILSChecklist 구조
permit 작성 단계의 ILS 체크리스트 결과를 저장한다.

예:

{
  "1": "ok",
  "2": "ok",
  "3": "na"
}
허용값:

ok
no
na
12.1 ILSReasons
na 또는 기타 사유가 필요한 경우 ILSReasons 에 저장한다.

13. questions 구조
안전 확인 질문 응답 결과를 저장한다.

예:

{
  "C1": "yes",
  "C2": "yes",
  "CF1": "yes"
}
허용값:

yes
no
no 가 있으면 permit 승인 제한 조건이 될 수 있다.

14. ils 구조
ILS 확인 관련 정보는 별도 ils 객체로 관리한다.

{
  "required": true,
  "confirmed": false,
  "referenceNo": "",
  "confirmedAt": "",
  "confirmedBy": "",
  "machineIlsRefNo": "",
  "electricIlsRefNo": "",
  "gibNo": "",
  "targetMatched": false,
  "closeoutConfirmed": false,
  "closeoutConfirmedAt": "",
  "closeoutConfirmedBy": ""
}
14.1 원칙
required 는 작업 특성상 ILS 대상 여부
confirmed 는 허가 전 ILS 완료 확인 여부
referenceNo 는 기존 ILS 시스템 참조번호
targetMatched 는 대상 설비 일치 여부
closeoutConfirmed 는 작업 종료 후 해제 완료 확인 여부
15. approvals 구조
permit 승인 흐름은 approvals 객체로 관리한다.

{
  "requestedAt": "",
  "requestedBy": "",
  "requestComment": "",
  "supervisorApprovedAt": "",
  "supervisorApprovedBy": "",
  "finalApprovedAt": "",
  "finalApprovedBy": "",
  "approvalComment": "",
  "rejectedAt": "",
  "rejectedBy": "",
  "rejectionReason": ""
}
15.1 원칙
신청과 최종 승인 시각을 구분한다.
감독자 승인과 최종 허가자 승인을 구분할 수 있다.
반려/보완요청 사유를 기록할 수 있다.
16. 서명 및 작업책임자 정보
permit 문서에는 다음 정보를 저장할 수 있어야 한다.

workerSignature
supervisorName
supervisorPhone
supervisorEmail
16.1 원칙
현재 단계에서는 구조상 필드를 유지한다.
저장 방식은 향후 별도 정책에 따라 조정 가능하다.
서명 이미지는 대용량 Base64 반복 저장을 주의한다.
17. 다른 문서와의 연결 필드
permit 문서는 다음 연결 필드를 가진다.

riskId
tbmNo
emergencyNo
inspectionNos
17.1 연결 원칙
위험성평가 완료 후 riskId 연결
TBM 완료 후 tbmNo 연결
작업중지 발생 시 emergencyNo 연결
작업 중 점검은 inspectionNos 배열로 누적 가능
permitNo 가 통합 리포트 중심키이다
18. closeout 구조
작업 종료 관련 완료 여부는 closeout 객체에 저장한다.

{
  "workersCleared": false,
  "toolsRemoved": false,
  "areaCleaned": false,
  "guardsRestored": false,
  "facilityHandedOver": false,
  "closeoutComment": ""
}
18.1 원칙
작업자 철수 확인
공구·자재 제거
정리정돈
방호장치 복구
설비 인계
가 모두 확인된 후 작업완료 로 전환한다.

19. 현재 코드 기준 반영 필요사항
현재 안전작업허가서_v2.html 기준으로 다음 수정 검토가 필요하다.

19.1 필수
id: 'PERMIT-' + Date.now() 제거 방향 검토
permit의 정식 식별자는 permitNo 로 통일
workerSignature 저장 반영 여부 확인
supervisorName, supervisorPhone, supervisorEmail 저장 반영
schemaVersion 추가
createdBy, updatedBy 추가
statusHistory 추가 검토
19.2 중요
작업자 입력 완료 시 상태를 바로 허가완료 로 두지 않도록 재검토
허가진행중 → 허가완료 전환 로직 분리 검토
sourceWorkId 와 workId 단일화
19.3 권장
approvals 구조 분리
ils 구조 분리
closeout 구조 분리
inspectionNos 배열 도입

---

## 🔹 PART 3 / 3

```md
## 20. Firestore 저장 원칙

운영 단계에서 permit 문서는 다음 형태를 따른다.

컬렉션:

    작업허가

문서 ID:

    permitNo

예:

    작업허가/PTW-20260701-001

### 20.1 원칙

- Firestore 문서 ID와 permitNo 일치
- permitNo 중복 금지
- permit는 workId를 반드시 참조
- permit 생성 당시 핵심 작업정보를 스냅샷으로 함께 저장
- 연장 이력은 배열로 누적
- 상태 변경은 이력으로 남길 수 있어야 한다

---

## 21. 금지사항

- permitNo 대신 `PERMIT-Date.now()` 를 정식 식별자로 사용
- workId 없이 허가서를 독립 원본처럼 운영
- 작업자 입력 직후 무조건 최종 승인 완료로 간주
- 연장 시 기존 종료 시각 덮어쓰기만 하고 이력 미보존
- ILS 대상 작업을 confirmed 없이 허가완료 처리
- 위험성평가/TBM/작업중지 연결 필드 없이 통합 리포트 구현
- 서명/책임자 정보 누락 상태로 정식 저장
- 상태 변경 이력 없이 현재 상태만 덮어쓰기

---

## 22. 최종 원칙

작업허가서 DB는 **작업 원본(workId)을 기반으로 생성되는 실행 허가 문서**이다.

- 작업DB = 작업 원본
- 작업허가 = 실행 허가 문서
- permitNo = 실행 흐름 중심키
- 위험성평가 / TBM / 작업중지 = permitNo 기반 연결 문서

현재는 엑셀 입력/붙여넣기 기반 작업DB를 참조할 수 있고,
향후 회사 서버 연동 후에도 동일한 permit 스키마를 유지한다.

따라서 permit 설계는
1. `workId` 참조를 명확히 하고
2. `permitNo` 를 정식 식별자로 사용하며
3. 원본 스냅샷 + 허가 실행 필드 + 감사 필드를 분리하는 방향으로 운영한다.
