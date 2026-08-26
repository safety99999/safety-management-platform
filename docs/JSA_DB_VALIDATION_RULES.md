# JSA_DB 데이터 검증 규약

문서명: JSA_DB_VALIDATION_RULES.md  
버전: 1.0  
상태: 초안 검토  
작성 기준일: 2026-08-27  
적용 대상: JSA_DB TSV, JSON, 위험성평가 검색자료, Firestore 업로드 데이터  
관련 스키마: JSA_DB schemaVersion 3

---

## 1. 목적

이 문서는 JSA_DB 자료를 위험성평가, 안전작업허가서 및 TBM에서 사용하기 전에 확인해야 할 데이터 검증기준을 정의한다.

주요 목적은 다음과 같다.

- JSON 문법 오류 방지
- jsaId 중복 방지
- 필수 필드 누락 방지
- 위험요인과 안전대책의 연결 오류 방지
- 출처가 잘못 표시되는 문제 방지
- AI 보완내용이 사내기준처럼 표시되는 문제 방지
- 통제 적정성 판정 오류 방지
- 검토되지 않은 자료의 공식 추천 방지
- 고위험작업 필수대책 누락 방지
- Firestore 업로드 전 데이터 품질 확인

검증을 통과하지 못한 자료는 삭제하지 않고 검토대상으로 분류한다.

---

## 2. 검증 단계

JSA_DB 검증은 다음 순서로 수행한다.

1. JSON 문법 검증
2. 문서 식별정보 검증
3. 필수 필드 검증
4. 분류코드와 관리시트 검증
5. 작업정보 검증
6. 위험요인 검증
7. 안전대책 검증
8. 위험요인·대책 연결 검증
9. 출처·AI 표시 검증
10. 통제계층 검증
11. 통제 적정성 검증
12. 고위험작업 후보 검증
13. 검토·승인상태 검증
14. 중복·유사자료 검증
15. 개인정보·보안정보 검증
16. 앱 하위 호환 검증
17. 운영 반영 가능 여부 판정

검증 순서를 임의로 생략하지 않는다.

---

## 3. 검증 결과 등급

각 자료는 다음 결과 중 하나로 분류한다.

| 결과 | 의미 | 처리 |
|---|---|---|
| PASS | 필수 검증 통과 | 승인 검토 가능 |
| WARNING | 보완 또는 확인 필요 | review 상태 유지 |
| ERROR | 구조·연결·출처 오류 | 앱 추천 및 업로드 제한 |
| BLOCKED | 안전상 중대한 오류 | 운영 사용 금지 |

### 3.1 PASS

다음 조건을 모두 충족한 자료이다.

- JSON 문법 정상
- 필수 필드 존재
- ID 중복 없음
- 위험·대책 연결 정상
- 출처 정상
- AI 항목 구분 정상
- 통제 적정성 일관성 확보
- 검토·승인정보 정상

PASS는 자동 승인을 의미하지 않는다.

현업 및 안전보건 검토가 완료되어야 `approved` 상태로 변경할 수 있다.

### 3.2 WARNING

다음과 같은 자료이다.

- 문서번호·개정일 미확인
- 적용조건 일부 불명확
- 필수 여부 추가 확인 필요
- 사내기준 최신성 확인 필요
- 위험·대책 연결은 가능하나 검토 필요

WARNING 자료는 `review` 상태를 유지한다.

### 3.3 ERROR

다음과 같은 자료이다.

- 필수 필드 누락
- 존재하지 않는 위험 또는 대책 ID 참조
- 출처 표시 불일치
- AI 항목 표시 누락
- 잘못된 상태값
- 잘못된 통제계층
- 중복 jsaId
- 문서 ID와 내부 jsaId 불일치

ERROR 자료는 위험성평가의 일반 추천에 사용하지 않는다.

### 3.4 BLOCKED

다음과 같은 자료이다.

- 법령·사내기준이 아닌 내용을 공식 기준으로 표시
- 위험요인에 대응하는 핵심대책이 없음
- AI 대책을 법령 또는 사내기준으로 위장
- 폐기 자료를 현재 기준으로 사용
- 잘못된 대책이 중대사고를 유발할 가능성이 있음
- 개인정보·비밀정보가 공개 데이터에 포함됨
- JSON 손상으로 자료 일부를 신뢰할 수 없음

BLOCKED 자료는 운영 DB와 Firestore에 업로드하지 않는다.

---

## 4. JSON 문법 검증

다음 조건을 확인한다.

- 최상위 구조가 배열인지 확인
- 배열의 시작 문자가 `[`인지 확인
- 배열의 종료 문자가 `]`인지 확인
- 각 레코드가 객체인지 확인
- 객체 사이에 쉼표가 있는지 확인
- 마지막 객체 뒤에 불필요한 쉼표가 없는지 확인
- 문자열의 따옴표가 닫혀 있는지 확인
- 중괄호와 대괄호가 정상적으로 닫혀 있는지 확인
- 주석이 포함되지 않았는지 확인
- 허용되지 않는 특수문자로 JSON이 손상되지 않았는지 확인

JSON 파싱에 실패하면 전체 파일을 운영에 사용하지 않는다.

---

## 5. 문서 식별정보 검증

### 5.1 필수 식별 필드

각 JSA 레코드는 다음 필드를 가져야 한다.

- jsaId
- no
- classCode
- schemaVersion

### 5.2 jsaId 형식

형식:

    JSA-{분류코드}-{6자리 순번}

예:

    JSA-WRK-000001
    JSA-INT-000001
    JSA-ACC-000001

### 5.3 검증 항목

- jsaId가 비어 있지 않음
- jsaId가 전체 데이터에서 중복되지 않음
- jsaId의 분류코드와 classCode가 일치
- Firestore 문서 ID와 내부 jsaId가 일치
- Date.now 또는 Math.random 기반 임시 ID가 아님
- 폐기된 jsaId를 재사용하지 않음
- 원본 no를 jsaId 대신 사용하지 않음

### 5.4 no 필드

no는 원본 표 또는 자료의 번호를 보존하는 필드이다.

- no는 시스템 고유키로 사용하지 않는다.
- 서로 다른 분류 또는 원본에서 no가 중복될 수 있다.
- 원본 순서가 변경되어도 jsaId는 변경하지 않는다.

---

## 6. 분류코드와 관리시트 검증

허용 조합은 다음과 같다.

| classCode | sheet |
|---|---|
| LAW | 법령 |
| INT | 사내 |
| SOP | 표준 |
| JSA | JSA |
| TBM | TBM |
| PTW | 허가 |
| ACC | 재해 |
| NMS | 아차 |
| REC | 권고 |
| EXT | 외부 |
| WRK | 원문 |
| UNK | 미분류 |

다음은 오류로 처리한다.

- 허용되지 않은 classCode
- classCode와 sheet 불일치
- 일반 작업 원문을 LAW 또는 INT로 표시
- KOSHA 자료를 LAW로 자동 표시
- 작업표준서를 INT와 SOP로 혼용
- 재해사례를 일반 원문으로 표시
- 출처가 불명확한 자료를 임의로 확정

출처가 불명확하면 다음과 같이 처리한다.

- classCode: UNK
- sheet: 미분류
- metadata.status: review
- reviewNotes에 `출처 확인` 기록

---

## 7. 필수 평면 필드 검증

기존 위험성평가 앱과의 하위 호환을 위해 다음 필드를 확인한다.

- jsaId
- no
- classCode
- sheet
- workType
- workSubType
- workName
- workStage
- equipment
- materials
- originalHazard
- accidentType
- scenario
- detailedMeasures
- standardMeasures
- controlAdequacy
- remark
- schemaVersion

다음 필드는 빈값이 허용되지 않는다.

- jsaId
- classCode
- sheet
- workType
- workName
- originalHazard
- accidentType
- detailedMeasures
- controlAdequacy
- schemaVersion

기준자료 단독 입력 등으로 일부 정보가 없는 경우 임의로 구체화하지 않고 적용 검토사항을 남긴다.

---

## 8. 작업정보 검증

### 8.1 workInfo 필수 필드

- primaryWorkType
- workTypes
- workSubType
- workName
- stages
- equipment
- materials
- energySources
- riskSources
- keywords

### 8.2 배열 검증

다음 필드는 배열이어야 한다.

- workTypes
- stages
- equipment
- materials
- energySources
- riskSources
- keywords

### 8.3 일관성 검증

- 루트 workType과 workInfo.primaryWorkType이 일치하는지 확인
- 루트 workName과 workInfo.workName이 일치하는지 확인
- primaryWorkType이 workTypes에 포함되는지 확인
- 평면 문자열의 장비·물질과 구조화 배열의 의미가 충돌하지 않는지 확인
- 서로 다른 고위험 작업유형을 대표 유형 하나로 삭제하지 않았는지 확인

복합 작업의 경우 workTypes에 모든 관련 유형을 보존한다.

---

## 9. 위험요인 검증

### 9.1 필수 필드

각 hazards 항목에는 다음 필드가 필요하다.

- hazardId
- text
- standardName
- source
- sourceText
- stage
- energySources
- riskSources
- accidentTypes
- scenario
- relatedMeasureIds
- critical
- aiGenerated
- reviewStatus

### 9.2 hazardId

- 한 JSA 문서 안에서 중복되지 않아야 한다.
- 기본 형식은 H01, H02, H03 순서를 사용한다.
- 다른 JSA의 hazardId와 동일해도 되지만 jsaId와 함께 식별한다.

### 9.3 위험내용

- 위험요인은 작업상황, 위험원 및 예상 사고가 드러나야 한다.
- 단순히 `위험 있음`이라고 작성하지 않는다.
- 사고시나리오는 원인과 결과를 짧게 나타낸다.
- 원문 위험과 AI 보완 위험을 구분한다.
- 원문에 없는 위험을 WRK로 표시하지 않는다.
- `추락`은 표준 사고유형에서 `떨어짐`으로 통일한다.
- `협착`은 표준 사고유형에서 원칙적으로 `끼임`으로 통일한다.
- 의미가 불명확한 `전도`는 넘어짐·전복·무너짐 등으로 구체화한다.

### 9.4 AI 위험 검증

AI가 보완한 위험은 다음 조건을 모두 만족해야 한다.

- source가 AI
- aiGenerated가 true
- reviewStatus가 draft 또는 review
- 원문 위험인 것처럼 표시하지 않음
- 공식 추천 시 기본 미선택
- 선택 시 사용자와 선택시각 기록 가능

다음 조합은 오류이다.

- source가 WRK인데 aiGenerated가 true
- source가 AI인데 aiGenerated가 false
- AI 위험이 approved인데 검토정보가 없음

---

## 10. 안전대책 검증

### 10.1 필수 필드

각 measures 항목에는 다음 필드가 필요하다.

- measureId
- text
- standardName
- source
- hierarchy
- controlFunction
- required
- conditions
- verificationMethod
- relatedHazardIds
- aiGenerated
- reviewStatus

### 10.2 measureId

- 한 JSA 문서 안에서 중복되지 않아야 한다.
- 기본 형식은 M01, M02, M03 순서를 사용한다.
- jsaId와 함께 고유하게 식별한다.

### 10.3 대책 문구

- 실제로 수행 가능한 조치인지 확인
- 단순한 `주의`, `조심`, `안전수칙 준수`만 사용하지 않음
- 대상과 조치내용이 드러나야 함
- 보호구만 나열하지 않음
- 적용조건이 필요한 대책은 conditions에 기록
- 현장에서 확인할 방법을 verificationMethod에 기록
- 필수대책을 개수 제한으로 삭제하지 않음

### 10.4 표준 대책명

- 짧고 명확한 명사형 사용
- 동일 의미는 같은 표준명 사용
- LOTO는 ILS로 표준화
- 기본 보호구는 불필요하게 반복하지 않음
- 화학물질 보호구는 표준용어 사용

---

## 11. 출처 검증

### 11.1 허용 source

- LAW
- INT
- SOP
- JSA
- TBM
- PTW
- ACC
- NMS
- REC
- EXT
- WRK
- AI
- USER

### 11.2 기본 원칙

- source는 실제 근거자료를 나타낸다.
- 적용 우선순위가 높다는 이유로 source를 변경하지 않는다.
- WRK 자료의 원문 대책은 WRK로 저장한다.
- INT 자료에서 직접 확인된 대책은 INT로 저장한다.
- 재해사례의 공식 재발방지대책은 ACC로 저장한다.
- 아차사고의 확인된 예방조치는 NMS로 저장한다.
- 입력자료에 없던 보완안은 AI로 저장한다.

### 11.3 출처 불일치

다음은 오류 또는 검토대상이다.

- 평면 detailedMeasures의 태그와 measures.source가 다름
- 사내기준에서 확인되지 않은 대책을 INT로 표시
- 재해 원문에 없는 대책을 ACC로 표시
- AI 보완 대책에 AI 표시가 없음
- 태그가 없다는 이유로 모든 대책을 WRK로 처리
- 하나의 대책에 여러 출처가 있는데 추적정보가 없음

### 11.4 복수 출처

한 레코드가 작업 원문과 사내기준을 함께 참조하면 sourceDocuments 배열을 사용한다.

sourceDocuments 항목에는 다음 정보를 기록한다.

- sourceType
- documentName
- documentNo
- version
- effectiveDate
- verified
- verifiedAt
- verifiedBy

문서정보가 확인되지 않으면 빈값과 false를 사용하고 review 상태를 유지한다.

---

## 12. 통제계층 검증

허용 hierarchy:

- elimination
- substitution
- engineering
- administrative
- ppe
- emergency
- unknown

### 12.1 분류 예

| 대책 | hierarchy |
|---|---|
| 위험작업 제거 | elimination |
| 유해물질 대체 | substitution |
| 방호장치·밀폐·국소배기 | engineering |
| ILS 절차·출입통제·감시인 | administrative |
| 안전대·송기마스크·화학보호구 | ppe |
| 구조계획·소화설비·비상조치 | emergency |

### 12.2 검증 원칙

- 보호구를 engineering으로 분류하지 않는다.
- 교육·표지·점검을 engineering으로 분류하지 않는다.
- 환기설비·방호장치를 administrative로만 분류하지 않는다.
- 분류가 불명확하면 unknown으로 두고 검토한다.
- 하나의 대책에 여러 기능이 있으면 주된 통제계층을 지정한다.

---

## 13. 통제기능 검증

권장 controlFunction:

- isolation
- guarding
- grounding
- leakageProtection
- ventilation
- detection
- accessControl
- supervision
- communication
- permit
- planning
- inspection
- verification
- training
- recordkeeping
- contaminationControl
- emergencyResponse
- restoration
- ppe

### 13.1 검증 원칙

- controlFunction은 대책이 실제로 수행하는 기능을 나타낸다.
- hierarchy와 controlFunction의 의미가 모순되지 않아야 한다.
- 가스측정은 detection으로 분류한다.
- 강제환기는 ventilation으로 분류한다.
- 출입통제는 accessControl로 분류한다.
- 감시인 배치는 supervision으로 분류한다.
- ILS 완료 확인은 isolation으로 분류한다.
- 비상구조계획은 emergencyResponse로 분류한다.

---

## 14. 위험요인·대책 연결 검증

### 14.1 양방향 연결

hazard.relatedMeasureIds에 있는 각 ID는 measures에 실제로 존재해야 한다.

measure.relatedHazardIds에 있는 각 ID는 hazards에 실제로 존재해야 한다.

두 방향의 연결은 서로 일치해야 한다.

예:

- H01이 M01을 참조
- M01도 H01을 참조

### 14.2 오류 조건

다음은 ERROR로 처리한다.

- 존재하지 않는 measureId 참조
- 존재하지 않는 hazardId 참조
- 위험에는 대책이 연결됐지만 대책에는 위험이 없음
- 대책에는 위험이 연결됐지만 위험에는 대책이 없음
- hazardId 또는 measureId 중복
- 모든 위험이 하나의 무관한 대책에 일괄 연결됨

### 14.3 미통제 위험

다음 조건이면 미통제 위험으로 표시한다.

- relatedMeasureIds가 비어 있음
- 연결된 대책이 모두 미선택 또는 미승인
- 필수대책이 누락됨
- PPE만 연결되어 있음
- 적용조건이 현재 작업과 맞지 않음

중대한 미통제 위험이 있으면 통제 적정성을 ○로 판정하지 않는다.

---

## 15. 통제 적정성 검증

### 15.1 필드 역할

스키마 전환 중 두 값을 구분한다.

- 루트 controlAdequacy: 기존 원천자료의 판정
- quality.controlAdequacy: 구조화·기준대조 후 판정

신규 위험성평가 앱은 quality.controlAdequacy를 우선 사용한다.

### 15.2 허용값

- ○
- △
- ×

### 15.3 일관성 검사

다음 조건이면 ○를 허용하지 않는다.

- missingCriticalMeasures가 실제 필수대책 누락을 포함함
- 중대한 미통제 위험이 존재함
- 대책이 PPE에만 의존함
- AI 대책만 존재함
- 위험요인과 대책 연결이 깨져 있음
- 필수대책이 review 또는 draft 상태뿐임
- 현재 적용조건을 확인할 수 없음

### 15.4 missingCriticalMeasures

실제로 누락된 필수대책만 기록한다.

단순 확인사항은 missingCriticalMeasures에 넣지 않고 reviewNotes에 기록한다.

예:

- 필수대책 누락: `비상구조계획 없음`
- 검토사항: `비상구조계획 적용 여부 확인`

### 15.5 판정 사유

quality.adequacyReason은 빈값이면 안 된다.

다음 내용 중 핵심 사유를 기록한다.

- 공학적 대책 포함
- 행정적 대책 중심
- PPE 중심
- 필수대책 누락
- AI 보완 검토 필요
- 적용조건 확인 필요
- 미통제 위험 존재

---

## 16. 고위험작업 후보 검증

### 16.1 구조

각 JSA에는 필요한 경우 highRiskCandidate를 둔다.

필드:

- applicable
- categories
- reasons
- requiresConfirmation

### 16.2 categories 허용값

- 화재·폭발
- 밀폐공간
- 고부식성 화학물질
- 고소
- 중량물
- 전기

### 16.3 검증 원칙

- 고위험 후보는 최종 판정이 아니다.
- 작업조건이 부족하면 requiresConfirmation을 true로 둔다.
- 복합 고위험은 모든 categories를 보존한다.
- 예외조건만으로 자동 비대상 처리하지 않는다.
- 고위험 후보가 없더라도 일반 안전점검은 유지한다.

### 16.4 대표 검증 예

- 밀폐공간 내부 정비 → 밀폐공간 후보
- 밀폐공간 내부 용접 → 밀폐공간 + 화재·폭발 후보
- 강산·강염기 배관 수리 → 고부식성 화학물질 후보
- 중량물 인양 후 하부 작업 → 중량물 후보
- 고압 계통 수리 → 전기 후보
- 고정 난간 없는 5m 이상 작업 → 고소 후보

---

## 17. 검토·승인상태 검증

### 17.1 metadata.status 허용값

- draft
- review
- approved
- retired

### 17.2 추천 사용조건

일반 위험성평가 추천에 사용하는 자료는 원칙적으로 다음을 만족해야 한다.

- metadata.status가 approved
- qualityGrade가 A 또는 B
- retired 상태가 아님
- sourceVerified가 true
- 현재 유효 버전
- 필수 연결 오류 없음

### 17.3 review 자료

개발 단계에서 review 자료를 사용할 경우 다음 조건을 적용한다.

- 검토자료임을 화면에 표시
- 승인자료와 색상·문구로 구분
- 자동 적용하지 않음
- AI 항목 기본 미선택
- 사용자가 출처와 검토상태를 확인
- 공식 허가대책으로 반영하기 전 확인

### 17.4 approved 금지조건

다음 조건에서는 approved로 변경하지 않는다.

- sourceVerified가 false
- 문서번호·버전·시행일 확인이 필요한 핵심 기준
- 위험·대책 연결 오류
- AI 대책만으로 구성
- 필수대책 누락
- 개인정보 또는 보안정보 포함
- 통제 적정성 충돌
- 폐기 기준과 중복

---

## 18. 중복 검증

### 18.1 완전 중복

다음 값이 모두 동일하거나 사실상 동일하면 완전 중복 후보로 표시한다.

- classCode
- workName
- workSubType
- originalHazard
- detailedMeasures
- 출처 문서

### 18.2 유사 중복

다음 조건이면 유사 중복 후보로 표시한다.

- 작업명이 매우 유사함
- 위험요인이 동일함
- 사고시나리오가 동일함
- 대책 구성이 대부분 동일함
- 같은 원본 문서에서 반복 추출됨

### 18.3 처리 원칙

- 자동 삭제하지 않는다.
- 대표 자료를 지정한다.
- 출처가 다르면 각각 보존할 수 있다.
- 동일 대책의 복수 출처는 추적정보를 유지한다.
- 대체 관계가 있으면 replacedByJsaId를 기록한다.
- 단순 문구 차이만 있는 자료는 병합 검토한다.

---

## 19. 고위험 필수대책 검증

고위험작업은 대책 개수만으로 적정성을 판단하지 않는다.

### 19.1 밀폐공간

최소 확인기능:

- 사전조사
- 유입원 차단
- 다점 가스측정
- 적정공기 판정
- 강제환기
- 1시간 주기 측정
- 휴대용 검지기
- 감시인
- 출입통제
- 통신
- 구조장비
- 비상구조계획
- 교육·훈련
- 보호구
- 재진입 전 재측정

### 19.2 화재·폭발

최소 확인기능:

- 작업허가
- 가연물 제거·격리
- 가스측정
- 환기
- 불티비산 방지
- 소화설비
- 화재감시자
- 장비 전기안전
- 가스 누설방지
- 역화방지
- 용기 관리
- 잔불 확인
- 비상대응

### 19.3 고소

최소 확인기능:

- 작업높이
- 적합한 장비
- 작업발판
- 안전난간
- 개구부 방호
- 전도·미끄럼 방지
- 안전대 부착설비
- 떨어짐 방지장비
- 낙하물 방지
- 하부 출입통제
- 적재하중
- 장비점검
- 기상·조도
- 구조계획

### 19.4 중량물

최소 확인기능:

- 작업계획서
- 운전자 자격
- 지반상태
- 아웃트리거
- 정격하중
- 인양물 중량·무게중심
- 방호장치
- 줄걸이 용구
- 신호수·작업지휘자
- 통신
- 작업반경 통제
- 인양물 하부 출입금지
- 유도로프
- 비상정지

### 19.5 전기

최소 확인기능:

- 전압·전력량
- 충전·정전 구분
- 작업계획
- 작업자 자격
- ILS 적용·완료 확인
- 충전부 방호
- 무전압 확인
- 접지·단락접지
- 누전보호
- 절연공구·보호구
- 인접 충전부 보호
- 작업자 철수
- 복전 승인

### 19.6 고부식성 화학물질

최소 확인기능:

- 물질 식별
- MSDS
- 유입원 차단
- ILS
- 잔류압력·잔류물 제거
- 누출·비산 방지
- 환기·국소배기
- 출입통제
- 적합한 보호구
- 비상세안·샤워
- 방제장비
- 회수·폐기
- 응급조치

필수 통제기능의 적용 여부가 불명확하면 자동으로 적정 판정을 내리지 않는다.

---

## 20. 개인정보·보안 검증

다음 정보가 JSA_DB에 포함되면 검토한다.

- 직원 실명
- 개인 전화번호
- 이메일
- 서명
- 주민번호 등 식별정보
- 내부 연락망
- 민감한 설비 위치
- 출입통제 정보
- 인증키·토큰
- 공개 제한 문서

### 20.1 처리 원칙

- JSA_DB에는 개인별 실적정보를 저장하지 않는다.
- 작업 원문의 개인정보는 제거 또는 마스킹한다.
- WO 번호는 보안정책에 따라 마스킹할 수 있다.
- 실제 연락처를 Public GitHub에 저장하지 않는다.
- 서명 이미지를 JSA_DB에 포함하지 않는다.
- API 키·비밀키·인증 토큰을 포함하지 않는다.

개인정보 또는 보안정보가 포함된 자료는 정제 전까지 BLOCKED로 처리한다.

---

## 21. 하위 호환 검증

현재 위험성평가 v2가 사용하는 다음 필드가 존재하는지 확인한다.

- classCode
- workType
- workSubType
- workName
- workStage
- originalHazard
- accidentType
- detailedMeasures
- standardMeasures
- controlAdequacy

신규 구조에는 다음 필드가 존재해야 한다.

- jsaId
- workInfo
- hazards
- measures
- quality
- metadata
- schemaVersion

### 21.1 우선 사용 규칙

- v3 앱은 hazards와 measures를 우선 사용
- 구조화 필드가 없으면 평면 문자열을 임시 파싱
- v2 앱은 평면 필드 사용
- 변환 완료 후 문자열 파싱 의존도를 줄임
- 평면 필드와 구조화 필드의 의미가 충돌하면 ERROR로 처리

---

## 22. 운영 반영 가능 여부

### 22.1 테스트 전용

다음 조건이면 테스트 파일에서만 사용한다.

- metadata.status가 review
- sourceVerified가 false
- qualityGrade가 C 또는 D
- AI 대책 중심
- 기준 문서정보 미확인
- 위험·대책 연결 검토 중

### 22.2 제한 사용

다음 조건이면 검토자료로만 표시할 수 있다.

- metadata.status가 review
- qualityGrade가 B
- 구조 검증 통과
- 출처 최신성 확인 전
- 사용자가 검토자료임을 확인할 수 있음

### 22.3 운영 추천 가능

다음 조건을 모두 만족해야 한다.

- metadata.status가 approved
- qualityGrade가 A 또는 B
- sourceVerified가 true
- JSON 문법 정상
- ID 중복 없음
- 위험·대책 연결 정상
- 필수대책 검증 완료
- 개인정보 제거
- 최신 버전
- 승인자·승인시각 존재

운영 추천이 가능하더라도 사용자가 현재 작업조건에 맞는지 최종 확인해야 한다.

---

## 23. 검증 오류 기록

검증 오류는 다음 구조로 기록할 수 있다.

    {
      "validationId": "VAL-000001",
      "jsaId": "JSA-WRK-000001",
      "severity": "ERROR",
      "ruleCode": "LINK-001",
      "field": "hazards[0].relatedMeasureIds",
      "message": "참조한 M10 대책이 존재하지 않음",
      "detectedAt": "",
      "resolved": false,
      "resolvedAt": "",
      "resolvedBy": "",
      "resolution": ""
    }

severity 허용값:

- INFO
- WARNING
- ERROR
- BLOCKED

오류를 수정한 후에도 검증 이력을 보존할 수 있다.

---

## 24. 대표 10건 검증 체크리스트

대표 10건은 다음을 모두 확인한다.

### 공통

- jsaId 중복 없음
- 원본 no 보존
- classCode와 sheet 일치
- 평면 필드 존재
- workInfo 존재
- hazards 존재
- measures 존재
- quality 존재
- metadata 존재
- schemaVersion이 3

### 위험요인

- 원문 의미 보존
- 위험요인 분리 적정
- 사고유형 표준화
- 사고시나리오 적정
- AI 위험 구분
- 중대위험 표시
- 적용조건 확인

### 안전대책

- 대책 분리 적정
- 표준명 존재
- 출처 정확
- AI 대책 구분
- 통제계층 적정
- 통제기능 적정
- 필수 여부 검토
- 확인방법 존재

### 연결

- 위험에서 대책 참조 정상
- 대책에서 위험 참조 정상
- 미통제 위험 확인
- 무관한 대책 연결 없음

### 품질

- 원천 판정과 구조화 판정 비교
- missingCriticalMeasures 적정
- reviewNotes와 누락대책 구분
- qualityGrade 적정
- sourceVerified 상태 적정
- approved 오사용 없음

### 고위험 후보

- 분류 적정
- 복합 고위험 보존
- 예외 자동 적용 없음
- 최종 판정과 후보 구분

---

## 25. 대표 10건별 중점 검증

| 원본 no | 분야 | 중점 검증 |
|---:|---|---|
| 1 | 밀폐공간 | 가스측정·환기·감시·구조·출입 |
| 2 | 화기 | 격리·가연물·감시자·소화·잔불 |
| 3 | 전기 | ILS·무전압·충전부·고온 |
| 8 | 고소 | 떨어짐·충돌·끼임·고소작업대 |
| 12 | 중량물 | 인양·줄걸이·신호수·감전 |
| 6 | 화학물질 | 차단·드레인·잔류압력·보호구 |
| 82 | 재해 | AI 재발방지대책 검토 |
| 81 | 아차 | 비상통화·구조연락·훈련 |
| 77 | 사내 화기 | 역화방지·누설·호스·용기 |
| 78 | 사내 화학 | 분진·국소배기·오염관리·수분반응 |

---

## 26. 파일 단위 완료 기준

`data/jsa_database_v3_test.json`은 다음 조건을 충족해야 한다.

- 하나의 유효한 JSON 배열
- 대표 10건 포함
- jsaId 10개 모두 고유
- schemaVersion 3
- 모든 metadata.status가 review
- 모든 위험·대책 연결 정상
- AI 항목 표시 정상
- sourceDocuments 존재
- highRiskCandidate 존재
- 개인정보 없음
- 기존 평면 필드 유지
- 운영 파일과 분리
- Firestore 미업로드 상태

---

## 27. 검증 완료 후 처리

대표 10건이 검증되면 다음 순서로 진행한다.

1. 검토 오류 수정
2. 사내기준 문서정보 보완
3. approved 전환 대상 선정
4. 위험성평가 앱 v3 호환 기능 추가
5. hazards·measures 우선 읽기
6. 위험요인 선택 기능
7. 복수 JSA 참조
8. 위험별 최초·잔여 위험도
9. TBM 위험·대책 연결
10. 나머지 JSA 자료 단계적 확장
11. Firestore 업로드 전 최종 검증

---

## 28. 금지사항

- 검증 없이 운영 DB와 교체
- review 자료를 approved로 일괄 변경
- 필수대책 누락 상태에서 적정 판정
- AI 항목의 출처 변경
- 원문 위험을 AI 위험으로 변경
- AI 위험을 원문 위험으로 변경
- 존재하지 않는 ID 참조
- 개인정보 포함 자료 업로드
- 운영 Firestore에 테스트 자료 업로드
- 위험성평가 앱을 테스트 DB로 즉시 전환
- JSON 오류가 있는 상태에서 일부 데이터만 임의 사용
- 오류 레코드를 조용히 삭제

---

## 29. 최종 원칙

JSA_DB 검증은 데이터 형식만 확인하는 작업이 아니다.

다음 사항을 함께 확인해야 한다.

- 원문 의미
- 출처
- 위험요인
- 사고시나리오
- 안전대책
- 통제계층
- 위험·대책 연결
- 필수대책
- 고위험작업 적용 가능성
- 검토·승인상태
- 개인정보와 보안
- 위험성평가·허가서·TBM 활용 가능성

검증을 통과하지 않은 자료는 공식 안전대책으로 자동 사용하지 않는다.

최종 승인된 자료라도 현재 작업조건에 맞는지는 현업 담당자와 안전보건 담당자가 다시 확인한다.
