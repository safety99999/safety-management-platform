# 위험성평가 permit 연결 체크리스트

문서명: RISK_PERMIT_LINK_REVIEW.md  
버전: 1.0  
상태: 검토용  
작성 기준일: 2026-08-27  
적용 대상: 위험성평가_v2.html, permit 연결 구조, Firestore 이관 준비

---

## 1. 목적

이 문서는 위험성평가 문서가 permit 문서와 올바르게 연결되도록 하기 위한 점검 항목을 정의한다.

핵심 목적은 다음과 같다.

- 위험성평가의 정식 식별자(riskId) 구조 확인
- 위험성평가 문서의 상위 원본 연결(workId, permitNo) 확인
- permit 중심 연결 구조와의 정합성 확보
- 위험성평가 저장 시 permit 연동값 누락 방지
- permit ↔ 위험성평가 간 중복 저장 방지
- 나중에 Firestore 이관 시 구조 충돌 방지

---

## 2. 기본 원칙

위험성평가는 독립 문서로 저장한다.

다만 반드시 다음 두 값을 통해 상위 문서와 연결해야 한다.

- workId
- permitNo

또한 위험성평가 자체의 정식 식별자는 다음을 사용한다.

- riskId

즉 연결 구조는 다음과 같다.

```text
작업DB(workId)
   ↓
작업허가(permitNo)
   ↓
위험성평가(riskId)
3. 위험성평가 문서의 필수 연결키
위험성평가 문서에는 최소한 다음 필드가 있어야 한다.

riskId
workId
permitNo
예:

{
  "riskId": "RA-20260827-001",
  "workId": "2026-08-27_5",
  "permitNo": "PTW-20260827-001"
}
체크
[ ] riskId가 존재하는가
[ ] workId가 존재하는가
[ ] permitNo가 존재하는가
[ ] permitNo 형식이 규약과 일치하는가
[ ] workId 형식이 규약과 일치하는가
4. riskId 규칙
4.1 형식
형식:

RA-YYYYMMDD-SEQ3
예:

RA-20260827-001
4.2 원칙
riskId는 위험성평가 문서의 정식 식별자이다.
Firestore 이관 시 문서 ID와 riskId를 동일하게 사용할 수 있다.
riskId는 permitNo와 별도 개념이다.
permitNo 없이 riskId만으로 실행 흐름을 판단하지 않는다.
하나의 permit에 하나의 대표 riskId를 우선 연결한다.
체크
[ ] riskId가 중복 없이 생성되는가
[ ] Date.now만으로 정식 riskId를 만들고 있지 않은가
[ ] riskId와 permitNo를 혼동하지 않는가
5. workId 연결 확인
위험성평가는 상위 작업 원본을 추적할 수 있어야 하므로 workId를 저장해야 한다.

원칙
workId는 위험성평가의 상위 작업 참조키이다.
workId가 없으면 어떤 작업의 평가인지 추적하기 어렵다.
permitNo만 저장하고 workId를 누락하지 않는다.
permit가 workId를 가지고 있더라도 위험성평가 문서에도 workId를 직접 저장한다.
체크
[ ] 위험성평가 저장 시 workId가 직접 들어가는가
[ ] permit에서 불러온 workId를 그대로 유지하는가
[ ] 신규 생성 시 workId 누락 가능성이 없는가
6. permitNo 연결 확인
위험성평가는 실행 흐름의 중심 문서인 permit와 연결되어야 한다.

원칙
위험성평가 문서에는 permitNo를 저장한다.
위험성평가가 permit 생성 이후 작성되면 반드시 permitNo를 연결한다.
permitNo 없이 저장된 위험성평가는 추적/연계가 어렵다.
permitNo는 통합 리포트와 TBM 연결의 기준이 된다.
체크
[ ] permitNo가 위험성평가 문서에 저장되는가
[ ] permitNo가 URL, localStorage, 원본 permit 문서에서 일관되게 전달되는가
[ ] permitNo 없는 평가를 허용할지 운영 기준이 있는가

---

## 🔹 PART 2 / 3

```md
## 7. permit 문서에 저장할 연결값

위험성평가 저장 후 permit 문서에는 대표 연결값으로 riskId를 저장한다.

예:

```json
{
  "permitNo": "PTW-20260827-001",
  "riskId": "RA-20260827-001"
}
원칙
permit에는 대표 riskId만 저장한다.
위험성평가 원문 전체를 permit에 중복 저장하지 않는다.
permit는 실행 흐름 허브이고, 위험성평가 문서가 원본이다.
permit의 riskId는 하위 문서 참조값이다.
체크
[ ] 위험성평가 완료 후 permit.riskId가 갱신되는가
[ ] permit에 위험성평가 원문 전체를 복제하고 있지 않은가
[ ] riskId 갱신 시 이전 이력이 필요한지 검토했는가
8. 위험성평가 스냅샷과 원본 관계
위험성평가는 permit와 연결되지만 독립 문서이므로, 다음을 구분해야 한다.

8.1 위험성평가 문서가 직접 가지는 값
workId
permitNo
작업명
작업유형
작업장소
평가일자
위험요인 목록
안전대책 목록
위험도
통제 적정성
referencedJSAs
8.2 permit가 가지는 값
permitNo
riskId
작업 기본정보 스냅샷
상태
유효기간
approvals
ils
closeout
원칙
permit는 위험성평가 상세 원본을 대체하지 않는다.
위험성평가 문서는 작업명 등 일부 작업 스냅샷을 가질 수 있다.
위험성평가는 permit와 연결되지만 permit의 하위 상세 저장소가 아니다.
9. 기존 위험성평가 저장 구조 점검 항목
현재 위험성평가_v2.html 저장 구조에서 아래를 확인한다.

필수 확인
[ ] riskId 생성 방식
[ ] workId 저장 여부
[ ] permitNo 저장 여부
[ ] linkedPermitNo 와 permitNo가 중복/혼용되는지
[ ] referencedJSA 또는 referencedJSAs 구조
[ ] selectedMeasures 저장 구조
[ ] controlAdequacy 저장 구조
[ ] schemaVersion 저장 여부
권장 확인
[ ] createdAt / updatedAt
[ ] createdBy / updatedBy
[ ] status 또는 평가 상태 필드
[ ] 재평가 시 previousRiskId 연결 여부
10. linkedPermitNo 중복 검토
현재 코드나 기존 스키마에서 다음처럼 permit 관련 필드가 중복될 수 있다.

permitNo
linkedPermitNo
원칙
장기적으로는 permit 연결 필드는 하나로 통일하는 것이 좋다.

권장:

permitNo 로 단일화
단, 하위 호환이 필요하면 일정 기간 linkedPermitNo 를 병행할 수 있다.

체크
[ ] 현재 위험성평가 저장에 permitNo가 있는가
[ ] linkedPermitNo가 별도로 있는가
[ ] 둘 중 무엇을 정식 필드로 사용할지 확정했는가
[ ] 하위 호환 제거 시점이 있는가
11. 위험성평가와 JSA_DB 연결
위험성평가는 permit와 연결될 뿐 아니라 JSA_DB도 참조한다.

즉 위험성평가 문서는 다음 두 축을 함께 가진다.

상위 실행 문서 연결: workId, permitNo
안전 지식 참조: referencedJSA / referencedJSAs
원칙
JSA_DB 참조와 permit 연결은 역할이 다르다.
permitNo는 실행 흐름 연결용
referencedJSA(s)는 지식 참조용
둘을 혼동하지 않는다.
체크
[ ] permitNo와 referencedJSA를 같은 용도로 쓰고 있지 않은가
[ ] permitNo가 없어도 JSA 참조만으로 저장되는 구조는 아닌가
[ ] JSA 참조와 permit 연결이 동시에 저장되는가

---

## 🔹 PART 3 / 3

```md
## 12. 상태 연계 원칙

위험성평가 완료 시 permit 상태가 자동으로 바뀌는지 여부는 별도 정책이 필요하다.

### 권장 원칙

- 위험성평가 완료만으로 permit 상태를 자동 `허가완료` 로 바꾸지 않는다.
- 위험성평가는 permit 승인에 필요한 선행 문서일 뿐, permit 자체를 승인하지 않는다.
- permit 문서에는 `riskId` 연결만 반영한다.
- permit 승인/상태 변경은 별도 승인 흐름에서 수행한다.

### 체크
- [ ] 위험성평가 저장이 permit 상태를 과도하게 변경하지 않는가
- [ ] riskId만 연결하고 상태는 유지하는 구조인지 확인
- [ ] permit 승인과 위험성평가 완료를 구분하는가

---

## 13. 재평가 구조 검토

향후 위험성평가 재실시 또는 재평가 시 다음 구조가 필요할 수 있다.

- previousRiskId
- assessmentVersion
- reassessmentReason
- changedHazards
- changedMeasures

### 원칙

- 재평가는 기존 riskId를 덮어쓰지 않는 것을 권장
- 이전 평가와 새 평가의 연결이 가능해야 함
- permit에는 현재 유효한 대표 riskId만 연결 가능

### 체크
- [ ] 재평가 시 기존 riskId 덮어쓰기 여부
- [ ] 이전 평가 이력 보존 여부
- [ ] permit.riskId를 언제 갱신할지 기준이 있는가

---

## 14. Firestore 이관 전 확인사항

위험성평가를 Firestore로 이관하기 전에 다음을 확인한다.

- riskId 중복 없음
- permitNo 형식 정상
- workId 형식 정상
- permitNo 없는 위험성평가 처리 기준 정의
- linkedPermitNo 사용 여부 정리
- referencedJSA / referencedJSAs 정리
- selectedMeasures 구조 확인
- controlAdequacy 구조 확인
- schemaVersion 확인
- createdAt / updatedAt 존재 여부 확인

---

## 15. 금지사항

- riskId 없이 위험성평가 저장
- permitNo 없이 permit 기반 평가 저장
- workId 없이 원본 작업 추적이 안 되는 평가 저장
- permit에 위험성평가 전체 원문을 복제 저장
- 위험성평가 완료 시 permit를 자동 최종 승인 처리
- linkedPermitNo / permitNo를 혼용하면서 기준 미정 상태 유지
- referencedJSA를 permit 연결키처럼 사용
- 재평가 시 기존 riskId를 조용히 덮어쓰기

---

## 16. 최종 원칙

위험성평가 문서는 다음 원칙을 따른다.

1. `riskId` 는 위험성평가 문서의 정식 식별자이다.
2. `workId` 는 상위 작업 원본 연결키이다.
3. `permitNo` 는 실행 흐름 permit 연결키이다.
4. 위험성평가는 permit와 연결되지만 permit의 상세 하위 저장소가 아니다.
5. permit에는 대표 riskId만 저장하고, 위험성평가 원문은 위험성평가 문서에서 관리한다.
6. permit 승인과 위험성평가 완료는 서로 다른 단계로 구분한다.
