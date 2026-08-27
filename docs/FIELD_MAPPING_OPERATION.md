
---

# `FIELD_MAPPING_OPERATION.md` 1/2

```markdown
# 운영 데이터 필드 매핑

- 문서명: `FIELD_MAPPING_OPERATION.md`
- 작성일: 2026-08-27
- 상태: 최종 확정
- 관련 문서:
  - `FIRESTORE_MIGRATION_PLAN.md`
  - `FIELD_MAPPING_PERMIT.md`
  - `PERMIT_DB_SCHEMA.md`
  - `DB_SCHEMA.md`

---

## 1. 문서 목적

작업관리대장, 위험성평가, TBM, 긴급조치 데이터를 localStorage에서 Firestore로 이관하기 위한 필드 매핑과 연결 규칙을 정의한다.

본 문서의 적용 대상은 다음과 같다.

| 구분 | localStorage | Firestore |
|---|---|---|
| 작업 원본 | `safetyDatabase.workHistory` | `작업DB/{workId}` |
| 위험성평가 | `riskAssessments` | `위험성평가/{riskId}` |
| TBM | `safetyTBM` | `TBM/{tbmNo}` |
| 긴급조치 | `emergencies` | `긴급조치/{emergencyNo}` |

작업허가 데이터는 `FIELD_MAPPING_PERMIT.md`에서 별도로 관리한다.

---

## 2. 공통 연결 원칙

### 상위 원본키

```text
workId
workId는 작업관리대장의 원본 작업을 식별한다.

실행 허브키
permitNo
permitNo는 작업허가서를 식별하며 위험성평가, TBM, 긴급조치 연결의 중심키로 사용한다.

하위 문서 식별자
문서	대표 식별자
위험성평가	riskId
TBM	tbmNo
긴급조치	emergencyNo
연결 구조
작업DB/{workId}
작업허가/{permitNo}
위험성평가/{riskId}
TBM/{tbmNo}
긴급조치/{emergencyNo}
관계 개념은 다음과 같다.

작업DB(workId)
   └─ 작업허가(permitNo, workId)
        ├─ 위험성평가(riskId, permitNo, workId)
        ├─ TBM(tbmNo, permitNo, workId, riskId)
        └─ 긴급조치(emergencyNo, permitNo, workId, riskId, tbmNo)
3. 작업DB 매핑
3.1 대상
기존 데이터: safetyDatabase.workHistory
신규 컬렉션: 작업DB
문서 경로: 작업DB/{workId}
역할: 작업관리대장 원본
3.2 구조 기준
safetyDatabase.workHistory는 localStorage 키 자체가 아니라 safetyDatabase 객체 안의 하위 속성으로 본다.

예시:

const safetyDatabase = JSON.parse(
  localStorage.getItem("safetyDatabase") || "{}"
);

const workHistory = safetyDatabase.workHistory || [];
3.3 필드 매핑
기존 필드	Firestore 필드	타입	필수	처리
workId	workId	string	필수	문서 ID로 사용
작업명 필드	workName	string	필수	공백 정리
작업일 필드	workDate	Timestamp/string	필수	날짜 변환
작업장소 필드	location	string	필수	공백 정리
department	department	string	선택	원본 유지
team	team	string	선택	원본 유지
workType	workType	string	선택	표준값 검토
contractor	contractor	string	선택	원본 유지
managerName	managerName	string	선택	원본 유지
status	workStatus	string	선택	permit 상태와 분리
sourceType	sourceType	string	필수	표준값 적용
createdAt	createdAt	Timestamp	필수	날짜 변환
updatedAt	updatedAt	Timestamp	필수	날짜 변환
없음	schemaVersion	number	필수	신규 생성
없음	migrationId	string	이관 시 필수	신규 생성
없음	migratedAt	Timestamp	이관 시 필수	서버 시각
없음	legacyKey	string	이관 시 필수	safetyDatabase.workHistory
없음	migrationSource	string	이관 시 필수	legacy-localstorage
3.4 권장 문서 구조
{
  workId: "WORK-2026-0001",

  workName: "설비 점검",
  workDate: null,
  location: "사업장 A동",

  department: "",
  team: "",
  workType: "",
  contractor: "",
  managerName: "",

  workStatus: "등록",
  sourceType: "excel-paste",

  schemaVersion: 1,

  createdAt: null,
  updatedAt: null,
  createdBy: null,
  updatedBy: null,

  migrationId: null,
  migratedAt: null,
  migrationSource: "legacy-localstorage",
  legacyKey: "safetyDatabase.workHistory"
}
3.5 검증 규칙
workId는 필수다.
workId와 Firestore 문서 ID는 같아야 한다.
동일한 workId가 여러 건이면 자동 병합하지 않는다.
작업명, 작업일, 장소 중 필수 항목이 누락되면 검토 목록으로 분리한다.
permit의 workId가 작업DB에 존재하는지 확인한다.
작업 원본 상태와 permit 상태를 같은 필드로 관리하지 않는다.
4. 위험성평가 매핑
4.1 대상
기존 데이터: riskAssessments
신규 컬렉션: 위험성평가
문서 경로: 위험성평가/{riskId}
역할: permit에 연결된 위험성평가 상세 문서
4.2 현재 확정 필드
riskId
workId
permitNo
linkedPermitNo
riskScore
riskLevel
controlAdequacy
riskMeasures
위험성평가는 이미 permit 연동 구조와 요약 반영 흐름이 확인된 상태다.

4.3 필드 매핑
localStorage 필드	Firestore 필드	타입	필수	처리
riskId	riskId	string	필수	문서 ID로 사용
workId	workId	string	필수	작업DB 연결
permitNo	permitNo	string	필수	정식 연결키
linkedPermitNo	permitNo	string	조건부	기존 호환값 변환
위험항목 필드	riskItems	array	필수	실제 구조 유지
riskScore	riskScore	number	선택	숫자 변환
riskLevel	riskLevel	string	선택	등급 표준화
controlAdequacy	controlAdequacy	string/object	선택	원본 유지
riskMeasures	riskMeasures	string/array	선택	원본 유지
status	riskStatus	string	선택	상태 표준화
createdAt	createdAt	Timestamp	필수	날짜 변환
updatedAt	updatedAt	Timestamp	필수	날짜 변환
updatedBy	updatedBy	string/object	선택	원본 유지
없음	schemaVersion	number	필수	신규 생성
없음	migrationId	string	이관 시 필수	신규 생성
없음	migratedAt	Timestamp	이관 시 필수	서버 시각
없음	legacyKey	string	이관 시 필수	riskAssessments
없음	migrationSource	string	이관 시 필수	legacy-localstorage
4.4 permitNo 단일화 규칙
Firestore의 정식 연결 필드는 permitNo로 한다.

변환 우선순위:

permitNo가 있으면 사용
permitNo가 없고 linkedPermitNo가 있으면 permitNo로 변환
두 값이 모두 있고 같으면 permitNo만 저장
두 값이 서로 다르면 자동 이관하지 않고 오류 목록으로 분리
신규 저장에서는 linkedPermitNo를 생성하지 않음
의사 코드:

function resolvePermitNo(risk) {
  const permitNo = normalizeId(risk.permitNo);
  const linkedPermitNo = normalizeId(risk.linkedPermitNo);

  if (permitNo && linkedPermitNo && permitNo !== linkedPermitNo) {
    throw new Error("PERMIT_LINK_CONFLICT");
  }

  return permitNo || linkedPermitNo || null;
}
4.5 권장 문서 구조
{
  riskId: "RISK-2026-0001",
  workId: "WORK-2026-0001",
  permitNo: "PERMIT-2026-0001",

  riskItems: [],

  riskScore: null,
  riskLevel: null,
  controlAdequacy: null,
  riskMeasures: [],

  riskStatus: "작성중",
  schemaVersion: 1,

  createdAt: null,
  updatedAt: null,
  createdBy: null,
  updatedBy: null,

  migrationId: null,
  migratedAt: null,
  migrationSource: "legacy-localstorage",
  legacyKey: "riskAssessments"
}
4.6 permit 요약 반영
위험성평가 저장 후 permit에 다음 요약값을 반영한다.

{
  riskId: "RISK-2026-0001",
  riskScore: 12,
  riskLevel: "높음",
  controlAdequacy: "보완필요",
  riskMeasures: [
    "작업구역 통제",
    "보호구 착용"
  ]
}
상세 기준 데이터는 항상 위험성평가/{riskId}로 본다.

4.7 검증 규칙
riskId, permitNo, workId 확인
연결된 permit와 작업DB 문서 존재 여부 확인
permitNo와 linkedPermitNo 충돌 여부 확인
위험도 요약과 permit 반영값 정합성 확인

---

# `FIELD_MAPPING_OPERATION.md` 2/2

```markdown
## 5. TBM 매핑

### 5.1 대상

- 기존 데이터: `safetyTBM`
- 신규 컬렉션: `TBM`
- 문서 경로: `TBM/{tbmNo}`
- 역할: 작업 전·중 TBM 기록

### 5.2 현재 확정 필드

- `tbmNo`
- `permitNo`
- `workId`
- `riskId`
- `stopNotice`
- `updatedBy`

### 5.3 필드 매핑

| localStorage 필드 | Firestore 필드 | 타입 | 필수 | 처리 |
|---|---|---|---|---|
| `tbmNo` | `tbmNo` | string | 필수 | 문서 ID로 사용 |
| `permitNo` | `permitNo` | string | 필수 | permit 연결 |
| `workId` | `workId` | string | 필수 | 작업DB 연결 |
| `riskId` | `riskId` | string | 선택 | 위험성평가 연결 |
| TBM 일시 필드 | `tbmDate` | Timestamp | 필수 | 날짜 변환 |
| 참석자 필드 | `participants` | array | 선택 | 구조 유지 |
| 주요 내용 필드 | `agenda` | string/array | 선택 | 원본 유지 |
| 점검 항목 필드 | `checkItems` | array | 선택 | 구조 유지 |
| `stopNotice` | `stopNotice` | object/boolean | 선택 | 긴급조치와 분리 |
| `status` | `tbmStatus` | string | 선택 | 상태 표준화 |
| `createdAt` | `createdAt` | Timestamp | 필수 | 날짜 변환 |
| `updatedAt` | `updatedAt` | Timestamp | 필수 | 날짜 변환 |
| `updatedBy` | `updatedBy` | string/object | 선택 | 원본 유지 |
| 없음 | `schemaVersion` | number | 필수 | 신규 생성 |
| 없음 | `migrationId` | string | 이관 시 필수 | 신규 생성 |
| 없음 | `migratedAt` | Timestamp | 이관 시 필수 | 서버 시각 |
| 없음 | `legacyKey` | string | 이관 시 필수 | `safetyTBM` |
| 없음 | `migrationSource` | string | 이관 시 필수 | `legacy-localstorage` |

### 5.4 권장 문서 구조

```javascript
{
  tbmNo: "TBM-2026-0001",
  permitNo: "PERMIT-2026-0001",
  workId: "WORK-2026-0001",
  riskId: "RISK-2026-0001",

  tbmDate: null,
  participants: [],
  agenda: [],
  checkItems: [],

  stopNotice: {
    requested: false,
    reason: "",
    requestedBy: null,
    requestedAt: null
  },

  tbmStatus: "제출완료",
  schemaVersion: 1,

  createdAt: null,
  updatedAt: null,
  createdBy: null,
  updatedBy: null,

  migrationId: null,
  migratedAt: null,
  migrationSource: "legacy-localstorage",
  legacyKey: "safetyTBM"
}
5.5 stopNotice 처리 원칙
stopNotice와 실제 긴급조치 문서는 구분한다.

stopNotice는 TBM 과정의 주의 요청 또는 중지 의견
실제 작업중지 실행은 긴급조치 문서로 별도 관리
stopNotice가 있다고 해서 긴급조치를 자동 생성하지 않는다
5.6 permit 상태 반영
신규 TBM 저장 성공 시 permit 상태를 작업중으로 갱신
permit에 최신 또는 대표 tbmNo 반영
이관 시에는 과거 TBM 존재만으로 현재 permit 상태를 강제 변경하지 않는다
상태 우선순위:

작업완료
작업중지
작업중
허가완료
허가진행중
5.7 검증 규칙
tbmNo, permitNo, workId 확인
연결 permit 및 작업DB 존재 여부 확인
riskId가 있으면 연결 위험성평가 존재 여부 확인
stopNotice를 긴급조치로 잘못 변환하지 않음
6. 긴급조치 매핑
6.1 대상
기존 데이터: emergencies
신규 컬렉션: 긴급조치
문서 경로: 긴급조치/{emergencyNo}
역할: 실제 작업중지 및 긴급조치 이력
6.2 현재 구조 기준
작업중지 데이터는 emergencies에 저장
permit 상태는 작업중지로 갱신
stopNotice와 실제 작업중지 데이터는 분리 구조 유지
6.3 필드 매핑
localStorage 필드	Firestore 필드	타입	필수	처리
emergencyNo	emergencyNo	string	필수	문서 ID로 사용
permitNo	permitNo	string	필수	permit 연결
workId	workId	string	필수	작업DB 연결
riskId	riskId	string	선택	위험성평가 연결
tbmNo	tbmNo	string	선택	TBM 연결
작업중지 유형 필드	emergencyType	string	필수	표준화
사유 필드	reason	string	필수	원본 유지
조치 내용 필드	actionTaken	string/array	선택	원본 유지
요청자 필드	requestedBy	string/object	선택	원본 유지
승인자 필드	approvedBy	string/object	선택	원본 유지
해제자 필드	releasedBy	string/object	선택	확장 대비
해제일 필드	releasedAt	Timestamp	선택	확장 대비
status	emergencyStatus	string	필수	상태 표준화
createdAt	createdAt	Timestamp	필수	날짜 변환
updatedAt	updatedAt	Timestamp	필수	날짜 변환
updatedBy	updatedBy	string/object	선택	원본 유지
없음	schemaVersion	number	필수	신규 생성
없음	migrationId	string	이관 시 필수	신규 생성
없음	migratedAt	Timestamp	이관 시 필수	서버 시각
없음	legacyKey	string	이관 시 필수	emergencies
없음	migrationSource	string	이관 시 필수	legacy-localstorage
6.4 권장 문서 구조
{
  emergencyNo: "EMG-2026-0001",
  permitNo: "PERMIT-2026-0001",
  workId: "WORK-2026-0001",
  riskId: "RISK-2026-0001",
  tbmNo: "TBM-2026-0001",

  emergencyType: "작업중지",
  reason: "안전설비 이상 발견",
  actionTaken: [],

  requestedBy: null,
  approvedBy: null,

  emergencyStatus: "활성",

  releasedBy: null,
  releasedAt: null,
  releaseReason: "",

  schemaVersion: 1,

  createdAt: null,
  updatedAt: null,
  createdBy: null,
  updatedBy: null,

  migrationId: null,
  migratedAt: null,
  migrationSource: "legacy-localstorage",
  legacyKey: "emergencies"
}
6.5 긴급조치 상태 표준안
상태	의미
접수	요청 등록 상태
활성	실제 작업중지 적용 상태
조치중	원인 제거 및 안전조치 진행 중
해제승인	작업 재개 승인 상태
종료	긴급조치 종결 상태
취소	잘못 등록되어 취소된 상태
6.6 permit 상태 반영
긴급조치 활성 시 permit 상태를 작업중지로 갱신
permit에 최신 또는 현재 활성 emergencyNo 반영
작업 재개는 별도 승인 정책에 따라 처리
6.7 검증 규칙
emergencyNo, permitNo, workId 확인
실제 작업중지와 stopNotice 구분
연결 permit 및 작업DB 존재 여부 확인
riskId, tbmNo 연결 문서 존재 여부 확인
활성 긴급조치가 있으면 permit 상태가 작업중지인지 확인
7. 공통 메타데이터
모든 Firestore 문서에 다음 필드를 적용한다.

필드	타입	설명
schemaVersion	number	스키마 버전
sourceType	string	최초 생성 방식
createdAt	Timestamp	최초 생성 시각
updatedAt	Timestamp	최종 수정 시각
createdBy	string/object	생성자
updatedBy	string/object	수정자
migrationId	string	이관 실행 ID
migratedAt	Timestamp	이관 시각
migrationSource	string	이관 출처
legacyKey	string	기존 localStorage 위치
legacyIndex	number/string	원본 배열 인덱스 또는 키
예시:

{
  schemaVersion: 1,
  migrationId: "MIG-20260827-001",
  migratedAt: null,
  migrationSource: "legacy-localstorage",
  legacyKey: "safetyTBM",
  legacyIndex: 3
}
8. 이관 순서
1차: 작업DB
safetyDatabase.workHistory 추출
workId 검증
테스트 컬렉션 저장
건수 및 필드 검증
운영 컬렉션 저장
2차: 작업허가
FIELD_MAPPING_PERMIT.md 기준 적용
3차: 위험성평가
permitNo 단일화
permit 위험도 요약 연결
4차: TBM
permit 중심 TBM 이력 연결
stopNotice 구조 유지
5차: 긴급조치
작업중지 이력 연결
permit 상태 정합성 검증
9. 상태 복원 우선순위
과거 데이터를 이관할 때 하위 문서 존재 여부만으로 permit 상태를 무조건 변경하지 않는다.

상태 재구성이 필요한 경우 우선순위는 다음과 같다.

종료 처리 완료 → 작업완료
활성 긴급조치 존재 → 작업중지
유효한 TBM 존재 → 작업중
승인 완료 상태 → 허가완료
그 외 → 허가진행중
10. 날짜 변환 원칙
Firestore 신규 저장에는 Timestamp를 사용한다.

변환 대상 예시:

작업일
위험성평가일
TBM 실시일
긴급조치 발생일
생성일
수정일
해제일
변환 실패 시 현재 시각으로 임의 대체하지 않는다.

예시:

{
  tbmDate: null,
  legacyTbmDate: "2026.08.27 09:00",
  migrationError: "DATE_INVALID"
}
11. 오류 코드
오류 코드	의미
WORK_ID_MISSING	workId 없음
WORK_ID_DUPLICATED	workId 중복
WORK_NOT_FOUND	연결 작업DB 없음
PERMIT_NO_MISSING	permitNo 없음
PERMIT_NOT_FOUND	연결 작업허가 없음
PERMIT_LINK_CONFLICT	permitNo와 linkedPermitNo 불일치
RISK_ID_MISSING	riskId 없음
RISK_NOT_FOUND	연결 위험성평가 없음
TBM_NO_MISSING	tbmNo 없음
TBM_NOT_FOUND	연결 TBM 없음
EMERGENCY_NO_MISSING	emergencyNo 없음
DATE_INVALID	날짜 변환 실패
STATUS_INVALID	상태값 불량
DOCUMENT_EXISTS	대상 문서 이미 존재
WRITE_FAILED	Firestore 저장 실패
12. 구현 시 최종 기준
작업 원본은 workId 기준으로 관리한다.
작업허가 및 하위 실행 문서 연결은 permitNo 기준으로 관리한다.
위험성평가의 linkedPermitNo는 permitNo로 단일화한다.
TBM의 stopNotice와 실제 긴급조치를 구분한다.
하위 문서 상세 내용은 각 컬렉션에 저장한다.
permit에는 통합 조회를 위한 최신 또는 대표 요약값만 저장한다.
과거 데이터 이관 시 하위 문서만으로 현재 상태를 무조건 변경하지 않는다.
실제 구현 전 각 localStorage 저장 객체와 필드 타입을 확인한다.
