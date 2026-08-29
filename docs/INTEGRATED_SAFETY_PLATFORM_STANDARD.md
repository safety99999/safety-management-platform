안전관리 플랫폼 통합 업무·시스템 기준서
문서명: INTEGRATED_SAFETY_PLATFORM_STANDARD.md
버전: 1.0
상태: 통합 기준안
작성 기준일: 2026-08-29
적용 대상: 포스코퓨처엠 포항양극재공장 안전관리 플랫폼 전체
적용 범위: 작업DB, 안전정보제공, 안전퀴즈, AI 위험검증, 작업허가, TBM, 작업중지, 작업 중 점검, 전자종결
최종 확정: 현업 담당자 및 안전보건 담당자 승인 후 확정
1. 문서 목적
이 문서는 기존에 작성된 다음 문서와 앱의 중복·불일치 사항을 통합하고, 향후 개발과 운영에 적용할 단일 기준을 정의한다.

통합 대상 문서
WORKFLOW_ARCHITECTURE.md
JSA_DB_STRUCTURE.md
FIELD_MAPPING_OPERATION.md
PERMIT_DB_SCHEMA.md
PAPER_FORM_DIGITAL_MAPPING.md
기타 프로젝트 규약 및 인수인계 문서
통합 대상 앱
안전관리플랫폼_대시보드_V6_.html
안전정보제공서_도급인용.html
안전정보제공서_수급인용.html
포항양극재공장_안전퀴즈.html
위험성평가_v2.html
안전작업허가서_v2.html
TBM_및_작업중지권_v2.html
향후 분리할 TBM_v2.html
향후 분리할 작업중지권_v2.html
2. 문서 적용 우선순위
문서 간 내용이 충돌할 경우 다음 순서를 적용한다.

최신 법령
회사 공식 안전기준
담당 부서의 확정 사항
이 문서 INTEGRATED_SAFETY_PLATFORM_STANDARD.md
WORKFLOW_ARCHITECTURE.md
기타 데이터·기능별 세부 문서
기존 애플리케이션 코드
이 문서가 확정되면 기존 문서는 세부 참고자료로 사용하고, 서로 충돌하는 내용은 이 문서에 맞춰 개정한다.

3. 핵심 운영 원칙
3.1 작업DB는 D-1 확정 계획의 신뢰 원본이다
작업DB에 실행 대상으로 등록된 작업은 다음 절차가 완료된 것으로 본다.

작업 등록
작업 수행 주체 결정
작업표준 등록
공식 위험성평가 등록
작업계획서 등록
필요한 안전자료 등록
고위험작업 판정
고위험작업 별도 검토 및 승인
도급인·수급인 D-1 사전회의
사전 보완
최종 확정
안전관리 앱은 작업DB의 확정 결과를 임의로 변경하지 않는다.

3.2 계획과 실행을 분리한다
구분	시스템	시점	역할
계획	작업관리대장 서버	D-1 이전	작업계획 수립·검토·확정
실행	안전관리 앱	D-Day	현장 확인·허가·TBM·점검
통제	안전관리 앱	작업 중	작업중지·조치·재개
종결	안전관리 앱	작업 완료 시	복구·ILS 해제·전자종결
3.3 D-1 확정자료는 임의 변경하지 않는다
D-Day 현장에서 작업조건이 달라지면 작업DB 원본을 직접 수정하지 않고 변경·재검토 절차를 수행한다.

현장조건 불일치
→ 작업 보류 또는 작업중지
→ 변경내용 등록
→ 위험 재검토
→ 고위험 여부 재확인
→ 허가 재확인 또는 재허가
→ 재TBM
→ 작업재개 승인
3.4 AI는 제안하고 사람이 결정한다
AI는 다음 기능만 수행한다.

D-1 확정자료와 현장조건 비교
JSA_DB 유사 작업 검색
누락 위험요인 후보 제시
추가 안전대책 후보 제시
통제 적정성 보완 안내
AI는 다음 사항을 자동 확정하지 않는다.

공식 고위험작업 판정
최종 위험도
법령 준수 여부
작업허가 승인
작업재개 승인
작업종결
JSA_DB 승인
3.5 작업중지권은 항상 보장한다
모든 사용자 역할이 행사할 수 있다.
안전퀴즈 합격 여부와 무관하다.
다른 게이트의 통과 여부와 무관하다.
작업과 연결되지 않은 상태에서도 신고할 수 있어야 한다.
작업중지 기록은 삭제하지 않는다.
작업 재개는 권한 있는 관리자의 승인 후 가능하다.
4. 시스템 구성
4.1 계획 시스템
작업관리대장 서버
담당 영역:

작업 등록
수행 주체 결정
작업표준 관리
공식 위험성평가
작업계획서
고위험작업 판정
고위험작업 사전승인
D-1 사전회의
계획 확정
확정자료 버전 관리
4.2 실행 시스템
안전관리 앱
담당 영역:

안전정보 제공 및 확인
출입자 안전퀴즈
D-Day AI 위험검증
작업 전 안전확인
작업허가 신청 및 승인
TBM
작업 시작
작업 중 이행점검
작업중지 및 조치
작업재개
작업종료
ILS/LOTO 해제 확인
전자종결
통합 리포트
5. 운영 단계
5.1 Operation Phase A
현재 운영 방식이다.

관리자 엑셀
→ 대시보드 붙여넣기
→ localStorage 임시 변환
→ Firestore 작업DB 동기화
→ 안전관리 앱 조회
원칙:

Firestore가 정식 작업 원본이다.
localStorage는 업로드 준비 및 캐시 용도이다.
엑셀 업로드와 Firestore 동기화는 관리자만 수행한다.
동일 workId는 중복 생성하지 않는다.
5.2 Operation Phase B
작업관리대장 서버 완성 후 적용한다.

작업관리대장 서버
→ 인증된 API 연동
→ Firestore 작업DB
→ 안전관리 앱
전환 시에도 Firestore 작업DB 스키마와 workId를 유지한다.

5.3 개발 단계와 운영 단계를 구분한다
용어 혼동을 막기 위해 다음처럼 사용한다.

운영 방식: Operation Phase A/B
개발 로드맵: Development Phase 0~5
6. 작업 수행 주체별 흐름
6.1 수급인 도급작업
작업DB D-1 확정
→ 도급인 작업담당자 안전정보제공서 작성
→ 수급인에게 발행
→ 수급인 작업책임자 확인·서명
→ 작업자 안전퀴즈 검증
→ D-1 확정자료 확인
→ D-Day AI 위험검증
→ 작업 전 최종 안전확인
→ 수급인 작업책임자 작업허가 신청
→ 도급인 관리자 최종 승인
→ TBM
→ 작업 시작
→ 작업 중 점검
→ 필요 시 작업중지·조치·재개
→ 작업종료 신청
→ 철수·복구·ILS/LOTO 해제
→ 도급인 관리자 전자종결
6.2 도급인 직접작업
작업DB D-1 확정
→ 안전정보제공서 승인불필요
→ 작업자 자격·교육 확인
→ D-1 확정자료 확인
→ D-Day AI 위험검증
→ 작업 전 최종 안전확인
→ 작업허가
→ TBM
→ 작업 시작
→ 작업 중 점검
→ 필요 시 작업중지·조치·재개
→ 작업종료
→ 철수·복구·ILS/LOTO 해제
→ 전자종결
7. 전체 표준 워크플로우
7.1 D-1 계획 단계
단계	업무	담당	원본 시스템
1	작업 등록	도급인 작업담당자	작업관리대장
2	수행 주체 결정	도급인 작업담당자	작업관리대장
3	작업자료 등록	도급인·수급인	작업관리대장
4	고위험작업 판정	지정 담당자	작업관리대장
5	고위험 별도 검토·승인	지정 승인자	작업관리대장
6	D-1 사전회의	도급인·수급인	작업관리대장
7	계획 최종 확정	도급인 관리자	작업관리대장
7.2 D-Day 실행 단계
단계	업무	담당	실행 앱
8	확정 작업 조회	사용자	대시보드
9	안전정보 작성·발행	도급인 작업담당자	안전정보 도급인용
10	안전정보 확인·서명	수급인 작업책임자	안전정보 수급인용
11	안전퀴즈 응시	작업자	안전퀴즈
12	확정자료 확인	수급인 작업책임자	대시보드
13	D-Day AI 위험검증	수급인 작업책임자	위험성평가
14	작업 전 최종 확인	수급인 작업책임자	작업허가
15	작업허가 신청	수급인 작업책임자	작업허가
16	작업허가 검토·승인	도급인 관리자	승인 화면
17	TBM 실시	수급인 작업책임자	TBM
18	참석자·퀴즈 검증	수급인 작업책임자	TBM
19	작업 시작 확인	수급인 작업책임자	TBM 또는 대시보드
20	3시간 이내 이행점검	수급인 관리감독자	작업중점검
21	작업 계속 또는 중지	모든 작업자	작업중지권
22	안전조치	지정 조치자	작업중지권
23	위험 재검토	수급인·도급인	위험성평가
24	재허가·재TBM	담당자	허가·TBM
25	작업재개 승인	도급인 관리자	작업중지권
26	작업종료 신청	수급인 작업책임자	전자종결
27	현장 철수·복구 확인	수급인·도급인	전자종결
28	ILS/LOTO 해제 확인	도급인 작업담당자	전자종결
29	최종 전자종결	도급인 관리자	전자종결
30	결과 반영·리포트	시스템	통합 리포트
8. 역할 및 권한
8.1 역할 코드
admin
employer_manager
employer_officer
contractor_manager
worker
8.2 권한 기준
기능	admin	도급인 관리자	도급인 작업담당자	수급인 관리자	작업자
사용자 관리	전체	부분	-	-	-
작업DB 업로드	✅	✅	-	-	-
안전정보 작성	✅	✅	✅	-	-
안전정보 확인	✅	✅	✅	✅	조회
AI 위험검증 작성	✅	검토	검토	✅	조회
작업허가 신청	✅	✅	정책에 따라	✅	-
작업허가 승인	✅	✅	검토	-	-
TBM 주관	✅	✅	✅	✅	-
TBM 참석	✅	✅	✅	✅	✅
작업중지 요청	✅	✅	✅	✅	✅
작업재개 승인	✅	✅	-	-	-
전자종결 승인	✅	✅	검토	신청	-
종결 후 수정	✅	-	-	-	-
8.3 인증 원칙
모든 사용자는 사전 등록한다.
익명 사용은 지원하지 않는다.
로그인 식별자는 Firebase Auth uid를 사용한다.
이름만으로 사용자를 식별하지 않는다.
사용자 권한은 users/{uid}에서 조회한다.
UI 권한 제어와 Firestore Rules를 함께 적용한다.
8.4 작업중지 예외
작업중지 요청은 다음 조건으로 차단하지 않는다.

안전퀴즈 미응시
안전퀴즈 불합격
안전정보 미확인
작업허가 미승인
TBM 미완료
9. Firestore 표준 컬렉션
데이터	Firestore 경로	문서 ID
작업 원본	작업DB/{workId}	workId
사용자	users/{uid}	Firebase Auth UID
안전정보	안전정보제공/{safeinfoNo}	safeinfoNo
안전퀴즈	안전퀴즈/{quizId}	quizId
JSA 지식 DB	jsaDatabase/{jsaId}	jsaId
AI 위험검증	위험성평가/{riskId}	riskId
고위험 승인	고위험작업승인/{approvalNo}	approvalNo
작업허가	작업허가/{permitNo}	permitNo
TBM	TBM/{tbmNo}	tbmNo
작업중지	긴급조치/{emergencyNo}	emergencyNo
작업 중 점검	작업중점검/{inspectionNo}	inspectionNo
가스 측정	가스측정기록/{measurementId}	measurementId
jsaDatabase는 현재 운영 코드와 데이터를 고려하여 정식 이름으로 사용한다.

10. 식별번호 규칙
데이터	형식
작업	{YYYY-MM-DD}_{originalNo}
안전정보	SIP-YYYYMMDD-SEQ3
안전퀴즈	QZ-YYYYMMDD-SEQ3
위험검증	RA-YYYYMMDD-SEQ3
고위험 승인	HRA-YYYYMMDD-SEQ3
작업허가	PTW-YYYYMMDD-SEQ3
TBM	TBM-YYYYMMDD-SEQ3
작업중지	EM-YYYYMMDD-SEQ3
작업점검	IN-YYYYMMDD-SEQ3
JSA	JSA-{분류코드}-{6자리 순번}
번호 발급 원칙
배열 길이와 Math.random()으로 정식 번호를 발급하지 않는다.
Firestore transaction 기반 순번을 사용한다.
문서 ID와 내부 식별번호는 동일해야 한다.
이미 발급한 번호는 재사용하지 않는다.
11. 문서 연결 원칙
11.1 중심키
허가 이전 단계: workId
허가 이후 실행 단계: permitNo
사용자 식별: uid
11.2 연결 구조
작업DB/{workId}
├─ 안전정보제공/{safeinfoNo}
├─ 위험성평가/{riskId}
└─ 작업허가/{permitNo}
   ├─ TBM/{tbmNo}
   ├─ 긴급조치/{emergencyNo}
   ├─ 작업중점검/{inspectionNo}
   └─ 가스측정기록/{measurementId}
11.3 문서별 필수 참조
문서	필수 참조
안전정보	workId
위험성평가	workId, 필요 시 safeinfoNo
작업허가	workId, riskId
TBM	permitNo, workId, riskId
긴급조치	연결 작업이 있으면 permitNo, workId, tbmNo
작업중점검	permitNo, workId
11.4 중복 저장 제한
하위 문서의 상세내용을 상위 문서에 모두 복사하지 않는다.

작업허가서에는 위험성평가의 요약만 저장한다.

riskSummary: {
  riskId: '',
  overallRisk: '',
  controlAdequacy: '',
  unresolvedCount: 0,
  criticalHazardCount: 0,
  referencedJsaIds: []
}
상세 위험요인과 대책은 위험성평가/{riskId}에서 조회한다.

12. 작업DB 표준 필드
작업DB에는 최소 다음 필드가 필요하다.

{
  workId: '',
  date: '',
  originalNo: '',

  workName: '',
  workNameFull: '',
  location: {},
  company: '',

  executionType: 'employer_direct' | 'contractor',

  planningStatus: '작성중' | '검토중' | '확정' | '보류',
  planVersion: 1,
  confirmedAt: null,
  confirmedBy: null,

  baselineDocuments: {
    workStandardRef: null,
    riskAssessmentRef: null,
    workPlanRef: null
  },

  highRisk: {
    applicable: false,
    categories: [],
    reasons: [],
    approvalRequired: false,
    approvalStatus: '승인불필요',
    approvalNo: null
  },

  employerOfficerId: null,
  contractorManagerId: null,

  sourceType: 'excel-paste',
  createdAt: null,
  updatedAt: null,
  schemaVersion: 1
}
안전관리 앱에는 원칙적으로 다음 조건을 충족한 작업만 표시한다.

planningStatus = 확정
13. 상태값 표준
13.1 안전정보
작성중
발행완료
서명완료
보완요청
반려
폐기
13.2 안전퀴즈
합격
불합격
13.3 위험성평가
작성중
평가완료
재검토필요
폐기
13.4 고위험 승인
승인불필요
승인대기
보완요청
승인
반려
재승인필요
13.5 작업허가
대기중
허가진행중
허가완료
작업중
작업중지
작업완료
13.6 TBM
작성중
완료
취소
재TBM필요
13.7 긴급조치
상위 상태:

요청
조치중
완료
취소
세부 상태:

요청접수
작업중지
현장확인
조치중
재점검
재개검토
재개승인
완료
13.8 작업 중 점검
예정
점검중
양호
미흡
조치중
재점검완료
미실시
13.9 전자종결
작업중
종료확인중
미흡조치중
ILS해제대기
설비인계대기
종료완료
14. 필수 게이트
Gate 1: 실행 대상 확인
작업DB 문서 존재
작업일 일치
planningStatus = 확정
담당자 또는 소속 권한 일치
Gate 2: 안전정보
수급인 작업:

도급인 작업담당자가 발행
수급인 작업책임자가 확인·서명
작업내용 일치
작업장소 일치
제공정보 충분
필요한 MSDS 확인
반려·보완요청 없음
도급인 직접작업:

승인불필요
Gate 3: 사용자 및 안전퀴즈
사용자 활성 상태
유효기간 내 계정
안전퀴즈 합격
퀴즈 유효기간 내
소속 일치
작업중지 요청에는 적용하지 않는다.

Gate 4: D-Day AI 위험검증
D-1 확정자료 확인
안전정보 반영
JSA_DB 비교
AI 제안 검토
현장조건 불일치 없음
미해결 중대위험 없음
통제 적정성 × 없음
Gate 5: 작업허가
Gate 1~4 통과
고위험 작업이면 기존 사전승인 완료
필요한 작업계획서 확인
ILS 대상이면 완료 확인
밀폐공간이면 최초 가스 측정 적합
수급인 신청 완료
도급인 관리자 최종 승인
Gate 6: TBM 및 작업 시작
작업허가 상태 허가완료
위험요인·사고시나리오·대책 전달
참석자 명단 존재
참석자 안전퀴즈 전원 검증
작업중지권 고지
필요한 별지 완료
실제 작업 시작 시각 기록
Gate 7: 작업 유지
작업 시작 후 3시간 이내 최초 이행점검
고위험 작업 강화 점검
밀폐공간 가스 측정 주기 준수
활성 긴급조치 없음
현장 조건 변경 없음
Gate 8: 작업재개
작업중지 원인 확인
안전조치 완료
재점검 완료
위험성평가 재검토
허가 재확인 또는 재허가
ILS 상태 재확인
재TBM 완료
도급인 관리자 재개 승인
Gate 9: 전자종결
작업자 전원 철수
공구·자재·폐기물 제거
작업구역 정리
방호장치 복구
미흡사항 조치 완료
밀폐공간 출입자 전원 퇴실
ILS/LOTO 해제 확인
설비 인계
도급인 관리자 승인
15. D-Day AI 위험검증 기준
15.1 공식 기준과 AI 검증 구분
구분	원본	변경 권한
D-1 공식 위험성평가	작업관리대장 서버	D-1 검토 절차
공식 고위험 판정	작업관리대장 서버	지정 승인 절차
D-Day AI 위험검증	안전관리 앱	사람이 검토·확정
현장 변경 위험	안전관리 앱	재검토 절차
15.2 AI 위험검증 결과
{
  riskId: '',
  workId: '',
  assessmentType: 'day-of-ai-review',

  baselineAssessment: {
    referenceNo: '',
    version: '',
    source: 'work-ledger-server'
  },

  safeinfoNo: '',
  referencedJSAs: [],
  riskItems: [],

  discrepancyDetected: false,
  reviewRequired: false,
  unresolvedCount: 0,

  status: '평가완료',
  createdAt: null,
  createdBy: null
}
15.3 JSA_DB 검색
기본 추천 대상:

metadata.status = approved
quality.qualityGrade = A 또는 B
retired 상태가 아님
현재 버전
출처와 적용조건 확인 완료
개발 중 review 자료는 승인 자료와 구분하여 표시한다.

15.4 위험요인별 평가
위험성평가는 작업 전체에 위험도 하나만 저장하지 않고 위험요인별로 관리한다.

riskItems: [
  {
    riskItemId: 'RI01',
    hazardText: '',
    hazardSource: 'JSA_DB',
    sourceJsaId: '',
    sourceHazardId: '',
    scenario: '',

    initialRisk: {
      frequency: 0,
      severity: 0,
      score: 0,
      level: ''
    },

    selectedMeasures: [],

    residualRisk: {
      frequency: 0,
      severity: 0,
      score: 0,
      level: ''
    },

    controlAdequacy: '',
    adequacyReason: '',
    unresolved: false,
    actionOwner: '',
    dueDate: null
  }
]
16. 작업중지 및 재개 기준
16.1 긴급 버튼 처리
긴급 작업중지 버튼을 누르면 상세 입력 전에 최소 기록을 먼저 생성한다.

{
  emergencyNo: '',
  permitNo: '',
  workId: '',
  tbmNo: '',
  emergencyStatus: '요청',
  detailStatus: '요청접수',
  requestedAt: null,
  requestedBy: null,
  detailsCompleted: false
}
그 후 위험내용·사진·위치·사유를 보완한다.

16.2 자동 처리
작업중지 요청 시:

긴급조치 문서 생성
작업허가 상태 작업중지
관련 TBM에 emergencyNo 연결
위험성평가 상태 재검토필요
대시보드 긴급 알림 표시
작업DB 원본은 수정하지 않고 실행 상태를 별도 표시한다.

16.3 재개
재개 승인 시:

긴급조치 세부 상태 재개승인
작업허가 상태 작업중
재TBM 번호 연결
승인자와 승인 시각 기록
17. 저장소와 동기화 원칙
17.1 원본 우선순위
Firestore 정식 문서
→ Firestore 오프라인 캐시
→ localStorage 임시 초안
localStorage는 정식 업무 원본으로 사용하지 않는다.

17.2 저장 상태
draft
pending
synced
failed
draft: 기기 내 임시저장
pending: 서버 전송 대기
synced: Firestore 저장 완료
failed: 저장 실패
Firestore 저장 성공 전에는 “제출 완료”라고 표시하지 않는다.

17.3 문서 수정
신규 생성은 자연키 문서 ID를 사용한다.
부분 수정은 updateDoc() 또는 transaction을 사용한다.
오래된 localStorage 객체로 Firestore 전체 문서를 덮어쓰지 않는다.
상태 전환은 transaction으로 처리한다.
생성 버튼은 저장 중 비활성화하여 중복 제출을 방지한다.
18. 공통 감사 필드
모든 업무 문서에 다음 필드를 둔다.

{
  schemaVersion: 1,
  sourceType: '',
  createdAt: null,
  createdBy: {
    uid: '',
    name: '',
    role: '',
    companyId: ''
  },
  updatedAt: null,
  updatedBy: {
    uid: '',
    name: '',
    role: '',
    companyId: ''
  }
}
Firestore 저장 시 서버 기준 시각을 사용한다.

관리자의 일반 데이터 수정 이력은 별도로 저장하지 않는 현재 정책을 유지하더라도 다음은 반드시 기록한다.

상태 전환
게이트 우회
작업중지
작업재개 승인
ILS 확인
전자종결
이는 일반 오탈자 수정과 별개의 업무 이력이다.

19. 앱별 책임
앱	주요 책임	직접 수정 가능한 원본
대시보드	상태 통합·다음 단계 안내	없음
안전정보 도급인용	안전정보 작성·발행	안전정보제공
안전정보 수급인용	확인·서명·보완요청	안전정보제공의 확인 영역
안전퀴즈	응시·채점·유효성	안전퀴즈
위험성평가	AI 검증·위험별 평가	위험성평가
작업허가	신청·검토·승인	작업허가
TBM	위험 전달·참석 확인	TBM
작업중지권	중지·조치·재개	긴급조치
작업중점검	이행점검·조치	작업중점검
전자종결	종료 확인·종결	작업허가의 종결 영역
각 앱은 다른 컬렉션의 상세 데이터를 직접 덮어쓰지 않는다. 필요한 경우 참조키와 요약정보만 갱신한다.

20. 대시보드 표준
20.1 홈 화면 핵심
대시보드는 메뉴 모음보다 다음 정보를 우선 표시한다.

오늘 내 작업
→ 현재 단계
→ 완료된 게이트
→ 차단된 이유
→ 다음 단계 버튼
20.2 워크플로우 계산 결과
{
  workId: '',
  currentStage: 'SAFEINFO_CONFIRM',
  nextAction: {
    label: '안전정보 확인',
    url: '안전정보제공서_수급인용.html?safeinfoNo=...'
  },
  gates: [],
  blockers: [],
  emergencyAvailable: true
}
20.3 작업중지 버튼
작업중지 버튼은 모든 화면과 권한에서 쉽게 접근할 수 있어야 한다.

21. 미확정 사항 관리
다음 값은 코드에 직접 하드코딩하지 않고 설정 문서 또는 Firestore 설정 컬렉션에서 관리한다.

안전퀴즈 합격 기준
안전퀴즈 유효기간
재응시 제한
밀폐공간 측정 주기
화기작업 LEL 기준
고위험 점검 주기
보존 기간
서명·사진 저장 방식
긴급 알림 수신자
서버 동기화 주기
법령 표시 문구와 조문
권장 경로:

시스템설정/workflow
시스템설정/quiz
시스템설정/gas
시스템설정/retention
시스템설정/legal
22. 기존 문서 정리 방침
기존 문서를 삭제할 필요는 없다.

각 문서 상단에 다음 표시를 추가한다.

> 이 문서는 세부 참고 문서입니다.
> 충돌 시 INTEGRATED_SAFETY_PLATFORM_STANDARD.md를 우선 적용합니다.
다음 항목은 기존 문서에서 정리한다.

중복 장 삭제
장 번호 오류 수정
JSA_DB를 jsaDatabase로 통일
linkedPermitNo 신규 생성 중단
Firestore safetyPermits를 작업허가로 수정
작업유형 코드 통일
작업중지 상태값 통일
안전정보제공서의 위험성평가 번호 필수 조건 제거
QR 임시 접속 내용 제거
사용자 사전 등록 원칙 반영
개선계획표
1. 전체 개선 로드맵
단계	목표	주요 작업	완료 기준	우선순위
P0	기준 통일	통합 기준서 확정, 컬렉션·상태·코드 통일	문서 충돌 제거	최우선
P1	데이터 보호	ID 충돌 방지, Firestore 원본화, 저장 실패 처리	중복·덮어쓰기 없음	최우선
P2	인증·권한	Firebase Auth, users, 5단계 권한	비인가 접근 차단	필수
P3	안전정보 흐름	작업DB 선택, 도급인 발행, 수급인 확인	다른 기기에서 확인 가능	필수
P4	AI 위험검증	위험요인별 평가, 복수 JSA, 잔여 위험도	구조화 위험성평가 저장	필수
P5	작업허가	신청·승인 분리, 게이트·ILS 확인	승인 전 TBM 차단	필수
P6	TBM·퀴즈	참석자 구조화, 퀴즈 검증, 작업 시작	전원 검증 후 시작	필수
P7	작업중지·재개	전용 앱, 즉시 기록, 조치·재개	전체 중지 이력 연결	필수
P8	점검·종결	3시간 점검, 복구, ILS 해제, 종결	작업완료 게이트 적용	필수
P9	통합 대시보드	현재 단계·다음 행동·관리자 현황	역할별 홈 완성	권장
P10	서버 자동 연동	작업관리대장 서버 API 연동	Operation Phase B 전환	최종
2. P0 — 기준 및 코드 정리
작업	변경 내용	산출물
통합 기준서 확정	본 문서 승인	통합 기준서 v1.0
컬렉션명 통일	한글 운영 컬렉션 및 jsaDatabase 확정	컬렉션 상수
상태값 통일	문서별 상태 enum 작성	constants.js
작업유형 통일	혼합 코드 분리	작업유형 마스터
자연키 통일	번호 형식 확정	ID 규약
중복 코드 제거	Firebase·날짜·테마 함수 공통화	공통 모듈
기존 문서 정리	중복 장·오래된 정책 표시	개정 문서
완료 기준
같은 개념에 여러 필드명이나 상태값이 존재하지 않는다.
신규 코드는 통합 상수만 사용한다.
기존 키는 읽기 호환에만 사용한다.
3. P1 — Firestore 저장 안정화
앱	현재	개선
작업DB	Firestore 조회 가능	날짜·권한 조건 쿼리
안전정보	localStorage	Firestore 안전정보제공
안전퀴즈	localStorage	Firestore 안전퀴즈
위험성평가	localStorage	Firestore 위험성평가
작업허가	잘못된 컬렉션명 사용	Firestore 작업허가
TBM	localStorage	Firestore TBM
작업중지	localStorage	Firestore 긴급조치
필수 조치
Firestore transaction 기반 ID 발급
저장 중 버튼 잠금
Firestore 성공 후 완료 화면 표시
오프라인 시 동기화대기 표시
setDoc() 전체 덮어쓰기 제한
부분 갱신 및 transaction 적용
4. P2 — 인증과 권한
항목	구현 내용
로그인	Firebase Auth 이메일·비밀번호
사용자 프로필	users/{uid}
역할	5단계 역할 코드
사용자 상태	활성·비활성·유효기간
화면 권한	역할별 메뉴·버튼 제어
저장 권한	Firestore Rules
관리자 계정	최소 2명 별도 발급
작업 범위	담당 작업·소속 회사 기준 조회
완료 기준
미로그인 사용자는 업무 데이터에 접근할 수 없다.
수급인은 도급인 작성 영역을 수정할 수 없다.
작업자는 관리자 승인 기능을 사용할 수 없다.
모든 역할이 작업중지 요청에 접근할 수 있다.
5. P3 — 안전정보 제공 통합
대상	개선 작업
도급인용	workId로 작업DB 자동 채움
도급인용	위험성평가 번호 필수 입력 제거
도급인용	작업장 고유 위험·제한사항 필드 추가
수급인용	Firestore 문서 조회
수급인용	작업내용·장소 일치 확인
수급인용	정보 충분 여부
수급인용	MSDS 확인
수급인용	보완요청·반려
공통	발행자·확인자 UID 기록
완료 기준
도급인과 수급인이 서로 다른 기기에서 동일 문서를 작성·확인할 수 있어야 한다.

6. P4 — 위험성평가 v3
항목	현재	개선
JSA 참조	단일	복수 JSA
위험 평가	작업 전체 1건	위험요인별
위험도	단일 점수	최초·잔여 위험도
대책	문자열 목록	위험요인 연결 구조
통제 적정성	사용자 선택	사유 포함
× 처리	완료 가능	완료 차단
AI 항목	일부 태그	기본 미선택·검토 상태
고위험 판정	앱 재판정 가능	작업DB 공식값 참조
현장 불일치	없음	재검토 요청
완료 기준
riskItems 배열로 저장한다.
위험요인과 대책의 연결을 추적할 수 있다.
미해결 위험이 있으면 허가를 차단한다.
승인되지 않은 JSA는 일반 추천에서 제외한다.
7. P5 — 작업허가 신청·승인 분리
항목	개선
수동 작업	권한 있는 사용자만 작업DB 선등록
workId	허가서 생성 전 필수 확보
permitNo	transaction 발급
신청	수급인 작업책임자
승인	도급인 관리자
ILS	외부 ILS 완료상태 확인
가스 측정	다점·시간별 구조화
고위험	작업DB 승인 상태 확인
TBM 버튼	허가완료 후 활성화
연장	요청과 승인 분리
저장	Firestore 부분 갱신
완료 기준
허가진행중과 허가완료가 명확히 분리되고, 최종 승인 전에는 TBM을 완료할 수 없어야 한다.

8. P6 — TBM과 안전퀴즈
항목	개선
참석자	쉼표 문자열을 사용자 배열로 변경
사용자 식별	이름 대신 uid
퀴즈 검증	합격·유효기간·버전·소속 확인
서명	참석자별 확인 또는 정책상 승인 방식
위험 자동 채움	riskId로 위험성평가 조회
위험·대책	riskItemId 단위 연결
ILS	허가서 결과 읽기 전용 표시
작업 시작	실제 시작 시각 기록
재TBM	기존 TBM 덮어쓰기 금지
완료 기준
참석자 전원이 유효한 퀴즈 결과를 갖고, 허가가 완료된 작업만 TBM을 완료할 수 있어야 한다.

9. P7 — 작업중지 전용 앱
항목	개선
파일 분리	작업중지권_v2.html
긴급 기록	버튼 클릭 즉시 최소 문서 생성
상세정보	사유·설명·사진·위치
연결	permitNo, workId, tbmNo, riskId
자동 처리	permit를 작업중지로 변경
조치	조치자·기한·완료 결과
재평가	위험성평가 재검토필요
재TBM	신규 TBM 연결
재개 승인	도급인 관리자
삭제	금지
완료 기준
작업중지 요청부터 조치·재점검·재개 승인까지 하나의 이력으로 조회할 수 있어야 한다.

10. P8 — 작업 중 점검과 전자종결
기능	구현 내용
작업 시작	startedAt, startedBy
최초 점검	3시간 이내
고위험 점검	작업DB 기준 강화 주기
밀폐공간	가스 측정 주기 별도 관리
종료 신청	수급인 작업책임자
철수 확인	작업자·공구·자재
복구 확인	방호장치·현장
ILS 해제	외부 시스템 완료 확인
설비 인계	인계자·인수자
최종 종결	도급인 관리자
통합 리포트	permitNo 기준
앱별 즉시 수정 목록
대시보드
오늘 내 작업 추가
현재 단계와 다음 단계 추가
사용자 역할별 목록 필터
planningStatus = 확정 작업만 실행 대상으로 표시
localStorage 상태 계산을 Firestore 조회로 전환
관리자 전용 설정 메뉴 분리
안전정보 도급인용
workId 필수 추가
작업DB 선택 방식 적용
위험성평가 번호 필수 제거
Firestore 저장
역할 검증 추가
법령 문구 설정화
안전정보 수급인용
Firestore 조회
일치 여부와 충분성 확인
보완 요청·반려 기능
Firebase Auth 사용자로 서명자 확인
같은 브라우저 localStorage 의존 제거
안전퀴즈
respondentId 추가
quizVersion, validUntil, attemptNo 추가
정답 수와 점수 백분율 분리
Firestore 저장
퀴즈 정책을 설정값으로 분리
QR을 인증 수단으로 사용하지 않음
위험성평가
compat SDK를 modular SDK로 전환
jsaDatabase 승인 자료만 검색
복수 JSA 참조
riskItems 구조 도입
최초·잔여 위험도 분리
× 상태 완료 차단
필수대책 10개 제한 제거
Firestore 저장
D-Day AI 위험검증 역할로 명확화
작업허가서
Firestore 컬렉션을 작업허가로 변경
수동 작업 workId 생성 순서 수정
ID 충돌 방지
신청과 승인 분리
안전정보·위험검증 게이트
ILS 전체 항목 확인
가스 측정 전체 행 저장
승인 전 TBM 차단
연장 부분 업데이트
TBM
허가 상태 확인
참석자 구조화
퀴즈 유효성 검증
riskId로 위험성평가 조회
실제 작업 시작 시각 저장
작업중지 앱 분리
Firestore 저장
최종 완료 조건
플랫폼 통합은 다음 조건을 모두 만족할 때 완료로 본다.

작업DB가 D-1 확정 계획의 신뢰 원본으로 동작한다.
수급인 작업의 안전정보 제공·확인이 연결된다.
모든 작업 참여자를 UID로 식별한다.
안전퀴즈 유효성 검증이 TBM에 적용된다.
D-Day AI 위험검증이 D-1 자료와 구분된다.
위험요인별 최초·잔여 위험도를 관리한다.
작업허가 신청과 최종 승인이 분리된다.
허가완료 전 TBM과 작업 시작이 차단된다.
작업중지는 모든 사용자가 즉시 요청할 수 있다.
작업중지 이후 재평가·재허가·재TBM·재개 승인이 연결된다.
작업 중 점검과 미흡조치를 관리한다.
ILS/LOTO 해제 전 전자종결을 차단한다.
모든 정식 데이터가 Firestore에 저장된다.
대시보드가 사용자별 현재 단계와 다음 행동을 표시한다.
permitNo 기준 통합 리포트를 생성할 수 있다.
핵심 결론
이 프로젝트는 기존 앱을 폐기할 필요가 없습니다. 현재 화면과 입력 기능은 대부분 재사용할 수 있습니다. 다만 개발 중심을 개별 화면 추가에서 다음 구조로 전환해야 합니다.

작업DB 신뢰 원본 + Firestore 단일 저장소 + 공통 게이트 엔진 + Firebase Auth 권한 + permitNo 중심 실행 연결

이 기준으로 정리하면 현재 분산된 앱들이 다음 하나의 프로세스로 통합됩니다.

D-1 확정 작업
→ 안전정보
→ 안전퀴즈
→ AI 위험검증
→ 작업허가
→ TBM
→ 작업 시작
→ 현장 점검
→ 작업중지·재개
→ 작업종료
→ ILS/LOTO 해제
→ 전자종결
