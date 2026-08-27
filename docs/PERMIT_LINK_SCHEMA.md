# Permit 중심 연결 스키마 초안

문서명: PERMIT_LINK_SCHEMA.md  
버전: 1.0  
상태: 초안  
작성 기준일: 2026-08-27  
적용 대상: 작업허가, 위험성평가, TBM, 작업중지, 작업중점검, 통합 리포트

---

## 1. 목적

이 문서는 안전관리 플랫폼에서 `permitNo` 를 중심으로 연결되는 업무 문서 간 관계를 정의한다.

Permit는 작업 실행 흐름의 중심 문서이며, 다음 문서를 연결한다.

- 작업관리대장 DB
- 위험성평가
- TBM
- 작업중지/긴급조치
- 작업 중 점검
- 통합 리포트

이 문서의 목적은 다음과 같다.

- permit 중심 연결 원칙 통일
- 중복 저장 최소화
- 참조키 표준화
- 문서 간 추적 가능성 확보
- 나중에 Firestore 이관 시 충돌 방지

---

## 2. 연결 구조 개요

전체 연결 구조는 다음과 같다.

```text
작업DB(workId)
   ↓
작업허가(permitNo)
   ├─ 위험성평가(riskId)
   ├─ TBM(tbmNo)
   ├─ 작업중지(emergencyNo)
   └─ 작업중점검(inspectionNo[])
2.1 중심 원칙
workId 는 작업 원본의 중심키이다.
permitNo 는 실행 문서 흐름의 중심키이다.
하위 문서는 독립 문서로 저장한다.
permit 문서는 하위 문서의 대표 참조값만 가진다.
상세 내용은 각 하위 문서 원본에서 조회한다.
3. workId 와 permitNo 역할 구분
3.1 workId
workId는 작업 원본 DB의 식별자이다.

역할:

작업 원본 추적
원본 작업과 permit 연결
대시보드 기준 원본 작업 식별
회사 서버 연동 시 상위 원본 참조
3.2 permitNo
permitNo는 작업 실행 흐름의 중심키이다.

역할:

허가 상태 관리
위험성평가 연결
TBM 연결
작업중지 연결
작업 중 점검 연결
통합 리포트 중심키
3.3 원칙
workId 와 permitNo 는 역할이 다르므로 혼용하지 않는다.
작업 원본 조회는 workId
실행 흐름 조회는 permitNo
permit는 반드시 workId 를 참조한다.
4. permit 문서의 역할
permit 문서는 다음 역할을 가진다.

작업허가 상태 저장
유효기간 및 연장 관리
ILS 확인 상태 저장
위험성평가·TBM·작업중지 연결
작업 종료 및 closeout 상태 저장
통합 리포트의 중심 참조
permit 문서는 하위 문서의 원본 전체를 복제하지 않고,
다음과 같은 대표 연결 필드만 저장한다.

riskId
tbmNo
emergencyNo
inspectionNos
5. 위험성평가 연결 규칙
5.1 위험성평가 문서 필수 연결 필드
위험성평가 문서에는 다음 필드가 있어야 한다.

riskId
workId
permitNo
예:

{
  "riskId": "RA-20260827-001",
  "workId": "2026-08-27_5",
  "permitNo": "PTW-20260827-001"
}
5.2 permit 문서의 연결 필드
permit 문서에는 다음을 저장한다.

{
  "riskId": "RA-20260827-001"
}
5.3 원칙
위험성평가 원문은 위험성평가 컬렉션이 원본이다.
permit에는 대표 riskId만 저장한다.
permit에 위험성평가 전체 내용을 중복 저장하지 않는다.
하나의 permit에 여러 riskId가 필요할 경우 확장 구조를 검토할 수 있으나, 현재 단계에서는 대표 riskId 1건 연결을 우선 사용한다.
6. TBM 연결 규칙
6.1 TBM 문서 필수 연결 필드
TBM 문서에는 다음 필드가 있어야 한다.

tbmNo
workId
permitNo
riskId (가능하면 포함)
예:

{
  "tbmNo": "TBM-20260827-001",
  "workId": "2026-08-27_5",
  "permitNo": "PTW-20260827-001",
  "riskId": "RA-20260827-001"
}
6.2 permit 문서의 연결 필드
permit 문서에는 다음을 저장한다.

{
  "tbmNo": "TBM-20260827-001"
}
6.3 원칙
TBM 원문은 TBM 컬렉션이 원본이다.
permit에는 대표 tbmNo만 저장한다.
permit에 TBM 전체 내용을 중복 저장하지 않는다.
재TBM이 발생하면 별도 tbmNo 또는 reTbmNo를 생성하고 이력으로 관리한다.

---

## 🔹 PART 2 / 3

```md
## 7. 작업중지 연결 규칙

### 7.1 작업중지 문서 필수 연결 필드

작업중지/긴급조치 문서에는 다음 필드가 있어야 한다.

- emergencyNo
- permitNo
- workId
- tbmNo (선택)
- riskId (선택)

예:

```json
{
  "emergencyNo": "EM-20260827-001",
  "permitNo": "PTW-20260827-001",
  "workId": "2026-08-27_5",
  "tbmNo": "TBM-20260827-001",
  "riskId": "RA-20260827-001"
}
7.2 permit 문서의 연결 필드
permit 문서에는 다음을 저장한다.

{
  "emergencyNo": "EM-20260827-001",
  "status": "작업중지"
}
7.3 원칙
작업중지 문서는 독립 원본 문서이다.
permit에는 대표 emergencyNo만 저장한다.
작업중지 발생 시 permit 상태를 작업중지 로 전환한다.
작업중지 후 재개 시 permit 상태 변경 이력을 남긴다.
8. 작업 중 점검 연결 규칙
8.1 점검 문서 필수 연결 필드
작업 중 점검 문서에는 다음 필드가 있어야 한다.

inspectionNo
permitNo
workId
riskId (선택)
예:

{
  "inspectionNo": "IN-20260827-001",
  "permitNo": "PTW-20260827-001",
  "workId": "2026-08-27_5"
}
8.2 permit 문서의 연결 필드
permit 문서에는 다음을 저장한다.

{
  "inspectionNos": [
    "IN-20260827-001",
    "IN-20260827-002"
  ]
}
8.3 원칙
점검 문서는 복수 발생 가능하므로 배열로 연결한다.
permit에는 inspectionNos[] 배열을 유지한다.
점검 세부 내용은 permit에 중복 저장하지 않는다.
9. 통합 리포트 연결 원칙
9.1 중심키
통합 리포트의 중심키는 permitNo 이다.

9.2 조회 순서
permitNo를 기준으로 다음 문서를 조회한다.

permit 문서
permit.workId → 작업DB
permit.riskId → 위험성평가
permit.tbmNo → TBM
permit.emergencyNo → 작업중지
permit.inspectionNos[] → 작업 중 점검
9.3 원칙
통합 리포트는 permitNo를 중심으로 관계 문서를 조회한다.
workId는 상위 원본 참조를 위해 사용한다.
permit가 하위 문서의 원본 전체를 저장하지 않아도 통합 리포트를 구성할 수 있어야 한다.
10. 연결 필드 저장 예시
10.1 permit 문서 예시
{
  "permitNo": "PTW-20260827-001",
  "workId": "2026-08-27_5",
  "riskId": "RA-20260827-001",
  "tbmNo": "TBM-20260827-001",
  "emergencyNo": null,
  "inspectionNos": ["IN-20260827-001"],
  "status": "작업중"
}
10.2 위험성평가 문서 예시
{
  "riskId": "RA-20260827-001",
  "workId": "2026-08-27_5",
  "permitNo": "PTW-20260827-001"
}
10.3 TBM 문서 예시
{
  "tbmNo": "TBM-20260827-001",
  "workId": "2026-08-27_5",
  "permitNo": "PTW-20260827-001",
  "riskId": "RA-20260827-001"
}
10.4 작업중지 문서 예시
{
  "emergencyNo": "EM-20260827-001",
  "workId": "2026-08-27_5",
  "permitNo": "PTW-20260827-001",
  "tbmNo": "TBM-20260827-001"
}
11. 상태 연계 원칙
11.1 permit 상태가 중심
permit 상태는 실행 흐름의 대표 상태로 사용한다.

예:

허가진행중
허가완료
작업중
작업중지
작업완료
11.2 하위 문서 발생 시 상태 변화 예
위험성평가 완료 → permit 상태 변화 없음
TBM 완료 → 작업 시작 시 permit 상태 작업중
작업중지 발생 → permit 상태 작업중지
종료/해제 완료 → permit 상태 작업완료
11.3 원칙
하위 문서 원본 상태와 permit 상태를 구분한다.
permit는 실행 흐름 대표 상태를 보유한다.
상태 전환 시 상태 이력을 남기는 것을 권장한다.

---

## 🔹 PART 3 / 3

```md
## 12. 데이터 중복 최소화 원칙

### 12.1 permit에 저장하는 것

permit에는 다음만 저장한다.

- 상위 원본 참조(workId)
- 핵심 작업정보 스냅샷
- 실행 허가 정보
- 하위 문서 대표 참조값

### 12.2 permit에 저장하지 않는 것

permit에는 다음 원문 전체를 중복 저장하지 않는다.

- 위험성평가 전체 위험항목 목록
- TBM 전체 상세 내용
- 작업중지 상세 조치 전부
- 점검 세부 이력 전부

### 12.3 이유

- 데이터 중복 감소
- 수정 충돌 방지
- 각 문서의 원본성 유지
- 통합 리포트 구성 단순화

---

## 13. 현재 구현 단계 적용 원칙

현재 구현 단계에서는 다음을 우선 적용한다.

### 13.1 permit
- workId 저장
- riskId / tbmNo / emergencyNo / inspectionNos 필드 확보

### 13.2 위험성평가
- riskId와 permitNo 연결

### 13.3 TBM
- tbmNo와 permitNo 연결

### 13.4 작업중지
- emergencyNo와 permitNo 연결

즉, 문서 전체를 재작성하지 말고 먼저 **참조키 정렬**부터 수행한다.

---

## 14. 금지사항

- workId 없이 permit 생성
- permitNo 없이 위험성평가 저장
- permitNo 없이 TBM 저장
- permitNo 없이 작업중지 저장
- permit에 하위 문서 원문 전체를 중복 저장
- 하위 문서 원본 없이 permit 상태만 바꾸고 상세 이력 미저장
- workId와 permitNo를 같은 역할로 혼용
- 위험성평가/TBM/작업중지 사이 직접 연결만 하고 permit를 우회

---

## 15. 최종 원칙

안전관리 플랫폼에서 문서 연결은 다음 원칙을 따른다.

- `workId` 는 작업 원본의 중심키이다.
- `permitNo` 는 실행 흐름의 중심키이다.
- permit는 상위 원본을 참조하고 하위 실행 문서를 연결하는 허브이다.
- 위험성평가, TBM, 작업중지, 점검은 각각 독립 문서로 저장한다.
- permit에는 대표 참조값만 저장하고 상세 원문은 각 문서 원본에서 조회한다.

이 원칙에 따라 permit 중심 연결 구조를 설계하고, 이후 Firestore 이관 시에도 동일한 구조를 유지한다.
