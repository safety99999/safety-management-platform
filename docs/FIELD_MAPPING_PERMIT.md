# 작업허가 데이터 필드 매핑

- 문서명: `FIELD_MAPPING_PERMIT.md`
- 작성일: 2026-08-27
- 상태: 최종 확정
- 이관 대상: localStorage `safetyPermits`
- Firestore 대상: `작업허가/{permitNo}`
- 관련 문서:
  - `FIRESTORE_MIGRATION_PLAN.md`
  - `FIELD_MAPPING_OPERATION.md`
  - `PERMIT_DB_SCHEMA.md`
  - `DB_SCHEMA.md`

---

## 1. 문서 목적

기존 localStorage의 `safetyPermits` 데이터를 Firestore의 `작업허가` 컬렉션으로 이관하기 위한 필드 매핑과 변환 규칙을 정의한다.

본 문서는 다음 작업의 기준으로 사용한다.

- 기존 permit 데이터 분석
- localStorage → Firestore 이관 함수 구현
- 작업허가서 신규 저장 로직 변경
- 기존 데이터 검증
- permit 중심 통합 조회 구현
- 데이터 스키마 버전 관리

---

## 2. 적용 범위

### 기존 저장소

```text
localStorage["safetyPermits"]
신규 저장소
작업허가/{permitNo}
대표 식별자
permitNo
상위 원본 연결키
workId
permit 하위 연결 문서
위험성평가: riskId
TBM: tbmNo
긴급조치: emergencyNo
점검 문서: inspectionNos
3. 현재 확정된 필드
안전작업허가서_v2.html의 저장 및 테스트 결과 다음 필드를 기준 필드로 확정한다.

필드	설명
permitNo	작업허가 고유번호
workId	작업관리대장 원본 ID
sourceType	생성 또는 입력 경로
workerSignature	작업자 서명
supervisorName	감독자 이름
supervisorPhone	감독자 연락처
supervisorEmail	감독자 이메일
approvals	승인 정보
ils	ILS 확인 정보
closeout	작업 종료 정보
schemaVersion	스키마 버전
permitStatus	작업허가 상태
riskId	연결 위험성평가 ID
riskScore	위험성평가 대표 점수
riskLevel	위험 수준
controlAdequacy	안전대책 적정성
riskMeasures	위험 저감조치
tbmNo	최신 또는 대표 TBM 번호
emergencyNo	최신 또는 대표 긴급조치 번호
inspectionNos	연결 점검 번호 목록
createdAt	생성 시각
updatedAt	수정 시각
createdBy	생성자
updatedBy	수정자
4. 필드 분류 기준
각 필드는 다음 분류 중 하나로 관리한다.

분류	의미
필수	Firestore 저장 시 반드시 있어야 하는 필드
조건부 필수	특정 업무 단계 또는 생성 방식에서 필수인 필드
선택	값이 있을 때 저장하는 필드
자동 생성	시스템에서 생성하는 필드
호환	기존 데이터 이관을 위해 임시 유지하는 필드
폐기 검토	신규 구조에서는 사용하지 않는 필드
5. 핵심 필드 매핑
localStorage 필드	Firestore 필드	타입	필수 여부	변환 규칙
permitNo	permitNo	string	필수	문자열 정리 후 유지
workId	workId	string	조건부 필수	문자열 정리 후 유지
sourceType	sourceType	string	필수	표준값으로 변환
permitStatus 또는 기존 상태 필드	permitStatus	string	필수	표준 상태값으로 변환
workerSignature	workerSignature	string/object	선택	원본 구조 유지 후 보안 검토
supervisorName	supervisorName	string	선택	앞뒤 공백 제거
supervisorPhone	supervisorPhone	string	선택	문자열로 저장
supervisorEmail	supervisorEmail	string	선택	문자열 정리
approvals	approvals	array/object	선택	내부 구조 표준화 유지
ils	ils	object	선택	내부 구조 유지
closeout	closeout	object	선택	내부 구조 유지
schemaVersion	schemaVersion	number/string	필수	신규 버전 적용
riskId	riskId	string	선택	위험성평가 대표 ID
riskScore	riskScore	number	선택	숫자 변환
riskLevel	riskLevel	string	선택	표준 위험등급 적용
controlAdequacy	controlAdequacy	string/object	선택	원본 유지
riskMeasures	riskMeasures	string/array	선택	배열 또는 원본 유지
tbmNo	tbmNo	string	선택	최신 또는 대표 TBM 번호
emergencyNo	emergencyNo	string	선택	최신 또는 대표 긴급조치 번호
inspectionNos	inspectionNos	array	선택	문자열 배열로 표준화
createdAt	createdAt	Timestamp	필수	Timestamp로 변환
updatedAt	updatedAt	Timestamp	필수	Timestamp로 변환
createdBy	createdBy	string/object	선택	원본 유지
updatedBy	updatedBy	string/object	선택	원본 유지
없음	migrationId	string	이관 시 필수	이관 실행 ID 생성
없음	migratedAt	Timestamp	이관 시 필수	서버 시각 저장
없음	legacyKey	string	이관 시 필수	safetyPermits 저장
없음	migrationSource	string	이관 시 필수	legacy-localstorage 저장
6. Firestore 권장 문서 구조
{
  permitNo: "PERMIT-2026-0001",
  workId: "WORK-2026-0001",

  sourceType: "work-reference",
  permitStatus: "허가진행중",

  supervisorName: "",
  supervisorPhone: "",
  supervisorEmail: "",

  workerSignature: null,

  approvals: [],
  ils: {},
  closeout: {},

  riskId: null,
  riskScore: null,
  riskLevel: null,
  controlAdequacy: null,
  riskMeasures: [],

  tbmNo: null,
  emergencyNo: null,
  inspectionNos: [],

  schemaVersion: 1,

  createdAt: null,
  updatedAt: null,
  createdBy: null,
  updatedBy: null,

  migrationId: null,
  migratedAt: null,
  migrationSource: "legacy-localstorage",
  legacyKey: "safetyPermits"
}
7. 식별자 매핑 규칙
7.1 permitNo
Firestore 문서 ID와 내부 permitNo는 동일하게 한다.
앞뒤 공백을 제거한다.
빈 문자열은 허용하지 않는다.
/가 포함된 값은 문서 ID로 사용할 수 없으므로 오류 처리한다.
중복 번호가 있으면 자동 병합하지 않는다.
저장 예시:

작업허가/PERMIT-2026-0001
문서 내부:

{
  permitNo: "PERMIT-2026-0001"
}
오류 처리 대상:

permitNo 없음
빈 문자열
중복 permit 번호
문서 ID 사용 불가 문자 포함
객체 또는 배열 형태로 저장된 비정상 값
7.2 workId
작업 원본 참조 permit는 workId가 필수다.
수동 신규 생성 permit는 정책상 workId 없이 생성될 수 있으나, 운영 기준상 가능하면 workId를 생성해 작업DB에 최소 원본을 남긴다.
workId가 존재하면 작업DB/{workId} 문서 존재 여부를 검증한다.
예외 분류:

상황	처리
작업 원본 참조 permit인데 workId 없음	오류
수동 생성 permit이고 workId 없음	조건부 허용
workId는 있으나 작업DB 문서 없음	연결 오류 목록 기록
workId 형식 불량	오류 또는 수동 검토
8. sourceType 표준화
권장 표준값
표준값	의미
work-reference	작업DB 원본을 참조하여 생성
manual	사용자가 직접 신규 생성
legacy-localstorage	기존 localStorage 데이터 이관
excel-upload	엑셀 파일 업로드 기반
excel-paste	엑셀 복사·붙여넣기 기반
system	시스템 자동 생성
처리 원칙
기존 sourceType이 있으면 표준값으로 변환한다.
기존 sourceType이 없으면:
유효한 workId가 있으면 work-reference
workId가 없으면 manual
이관 출처는 migrationSource와 legacyKey로 따로 남긴다.
예시:

{
  sourceType: "work-reference",
  migrationSource: "legacy-localstorage",
  legacyKey: "safetyPermits"
}
9. permit 상태 표준화
정식 상태값
상태	의미
허가진행중	작성 또는 승인 진행 중
허가완료	승인 완료, 작업 시작 전
작업중	TBM 완료 후 작업 수행 중
작업중지	작업중지권 또는 긴급조치 발동
작업완료	작업 및 종료 처리 완료
상태 필드명
Firestore 정식 필드는 permitStatus를 사용한다.
기존 status 또는 다른 상태 필드는 이관 시 permitStatus로 변환한다.
신규 저장 시 status는 생성하지 않는다.
기존 상태 변환표
기존 값	신규 값
작성중	허가진행중
진행중	허가진행중
허가진행중	허가진행중
승인완료	허가완료
허가완료	허가완료
작업대기	허가완료
작업중	작업중
중지	작업중지
작업중지	작업중지
완료	작업완료
작업완료	작업완료
알 수 없는 상태는 자동 변환하지 않고 오류 목록으로 분리한다.

10. 작업 원본 스냅샷 정책
permit는 workId로 작업DB 원본을 참조한다.
필요 시 permit 생성 당시 일부 원본 항목을 workSummary로 스냅샷 저장할 수 있다.

권장 예시:

{
  workId: "WORK-2026-0001",
  workSummary: {
    workName: "설비 점검",
    workDate: "2026-08-28",
    location: "사업장 A동",
    department: "설비부",
    contractor: "협력사명"
  }
}
운영 기준:

현재 원본 값은 작업DB/{workId}를 기준으로 조회
permit 발행 당시 값 보존이 필요하면 workSummary 사용
단순 조회용 값은 중복 저장하지 않음
11. 감독자 정보 매핑
기존 필드	신규 필드	타입	처리
supervisorName	supervisorName	string	공백 제거
supervisorPhone	supervisorPhone	string	문자열 유지
supervisorEmail	supervisorEmail	string	형식 검증
supervisorId	supervisorId	string	필요 시 확장
supervisorDepartment	supervisorDepartment	string	필요 시 확장
개인정보 관련 운영 원칙:

연락처와 이메일은 업무상 필요한 범위만 저장
Firestore Rules에서 역할별 읽기 권한 제한
화면 로그에 개인정보 전체 노출 금지
12. 서명 데이터 매핑
현재 필드:

workerSignature
운영 원칙:

현재 구조는 원본 유지
Base64 대용량 데이터는 장기적으로 Firebase Storage 분리 권장
Firestore 문서에는 가능하면 URL, 저장 경로, 서명자, 서명 시각만 저장
권장 구조 예시:

{
  workerSignature: {
    signed: true,
    signerName: "",
    signerId: "",
    signedAt: null,
    storageType: "url",
    fileUrl: ""
  }
}
단, 현재 운영 구조는 기존 데이터와의 정합성을 우선하여 원본 구조를 유지한다.

13. 승인 정보 매핑
현재 필드:

approvals
기본 원칙:

기존 승인 구조를 임의 단순화하지 않는다.
승인 단계, 승인자, 승인 시각, 상태, 의견이 있으면 그대로 보존한다.
승인 시각은 Timestamp로 변환한다.
권장 배열 구조 예시:

{
  approvals: [
    {
      step: 1,
      role: "supervisor",
      approverId: "",
      approverName: "",
      status: "대기",
      approvedAt: null,
      comment: ""
    }
  ]
}
승인 상태 표준값:

대기
승인
반려
취소
14. ILS 정보 매핑
현재 필드:

ils
기본 원칙:

현재 구조를 유지한다.
boolean, 문자열, 객체가 혼재하면 Firestore 저장 전 정규화한다.
"true"는 true, "false"는 false로 변환 가능하다.
값의 의미가 불명확하면 원본 보존 후 오류 목록에 기록한다.
권장 구조 예시:

{
  ils: {
    required: false,
    checked: false,
    checkedBy: null,
    checkedAt: null,
    items: [],
    comment: ""
  }
}
15. 종료 정보 매핑
현재 필드:

closeout
기본 원칙:

종료 구조는 기존 형태를 유지하되, 종료 여부와 종료 시각은 명확히 보존한다.
closeout.completed = true이면 permit 상태가 작업완료인지 검증한다.
permit가 작업완료인데 종료 정보가 없으면 검토 목록에 기록한다.
권장 구조 예시:

{
  closeout: {
    completed: false,
    completedAt: null,
    completedBy: null,
    result: "",
    remainingRisk: "",
    comment: ""
  }
}
16. 위험성평가 요약 필드
permit에는 위험성평가 전체 상세가 아니라 요약값만 저장한다.

필드	타입	역할
riskId	string	대표 또는 최신 위험성평가 ID
riskScore	number	대표 위험점수
riskLevel	string	대표 위험등급
controlAdequacy	string/object	안전대책 적정성 요약
riskMeasures	string/array	핵심 저감조치
기준 데이터:

상세 기준 데이터: 위험성평가/{riskId}
permit 필드: 목록 조회 및 요약 표시용
값이 불일치하면 위험성평가 상세 문서를 기준으로 재동기화한다.
17. TBM 및 긴급조치 연결 필드
TBM
{
  tbmNo: "TBM-2026-0001"
}
최신 또는 대표 TBM 번호만 permit에 저장
TBM 전체 목록은 TBM 컬렉션에서 permitNo로 조회
TBM 제출 후 permit 상태를 작업중으로 변경
긴급조치
{
  emergencyNo: "EMG-2026-0001"
}
최신 또는 현재 활성 긴급조치 번호를 permit에 저장
전체 이력은 긴급조치 컬렉션에서 조회
긴급조치 등록 후 permit 상태를 작업중지로 변경
처리 원칙
하위 문서 저장과 permit 상태 갱신은 가능하면 batch write 또는 transaction으로 처리한다.
18. 날짜 및 시간 변환 규칙
Firestore 신규 저장에는 Timestamp를 사용한다.

변환 대상:

createdAt
updatedAt
migratedAt
승인 시각
서명 시각
ILS 확인 시각
종료 시각
변환 원칙:

유효한 Date 또는 Timestamp인지 확인
ISO 문자열인지 확인
숫자 timestamp인지 확인
기존 날짜 문자열 형식인지 확인
변환 실패 시 현재 시각으로 임의 대체하지 않고 오류 목록에 기록
권장 보존 예시:

{
  createdAt: null,
  legacyCreatedAt: "기존 원본 문자열",
  migratedAt: null
}
19. 기본값 정책
필드	권장 기본값
permitStatus	허가진행중
sourceType	데이터 상황에 따라 판정
approvals	[]
ils	{}
closeout	{}
riskId	null
riskScore	null
riskLevel	null
riskMeasures	[]
tbmNo	null
emergencyNo	null
inspectionNos	[]
schemaVersion	1
원칙:

값이 아직 없는 경우는 null
목록이 비어 있는 경우는 []
초기 구조가 필요한 경우는 기본 객체 사용
20. 스키마 버전 정책
Firestore 신규 표준 구조의 시작 버전은 1로 한다.
기존 schemaVersion이 있어도 Firestore 기준 구조를 우선한다.
예시:

{
  schemaVersion: 1
}
버전 증가 대상 예시:

필드명 변경
승인 구조 변경
서명 구조 변경
ILS 구조 변경
종료 구조 변경
상태 체계 변경
21. 이관 변환 의사 코드
function normalizePermit(legacyPermit, context) {
  const permitNo = normalizeId(legacyPermit.permitNo);

  if (!permitNo) {
    throw new Error("PERMIT_NO_MISSING");
  }

  const workId = normalizeOptionalId(legacyPermit.workId);

  const originalStatus =
    legacyPermit.permitStatus ??
    legacyPermit.status ??
    legacyPermit.state;

  const permitStatus = normalizePermitStatus(originalStatus);

  return {
    permitNo,
    workId: workId || null,

    sourceType: normalizeSourceType(
      legacyPermit.sourceType,
      workId
    ),

    permitStatus,

    workerSignature: legacyPermit.workerSignature ?? null,

    supervisorName: normalizeText(legacyPermit.supervisorName),
    supervisorPhone: normalizeText(legacyPermit.supervisorPhone),
    supervisorEmail: normalizeText(legacyPermit.supervisorEmail),

    approvals: legacyPermit.approvals ?? [],
    ils: legacyPermit.ils ?? {},
    closeout: legacyPermit.closeout ?? {},

    riskId: normalizeOptionalId(legacyPermit.riskId),
    riskScore: normalizeOptionalNumber(legacyPermit.riskScore),
    riskLevel: normalizeOptionalText(legacyPermit.riskLevel),
    controlAdequacy: legacyPermit.controlAdequacy ?? null,
    riskMeasures: legacyPermit.riskMeasures ?? [],

    tbmNo: normalizeOptionalId(legacyPermit.tbmNo),
    emergencyNo: normalizeOptionalId(legacyPermit.emergencyNo),
    inspectionNos: normalizeStringArray(legacyPermit.inspectionNos),

    schemaVersion: 1,

    createdAt: normalizeLegacyDate(legacyPermit.createdAt),
    updatedAt: normalizeLegacyDate(legacyPermit.updatedAt),
    createdBy: legacyPermit.createdBy ?? null,
    updatedBy: legacyPermit.updatedBy ?? null,

    migrationId: context.migrationId,
    migratedAt: context.serverTimestamp,
    migrationSource: "legacy-localstorage",
    legacyKey: "safetyPermits"
  };
}
22. 저장 정책
기본 저장 경로:

작업허가/{permitNo}
정책:

기존 문서가 없으면 신규 생성
기존 문서가 있으면 기본적으로 스킵
강제 덮어쓰기는 관리자 옵션으로만 허용
운영 중 Firestore 문서를 과거 localStorage 데이터로 덮어쓰지 않도록 주의
23. 필수 검증 규칙
저장 전 검증
permitNo 존재 여부
Firestore 문서 ID 사용 가능 여부
동일 permitNo 중복 여부
원본 참조 permit의 workId 존재 여부
permitStatus 표준 상태 여부
날짜 변환 가능 여부
저장 후 검증
Firestore 문서 ID와 permitNo 일치 여부
workId가 작업DB와 연결되는지 여부
승인 정보 보존 여부
서명 데이터 조회 가능 여부
위험성평가 요약값 유지 여부
화면 표시 정합성 여부
24. 데이터 오류 코드
오류 코드	의미
PERMIT_NO_MISSING	permit 번호 없음
PERMIT_NO_DUPLICATED	permit 번호 중복
PERMIT_NO_INVALID	문서 ID로 사용할 수 없는 permit 번호
WORK_ID_MISSING	원본 참조 permit의 workId 없음
WORK_NOT_FOUND	연결된 작업DB 문서 없음
STATUS_INVALID	허용되지 않은 permit 상태
DATE_INVALID	날짜 변환 실패
APPROVALS_INVALID	승인 구조 해석 실패
SCHEMA_INVALID	필수 구조 불일치
DOCUMENT_EXISTS	동일 permit 문서 이미 존재
WRITE_FAILED	Firestore 저장 실패
25. 이관 결과 로그
로그 필드 권장안:

필드	설명
migrationId	이관 실행 ID
legacyKey	safetyPermits
legacyIndex	기존 배열 인덱스
permitNo	대상 permit 번호
workId	연결 work ID
result	success, skip, error
errorCode	오류 코드
errorMessage	상세 메시지
processedAt	처리 시각
집계 항목:

원본 전체 건수
정상 변환 건수
저장 성공 건수
기존 문서 스킵 건수
중복 건수
오류 건수
26. 구현 시 최종 기준
Firestore 컬렉션은 작업허가를 사용한다.
문서 ID는 permitNo를 사용한다.
작업 원본은 workId로 연결한다.
permit 상태 필드는 permitStatus로 단일화한다.
위험성평가, TBM, 긴급조치는 permitNo를 중심으로 연결한다.
permit에는 통합 조회용 요약값만 저장한다.
상세 이력은 각 하위 컬렉션에 저장한다.
기존 문서가 있을 때는 기본적으로 스킵한다.
개인정보와 서명 정보는 강화된 접근 통제가 필요하다.

---

# 2. `FIELD_MAPPING_OPERATION.md`

아래 내용을 그대로 복사해서  
`docs/FIELD_MAPPING_OPERATION.md`에 붙여넣으면 됩니다.

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
5. TBM 매핑
5.1 대상
기존 데이터: safetyTBM
신규 컬렉션: TBM
문서 경로: TBM/{tbmNo}
역할: 작업 전·중 TBM 기록
5.2 현재 확정 필드
tbmNo
permitNo
workId
riskId
stopNotice
updatedBy
5.3 필드 매핑
localStorage 필드	Firestore 필드	타입	필수	처리
tbmNo	tbmNo	string	필수	문서 ID로 사용
permitNo	permitNo	string	필수	permit 연결
workId	workId	string	필수	작업DB 연결
riskId	riskId	string	선택	위험성평가 연결
TBM 일시 필드	tbmDate	Timestamp	필수	날짜 변환
참석자 필드	participants	array	선택	구조 유지
주요 내용 필드	agenda	string/array	선택	원본 유지
점검 항목 필드	checkItems	array	선택	구조 유지
stopNotice	stopNotice	object/boolean	선택	긴급조치와 분리
status	tbmStatus	string	선택	상태 표준화
createdAt	createdAt	Timestamp	필수	날짜 변환
updatedAt	updatedAt	Timestamp	필수	날짜 변환
updatedBy	updatedBy	string/object	선택	원본 유지
없음	schemaVersion	number	필수	신규 생성
없음	migrationId	string	이관 시 필수	신규 생성
없음	migratedAt	Timestamp	이관 시 필수	서버 시각
없음	legacyKey	string	이관 시 필수	safetyTBM
없음	migrationSource	string	이관 시 필수	legacy-localstorage
5.4 권장 문서 구조
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
