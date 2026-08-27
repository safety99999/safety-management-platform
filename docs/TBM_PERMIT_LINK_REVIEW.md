# TBM permit 연결 체크리스트
문서명: TBM_PERMIT_LINK_REVIEW.md  
버전: 1.0  
상태: 검토용  
작성 기준일: 2026-08-27  
적용 대상: TBM_및_작업중지권_v2.html, permit 연결 구조, Firestore 이관 준비

---

## 1. 목적

이 문서는 TBM 문서가 permit 문서와 올바르게 연결되도록 하기 위한 점검 항목을 정의한다.

핵심 목적은 다음과 같다.

- TBM 문서의 정식 식별자(tbmNo) 구조 확인
- TBM 문서의 상위 원본 연결(workId, permitNo) 확인
- permit 중심 연결 구조와의 정합성 확보
- TBM 저장 시 permit 연동값 누락 방지
- permit ↔ TBM 간 중복 저장 방지
- 나중에 Firestore 이관 시 구조 충돌 방지

---

## 2. 기본 원칙

TBM은 독립 문서로 저장한다.

다만 반드시 다음 값을 통해 상위 문서와 연결해야 한다.

- workId
- permitNo

가능하면 다음도 함께 가진다.

- riskId

TBM 자체의 정식 식별자는 다음을 사용한다.

- tbmNo

즉 연결 구조는 다음과 같다.

```text
작업DB(workId)
   ↓
작업허가(permitNo)
   ↓
위험성평가(riskId)
   ↓
TBM(tbmNo)
3. TBM 문서의 필수 연결키
TBM 문서에는 최소한 다음 필드가 있어야 한다.

tbmNo
workId
permitNo
권장 추가 필드:

riskId
예:

{
  "tbmNo": "TBM-20260827-001",
  "workId": "2026-08-27_5",
  "permitNo": "PTW-20260827-001",
  "riskId": "RA-20260827-001"
}
체크
[ ] tbmNo가 존재하는가
[ ] workId가 존재하는가
[ ] permitNo가 존재하는가
[ ] permitNo 형식이 규약과 일치하는가
[ ] workId 형식이 규약과 일치하는가

---

## PART 2 / 5

```md
## 4. tbmNo 규칙

### 4.1 형식

형식:

    TBM-YYYYMMDD-SEQ3

예:

    TBM-20260827-001

### 4.2 원칙

- tbmNo는 TBM 문서의 정식 식별자이다.
- Firestore 이관 시 문서 ID와 tbmNo를 동일하게 사용할 수 있다.
- tbmNo는 permitNo와 별도 개념이다.
- permitNo 없이 tbmNo만으로 실행 흐름을 판단하지 않는다.
- 하나의 permit에 하나의 대표 tbmNo를 우선 연결한다.

### 체크
- [ ] tbmNo가 중복 없이 생성되는가
- [ ] Date.now만으로 정식 tbmNo를 만들고 있지 않은가
- [ ] tbmNo와 permitNo를 혼동하지 않는가

---

## 5. workId 연결 확인

TBM은 상위 작업 원본을 추적할 수 있어야 하므로 workId를 저장해야 한다.

### 원칙

- workId는 TBM의 상위 작업 참조키이다.
- workId가 없으면 어떤 작업의 TBM인지 추적하기 어렵다.
- permitNo만 저장하고 workId를 누락하지 않는다.
- permit가 workId를 가지고 있더라도 TBM 문서에도 workId를 직접 저장한다.

### 체크
- [ ] TBM 저장 시 workId가 직접 들어가는가
- [ ] permit에서 불러온 workId를 그대로 유지하는가
- [ ] 신규 생성 시 workId 누락 가능성이 없는가

---

## 6. permitNo 연결 확인

TBM은 실행 흐름의 중심 문서인 permit와 연결되어야 한다.

### 원칙

- TBM 문서에는 permitNo를 저장한다.
- permitNo 없이 저장된 TBM은 추적/연계가 어렵다.
- permitNo는 통합 리포트와 작업중지 연결의 기준이 된다.

### 체크
- [ ] permitNo가 TBM 문서에 저장되는가
- [ ] permitNo가 URL, localStorage, 원본 permit 문서에서 일관되게 전달되는가
- [ ] permitNo 없는 TBM을 허용할지 운영 기준이 있는가
PART 3 / 5
## 7. riskId 연결 확인

TBM은 가능하면 위험성평가와도 연결되어야 한다.

### 원칙

- 위험성평가를 기반으로 TBM을 작성하는 경우 riskId를 함께 저장한다.
- riskId가 있으면 TBM의 위험요인/대책 출처 추적이 쉬워진다.
- permitNo만 있고 riskId가 없어도 TBM 저장은 가능할 수 있으나,
  가능하면 riskId를 포함하는 것을 권장한다.

### 체크
- [ ] TBM 저장 시 riskId가 같이 저장되는가
- [ ] permitNo만 있고 riskId는 빠지는 구조인지 확인
- [ ] 위험성평가 없는 TBM 허용 기준이 있는가

---

## 8. permit 문서에 저장할 연결값

TBM 저장 후 permit 문서에는 대표 연결값으로 tbmNo를 저장한다.

예:

```json
{
  "permitNo": "PTW-20260827-001",
  "tbmNo": "TBM-20260827-001"
}
원칙
permit에는 대표 tbmNo만 저장한다.
TBM 원문 전체를 permit에 중복 저장하지 않는다.
permit는 실행 흐름 허브이고, TBM 문서가 원본이다.
체크
[ ] TBM 완료 후 permit.tbmNo가 갱신되는가
[ ] permit에 TBM 원문 전체를 복제하고 있지 않은가
[ ] 재TBM 발생 시 permit에 어떤 값을 유지할지 기준이 있는가
9. TBM과 위험성평가의 역할 구분
TBM은 위험성평가를 대체하지 않는다.

위험성평가의 역할
위험요인 선정
안전대책 선정
위험도 평가
통제 적정성 판단
TBM의 역할
위험요인 전달
대책 전달
조치 담당자 확인
작업중지 조건 공유
참석자 확인
작업중지권 고지
체크
[ ] TBM에 위험성평가 원문 전체를 그대로 복제하고 있지 않은가
[ ] TBM이 위험성평가를 대체하는 구조는 아닌가
[ ] TBM이 전달/확인 문서 역할에 맞게 저장되는가

---

## PART 4 / 5

```md
## 10. 현재 TBM 저장 구조 점검 항목

현재 `TBM_및_작업중지권_v2.html` 저장 구조에서 아래를 확인한다.

### 필수 확인
- [ ] tbmNo 생성 방식
- [ ] workId 저장 여부
- [ ] permitNo 저장 여부
- [ ] riskId 저장 여부
- [ ] stopNotice 저장 구조
- [ ] hazards 저장 구조
- [ ] status 저장 구조
- [ ] schemaVersion 저장 여부

### 권장 확인
- [ ] createdAt / updatedAt
- [ ] createdBy / updatedBy
- [ ] 참석자 안전퀴즈 검증 결과 저장 여부
- [ ] 작업중지권 고지 결과 저장 여부
- [ ] 재TBM 시 원본 TBM 참조 구조 여부

---

## 11. 작업중지권 고지와 실제 작업중지의 구분

TBM에는 작업중지권 **고지**가 포함될 수 있다.

하지만 실제 작업중지 **요청/조치/재개**는 별도 문서이다.

### 원칙

- TBM의 stopNotice는 고지 기록이다.
- emergencyNo는 실제 작업중지 문서 연결값이다.
- stopNotice와 emergency를 같은 것으로 취급하지 않는다.

### 체크
- [ ] TBM의 stopNotice와 작업중지 문서가 구분되는가
- [ ] permit.tbmNo와 permit.emergencyNo가 별도 관리되는가
- [ ] 작업중지 발생 시 TBM 자체를 작업중지 문서처럼 덮어쓰지 않는가

---

## 12. 상태 연계 원칙

TBM 완료 시 permit 상태를 어떻게 바꿀지 기준이 필요하다.

### 권장 원칙

- permit가 이미 허가완료 상태이고
- TBM이 완료되면
- 실제 작업 시작 시 permit 상태를 `작업중` 으로 전환한다.

즉:
- TBM 완료 자체와 작업 시작은 완전히 같지 않을 수 있다.
- 운영상 단순화가 필요하면 TBM 완료 시 `작업중` 전환도 가능하지만 기준을 명확히 해야 한다.

### 체크
- [ ] 현재 TBM 저장 시 permit 상태가 바뀌는가
- [ ] 바뀐다면 언제 `작업중` 으로 전환되는가
- [ ] TBM 완료와 실제 작업 시작을 구분할지 결정했는가
PART 5 / 5
## 13. Firestore 이관 전 확인사항

TBM을 Firestore로 이관하기 전에 다음을 확인한다.

- tbmNo 중복 없음
- permitNo 형식 정상
- workId 형식 정상
- riskId 저장 여부 정리
- stopNotice 구조 확인
- hazards 저장 구조 확인
- status 값 확인
- schemaVersion 확인
- createdAt / updatedAt 존재 여부 확인

---

## 14. 금지사항

- tbmNo 없이 TBM 저장
- permitNo 없이 permit 기반 TBM 저장
- workId 없이 원본 작업 추적이 안 되는 TBM 저장
- permit에 TBM 전체 원문을 복제 저장
- TBM 완료만으로 permit를 자동 최종 승인 처리
- stopNotice를 실제 작업중지 문서처럼 취급
- 재TBM 시 기존 TBM을 조용히 덮어쓰기

---

## 15. 최종 원칙

TBM 문서는 다음 원칙을 따른다.

1. `tbmNo` 는 TBM 문서의 정식 식별자이다.
2. `workId` 는 상위 작업 원본 연결키이다.
3. `permitNo` 는 실행 흐름 permit 연결키이다.
4. `riskId` 는 위험성평가 출처 연결키로 가능하면 함께 저장한다.
5. permit에는 대표 tbmNo만 저장하고, TBM 원문은 TBM 문서에서 관리한다.
6. 작업중지권 고지 기록(stopNotice)과 실제 작업중지 문서(emergencyNo)는 구분한다.
