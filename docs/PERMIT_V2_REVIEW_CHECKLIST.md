# 안전작업허가서_v2 수정 검토 체크리스트

문서명: PERMIT_V2_REVIEW_CHECKLIST.md  
버전: 1.0  
상태: 검토용  
작성 기준일: 2026-08-27  
적용 대상: 안전작업허가서_v2.html, 작업허가 DB 이관 준비

---

## 1. 목적

이 문서는 현재 `안전작업허가서_v2.html` 코드를 기준으로  
Firestore 이관 및 Permit DB 구조 정비 전에 반드시 확인해야 할 수정/검토 포인트를 정리한 체크리스트이다.

주요 목적은 다음과 같다.

- localStorage 저장 구조 점검
- permitNo 중심 식별 구조 정비
- workId 참조 구조 확인
- 상태값 전환 시점 검토
- 저장 누락 필드 점검
- Firestore 전환 시 필요한 필드 보강
- 향후 위험성평가 / TBM / 작업중지 연계 대비

---

## 2. 현재 저장 구조 핵심 요약

현재 `savePermit()` 기준 허가서 저장은 localStorage `safetyPermits` 배열에 push 되는 방식이다.

현재 저장 객체 핵심 필드:

- id
- permitNo
- woNumber
- workName
- location
- detailLocation
- startDate
- startTime
- endDate
- endTime
- workerCount
- companyName
- supervisor
- workDescription
- psmFacility
- workTypes
- checklist
- checklistReasons
- ILSChecklist
- questions
- questionReasons
- sourceWorkId
- status
- createdAt
- validity

현재 구조는 기본 기능은 수행하지만, Firestore 이관 및 규약 기준으로는 보완이 필요하다.

---

## 3. 최우선 검토 항목

### 3.1 식별자 구조

현재 코드에는 다음 구조가 존재한다.

- `id: 'PERMIT-' + Date.now()`
- `permitNo: 'PTW-YYYYMMDD-SEQ3'`

검토 원칙:

- 정식 식별자는 `permitNo` 로 통일
- Firestore 문서 ID도 `permitNo` 사용
- `PERMIT-Date.now()` 방식은 운영 기준 식별자로 사용하지 않음
- 필요 시 `id` 필드는 제거 또는 내부 임시값 용도로만 사용

체크:
- [ ] `id` 제거 여부 검토
- [ ] permitNo를 유일 식별자로 단일화할지 결정
- [ ] Firestore 문서 ID = permitNo 원칙 반영 여부 확인

---

### 3.2 원본 작업 참조 필드

현재 permit는 `sourceWorkId` 를 사용한다.

규약상 permit는 `workId` 를 상위 원본 참조 필드로 사용해야 한다.

검토 원칙:

- `sourceWorkId` 와 `workId` 는 장기적으로 단일화 권장
- permit는 반드시 어떤 작업 원본에서 생성되었는지 추적 가능해야 함
- permit는 workId 없이 독립 원본처럼 저장하지 않음

체크:
- [ ] `sourceWorkId` → `workId` 단일화 여부 검토
- [ ] permit 생성 시 workId 저장 보장 여부 확인
- [ ] workId 없는 신규 생성 허용 기준 검토

---

### 3.3 상태값 전환 시점

현재 `validateStep7()` 완료 후 permitData.status 를 바로 `허가완료` 로 저장한다.

그러나 규약상 작업자 입력 완료 = 최종 허가완료가 아니다.

권장 상태 흐름:

- 작성/제출 완료 → `허가진행중`
- 허가자 최종 승인 완료 → `허가완료`
- TBM 완료 후 작업 시작 → `작업중`
- 작업중지 발생 → `작업중지`
- 종료 및 해제 확인 → `작업완료`

체크:
- [ ] 현재 `허가완료` 저장 시점 재검토
- [ ] 작업자 제출 시 상태를 `허가진행중` 으로 변경할지 검토
- [ ] 허가자 승인 로직 분리 필요 여부 검토
- [ ] statusHistory 도입 여부 검토
## 4. 저장 누락 가능 필드 점검

현재 코드 흐름상 화면에서는 입력하지만 `permitRecord` 저장 객체에 누락될 가능성이 있는 필드를 확인한다.

### 4.1 서명 관련

현재 입력:
- 작업자 서명 canvas
- `permitData.workerSignature`

검토 포인트:
- 실제 `permitRecord` 에 `workerSignature` 저장 반영 여부 확인
- 누락 시 Firestore 이관 전 반드시 보완

체크:
- [ ] workerSignature 저장 여부 확인
- [ ] 저장 누락 시 permitRecord에 추가

---

### 4.2 작업책임자 상세 정보

현재 입력:
- `sup-name`
- `sup-phone`
- `sup-email`

현재 `permitData` 에는:
- supervisorName
- supervisorPhone
- supervisorEmail

이 저장되지만 `permitRecord` 에 반영 여부 확인 필요

체크:
- [ ] supervisorName 저장 여부 확인
- [ ] supervisorPhone 저장 여부 확인
- [ ] supervisorEmail 저장 여부 확인
- [ ] Firestore 스키마와 필드명 일치 여부 확인

---

### 4.3 감사 필드

현재 저장:
- createdAt

보완 필요:
- updatedAt
- createdBy
- updatedBy
- schemaVersion

체크:
- [ ] updatedAt 추가 여부
- [ ] createdBy 추가 여부
- [ ] updatedBy 추가 여부
- [ ] schemaVersion 추가 여부

---

## 5. validity 구조 점검

현재 코드의 `validity` 구조는 비교적 잘 설계되어 있다.

현재 구조:
- isNight
- originalEndDateTime
- currentEndDateTime
- extensionCount
- extensions[]

검토 포인트:
- Firestore 이관 시 구조 그대로 사용 가능
- 연장 이력 누적 방식 유지 권장
- currentEndDateTime / originalEndDateTime 의미 문서화 필요

체크:
- [ ] validity 구조 유지
- [ ] extensionCount 신뢰성 확인
- [ ] extensions 배열 구조 문서화
- [ ] 연장 승인자/사유/시각 누락 없는지 확인

---

## 6. approvals 구조 도입 검토

현재 코드에는 상태는 있으나 승인 구조가 별도 객체로 정리되어 있지 않다.

권장 구조 예:
- requestedAt
- requestedBy
- requestComment
- supervisorApprovedAt
- supervisorApprovedBy
- finalApprovedAt
- finalApprovedBy
- approvalComment
- rejectedAt
- rejectedBy
- rejectionReason

체크:
- [ ] approvals 객체 도입 여부 검토
- [ ] 작업자 제출 시각/제출자 기록 방식 검토
- [ ] 최종 승인 필드 분리 필요 여부 검토
- [ ] 반려/보완 요청 필드 설계 여부 검토

---

## 7. ils 구조 도입 검토

현재 permit에는:
- ILSChecklist
- validity
- sourceWorkId

등은 있으나,
실제 허가 전 ILS 확인 정보를 구조화한 `ils` 객체는 아직 없음

권장 구조 예:
- required
- confirmed
- referenceNo
- confirmedAt
- confirmedBy
- machineIlsRefNo
- electricIlsRefNo
- gibNo
- targetMatched
- closeoutConfirmed
- closeoutConfirmedAt
- closeoutConfirmedBy

체크:
- [ ] ils 객체 도입 여부 검토
- [ ] 기존 ILSChecklist와 역할 구분 필요
- [ ] 허가 전 확인 / 종료 후 해제 확인 분리 여부 검토
## 4. 저장 누락 가능 필드 점검

현재 코드 흐름상 화면에서는 입력하지만 `permitRecord` 저장 객체에 누락될 가능성이 있는 필드를 확인한다.

### 4.1 서명 관련

현재 입력:
- 작업자 서명 canvas
- `permitData.workerSignature`

검토 포인트:
- 실제 `permitRecord` 에 `workerSignature` 저장 반영 여부 확인
- 누락 시 Firestore 이관 전 반드시 보완

체크:
- [ ] workerSignature 저장 여부 확인
- [ ] 저장 누락 시 permitRecord에 추가

---

### 4.2 작업책임자 상세 정보

현재 입력:
- `sup-name`
- `sup-phone`
- `sup-email`

현재 `permitData` 에는:
- supervisorName
- supervisorPhone
- supervisorEmail

이 저장되지만 `permitRecord` 에 반영 여부 확인 필요

체크:
- [ ] supervisorName 저장 여부 확인
- [ ] supervisorPhone 저장 여부 확인
- [ ] supervisorEmail 저장 여부 확인
- [ ] Firestore 스키마와 필드명 일치 여부 확인

---

### 4.3 감사 필드

현재 저장:
- createdAt

보완 필요:
- updatedAt
- createdBy
- updatedBy
- schemaVersion

체크:
- [ ] updatedAt 추가 여부
- [ ] createdBy 추가 여부
- [ ] updatedBy 추가 여부
- [ ] schemaVersion 추가 여부

---

## 5. validity 구조 점검

현재 코드의 `validity` 구조는 비교적 잘 설계되어 있다.

현재 구조:
- isNight
- originalEndDateTime
- currentEndDateTime
- extensionCount
- extensions[]

검토 포인트:
- Firestore 이관 시 구조 그대로 사용 가능
- 연장 이력 누적 방식 유지 권장
- currentEndDateTime / originalEndDateTime 의미 문서화 필요

체크:
- [ ] validity 구조 유지
- [ ] extensionCount 신뢰성 확인
- [ ] extensions 배열 구조 문서화
- [ ] 연장 승인자/사유/시각 누락 없는지 확인

---

## 6. approvals 구조 도입 검토

현재 코드에는 상태는 있으나 승인 구조가 별도 객체로 정리되어 있지 않다.

권장 구조 예:
- requestedAt
- requestedBy
- requestComment
- supervisorApprovedAt
- supervisorApprovedBy
- finalApprovedAt
- finalApprovedBy
- approvalComment
- rejectedAt
- rejectedBy
- rejectionReason

체크:
- [ ] approvals 객체 도입 여부 검토
- [ ] 작업자 제출 시각/제출자 기록 방식 검토
- [ ] 최종 승인 필드 분리 필요 여부 검토
- [ ] 반려/보완 요청 필드 설계 여부 검토

---

## 7. ils 구조 도입 검토

현재 permit에는:
- ILSChecklist
- validity
- sourceWorkId

등은 있으나,
실제 허가 전 ILS 확인 정보를 구조화한 `ils` 객체는 아직 없음

권장 구조 예:
- required
- confirmed
- referenceNo
- confirmedAt
- confirmedBy
- machineIlsRefNo
- electricIlsRefNo
- gibNo
- targetMatched
- closeoutConfirmed
- closeoutConfirmedAt
- closeoutConfirmedBy

체크:
- [ ] ils 객체 도입 여부 검토
- [ ] 기존 ILSChecklist와 역할 구분 필요
- [ ] 허가 전 확인 / 종료 후 해제 확인 분리 여부 검토
## 8. 위험성평가 / TBM / 작업중지 연결 필드

permit 문서는 실행 흐름의 중심 문서이므로 다음 연결 필드를 가질 수 있어야 한다.

- riskId
- tbmNo
- emergencyNo
- inspectionNos

현재 코드에는 이 연결 구조가 충분히 반영되지 않았을 수 있다.

체크:
- [ ] riskId 연결 필드 도입 여부 검토
- [ ] tbmNo 연결 필드 도입 여부 검토
- [ ] emergencyNo 연결 필드 도입 여부 검토
- [ ] inspectionNos 배열 도입 여부 검토

---

## 9. closeout 구조 도입 검토

현재 permit에는 종료 확인과 ILS 해제 완료를 구조적으로 저장하는 `closeout` 객체가 없다.

권장 구조 예:
- workersCleared
- toolsRemoved
- areaCleaned
- guardsRestored
- facilityHandedOver
- closeoutComment

체크:
- [ ] closeout 구조 도입 여부 검토
- [ ] 작업완료 전 필수 확인항목 구조화 여부 검토
- [ ] ILS 해제 완료와 closeout의 경계 정의 여부 검토

---

## 10. 원본 작업 스냅샷 유지 검토

permit는 `workId` 만 참조하는 것이 아니라,
permit 생성 당시 핵심 작업정보도 함께 저장해야 한다.

이유:
- 원본 작업정보 변경 시 당시 permit 의미 보존
- 감사 대응
- 통합 리포트
- 이력 추적

유지 권장 스냅샷 필드:
- woNumber
- workName
- location
- detailLocation
- workDescription
- companyName
- subcontractCompany
- workerCount
- supervisor
- workTypes
- requiredPlans
- ilsMemoRaw

체크:
- [ ] 원본 스냅샷 필드 유지 여부 확인
- [ ] permit가 workId 참조만 하고 나머지 필드를 조회 의존하지 않도록 검토
- [ ] 당시 허가 기준값 보존 필요성 확인

---

## 11. 현재 코드 기준 권장 우선순위

### P0
- [ ] permit 식별자를 permitNo 중심으로 재정렬
- [ ] workId 저장 구조 정리
- [ ] status 저장 시점 재검토
- [ ] workerSignature 저장 확인
- [ ] supervisorName / supervisorPhone / supervisorEmail 저장 반영
- [ ] schemaVersion 추가

### P1
- [ ] approvals 객체 도입
- [ ] ils 객체 도입
- [ ] riskId / tbmNo / emergencyNo 연결 필드 도입
- [ ] updatedAt / updatedBy 추가

### P2
- [ ] closeout 구조 도입
- [ ] statusHistory 도입
- [ ] inspectionNos 배열 도입
- [ ] Firestore `작업허가/{permitNo}` 구조로 매핑

---

## 12. 금지사항

- `PERMIT-Date.now()` 를 정식 문서 식별자로 계속 사용
- workId 없이 permit를 독립 원본처럼 저장
- 작업자 입력 직후 permit 상태를 자동 최종 승인 완료로 확정
- 화면에서 입력받은 서명/담당자 정보를 저장하지 않음
- 연장 이력을 누적하지 않고 현재값만 덮어씀
- 위험성평가/TBM 연결 없이 permit를 고립 문서로 운영
- ILS 관련 구조 없이 단순 체크 결과만으로 운영
- 종료 확인 구조 없이 작업완료만 바로 저장

---

## 13. 최종 원칙

`안전작업허가서_v2.html` 은 현재 기본 기능은 동작하지만,
정식 Permit DB 관점에서는 다음 원칙으로 보완한다.

1. permit는 `workId` 를 참조하는 실행 문서이다.
2. permit의 정식 식별자는 `permitNo` 이다.
3. permit는 생성 당시 핵심 작업정보를 스냅샷으로 저장한다.
4. permit 상태는 승인 흐름에 맞게 단계적으로 전환한다.
5. permit는 위험성평가, TBM, 작업중지, 종료 확인의 중심 문서가 된다.
6. Firestore 이관 전 localStorage 구조와 Firestore 목표 구조의 차이를 줄이는 방향으로 수정한다.
