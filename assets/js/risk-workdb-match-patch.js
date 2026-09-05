/* ============================================================
 * risk-workdb-match-patch.js v3.0.0
 * 위험성평가 작업DB 비차단 검토 + 위험성평가DB 컬럼 시프트 보정
 *
 * ── v3.0.0 변경 (2026-09-04) ─────────────────────────────
 * [근본 원인] 정적 JSON 생성 시 'No' 열이 포함된 17열 데이터를
 *   16개 필드에 위치 기준으로 매핑하여 전 필드가 한 칸 밀렸음.
 *   - classCode ← No(숫자)          - riskLevel ← 통제 적정성(○△×)
 *   - accidentType ← 원문 위험요인    - remark    ← 위험도(저/중/고)
 *   - controlAdequacy ← 표준 안전대책명(문장)
 *   결과: controlAdequacy 유효 0/215건 → 판정불가 100%,
 *         classCode 숫자화로 ACC 상향 로직 영구 미작동.
 *
 * [조치] mapRiskDatabaseDocument / loadRiskDatabase 를 감싸
 *   행 단위로 시프트를 자동 감지하여 원복한다.
 *   판정·심각도 함수는 일절 덮어쓰지 않는다.
 *   정적 JSON이 정상 매핑으로 재생성되면 자동으로 비활성화된다.
 *
 * ── 기존 원칙 (유지) ─────────────────────────────────────
 * - 위험성평가 본체 분석을 먼저 완료, 작업DB는 사후 검토
 * - 핵심 판정 함수를 덮어쓰지 않음
 * - 작업DB 오류가 평가 화면을 막지 않음
 * - 작업DB '일반'은 저위험으로 변환하지 않음
 * ============================================================ */

(function(global){
  'use strict';

  var PATCH_VERSION = '3.0.0';

  /* ========================================================
   * SECTION 0. 위험성평가DB 컬럼 시프트 보정
   * ======================================================== */

  /*
   * [대상 필드 ← 실제로 담긴 값이 있는 필드]
   * TSV 17열(No + 16개 항목)이 16필드에 밀려 들어갔으므로
   * 각 필드는 "다음 필드"의 값을 가져와야 한다.
   * 마지막 remark 는 원본 16열(비고)이 유실되어 공란 처리한다.
   */
  var SHIFT_FIELD_PAIRS = [
    ['classCode',        'sheet'],
    ['sheet',            'workType'],
    ['workType',         'workSubType'],
    ['workSubType',      'workName'],
    ['workName',         'workStage'],
    ['workStage',        'equipment'],
    ['equipment',        'materials'],
    ['materials',        'originalHazard'],
    ['originalHazard',   'accidentType'],
    ['accidentType',     'scenario'],
    ['scenario',         'detailedMeasures'],
    ['detailedMeasures', 'standardMeasures'],
    ['standardMeasures', 'controlAdequacy'],
    ['controlAdequacy',  'riskLevel'],
    ['riskLevel',        'remark'],
    ['remark',           null]
  ];

  var CONTROL_TOKENS = ['○', '△', '×'];

  var shiftStats = {
    installed: false,
    mappedRows: 0,
    corrected: 0,
    passed: 0,
    swept: 0,
    lastSweepAt: ''
  };

  function log(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[risk-workdb-v3]');
    console.log.apply(console, args);
  }

  function warn(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[risk-workdb-v3]');
    console.warn.apply(console, args);
  }

  /*
   * 시프트 판정 지표
   * - 통제 적정성 자리에 ○△× 가 없고
   * - 위험도 자리에 ○△× 가 있으면 = 한 칸 밀린 상태
   * 정상 데이터에서는 이 조건이 성립하지 않으므로 안전하다.
   */
  function isShiftedRow(row){
    if(
      !row ||
      typeof row !== 'object' ||
      row.__shiftCorrected === true
    ){
      return false;
    }

    var control = String(
      row.controlAdequacy === undefined ||
      row.controlAdequacy === null
        ? ''
        : row.controlAdequacy
    ).trim();

    var level = String(
      row.riskLevel === undefined ||
      row.riskLevel === null
        ? ''
        : row.riskLevel
    ).trim();

    return (
      CONTROL_TOKENS.indexOf(control) < 0 &&
      CONTROL_TOKENS.indexOf(level) >= 0
    );
  }

  function correctShiftedRow(row){
    if(!row || row.__shiftCorrected === true){
      return row;
    }

    var snapshot = {};

    Object.keys(row).forEach(function(key){
      snapshot[key] = row[key];
    });

    SHIFT_FIELD_PAIRS.forEach(function(pair){
      var target = pair[0];
      var source = pair[1];

      row[target] =
        source
          ? (
              snapshot[source] === undefined ||
              snapshot[source] === null
                ? ''
                : snapshot[source]
            )
          : '';
    });

    /* No 열은 이미 no 필드에 있으므로 별도 복원 불필요 */
    row.__shiftCorrected = true;

    return row;
  }

  /*
   * 최초 로드 경로 차단
   * mapRiskDatabaseDocument 는 전역 함수 선언이므로
   * DOMContentLoaded 이전에 교체하면 초기 로드부터 적용된다.
   */
  function installMappingGuard(){
    if(typeof global.mapRiskDatabaseDocument !== 'function'){
      return false;
    }

    if(global.mapRiskDatabaseDocument.__shiftGuard === true){
      shiftStats.installed = true;
      return true;
    }

    var originalMap = global.mapRiskDatabaseDocument;

    var wrapped = function(documentId, data){
      var row;

      try {
        row = originalMap.apply(this, arguments);
      } catch(error){
        warn('원본 mapRiskDatabaseDocument 오류', error);
        throw error;
      }

      shiftStats.mappedRows++;

      if(isShiftedRow(row)){
        correctShiftedRow(row);
        shiftStats.corrected++;
      } else {
        shiftStats.passed++;
      }

      return row;
    };

    wrapped.__shiftGuard = true;
    wrapped.__original = originalMap;

    global.mapRiskDatabaseDocument = wrapped;
    shiftStats.installed = true;

    log('위험성평가DB 매핑 가드 설치 완료');

    return true;
  }

  /*
   * IndexedDB 캐시 · 이미 로드된 배열 보정 (사후 스윕)
   */
  function sweepRiskDatabase(){
    var database = global.riskDatabase;

    if(
      !Array.isArray(database) ||
      database.length === 0
    ){
      return 0;
    }

    var count = 0;

    database.forEach(function(row){
      if(isShiftedRow(row)){
        correctShiftedRow(row);
        count++;
      }
    });

    shiftStats.lastSweepAt =
      new Date().toISOString();

    if(count > 0){
      shiftStats.swept += count;

      log(
        '메모리 위험성평가DB 시프트 보정',
        count + '건 / 총 ' + database.length + '건'
      );
    }

    return count;
  }

  function installLoadGuard(){
    var originalLoad = global.loadRiskDatabase;

    if(
      typeof originalLoad !== 'function' ||
      originalLoad.__shiftGuard === true
    ){
      return;
    }

    var wrapped = async function(){
      var result = await originalLoad.apply(this, arguments);

      try {
        sweepRiskDatabase();
      } catch(error){
        warn('로드 후 스윕 실패 — 평가는 계속됩니다.', error);
      }

      return result;
    };

    wrapped.__shiftGuard = true;
    wrapped.__original = originalLoad;

    global.loadRiskDatabase = wrapped;

    log('위험성평가DB 로드 가드 설치 완료');
  }

  /* 즉시 설치 시도 (본체 스크립트 뒤에 로드된 경우) */
  installMappingGuard();
  installLoadGuard();

  function diagnoseRiskDatabase(){
    var database =
      Array.isArray(global.riskDatabase)
        ? global.riskDatabase
        : [];

    var total = database.length;

    var validControl = database.filter(function(row){
      return CONTROL_TOKENS.indexOf(
        String(row.controlAdequacy || '').trim()
      ) >= 0;
    }).length;

    var validRisk = database.filter(function(row){
      return normalizeRisk(row.riskLevel) !== '';
    }).length;

    var stillShifted = database.filter(isShiftedRow).length;

    var report = {
      version: PATCH_VERSION,
      total: total,
      validControlAdequacy: validControl,
      validRiskLevel: validRisk,
      stillShifted: stillShifted,
      guard: Object.assign({}, shiftStats),
      verdict:
        total === 0
          ? '위험성평가DB 미로드'
          : (
              stillShifted > 0
                ? '보정 미적용 행 존재 — sweep() 실행 필요'
                : (
                    validControl >= total * 0.8
                      ? '정상 — 통제값·위험도 판독 가능'
                      : '통제값 결손 — 데이터 원본 점검 필요'
                  )
            )
    };

    console.table
      ? console.table(report)
      : log(report);

    return report;
  }

  /* ========================================================
   * SECTION 1. 공통 유틸리티
   * ======================================================== */

  var workDatabase = [];

  var workDatabaseState = {
    status: 'idle',
    source: '',
    count: 0,
    error: '',
    loadedAt: ''
  };

  var workDatabaseLoadPromise = null;
  var currentReviewToken = 0;

  var currentMatches = [];
  var selectedMatch = null;

  function escapeHtml(value){
    return String(
      value === undefined || value === null
        ? ''
        : value
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function compact(value){
    if(typeof global.compactText === 'function'){
      return global.compactText(value);
    }

    return String(value || '')
      .toLowerCase()
      .replace(/패널/g, '판넬')
      .replace(/\s+/g, '')
      .replace(/[^0-9a-z가-힣]/g, '');
  }

  function similarity(first, second){
    if(typeof global.calculateTextSimilarity === 'function'){
      return global.calculateTextSimilarity(first, second);
    }

    var firstText = compact(first);
    var secondText = compact(second);

    if(!firstText || !secondText){
      return 0;
    }

    if(firstText === secondText){
      return 1;
    }

    if(
      firstText.indexOf(secondText) >= 0 ||
      secondText.indexOf(firstText) >= 0
    ){
      return (
        Math.min(firstText.length, secondText.length) /
        Math.max(firstText.length, secondText.length)
      );
    }

    return 0;
  }

  function normalizeRisk(value){
    if(
      global.riskJudgmentPatch &&
      typeof global.riskJudgmentPatch.normalizeRiskLevel === 'function'
    ){
      return global.riskJudgmentPatch.normalizeRiskLevel(value);
    }

    var text = String(value || '').trim().replace(/\s+/g, '');

    if(text === '저' || text === '저위험' || text === '낮음'){
      return '저위험';
    }

    if(text === '중' || text === '중위험' || text === '보통'){
      return '중위험';
    }

    if(
      text === '고' ||
      text === '고위험' ||
      text === '매우고위험' ||
      text === '높음' ||
      text === '매우높음'
    ){
      return '고위험';
    }

    return '';
  }

  function normalizeControl(value){
    if(
      global.riskJudgmentPatch &&
      typeof global.riskJudgmentPatch.normalizeControlValue === 'function'
    ){
      return global.riskJudgmentPatch.normalizeControlValue(value);
    }

    var raw = String(value || '').trim();

    var text = raw
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[()]/g, '');

    if(
      raw === '○' ||
      text === 'o' ||
      text === '0' ||
      text === '적정' ||
      text === '양호' ||
      text === '적합'
    ){
      return '○';
    }

    if(
      raw === '△' ||
      text === '보완' ||
      text === '보완필요' ||
      text === '일부보완' ||
      text === '주의'
    ){
      return '△';
    }

    if(
      raw === '×' ||
      raw === '✕' ||
      text === 'x' ||
      text === '미흡' ||
      text === '부적정' ||
      text === '부적합'
    ){
      return '×';
    }

    return '';
  }

  /*
   * 이중 안전망
   * 가드가 어떤 이유로든 누락되어 시프트 데이터가 들어오면
   * 밀린 자리(remark / riskLevel)에서 값을 대체 판독한다.
   */
  function resolveItemRisk(item){
    item = item || {};

    var direct = normalizeRisk(item.riskLevel);

    if(direct){
      return direct;
    }

    return normalizeRisk(item.remark);
  }

  function resolveItemControl(item){
    item = item || {};

    var direct = normalizeControl(item.controlAdequacy);

    if(direct){
      return direct;
    }

    var shifted = String(item.riskLevel || '').trim();

    return CONTROL_TOKENS.indexOf(shifted) >= 0
      ? shifted
      : '';
  }

  function riskOrder(value){
    var order = { '저위험': 1, '중위험': 2, '고위험': 3 };
    return order[normalizeRisk(value)] || 0;
  }

  function controlOrder(value){
    var order = { '○': 1, '△': 2, '×': 3 };
    return order[normalizeControl(value)] || 0;
  }

  function firstValue(object, keys){
    object = object || {};

    for(var index = 0; index < keys.length; index++){
      var value = object[keys[index]];

      if(
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ''
      ){
        return value;
      }
    }

    return '';
  }

  /* ========================================================
   * SECTION 2. 작업DB 필드 접근자
   * ======================================================== */

  function getWorkId(work){
    var directId = firstValue(work, ['workId', 'id', 'docId']);

    if(directId){
      return String(directId);
    }

    var date = firstValue(work, ['date', 'workDate', 'startDate']);

    var originalNo = firstValue(
      work,
      ['originalNo', 'workNo', 'number', 'no']
    );

    if(date && originalNo){
      return String(date) + '_' + String(originalNo);
    }

    return '';
  }

  function getWorkName(work){
    return String(
      firstValue(
        work,
        ['workName', 'workNameFull', 'name', 'title']
      ) || ''
    );
  }

  function getWorkFullName(work){
    return String(
      firstValue(
        work,
        [
          'workNameFull',
          'workName',
          'workDescription',
          'workDetail',
          'safetyOriginal'
        ]
      ) || ''
    );
  }

  function getCompany(work){
    return String(
      firstValue(
        work,
        [
          'company',
          'executingCompany',
          'contractCompany',
          'subcontractCompany'
        ]
      ) || ''
    );
  }

  function getLocation(work){
    var value = firstValue(
      work,
      ['location', 'locationRaw', 'permitLocation']
    );

    if(value && typeof value === 'object'){
      return [
        value.factory || '',
        value.line || '',
        value.area || '',
        value.detail || ''
      ].join(' ').trim();
    }

    return String(value || '');
  }

  function getWorkRiskInfo(work){
    var risk = String(
      firstValue(work, ['risk', 'riskLevel', 'overallRisk']) || ''
    ).trim();

    var highRiskFlag =
      work && work.isHighRiskFromSource === true;

    var isHigh =
      highRiskFlag ||
      risk === '고위험' ||
      risk === '매우고위험';

    return {
      original: risk,
      isHigh: isHigh,
      label:
        isHigh
          ? '고위험'
          : (risk === '일반' ? '일반' : risk)
    };
  }

  /* ========================================================
   * SECTION 3. 작업DB 로드
   * ======================================================== */

  async function loadWorkDatabase(){
    if(Array.isArray(workDatabase) && workDatabase.length > 0){
      return workDatabase;
    }

    if(workDatabaseLoadPromise){
      return workDatabaseLoadPromise;
    }

    workDatabaseState.status = 'loading';
    workDatabaseState.error = '';

    workDatabaseLoadPromise = (async function(){
      try {
        if(
          !global.staticDbLoader ||
          typeof global.staticDbLoader.load !== 'function'
        ){
          throw new Error('정적 DB 로더를 사용할 수 없습니다.');
        }

        var result = await global.staticDbLoader.load('workDatabase');

        var payload =
          result && result.data
            ? result.data
            : null;

        var rows =
          Array.isArray(payload)
            ? payload
            : (
                payload && Array.isArray(payload.data)
                  ? payload.data
                  : null
              );

        if(!rows){
          throw new Error('작업DB data 배열을 찾을 수 없습니다.');
        }

        if(
          Number(result.count || 0) > 0 &&
          Number(result.count) !== rows.length
        ){
          throw new Error(
            '작업DB 건수 불일치: manifest ' +
            result.count + '건 / 실제 ' + rows.length + '건'
          );
        }

        workDatabase = rows.slice();

        workDatabaseState = {
          status: 'loaded',
          source: result.source || 'static',
          count: workDatabase.length,
          error: '',
          loadedAt: new Date().toISOString()
        };

        log('작업DB 준비 완료', workDatabaseState);

        return workDatabase;

      } catch(error){
        workDatabase = [];

        workDatabaseState = {
          status: 'error',
          source: '',
          count: 0,
          error:
            error && error.message
              ? error.message
              : String(error),
          loadedAt: new Date().toISOString()
        };

        warn('작업DB 로드 실패 — 본체 평가는 계속됩니다.', error);

        return [];

      } finally {
        workDatabaseLoadPromise = null;
      }
    })();

    return workDatabaseLoadPromise;
  }

  /* ========================================================
   * SECTION 4. 작업DB 매칭
   * ======================================================== */

  function calculateMatch(work, current){
    var workId = getWorkId(work);

    if(
      current.workId &&
      workId &&
      String(current.workId) === String(workId)
    ){
      return {
        score: 100,
        method: 'workId-exact',
        reasons: ['작업번호 정확 일치']
      };
    }

    var workDate = String(
      firstValue(work, ['date', 'workDate', 'startDate']) || ''
    );

    var workOriginalNo = String(
      firstValue(work, ['originalNo', 'workNo']) || ''
    );

    var combinedId =
      workDate && workOriginalNo
        ? (workDate + '_' + workOriginalNo)
        : '';

    if(
      current.workId &&
      combinedId &&
      String(current.workId) === combinedId
    ){
      return {
        score: 98,
        method: 'date-originalNo-exact',
        reasons: ['작업일자·원본번호 일치']
      };
    }

    var score = 0;
    var reasons = [];

    var currentName = String(current.workName || '');
    var databaseName = getWorkName(work);

    var currentNameKey = compact(currentName);
    var databaseNameKey = compact(databaseName);

    if(currentNameKey && currentNameKey === databaseNameKey){
      score += 60;
      reasons.push('작업명 정확 일치');
    } else {
      var nameScore = Math.round(
        similarity(currentName, databaseName) * 45
      );

      score += nameScore;

      if(nameScore >= 20){
        reasons.push('작업명 유사');
      }
    }

    var detailScore = Math.round(
      similarity(
        current.workDescription || '',
        getWorkFullName(work)
      ) * 15
    );

    score += detailScore;

    if(detailScore >= 7){
      reasons.push('상세 작업내용 유사');
    }

    var currentCompany = compact(current.company);
    var databaseCompany = compact(getCompany(work));

    if(
      currentCompany &&
      databaseCompany &&
      currentCompany === databaseCompany
    ){
      score += 10;
      reasons.push('협력사 일치');
    }

    var currentLocation = compact(current.location);
    var databaseLocation = compact(getLocation(work));

    if(
      currentLocation &&
      databaseLocation &&
      (
        currentLocation === databaseLocation ||
        currentLocation.indexOf(databaseLocation) >= 0 ||
        databaseLocation.indexOf(currentLocation) >= 0
      )
    ){
      score += 10;
      reasons.push('작업장소 일치');
    }

    return {
      score: Math.min(99, score),
      method: score >= 80 ? 'similar-strong' : 'similar-candidate',
      reasons: reasons
    };
  }

  function findMatches(){
    if(!global.riskData || !Array.isArray(workDatabase)){
      currentMatches = [];
      selectedMatch = null;
      return [];
    }

    var current = {
      workId: global.riskData.workId || '',
      workName: global.riskData.workName || '',
      workDescription: global.riskData.workDescription || '',
      company: global.riskData.company || '',
      location: [
        global.riskData.location || '',
        global.riskData.detailLocation || ''
      ].join(' ').trim()
    };

    currentMatches = workDatabase
      .map(function(work, index){
        var match = calculateMatch(work, current);
        var riskInfo = getWorkRiskInfo(work);

        return {
          rowIndex: index,
          workId: getWorkId(work),
          workName: getWorkName(work),
          company: getCompany(work),
          location: getLocation(work),
          score: match.score,
          method: match.method,
          reasons: match.reasons,
          riskOriginal: riskInfo.original,
          riskLabel: riskInfo.label,
          isHighRisk: riskInfo.isHigh
        };
      })
      .filter(function(match){
        return match.score >= 60;
      })
      .sort(function(first, second){
        if(second.score !== first.score){
          return second.score - first.score;
        }

        if(first.isHighRisk !== second.isHighRisk){
          return first.isHighRisk ? -1 : 1;
        }

        return 0;
      })
      .slice(0, 3);

    selectedMatch =
      currentMatches.find(function(match){
        return match.score >= 80;
      }) || null;

    return currentMatches;
  }

  /* ========================================================
   * SECTION 5. 위험성평가DB 근거 집계
   * ======================================================== */

  function buildRiskDbEvidence(){
    /* 집계 직전 시프트 잔존 여부를 한 번 더 확인 */
    try {
      sweepRiskDatabase();
    } catch(error){
      warn('근거 집계 전 스윕 실패', error);
    }

    var results =
      Array.isArray(global.currentSearchResults)
        ? global.currentSearchResults
        : [];

    var riskVotes = { '저위험': 0, '중위험': 0, '고위험': 0 };
    var controlVotes = { '○': 0, '△': 0, '×': 0 };

    var validRiskCount = 0;
    var validControlCount = 0;
    var maximumRelevance = 0;
    var shiftFallbackCount = 0;

    results.forEach(function(result){
      var relevance = Math.max(1, Number(result.relevance || 0));

      maximumRelevance = Math.max(maximumRelevance, relevance);

      var item = result.item || {};

      if(isShiftedRow(item)){
        shiftFallbackCount++;
      }

      var risk = resolveItemRisk(item);

      if(risk){
        riskVotes[risk] += relevance;
        validRiskCount++;
      }

      var control = resolveItemControl(item);

      if(control){
        controlVotes[control] += relevance;
        validControlCount++;
      }
    });

    function selectVote(votes, orderFunction){
      var selected = '';
      var selectedScore = -1;

      Object.keys(votes).forEach(function(value){
        var score = votes[value];

        if(score > selectedScore){
          selected = value;
          selectedScore = score;
          return;
        }

        if(
          score === selectedScore &&
          orderFunction(value) > orderFunction(selected)
        ){
          selected = value;
        }
      });

      return selectedScore > 0 ? selected : '';
    }

    return {
      risk: selectVote(riskVotes, riskOrder),
      control: selectVote(controlVotes, controlOrder),
      validRiskCount: validRiskCount,
      validControlCount: validControlCount,
      resultCount: results.length,
      maximumRelevance: maximumRelevance,
      shiftFallbackCount: shiftFallbackCount,
      riskVotes: riskVotes,
      controlVotes: controlVotes
    };
  }

  /* ========================================================
   * SECTION 6. 통합 판정 반영
   * ======================================================== */

  function selectAuthorRisk(risk){
    if(!risk){
      return;
    }

    var input = document.querySelector(
      'input[name="authorRiskLevel"][value="' + risk + '"]'
    );

    if(input){
      input.checked = true;
    }
  }

  function selectAuthorControl(control){
    if(!control){
      return;
    }

    var input = document.querySelector(
      'input[name="authorControlLevel"][value="' + control + '"]'
    );

    if(input){
      input.checked = true;
    }
  }

  function updateWorkDbReasonCheckbox(available){
    var checkbox = document.querySelector(
      'input[name="authorReason"][value="WORK_DB_RISK"]'
    );

    if(!checkbox){
      return;
    }

    var label = checkbox.closest('.author-reason');

    checkbox.disabled = !available;

    if(!available){
      checkbox.checked = false;

      if(label){
        label.style.opacity = '.45';
        label.title = '신뢰 가능한 작업DB 위험등급 매칭이 없습니다.';
      }

      return;
    }

    if(label){
      label.style.opacity = '1';
      label.title = '작업DB의 실제 매칭 결과가 확인되었습니다.';
    }
  }

  function applyIntegratedDecision(riskEvidence){
    if(!global.riskData){
      return;
    }

    var originalAutomaticValid =
      global.riskData.automaticJudgmentValid === true;

    var currentRisk = normalizeRisk(global.riskData.finalRiskLevel);
    var currentControl = normalizeControl(global.riskData.finalControlAdequacy);

    var exactHighRisk = Boolean(
      selectedMatch &&
      (
        selectedMatch.method === 'workId-exact' ||
        selectedMatch.method === 'date-originalNo-exact'
      ) &&
      selectedMatch.isHighRisk
    );

    var suggestedRisk = '';
    var suggestedControl = currentControl || riskEvidence.control;

    var method = '';
    var reasons = [];

    if(exactHighRisk){
      suggestedRisk = '고위험';
      method = 'internal-workdb-high';
      reasons.push('내부 작업DB 고위험 분류와 정확 일치');

    } else if(originalAutomaticValid && currentRisk && currentControl){
      /* 기존 자동 매트릭스 결과가 유효하면 그대로 유지 */
      suggestedRisk = currentRisk;
      suggestedControl = currentControl;
      method = global.riskData.judgmentMethod || 'auto';
      reasons.push('위험성평가 DB 매트릭스 판정');

    } else if(riskEvidence.risk){
      suggestedRisk = riskEvidence.risk;
      method = 'riskdb-registered-fallback';

      reasons.push(
        '위험성평가 DB 등록 위험도 ' +
        riskEvidence.validRiskCount + '건 종합'
      );
    }

    if(
      exactHighRisk &&
      currentRisk &&
      riskOrder(currentRisk) > riskOrder(suggestedRisk)
    ){
      suggestedRisk = currentRisk;
    }

    global.riskData.workDatabaseReference =
      selectedMatch
        ? {
            matched: true,
            workId: selectedMatch.workId,
            workName: selectedMatch.workName,
            method: selectedMatch.method,
            score: selectedMatch.score,
            riskOriginal: selectedMatch.riskOriginal,
            riskLabel: selectedMatch.riskLabel,
            isHighRisk: selectedMatch.isHighRisk,
            reasons: selectedMatch.reasons.slice(),
            source: workDatabaseState.source,
            reviewedAt: new Date().toISOString()
          }
        : {
            matched: false,
            candidateCount: currentMatches.length,
            source: workDatabaseState.source,
            reviewedAt: new Date().toISOString()
          };

    global.riskData.integratedJudgment = {
      suggestedRisk: suggestedRisk,
      suggestedControl: suggestedControl,
      method: method,
      reasons: reasons,
      riskDbEvidence: riskEvidence,
      workDbHighRiskExact: exactHighRisk,
      shiftGuard: {
        corrected: shiftStats.corrected,
        swept: shiftStats.swept
      },
      calculatedAt: new Date().toISOString()
    };

    var sufficient = Boolean(suggestedRisk && suggestedControl);

    if(sufficient){
      global.riskData.finalRiskLevel = suggestedRisk;
      global.riskData.finalControlAdequacy = suggestedControl;
      global.riskData.judgmentMethod = method;
      global.riskData.automaticJudgmentValid = true;
      global.riskData.authorJudgmentRequired = false;

      if(global.riskData.autoJudgment){
        global.riskData.autoJudgment.riskLevel = suggestedRisk;
        global.riskData.autoJudgment.controlAdequacy = suggestedControl;
        global.riskData.autoJudgment.basis = reasons.join(' · ');

        global.riskData.autoJudgment.matrixCalculation =
          method === 'internal-workdb-high'
            ? '내부 작업DB 고위험 정확 일치'
            : 'DB 등록값 기반 보조판정';
      }

      updateWorkDbReasonCheckbox(exactHighRisk);

      return;
    }

    /* 위험도·통제 수준 중 하나만 확보된 경우 → 작성자 직접판정 사전 선택 */
    global.riskData.automaticJudgmentValid = false;
    global.riskData.authorJudgmentRequired = true;

    global.riskData.judgmentMethod =
      suggestedRisk
        ? 'integrated-suggestion-pending-author'
        : 'author-direct-required';

    if(suggestedRisk){
      global.riskData.databaseFallbackRisk = suggestedRisk;
      global.riskData.finalRiskLevel = suggestedRisk;
    }

    global.riskData.finalControlAdequacy =
      suggestedControl ? suggestedControl : '';

    selectAuthorRisk(suggestedRisk);
    selectAuthorControl(suggestedControl);
    updateWorkDbReasonCheckbox(exactHighRisk);
  }

  /* ========================================================
   * SECTION 7. 패널 UI
   * ======================================================== */

  function sourceLabel(source){
    var labels = {
      pages: 'GitHub Pages',
      raw: 'GitHub Raw',
      indexeddb: 'IndexedDB 캐시',
      static: '정적 DB'
    };

    return labels[source] || source || '확인 불가';
  }

  function matchMethodLabel(method){
    var labels = {
      'workId-exact': '작업번호 정확 일치',
      'date-originalNo-exact': '작업일자·원본번호 일치',
      'similar-strong': '유사 작업 강한 일치',
      'similar-candidate': '유사 작업 후보'
    };

    return labels[method] || method || '유사 매칭';
  }

  function injectStyles(){
    if(document.getElementById('riskWorkDbV3Style')){
      return;
    }

    var style = document.createElement('style');
    style.id = 'riskWorkDbV3Style';

    style.textContent = [
      '.workdb-v2-panel{',
      'display:none;margin-bottom:9px;padding:12px;',
      'border:1.5px solid var(--line);border-radius:14px;',
      'background:var(--card);box-shadow:var(--shadow);}',

      '.workdb-v2-panel.active{display:block;}',

      '.workdb-v2-header{display:flex;align-items:center;',
      'justify-content:space-between;gap:8px;margin-bottom:8px;}',

      '.workdb-v2-title{color:var(--posco);font-size:13px;font-weight:900;}',

      '.workdb-v2-source{padding:3px 7px;border-radius:6px;',
      'background:var(--tint);color:var(--posco);',
      'font-size:9px;font-weight:850;}',

      '.workdb-v2-card{margin-bottom:6px;padding:9px;',
      'border:1px solid var(--line);border-radius:9px;background:var(--sunk);}',

      '.workdb-v2-card.selected{border-color:var(--done);background:var(--done-bg);}',

      '.workdb-v2-name{margin-bottom:4px;color:var(--ink);',
      'font-size:11.5px;font-weight:850;line-height:1.4;}',

      '.workdb-v2-meta{display:flex;gap:5px;flex-wrap:wrap;',
      'color:var(--sub);font-size:9.5px;font-weight:700;}',

      '.workdb-v2-risk{padding:2px 6px;border-radius:5px;',
      'background:var(--warn-bg);color:var(--warn);font-weight:900;}',

      '.workdb-v2-risk.high{background:var(--stop-bg);color:var(--stop);}',

      '.workdb-v2-note{margin-top:7px;color:var(--sub);',
      'font-size:10px;font-weight:650;line-height:1.45;}',

      '.workdb-v2-fix{margin-top:6px;padding:5px 7px;border-radius:6px;',
      'background:var(--tint);color:var(--posco);',
      'font-size:9.5px;font-weight:800;}'
    ].join('');

    document.head.appendChild(style);
  }

  function injectPanel(){
    if(document.getElementById('workDbV2Panel')){
      return;
    }

    var authorPanel = document.getElementById('authorJudgmentPanel');
    var judgmentCard = document.getElementById('judgmentCard');

    if(!judgmentCard){
      return;
    }

    var panel = document.createElement('section');
    panel.id = 'workDbV2Panel';
    panel.className = 'workdb-v2-panel';
    if(authorPanel && authorPanel.parentNode){
      authorPanel.parentNode.insertBefore(panel, authorPanel);
    } else {
      judgmentCard.insertAdjacentElement('afterend', panel);
    }
  }

  function renderPanel(){
    var panel = document.getElementById('workDbV2Panel');

    if(!panel){
      return;
    }

    panel.classList.add('active');

    var html =
      '<div class="workdb-v2-header">' +
        '<div class="workdb-v2-title">📋 작업DB 검토 결과</div>' +
        '<div class="workdb-v2-source">' +
          escapeHtml(
            workDatabaseState.count + '건 · ' +
            sourceLabel(workDatabaseState.source)
          ) +
        '</div>' +
      '</div>';

    if(workDatabaseState.status === 'error'){
      html +=
        '<div class="workdb-v2-note">' +
          '작업DB 검토에 실패했지만 위험성평가는 정상적으로 계속할 수 있습니다.' +
        '</div>';

      html += buildShiftBadge();
      panel.innerHTML = html;
      return;
    }

    if(currentMatches.length === 0){
      html +=
        '<div class="workdb-v2-note">' +
          '현재 작업과 충분히 유사한 작업DB 자료를 찾지 못했습니다.' +
        '</div>';

      html += buildShiftBadge();
      panel.innerHTML = html;
      return;
    }

    currentMatches.forEach(function(match, index){
      var selected =
        selectedMatch &&
        selectedMatch.rowIndex === match.rowIndex;

      html +=
        '<div class="workdb-v2-card' + (selected ? ' selected' : '') + '">' +

          '<div class="workdb-v2-name">' +
            (selected ? '✅ ' : (index + 1) + '. ') +
            escapeHtml(match.workName || '작업명 없음') +
          '</div>' +

          '<div class="workdb-v2-meta">' +
            '<span>' + escapeHtml(matchMethodLabel(match.method)) + '</span>' +
            '<span>일치도 ' + escapeHtml(match.score) + '점</span>' +
            '<span class="workdb-v2-risk' +
              (match.isHighRisk ? ' high' : '') + '">' +
              '내부 분류 ' + escapeHtml(match.riskLabel || '미분류') +
            '</span>' +
          '</div>' +

        '</div>';
    });

    if(
      selectedMatch &&
      selectedMatch.isHighRisk &&
      (
        selectedMatch.method === 'workId-exact' ||
        selectedMatch.method === 'date-originalNo-exact'
      )
    ){
      html +=
        '<div class="workdb-v2-note">' +
          '내부 프로세스를 거친 고위험 작업과 정확히 일치하여 고위험 근거로 반영했습니다.' +
        '</div>';
    } else {
      html +=
        '<div class="workdb-v2-note">' +
          '작업DB의 일반 분류는 저위험을 의미하지 않으며, ' +
          '위험성평가 DB와 함께 참고합니다.' +
        '</div>';
    }

    html += buildShiftBadge();

    panel.innerHTML = html;
  }

  /*
   * 시프트 보정이 실제로 작동했을 때만 관리자 확인용 배지를 표시한다.
   * 정적 JSON이 정상화되면 corrected 와 swept 가 0이 되어 자동으로 사라진다.
   */
  function buildShiftBadge(){
    var corrected = shiftStats.corrected + shiftStats.swept;

    if(corrected <= 0){
      return '';
    }

    return (
      '<div class="workdb-v2-fix">' +
        '🛠 위험성평가DB 컬럼 정렬 보정 ' +
        escapeHtml(corrected) + '건 적용 (임시 조치)' +
      '</div>'
    );
  }

  /* ========================================================
   * SECTION 8. 비차단 검토 실행
   * ======================================================== */

  async function reviewCurrentAssessment(){
    var token = ++currentReviewToken;

    if(!global.riskData || !global.riskData.workName){
      return;
    }

    /* 위험성평가DB 시프트 잔존분 우선 보정 */
    try {
      installMappingGuard();
      installLoadGuard();
      sweepRiskDatabase();
    } catch(error){
      warn('시프트 보정 단계 실패 — 검토는 계속됩니다.', error);
    }

    injectStyles();
    injectPanel();

    var panel = document.getElementById('workDbV2Panel');

    if(panel){
      panel.classList.add('active');

      panel.innerHTML =
        '<div class="workdb-v2-header">' +
          '<div class="workdb-v2-title">📋 작업DB 검토 결과</div>' +
        '</div>' +
        '<div class="workdb-v2-note">' +
          '기존 평가 화면과 별도로 작업DB를 검토하고 있습니다.' +
        '</div>';
    }

    await loadWorkDatabase();

    if(token !== currentReviewToken){
      return;
    }

    findMatches();

    var riskEvidence = buildRiskDbEvidence();

    applyIntegratedDecision(riskEvidence);

    renderPanel();

    /*
     * 기존 renderJudgment 를 덮어쓰지 않고 한 번만 호출하여
     * 변경된 결과를 화면에 반영한다.
     */
    if(typeof global.renderJudgment === 'function'){
      global.renderJudgment();
    }

    if(
      global.riskJudgmentPatch &&
      typeof global.riskJudgmentPatch.renderAuthorJudgmentPanel === 'function'
    ){
      global.riskJudgmentPatch.renderAuthorJudgmentPanel();
    }

    log('비차단 작업DB 검토 완료', {
      selected: selectedMatch,
      evidence: riskEvidence,
      finalRisk: global.riskData.finalRiskLevel,
      control: global.riskData.finalControlAdequacy,
      method: global.riskData.judgmentMethod,
      shiftGuard: {
        corrected: shiftStats.corrected,
        swept: shiftStats.swept
      }
    });
  }

  /* ========================================================
   * SECTION 9. 본체 함수 래핑 (비차단 유지)
   * ======================================================== */

  var originalInitializeStepTwo = global.initializeStepTwo;

  if(typeof originalInitializeStepTwo === 'function'){
    global.initializeStepTwo = async function(){
      /* 본체 분석 전에 가드를 재확인 (스크립트 로드 순서 무관하게 보장) */
      try {
        installMappingGuard();
        installLoadGuard();
        sweepRiskDatabase();
      } catch(error){
        warn('분석 전 시프트 보정 실패 — 본체 평가는 계속됩니다.', error);
      }

      var result = await originalInitializeStepTwo.apply(this, arguments);

      Promise.resolve()
        .then(function(){
          return reviewCurrentAssessment();
        })
        .catch(function(error){
          warn('작업DB 보조 검토 실패 — 본체 평가는 계속됩니다.', error);
        });

      return result;
    };
  }

  var originalBuildAssessmentSaveObject = global.buildAssessmentSaveObject;

  if(typeof originalBuildAssessmentSaveObject === 'function'){
    global.buildAssessmentSaveObject = function(includeServerTimestamp){
      var saveObject =
        originalBuildAssessmentSaveObject(includeServerTimestamp);

      saveObject.workDatabaseReference =
        global.riskData && global.riskData.workDatabaseReference
          ? JSON.parse(JSON.stringify(global.riskData.workDatabaseReference))
          : null;

      saveObject.integratedJudgment =
        global.riskData && global.riskData.integratedJudgment
          ? JSON.parse(JSON.stringify(global.riskData.integratedJudgment))
          : null;

      saveObject.workDatabaseState = {
        source: workDatabaseState.source,
        count: workDatabaseState.count,
        loadedAt: workDatabaseState.loadedAt
      };

      /* 어떤 데이터 상태에서 판정했는지 추적 가능하도록 기록 */
      saveObject.referenceDataIntegrity = {
        patchVersion: PATCH_VERSION,
        shiftGuardInstalled: shiftStats.installed,
        shiftCorrectedOnMap: shiftStats.corrected,
        shiftCorrectedOnSweep: shiftStats.swept,
        rowsPassedAsNormal: shiftStats.passed,
        lastSweepAt: shiftStats.lastSweepAt
      };

      return saveObject;
    };
  }

  /* ========================================================
   * SECTION 10. 초기화 및 외부 API
   * ======================================================== */

  document.addEventListener('DOMContentLoaded', function(){
    injectStyles();
    injectPanel();

    installMappingGuard();
    installLoadGuard();

    /* 본체 초기 로드가 먼저 끝난 경우를 대비한 지연 스윕 */
    setTimeout(function(){
      try {
        sweepRiskDatabase();
      } catch(error){
        warn('지연 스윕 실패', error);
      }
    }, 1500);

    log(
      'v' + PATCH_VERSION + ' 적용 완료 — 비차단 방식 + 컬럼 시프트 보정'
    );
  });

  global.riskWorkDbMatchPatch = {
    version: PATCH_VERSION,

    review: reviewCurrentAssessment,

    load: loadWorkDatabase,

    /* 위험성평가DB 정렬 보정 수동 실행 */
    sweep: sweepRiskDatabase,

    /* 데이터 상태 진단 (콘솔에서 직접 호출) */
    diagnose: diagnoseRiskDatabase,

    getShiftStats: function(){
      return Object.assign({}, shiftStats);
    },

    /* 보정 해제 (원본 동작으로 되돌림) */
    restore: function(){
      if(
        typeof global.mapRiskDatabaseDocument === 'function' &&
        global.mapRiskDatabaseDocument.__original
      ){
        global.mapRiskDatabaseDocument =
          global.mapRiskDatabaseDocument.__original;
      }

      if(
        typeof global.loadRiskDatabase === 'function' &&
        global.loadRiskDatabase.__original
      ){
        global.loadRiskDatabase =
          global.loadRiskDatabase.__original;
      }

      shiftStats.installed = false;

      log('시프트 보정 가드 해제 완료 (데이터 재로드 필요)');
    },

    getState: function(){
      return {
        database: Object.assign({}, workDatabaseState),

        selected:
          selectedMatch
            ? Object.assign({}, selectedMatch)
            : null,

        matches: currentMatches.map(function(match){
          return Object.assign({}, match);
        }),

        shiftGuard: Object.assign({}, shiftStats)
      };
    }
  };

  log('v' + PATCH_VERSION + ' loaded');

})(window);
/* ============================================================
   risk-workdb-match-patch 확장 v3.0.1
   1) (경미) 토큰 단위 하향 보정
   2) 원본 판정불가 행 참조 제외
   3) 통제값 문자 정규화
   ※ v3.0.0 시프트 보정 이후에 적용됨
   ============================================================ */
(function(global){
  'use strict';

  var V = '3.0.1';
  if(global.riskWorkDbPatchV301){ console.log('[v3.0.1] 이미 적용'); return; }

  var RANK = {'저심각도':1,'중심각도':2,'고심각도':3,'최고심각도':4};
  var REV  = {1:'저심각도',2:'중심각도',3:'고심각도',4:'최고심각도'};

  /* ---------- 1) 통제값 정규화 ---------- */
  function normalizeControl(v){
    var s = String(v == null ? '' : v).trim();
    if(!s) return '';
    if(/^[○◯〇oO0]$/.test(s)) return '○';
    if(/^[△▲]$/.test(s))      return '△';
    if(/^[×✕✖xX]$/.test(s))   return '×';
    return s;
  }

  function normalizeAllControls(){
    if(!Array.isArray(global.riskDatabase)) return 0;
    var n = 0;
    global.riskDatabase.forEach(function(r){
      var before = r.controlAdequacy;
      var after  = normalizeControl(before);
      if(after !== before){ r.controlAdequacy = after; n++; }
    });
    return n;
  }

  /* ---------- 2) (경미) 토큰 단위 하향 ---------- */
  var SPLIT = /\s*[\/;]\s*|\s*(?:및|또는)\s*/;

  function installMinorTokenGuard(){
    if(typeof global.getSeverity !== 'function'){
      console.error('[v3.0.1] getSeverity 없음 → 하향 보정 미적용'); return false;
    }
    /* 앞서 콘솔에서 설치한 잘못된 래퍼가 있으면 원본으로 되돌림 */
    while(global.getSeverity.__minorGuard && global.getSeverity.__original){
      global.getSeverity = global.getSeverity.__original;
    }
    if(global.getSeverity.__minorTokenGuard) return true;

    var original = global.getSeverity;

    var wrapped = function(accidentType){
      var text = String(accidentType == null ? '' : accidentType);
      if(text.indexOf('경미') < 0){ return original.apply(this, arguments); }

      var tokens = text.split(SPLIT).map(function(s){ return s.trim(); })
                       .filter(function(s){ return s.length > 0; });
      if(tokens.length === 0){ return original.apply(this, arguments); }

      var maxRank = 0, trace = [];
      tokens.forEach(function(tok){
        var isMinor = /경미/.test(tok);
        var clean = tok.replace(/\(\s*경미\s*\)/g, '').replace(/경미/g, '').trim();
        var sev = original(clean || tok);
        var rank = RANK[sev] || 0;
        if(isMinor && rank > 1){ rank -= 1; }
        trace.push(tok + '=>' + (REV[rank] || sev));
        if(rank > maxRank){ maxRank = rank; }
      });

      var result = REV[maxRank];
      if(!result){ return original.apply(this, arguments); }
      if(wrapped.verbose){ console.log('[경미 토큰]', result, '|', trace.join(' , ')); }
      return result;
    };

    wrapped.__minorTokenGuard = true;
    wrapped.__original = original;
    wrapped.verbose = false;
    global.getSeverity = wrapped;
    return true;
  }

  /* ---------- 3) 원본 판정불가 행 참조 제외 ---------- */
  function isJudgeableRow(row){
    if(!row) return false;
    return String(row.accidentType || '').trim() !== '판정불가' &&
           String(row.riskLevel   || '').trim() !== '판정불가';
  }

  function installReferenceFilter(){
    if(typeof global.evaluateReferenceRisk !== 'function'){
      console.error('[v3.0.1] evaluateReferenceRisk 없음 → 참조 필터 미적용'); return false;
    }
    if(global.evaluateReferenceRisk.__refFilter) return true;

    var original = global.evaluateReferenceRisk;

    var wrapped = function(searchResult){
      var item = searchResult && searchResult.item;
      if(item && !isJudgeableRow(item)){
        return {
          valid: false,
          invalidReason: '참조부적격(원본 판정불가 항목)',
          item: item,
          excludedBy: 'v3.0.1'
        };
      }
      return original.apply(this, arguments);
    };

    wrapped.__refFilter = true;
    wrapped.__original = original;
    global.evaluateReferenceRisk = wrapped;
    return true;
  }

  /* ---------- 실행 ---------- */
  var report = {
    version: V,
    controlNormalized: normalizeAllControls(),
    minorTokenGuard: installMinorTokenGuard(),
    referenceFilter: installReferenceFilter(),
    excludedRows: Array.isArray(global.riskDatabase)
      ? global.riskDatabase.filter(function(r){ return !isJudgeableRow(r); }).length : 0,
    remarkLost: Array.isArray(global.riskDatabase)
      ? global.riskDatabase.filter(function(r){ return !String(r.remark||'').trim(); }).length : 0
  };

  global.riskWorkDbPatchV301 = {
    version: V,
    report: report,
    normalizeControl: normalizeControl,
    isJudgeableRow: isJudgeableRow,
    setVerbose: function(on){ if(global.getSeverity.__minorTokenGuard){ global.getSeverity.verbose = !!on; } },
    restore: function(){
      if(global.getSeverity.__minorTokenGuard) global.getSeverity = global.getSeverity.__original;
      if(global.evaluateReferenceRisk.__refFilter) global.evaluateReferenceRisk = global.evaluateReferenceRisk.__original;
      delete global.riskWorkDbPatchV301;
      console.log('[v3.0.1] 해제 완료');
    }
  };

  console.log('[risk-workdb v3.0.1] 적용 완료', report);
})(window);
/* ============================================================
 * risk-workdb-match-patch 확장 v3.1.0
 * 관리대장 공식 위험등급 최우선 적용 안정본
 *
 * [공식 관리대장 적용 조건]
 * - workId 정확 일치만 공식 매칭으로 인정
 * - 키워드·작업명 유사 매칭은 참고 후보로만 기록
 *
 * [판정 우선순위]
 * 1. workId 정확 일치 + 관리대장 고위험
 *    → 무조건 고위험, 다른 하향 규칙 중단
 * 2. 순수 점검·순찰·육안·외관·측정·판독
 *    → 저위험
 * 3. 정비·수리 + 분해·조립
 *    → 중위험
 * 4. workId 정확 일치 + 관리대장 일반
 *    → 상한 중위험
 *
 * [저장 안정화]
 * - 위험등급과 riskScore 동기화
 * - override 필드 undefined 방지
 * - Firestore/localStorage 중복 객체 생성 시 원본등급 보존
 * ============================================================ */
(function(global){
  'use strict';

  var V = '3.1.0';

  if(global.riskWorkDbPatchV310){
    console.log('[v3.1.0] 이미 적용');
    return;
  }

  var LEVEL_ORDER = {
    '저위험': 1,
    '중위험': 2,
    '고위험': 3,
    '매우고위험': 4
  };

  var STOP_WORDS = [
    '작업',
    '실시',
    '확인',
    '관련',
    '안전'
  ];

  /* --------------------------------------------------------
   * 공통 유틸리티
   * -------------------------------------------------------- */

  function normalizeText(value){
    return String(value || '')
      .toLowerCase()
      .replace(/패널/g, '판넬')
      .replace(/\bloto\b/gi, 'ils')
      .replace(/로토/g, 'ils')
      .replace(/잠금\s*[·ㆍ-]?\s*표찰/g, 'ils')
      .replace(/[^0-9a-z가-힣]/g, '');
  }

  function normalizeId(value){
    return String(value || '')
      .trim()
      .replace(/\s+/g, '');
  }

  function firstValue(object, keys){
    object = object || {};

    for(var index = 0; index < keys.length; index++){
      var value = object[keys[index]];

      if(
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ''
      ){
        return value;
      }
    }

    return '';
  }

  function getHistoryWorkId(work){
    work = work || {};

    var directId = firstValue(
      work,
      ['workId', 'id', 'docId']
    );

    if(directId){
      return normalizeId(directId);
    }

    var date = firstValue(
      work,
      ['date', 'workDate', 'startDate']
    );

    var originalNo = firstValue(
      work,
      ['originalNo', 'workNo', 'number', 'no']
    );

    if(date && originalNo){
      return normalizeId(
        String(date) + '_' + String(originalNo)
      );
    }

    return '';
  }

  function getHistoryWorkName(work){
    return String(
      firstValue(
        work,
        ['workName', 'workNameFull', 'name', 'title']
      ) || ''
    ).trim();
  }

  function getHistorySearchText(work){
    work = work || {};

    return [
      work.workName || '',
      work.workNameFull || '',
      work.workDescription || '',
      work.safetyOriginal || '',
      work.safety || ''
    ].join(' ');
  }

  function getHistoryRisk(work){
    work = work || {};

    var risk = String(
      firstValue(
        work,
        ['risk', 'riskLevel', 'overallRisk']
      ) || ''
    )
      .trim()
      .replace(/\s+/g, '');

    if(
      work.isHighRiskFromSource === true ||
      risk === '고위험' ||
      risk === '매우고위험'
    ){
      return '고위험';
    }

    if(
      risk === '일반' ||
      risk === '일반작업' ||
      risk === '저위험'
    ){
      return '일반';
    }

    return risk;
  }

  function extractKeywords(value){
    var tokens = String(value || '')
      .toLowerCase()
      .replace(/패널/g, '판넬')
      .replace(/\bloto\b/gi, 'ils')
      .replace(/로토/g, 'ils')
      .split(/[^0-9a-z가-힣]+/)
      .map(function(token){
        return token.trim();
      })
      .filter(function(token){
        return (
          token.length >= 2 &&
          STOP_WORDS.indexOf(token) < 0
        );
      });

    var unique = [];

    tokens.forEach(function(token){
      if(unique.indexOf(token) < 0){
        unique.push(token);
      }
    });

    return unique;
  }

  function getWorkHistory(){
    try {
      var raw =
        localStorage.getItem('safetyDatabase');

      if(!raw){
        return [];
      }

      var database =
        JSON.parse(raw);

      return Array.isArray(database.workHistory)
        ? database.workHistory
        : [];

    } catch(error){
      console.warn(
        '[v3.1.0] 관리대장 조회 실패:',
        error
      );

      return [];
    }
  }

  function buildMatchResult(
    work,
    method,
    score,
    total,
    candidateCount,
    authoritative
  ){
    return {
      work: work,
      workId: getHistoryWorkId(work),
      workName: getHistoryWorkName(work),
      risk: getHistoryRisk(work),
      method: method,
      score: score,
      total: total,
      candidateCount: candidateCount,
      authoritative: authoritative === true
    };
  }

  function getEffectiveWorkId(riskData){
    var workId =
      riskData && riskData.workId
        ? riskData.workId
        : '';

    if(!workId){
      try {
        workId =
          new URLSearchParams(
            global.location.search
          ).get('workId') || '';
      } catch(error){
        console.warn(
          '[v3.1.0] URL workId 확인 실패:',
          error
        );
      }
    }

    workId = normalizeId(workId);

    if(
      riskData &&
      !riskData.workId &&
      workId
    ){
      riskData.workId = workId;

      console.log(
        '[v3.1.0] URL workId 복구:',
        workId
      );
    }

    return workId;
  }

  /* --------------------------------------------------------
   * 관리대장 검색
   * -------------------------------------------------------- */

  function findInWorkHistory(workName, workId){
    var history =
      getWorkHistory();

    if(history.length === 0){
      return null;
    }

    var normalizedWorkId =
      normalizeId(workId);

    /*
     * 공식 매칭: workId 정확 일치
     */
    if(normalizedWorkId){
      var exactWork =
        history.find(function(work){
          return (
            getHistoryWorkId(work) ===
            normalizedWorkId
          );
        });

      if(exactWork){
        return buildMatchResult(
          exactWork,
          'workId-exact',
          100,
          100,
          1,
          true
        );
      }
    }

    /*
     * 아래부터는 참고 후보일 뿐 위험등급을 변경하지 않는다.
     */
    if(!workName){
      return null;
    }

    var normalizedName =
      normalizeText(workName);

    if(normalizedName){
      var nameCandidates =
        history.filter(function(work){
          return (
            normalizeText(
              getHistoryWorkName(work)
            ) === normalizedName ||
            normalizeText(
              work.workNameFull || ''
            ) === normalizedName
          );
        });

      if(nameCandidates.length > 0){
        return buildMatchResult(
          nameCandidates[0],
          'workName-reference',
          100,
          100,
          nameCandidates.length,
          false
        );
      }
    }

    var keywords =
      extractKeywords(workName);

    if(keywords.length === 0){
      return null;
    }

    var candidates = [];

    history.forEach(function(work){
      var searchText =
        normalizeText(
          getHistorySearchText(work)
        );

      var score = 0;

      keywords.forEach(function(keyword){
        if(
          searchText.indexOf(
            normalizeText(keyword)
          ) >= 0
        ){
          score++;
        }
      });

      if(score > 0){
        candidates.push({
          work: work,
          score: score
        });
      }
    });

    if(candidates.length === 0){
      return null;
    }

    candidates.sort(function(first, second){
      return second.score - first.score;
    });

    var best =
      candidates[0];

    var threshold =
      Math.ceil(keywords.length / 2);

    if(best.score < threshold){
      return null;
    }

    return buildMatchResult(
      best.work,
      'keyword-reference',
      best.score,
      keywords.length,
      candidates.length,
      false
    );
  }

  /* --------------------------------------------------------
   * 키워드 규칙
   * -------------------------------------------------------- */

  function inferByKeyword(workName, workDescription){
    var text =
      String(workName || '') +
      ' ' +
      String(workDescription || '');

    /*
     * 순수 확인·점검 업무는 저위험
     */
    if(
      /점검|순찰|육안|외관|측정|판독/.test(text) &&
      !/정비|수리|교체|분해|조립/.test(text)
    ){
      return {
        level: '저위험',
        reason: '순수 점검 작업 저위험 규칙 적용'
      };
    }

    /*
     * 정비·수리와 분해·조립이 동시에 있으면 중위험
     */
    if(
      /정비|수리/.test(text) &&
      /분해|조립/.test(text)
    ){
      return {
        level: '중위험',
        reason: '정비·수리 및 분해·조립 작업 중위험 규칙 적용'
      };
    }

    return null;
  }

  function capRiskLevel(current, maximum){
    var currentOrder =
      LEVEL_ORDER[current];

    var maximumOrder =
      LEVEL_ORDER[maximum];

    if(
      currentOrder === undefined ||
      maximumOrder === undefined
    ){
      return current;
    }

    return currentOrder > maximumOrder
      ? maximum
      : current;
  }

  function higherRisk(first, second){
    var firstOrder =
      LEVEL_ORDER[first] || 0;

    var secondOrder =
      LEVEL_ORDER[second] || 0;

    return firstOrder >= secondOrder
      ? first
      : second;
  }

  function getRiskScore(level){
    if(typeof global.getRiskScore === 'function'){
      return global.getRiskScore(level);
    }

    var scores = {
      '저위험': 3,
      '중위험': 8,
      '고위험': 15,
      '매우고위험': 25
    };

    return scores[level] || 0;
  }

  /* --------------------------------------------------------
   * 판정 적용
   * -------------------------------------------------------- */

  function overrideDecision(riskData){
    if(
      !riskData ||
      !riskData.workName
    ){
      return riskData;
    }

    /*
     * Firestore와 localStorage가 각각 저장 객체를 만들기 때문에
     * 최초 자동판정값을 계속 유지한다.
     */
    var original =
      (
        riskData.overrideVersion === V &&
        riskData.originalRiskLevel
      )
        ? riskData.originalRiskLevel
        : (riskData.finalRiskLevel || '');

    var workId =
      getEffectiveWorkId(riskData);

    var workName =
      riskData.workName || '';

    var workDescription =
      riskData.workDescription ||
      riskData.workDesc ||
      '';

    var match =
      findInWorkHistory(
        workName,
        workId
      );

    var authoritative =
      Boolean(
        match &&
        match.authoritative === true &&
        match.method === 'workId-exact'
      );

    var finalLevel =
      original;

    var reasons = [];

    console.log(
      '[v3.1.0] 판정 시작:',
      {
        workId: workId,
        workName: workName,
        original: original
      }
    );

    /*
     * 모든 관리대장 검색 결과를 기록하되
     * workId 정확 일치 여부를 별도로 표시한다.
     */
    if(match){
      riskData.managementLedgerReference = {
        matched: true,
        authoritative: authoritative,
        workId: match.workId,
        workName: match.workName,
        risk: match.risk,
        method: match.method,
        score: match.score,
        total: match.total,
        candidateCount: match.candidateCount,
        highRiskPriorityApplied: false,
        reviewedAt: new Date().toISOString()
      };

      console.log(
        authoritative
          ? '[v3.1.0] 📋 관리대장 공식 매칭'
          : '[v3.1.0] 🔎 관리대장 참고 후보',
        riskData.managementLedgerReference
      );
    } else {
      riskData.managementLedgerReference = {
        matched: false,
        authoritative: false,
        requestedWorkId: workId,
        requestedWorkName: workName,
        highRiskPriorityApplied: false,
        reviewedAt: new Date().toISOString()
      };

      console.log(
        '[v3.1.0] 관리대장 매칭 없음'
      );
    }

    /*
     * 최우선: workId가 정확히 일치하는 관리대장 고위험
     */
    if(
      authoritative &&
      match.risk === '고위험'
    ){
      finalLevel = '고위험';

      reasons.push(
        original === '고위험'
          ? '관리대장 고위험 최우선 확인 (기존 등급 동일)'
          : (
              '관리대장 고위험 최우선 적용 (기존: ' +
              original +
              ')'
            )
      );

      riskData.managementLedgerReference
        .highRiskPriorityApplied = true;

      riskData.finalRiskLevel =
        finalLevel;

      riskData.overrideApplied =
        true;

      riskData.overrideVersion =
        V;

      riskData.overrideReasons =
        reasons.slice();

      riskData.originalRiskLevel =
        original;

      console.log(
        '[v3.1.0] ✅ 관리대장 고위험 최우선:',
        original,
        '→',
        finalLevel
      );

      console.log(
        '[v3.1.0] ✅ 다른 하향 규칙 적용 중단'
      );

      return riskData;
    }

    var keywordRule =
      inferByKeyword(
        workName,
        workDescription
      );

    /*
     * 정확 일치한 관리대장 일반은 상한 중위험
     */
    if(
      authoritative &&
      (
        match.risk === '일반' ||
        match.risk === '일반작업'
      )
    ){
      var capped =
        capRiskLevel(
          finalLevel,
          '중위험'
        );

      if(capped !== finalLevel){
        reasons.push(
          '관리대장 일반 → 상한 중위험 적용 (기존: ' +
          finalLevel +
          ')'
        );

        finalLevel = capped;
      }
    }

    /*
     * 관리대장 일반과 키워드 규칙이 동시에 있으면
     * 더 보수적인 등급을 적용한다.
     */
    if(keywordRule){
      if(
        authoritative &&
        (
          match.risk === '일반' ||
          match.risk === '일반작업'
        )
      ){
        var conservative =
          higherRisk(
            finalLevel,
            keywordRule.level
          );

        if(conservative !== finalLevel){
          reasons.push(
            keywordRule.reason +
            ' · 관리대장 일반과 보수적 등급 비교'
          );

          finalLevel =
            conservative;
        }
      } else {
        /*
         * 신규 평가 또는 참고 후보만 존재하는 경우
         * 키워드 규칙을 직접 적용한다.
         */
        if(
          keywordRule.level !== finalLevel
        ){
          reasons.push(
            keywordRule.reason +
            ' (기존: ' +
            finalLevel +
            ')'
          );

          finalLevel =
            keywordRule.level;
        }
      }
    }

    var changed =
      finalLevel !== original;

    riskData.finalRiskLevel =
      finalLevel;

    riskData.overrideApplied =
      changed;

    riskData.overrideVersion =
      V;

    riskData.overrideReasons =
      reasons.slice();

    riskData.originalRiskLevel =
      original;

    if(changed){
      console.log(
        '[v3.1.0] ✅ 오버라이드 적용:',
        original,
        '→',
        finalLevel
      );

      reasons.forEach(function(reason){
        console.log(
          '[v3.1.0]   · ' + reason
        );
      });
    } else {
      console.log(
        '[v3.1.0] 변경 없음:',
        original
      );
    }

    return riskData;
  }

  /* --------------------------------------------------------
   * 저장 객체 동기화
   * -------------------------------------------------------- */

  function applySaveFields(saveObject, riskData){
    var finalLevel =
      riskData.finalRiskLevel || '';

    saveObject.finalRiskLevel =
      finalLevel;

    saveObject.riskLevel =
      finalLevel;

    saveObject.overallRisk =
      finalLevel;

    saveObject.riskScore =
      getRiskScore(finalLevel);

    saveObject.overrideApplied =
      riskData.overrideApplied === true;

    saveObject.overrideVersion =
      riskData.overrideVersion || V;

    saveObject.overrideReasons =
      Array.isArray(riskData.overrideReasons)
        ? riskData.overrideReasons.slice()
        : [];

    saveObject.originalRiskLevel =
      riskData.originalRiskLevel ||
      finalLevel;

    saveObject.managementLedgerReference =
      riskData.managementLedgerReference
        ? JSON.parse(
            JSON.stringify(
              riskData.managementLedgerReference
            )
          )
        : {
            matched: false,
            authoritative: false,
            requestedWorkId: riskData.workId || '',
            requestedWorkName: riskData.workName || ''
          };

    return saveObject;
  }

  /* --------------------------------------------------------
   * 저장 훅 설치
   * -------------------------------------------------------- */

  function installHook(){
    if(
      typeof global.buildAssessmentSaveObject !==
      'function'
    ){
      setTimeout(installHook, 100);
      return;
    }

    if(
      global.buildAssessmentSaveObject
        .__v310Installed
    ){
      return;
    }

    var previous =
      global.buildAssessmentSaveObject;

    var wrapped =
      function(includeServerTimestamp){
        var saveObject =
          previous.apply(
            this,
            arguments
          );

        if(global.riskData){
          overrideDecision(
            global.riskData
          );

          applySaveFields(
            saveObject,
            global.riskData
          );
        } else {
          overrideDecision(saveObject);
          applySaveFields(
            saveObject,
            saveObject
          );
        }

        return saveObject;
      };

    wrapped.__v310Installed =
      true;

    wrapped.__previous =
      previous;

    global.buildAssessmentSaveObject =
      wrapped;

    console.log(
      '[v3.1.0] ✅ buildAssessmentSaveObject 훅 설치 완료'
    );
  }

  if(document.readyState === 'loading'){
    document.addEventListener(
      'DOMContentLoaded',
      installHook
    );
  } else {
    installHook();
  }

  var api = {
    version: V,
    override: overrideDecision,
    findInHistory: findInWorkHistory,
    ruleByKeyword: inferByKeyword,
    reinstall: installHook,

    restore: function(){
      if(
        global.buildAssessmentSaveObject &&
        global.buildAssessmentSaveObject
          .__v310Installed
      ){
        global.buildAssessmentSaveObject =
          global.buildAssessmentSaveObject
            .__previous;
      }

      delete global.riskWorkDbPatchV310;

      console.log(
        '[v3.1.0] 해제 완료'
      );
    }
  };

  global.riskWorkDbPatchV310 = api;

  /*
   * 기존 콘솔 검증 명령 호환
   */
  global.riskWorkDbPatchV303 = api;
  global.riskWorkDbPatchV302 = api;

  console.log(
    '[risk-workdb v3.1.0] 관리대장 공식 매칭 안정본 로드 완료'
  );

})(window);
/* ============================================================
 * risk-workdb-match-patch 확장 v3.2.0
 * 신규 위험성평가 사내 고위험작업 분류 적용
 *
 * [핵심 원칙]
 * 1. workId-exact + 관리대장 고위험은 무조건 고위험
 * 2. 관리대장 유사 매칭은 참고만 하고 판정에 사용하지 않음
 * 3. 신규평가는 사내 고위험작업 6개 분류 기준으로 판정
 * 4. 신규평가가 사내 고위험 기준에 해당하지 않으면
 *    정적 DB 자동판정만으로 고위험을 확정하지 않음
 * 5. 신규 일반 수리·정비·교체·분해·조립은 중위험
 * 6. 예외조건은 자동 비대상 처리하지 않고 예외검토로 유지
 * 7. 위험도와 고위험작업 특별관리 여부를 분리 저장
 * ============================================================ */
(function(global){
  'use strict';

  var V = '3.2.0';
  var POLICY_VERSION = '1.0';

  if(global.riskHighWorkPolicyV320){
    console.log('[v3.2.0] 이미 적용');
    return;
  }

  var LEVEL_ORDER = {
    '판정불가': 0,
    '저위험': 1,
    '중위험': 2,
    '고위험': 3,
    '매우고위험': 4
  };

  var LEVEL_SCORE = {
    '판정불가': 0,
    '저위험': 3,
    '중위험': 8,
    '고위험': 15,
    '매우고위험': 25
  };

  var CATEGORY_LABELS = {
    HIGH_RISK_FIRE: '고위험 화기작업',
    CONFINED_SPACE: '밀폐공간 작업',
    CORROSIVE_CHEMICAL: '고(高)부식성 유해화학물질 작업',
    HIGH_RISK_HEIGHT: '고(高)위험 고소작업',
    HIGH_RISK_LIFTING: '고(高)위험 중량물 취급 작업',
    HIGH_RISK_ELECTRICAL: '고(高)위험 전기작업'
  };

  function getElement(id){
    return document.getElementById(id);
  }

  function isChecked(id){
    var element = getElement(id);
    return Boolean(element && element.checked);
  }

  function getValue(id){
    var element = getElement(id);

    return element
      ? String(element.value || '').trim()
      : '';
  }

  function normalizeId(value){
    return String(value || '')
      .trim()
      .replace(/\s+/g, '');
  }

  function getEffectiveWorkId(riskData){
    var workId =
      riskData && riskData.workId
        ? riskData.workId
        : '';

    if(!workId){
      try {
        workId =
          new URLSearchParams(
            global.location.search
          ).get('workId') || '';
      } catch(error){
        console.warn(
          '[v3.2.0] URL workId 확인 실패:',
          error
        );
      }
    }

    workId = normalizeId(workId);

    if(riskData && !riskData.workId && workId){
      riskData.workId = workId;
    }

    return workId;
  }

  function getManagementLedgerMatch(riskData){
    if(
      !global.riskWorkDbPatchV310 ||
      typeof global.riskWorkDbPatchV310.findInHistory !== 'function'
    ){
      return null;
    }

    return global.riskWorkDbPatchV310.findInHistory(
      riskData.workName || '',
      getEffectiveWorkId(riskData)
    );
  }

  function isAuthoritativeMatch(match){
    return Boolean(
      match &&
      match.authoritative === true &&
      match.method === 'workId-exact'
    );
  }

  function capRiskLevel(level, maximum){
    var currentOrder = LEVEL_ORDER[level];
    var maximumOrder = LEVEL_ORDER[maximum];

    if(currentOrder === undefined){
      return maximum;
    }

    return currentOrder > maximumOrder
      ? maximum
      : level;
  }

  function higherRisk(first, second){
    var firstOrder = LEVEL_ORDER[first] || 0;
    var secondOrder = LEVEL_ORDER[second] || 0;

    return firstOrder >= secondOrder
      ? first
      : second;
  }

  function getRiskScore(level){
    return LEVEL_SCORE[level] || 0;
  }

  function getCurrentAssessmentText(riskData){
    return [
      riskData.workType || '',
      riskData.workName || '',
      riskData.workDescription || '',
      riskData.workDesc || ''
    ].join(' ');
  }

  function isPureInspection(text){
    return (
      /점검|순찰|육안|외관|측정|판독/.test(text) &&
      !/정비|수리|보수|교체|분해|조립|해체/.test(text)
    );
  }

  function isMaintenanceWork(text){
    return /정비|수리|보수|교체|분해|조립|해체/.test(text);
  }

  function readPolicyInputs(){
    return {
      reviewed: isChecked('highRiskPolicyReviewed'),

      fire: {
        criterionMatched:
          isChecked('hrFireCriterion')
      },

      confined: {
        criterionMatched:
          isChecked('hrConfinedCriterion'),

        shortInspectionException:
          isChecked('hrConfinedShortException'),

        co2FacilityException:
          isChecked('hrConfinedCo2Exception')
      },

      chemical: {
        criterionMatched:
          isChecked('hrChemicalCriterion'),

        reagentException:
          isChecked('hrChemicalReagentException')
      },

      height: {
        criterionMatched:
          isChecked('hrHeightCriterion'),

        protectedPlatformException:
          isChecked('hrHeightPlatformException')
      },

      lifting: {
        criterionMatched:
          isChecked('hrLiftingCriterion'),

        manualChainBlockException:
          isChecked('hrLiftingChainBlockException')
      },

      electrical: {
        criterionMatched:
          isChecked('hrElectricalCriterion'),

        branchBreakerException:
          isChecked('hrElectricalBranchException')
      },

      additionalReason:
        getValue('highRiskAdditionalReason')
    };
  }

  function evaluateInternalPolicy(inputs){
    var categories = [];
    var reasons = [];
    var criteria = [];
    var exceptions = [];

    if(inputs.fire.criterionMatched){
      categories.push('HIGH_RISK_FIRE');

      reasons.push(
        '폭발위험장소, 인화성 액체·가스, 가연성가스·산소 배관 또는 저장설비에서 수행하는 화기작업'
      );

      criteria.push(
        '사내 고위험 화기작업 기준'
      );
    }

    if(inputs.confined.criterionMatched){
      categories.push('CONFINED_SPACE');

      reasons.push(
        '산소결핍 또는 유해가스로 인한 질식 위험이 있는 밀폐공간 작업'
      );

      criteria.push(
        '사내 밀폐공간 고위험작업 기준'
      );

      if(inputs.confined.shortInspectionException){
        exceptions.push({
          category: 'CONFINED_SPACE',
          code: 'CONFINED_SHORT_INSPECTION',
          reason: '10분 이내 단순점검 예외 검토'
        });
      }

      if(inputs.confined.co2FacilityException){
        exceptions.push({
          category: 'CONFINED_SPACE',
          code: 'CONFINED_CO2_CONTROLLED_AREA',
          reason: '강화 운영 중인 이산화탄소 소화설비 방호구역·용기실 예외 검토'
        });
      }
    }

    if(inputs.chemical.criterionMatched){
      categories.push('CORROSIVE_CHEMICAL');

      reasons.push(
        '강산 또는 강염기 등 고부식성 물질의 배관·탱크 수리작업'
      );

      criteria.push(
        '사내 고부식성 유해화학물질 작업 기준'
      );

      if(inputs.chemical.reagentException){
        exceptions.push({
          category: 'CORROSIVE_CHEMICAL',
          code: 'CHEMICAL_REAGENT_EXCEPTION',
          reason: '시험·분석용 시약 사용 예외 검토'
        });
      }
    }

    if(inputs.height.criterionMatched){
      categories.push('HIGH_RISK_HEIGHT');

      reasons.push(
        '5m 이상 지붕·벽체·철골·비계 설치·해체 작업이며 고정식 난간·작업대 없이 임시 추락방지시설에 의존'
      );

      criteria.push(
        '사내 고위험 고소작업 기준'
      );

      if(inputs.height.protectedPlatformException){
        exceptions.push({
          category: 'HIGH_RISK_HEIGHT',
          code: 'HEIGHT_PROTECTED_PLATFORM_EXCEPTION',
          reason: '정규 안전난간을 갖춘 차량탑재형·시저형 고소작업대 예외 검토'
        });
      }
    }

    if(inputs.lifting.criterionMatched){
      categories.push('HIGH_RISK_LIFTING');

      reasons.push(
        '크레인·이동식 크레인·리프트 등 양중기를 이용한 권상 또는 권상물 하부 작업'
      );

      criteria.push(
        '사내 고위험 중량물 취급 작업 기준'
      );

      if(inputs.lifting.manualChainBlockException){
        exceptions.push({
          category: 'HIGH_RISK_LIFTING',
          code: 'LIFTING_MANUAL_CHAIN_BLOCK_EXCEPTION',
          reason: '수동 체인블록 작업 예외 검토'
        });
      }
    }

    if(inputs.electrical.criterionMatched){
      categories.push('HIGH_RISK_ELECTRICAL');

      reasons.push(
        'AC 1,000V 초과·DC 1,500V 초과 전력계통 수리 또는 공장 단위 이상 정전·복전 작업'
      );

      criteria.push(
        '사내 고위험 전기작업 기준'
      );

      if(inputs.electrical.branchBreakerException){
        exceptions.push({
          category: 'HIGH_RISK_ELECTRICAL',
          code: 'ELECTRICAL_BRANCH_BREAKER_EXCEPTION',
          reason: '단독 분기차단기 차단 작업 예외 검토'
        });
      }
    }

    return {
      categories: categories,
      categoryLabels: categories.map(function(code){
        return CATEGORY_LABELS[code] || code;
      }),
      reasons: reasons,
      criteria: criteria,
      exceptions: exceptions,
      hasHighRiskCriterion: categories.length > 0,
      exceptionReviewRequired: exceptions.length > 0
    };
  }

  function updateManagementReference(riskData, match){
    var authoritative =
      isAuthoritativeMatch(match);

    if(!match){
      riskData.managementLedgerReference = {
        matched: false,
        authoritative: false,
        requestedWorkId:
          getEffectiveWorkId(riskData),
        requestedWorkName:
          riskData.workName || '',
        highRiskPriorityApplied: false,
        reviewedAt:
          new Date().toISOString()
      };

      return;
    }

    riskData.managementLedgerReference = {
      matched: true,
      authoritative: authoritative,
      workId: match.workId || '',
      workName: match.workName || '',
      risk: match.risk || '',
      method: match.method || '',
      score: match.score || 0,
      total: match.total || 0,
      candidateCount: match.candidateCount || 0,
      highRiskPriorityApplied: false,
      reviewedAt: new Date().toISOString()
    };
  }

  function rememberAutomaticRisk(riskData){
    var calculatedAt =
      riskData.autoJudgment &&
      riskData.autoJudgment.calculatedAt
        ? riskData.autoJudgment.calculatedAt
        : '';

    if(
      riskData.policyAnalysisCalculatedAt !== calculatedAt
    ){
      riskData.policyOriginalRiskLevel =
        (
          riskData.autoJudgment &&
          riskData.autoJudgment.riskLevel
        ) ||
        riskData.finalRiskLevel ||
        '판정불가';

      riskData.policyAnalysisCalculatedAt =
        calculatedAt;
    }

    return (
      riskData.policyOriginalRiskLevel ||
      riskData.finalRiskLevel ||
      '판정불가'
    );
  }

  function applyInternalHighRiskPolicy(riskData){
    if(!riskData || !riskData.workName){
      return riskData;
    }

    var originalLevel =
      rememberAutomaticRisk(riskData);

    var finalLevel =
      originalLevel;

    var match =
      getManagementLedgerMatch(riskData);

    var authoritative =
      isAuthoritativeMatch(match);

    var inputs =
      readPolicyInputs();

    var policyResult =
      evaluateInternalPolicy(inputs);

    var reasons = [];
    var source = 'internal-policy';
    var applicable = false;
    var status = '비해당';

    updateManagementReference(
      riskData,
      match
    );

    /*
     * 1순위:
     * 관리대장 workId 정확 일치 + 고위험
     */
    if(
      authoritative &&
      match.risk === '고위험'
    ){
      finalLevel = higherRisk(
        originalLevel,
        '고위험'
      );

      applicable = true;
      status = '해당';
      source = 'management-ledger';

      reasons.push(
        originalLevel === '고위험'
          ? '관리대장 고위험 최우선 확인 (기존 등급 동일)'
          : (
              '관리대장 고위험 최우선 적용 (기존: ' +
              originalLevel +
              ')'
            )
      );

      riskData.managementLedgerReference
        .highRiskPriorityApplied = true;

      policyResult.categories = [
        'MANAGEMENT_LEDGER_HIGH_RISK'
      ];

      policyResult.categoryLabels = [
        '관리대장 확정 고위험작업'
      ];

      policyResult.criteria = [
        'workId 정확 일치한 작업관리대장 공식 위험등급'
      ];

    /*
     * 관리대장 일반도 공식 값으로 처리
     */
    } else if(
      authoritative &&
      (
        match.risk === '일반' ||
        match.risk === '일반작업'
      )
    ){
      finalLevel =
        capRiskLevel(
          originalLevel,
          '중위험'
        );

      applicable = false;
      status = '비해당';
      source = 'management-ledger';

      reasons.push(
        '관리대장 일반작업 공식값 확인 · 위험도 상한 중위험'
      );

      policyResult.categories = [];
      policyResult.categoryLabels = [];
      policyResult.criteria = [
        'workId 정확 일치한 작업관리대장 일반작업'
      ];

    /*
     * 신규평가:
     * 사내 고위험 기준 충족
     */
    } else if(
      policyResult.hasHighRiskCriterion
    ){
      finalLevel =
        higherRisk(
          originalLevel,
          '고위험'
        );

      applicable = true;
      source = 'internal-policy';

      status =
        policyResult.exceptionReviewRequired
          ? '예외검토'
          : '해당';

      reasons.push(
        policyResult.exceptionReviewRequired
          ? '사내 고위험작업 기준 충족 · 예외 적용 승인 필요'
          : '신규평가 사내 고위험작업 기준 충족'
      );

    /*
     * 신규평가:
     * 사내 고위험 기준 비해당
     */
    } else {
      var text =
        getCurrentAssessmentText(riskData);

      if(isPureInspection(text)){
        finalLevel = '저위험';

        reasons.push(
          '신규평가 · 순수 점검·순찰·육안·외관·측정·판독 작업'
        );

      } else if(isMaintenanceWork(text)){
        finalLevel = '중위험';

        reasons.push(
          '신규평가 · 일반 수리·정비·교체·분해·조립 작업'
        );

      } else {
        finalLevel =
          capRiskLevel(
            originalLevel,
            '중위험'
          );

        if(finalLevel !== originalLevel){
          reasons.push(
            '신규평가 · 사내 고위험 기준 비해당으로 자동 고위험 판정 제한'
          );
        } else {
          reasons.push(
            '신규평가 · 사내 고위험 기준 비해당'
          );
        }
      }

      applicable = false;
      status = '비해당';
      source = 'internal-policy';
    }

    /*
     * 관리자가 근거를 남기고 직접 조정한 값은 유지한다.
     * 단, 관리대장 고위험보다 낮출 수는 없다.
     */
    if(
      riskData.overridden === true &&
      !(
        authoritative &&
        match.risk === '고위험'
      )
    ){
      finalLevel =
        riskData.finalRiskLevel ||
        finalLevel;

      reasons.push(
        '권한 있는 관리자의 수동 조정값 유지'
      );
    }

    riskData.highRiskWorkAssessment = {
      source: source,
      policyVersion: POLICY_VERSION,
      applicable: applicable,
      categories:
        policyResult.categories.slice(),
      categoryLabels:
        policyResult.categoryLabels.slice(),
      reasons:
        policyResult.reasons.slice(),
      criteria:
        policyResult.criteria.slice(),
      exceptions:
        policyResult.exceptions.slice(),
      exceptionApplied: false,
      exceptionReason: '',
      exceptionReviewRequired:
        policyResult.exceptionReviewRequired,
      systemSuggested:
        source === 'internal-policy',
      status: status,
      assessedBy:
        source === 'management-ledger'
          ? '작업관리대장'
          : (
              riskData.assessor ||
              sessionStorage.getItem('userName') ||
              ''
            ),
      assessedAt:
        new Date().toISOString(),
      reviewedBy: '',
      reviewedAt: '',
      reviewCompleted:
        inputs.reviewed === true,
      inputSnapshot:
        JSON.parse(JSON.stringify(inputs))
    };

    riskData.workSource = {
      type:
        authoritative
          ? 'management-ledger'
          : 'new-assessment',
      authoritative:
        authoritative,
      method:
        authoritative
          ? 'workId-exact'
          : 'internal-policy'
    };

    riskData.finalRiskLevel =
      finalLevel;

    riskData.riskLevel =
      finalLevel;

    riskData.overallRisk =
      finalLevel;

    riskData.riskScore =
      getRiskScore(finalLevel);

    riskData.overrideApplied =
      (
        finalLevel !== originalLevel ||
        (
          authoritative &&
          match &&
          match.risk === '고위험'
        )
      );

    riskData.overrideVersion =
      V;

    riskData.overrideReasons =
      reasons.slice();

    riskData.originalRiskLevel =
      originalLevel;

    riskData.policyDecision = {
      version: V,
      source: source,
      originalRiskLevel: originalLevel,
      finalRiskLevel: finalLevel,
      riskScore: getRiskScore(finalLevel),
      reasons: reasons.slice(),
      calculatedAt: new Date().toISOString()
    };

    renderPolicyResult(
      riskData.highRiskWorkAssessment,
      finalLevel
    );

    console.log(
      '[v3.2.0] 사내 고위험작업 판정 완료:',
      {
        workId:
          getEffectiveWorkId(riskData),
        source: source,
        authoritative: authoritative,
        originalRiskLevel: originalLevel,
        finalRiskLevel: finalLevel,
        highRiskWork:
          riskData.highRiskWorkAssessment
      }
    );

    return riskData;
  }

  function injectPolicyStyle(){
    if(getElement('highRiskPolicyV320Style')){
      return;
    }

    var style =
      document.createElement('style');

    style.id =
      'highRiskPolicyV320Style';

    style.textContent = [
      '.high-risk-policy-section{',
      'border:2px solid var(--posco);',
      'background:var(--card);}',
      '.high-risk-policy-intro{',
      'margin-bottom:12px;padding:12px;',
      'border-left:4px solid var(--posco);',
      'border-radius:0 9px 9px 0;',
      'background:var(--tint);',
      'color:var(--ink);font-size:14px;',
      'font-weight:650;line-height:1.65;}',
      '.high-risk-policy-item{',
      'display:flex;align-items:flex-start;gap:10px;',
      'margin-bottom:9px;padding:12px;',
      'border:1.5px solid var(--line);',
      'border-radius:10px;background:var(--sunk);}',
      '.high-risk-policy-item input{',
      'flex-shrink:0;width:22px;height:22px;',
      'margin-top:2px;accent-color:var(--posco);}',
      '.high-risk-policy-item label{',
      'color:var(--ink);font-size:14px;',
      'font-weight:700;line-height:1.6;cursor:pointer;}',
      '.high-risk-policy-item.exception{',
      'margin-left:20px;background:var(--warn-bg);',
      'border-color:var(--warn);}',
      '.high-risk-policy-review{',
      'margin-top:12px;padding:13px;',
      'border:2px solid var(--done);',
      'border-radius:10px;background:var(--done-bg);}',
      '.high-risk-policy-result{',
      'margin-bottom:9px;padding:13px;',
      'border:2px solid var(--line);',
      'border-radius:13px;background:var(--card);}',
      '.high-risk-policy-result.high{',
      'border-color:var(--stop);background:var(--stop-bg);}',
      '.high-risk-policy-result.normal{',
      'border-color:var(--done);background:var(--done-bg);}',
      '.high-risk-policy-result-title{',
      'font-size:16px;font-weight:900;',
      'color:var(--ink);margin-bottom:6px;}',
      '.high-risk-policy-result-text{',
      'font-size:14px;font-weight:700;',
      'line-height:1.6;color:var(--body);}'
    ].join('');

    document.head.appendChild(style);
  }

  function injectPolicyForm(){
    if(getElement('highRiskPolicySection')){
      return;
    }

    var workTypeSection =
      getElement('workTypeSelect');

    if(!workTypeSection){
      return;
    }

    var parentSection =
      workTypeSection.closest('.form-section');

    if(!parentSection){
      return;
    }

    var section =
      document.createElement('div');

    section.id =
      'highRiskPolicySection';

    section.className =
      'form-section high-risk-policy-section';

    section.innerHTML =
      '<div class="section-title">🚨 사내 고위험작업 기준 확인</div>' +

      '<div class="high-risk-policy-intro">' +
        '관리대장 고위험은 공식값을 우선 적용합니다. ' +
        '신규평가는 아래 사내기준의 실제 작업조건을 확인하여 분류합니다.' +
      '</div>' +

      '<div class="high-risk-policy-item">' +
        '<input type="checkbox" id="hrFireCriterion">' +
        '<label for="hrFireCriterion">' +
          '<strong>고위험 화기작업</strong><br>' +
          '폭발위험장소, 인화성 액체·가스가 존재하는 장소, ' +
          '가연성가스·산소 배관 또는 저장설비에서 화기작업을 수행함' +
        '</label>' +
      '</div>' +

      '<div class="high-risk-policy-item">' +
        '<input type="checkbox" id="hrConfinedCriterion">' +
        '<label for="hrConfinedCriterion">' +
          '<strong>밀폐공간 작업</strong><br>' +
          '산소결핍 또는 유해가스로 인한 질식 위험이 있는 밀폐공간에서 작업함' +
        '</label>' +
      '</div>' +

      '<div class="high-risk-policy-item exception">' +
        '<input type="checkbox" id="hrConfinedShortException">' +
        '<label for="hrConfinedShortException">' +
          '밀폐공간 10분 이내 단순점검 예외 검토 대상' +
        '</label>' +
      '</div>' +

      '<div class="high-risk-policy-item exception">' +
        '<input type="checkbox" id="hrConfinedCo2Exception">' +
        '<label for="hrConfinedCo2Exception">' +
          '강화 운영 중인 CO₂ 소화설비 방호구역·용기실 예외 검토 대상' +
        '</label>' +
      '</div>' +

      '<div class="high-risk-policy-item">' +
        '<input type="checkbox" id="hrChemicalCriterion">' +
        '<label for="hrChemicalCriterion">' +
          '<strong>고부식성 유해화학물질 작업</strong><br>' +
          '황산·질산 등 강산 또는 수산화나트륨 등 강염기의 ' +
          '배관·탱크를 수리함' +
        '</label>' +
      '</div>' +

      '<div class="high-risk-policy-item exception">' +
        '<input type="checkbox" id="hrChemicalReagentException">' +
        '<label for="hrChemicalReagentException">' +
          '시험·분석용 시약 사용 예외 검토 대상' +
        '</label>' +
      '</div>' +

      '<div class="high-risk-policy-item">' +
        '<input type="checkbox" id="hrHeightCriterion">' +
        '<label for="hrHeightCriterion">' +
          '<strong>고위험 고소작업</strong><br>' +
          '5m 이상 지붕·벽체·철골·비계 설치·해체 작업이며, ' +
          '고정식 안전난간·작업대 없이 가설 또는 임시 추락방지시설에 의존함' +
        '</label>' +
      '</div>' +

      '<div class="high-risk-policy-item exception">' +
        '<input type="checkbox" id="hrHeightPlatformException">' +
        '<label for="hrHeightPlatformException">' +
          '정규 안전난간을 갖춘 차량탑재형·시저형 고소작업대 예외 검토 대상' +
        '</label>' +
      '</div>' +

      '<div class="high-risk-policy-item">' +
        '<input type="checkbox" id="hrLiftingCriterion">' +
        '<label for="hrLiftingCriterion">' +
          '<strong>고위험 중량물 취급 작업</strong><br>' +
          '크레인·이동식 크레인·리프트 등 양중기로 중량물을 권상하거나 ' +
          '권상물 하부에서 작업함' +
        '</label>' +
      '</div>' +

      '<div class="high-risk-policy-item exception">' +
        '<input type="checkbox" id="hrLiftingChainBlockException">' +
        '<label for="hrLiftingChainBlockException">' +
          '수동 체인블록만 사용하는 작업의 예외 검토 대상' +
        '</label>' +
      '</div>' +

      '<div class="high-risk-policy-item">' +
        '<input type="checkbox" id="hrElectricalCriterion">' +
        '<label for="hrElectricalCriterion">' +
          '<strong>고위험 전기작업</strong><br>' +
          'AC 1,000V 초과·DC 1,500V 초과 전력계통 수리 또는 ' +
          '공장 단위 이상 정전·복전 작업을 수행함' +
        '</label>' +
      '</div>' +

      '<div class="high-risk-policy-item exception">' +
        '<input type="checkbox" id="hrElectricalBranchException">' +
        '<label for="hrElectricalBranchException">' +
          '단독 분기차단기 차단 작업 예외 검토 대상' +
        '</label>' +
      '</div>' +

      '<div class="form-group">' +
        '<label class="form-label" for="highRiskAdditionalReason">' +
          '추가 판정 근거' +
        '</label>' +
        '<textarea class="form-textarea" ' +
          'id="highRiskAdditionalReason" ' +
          'placeholder="작업 장소, 높이, 전압, 물질, 장비, 작업방법 등 추가 근거"></textarea>' +
      '</div>' +

      '<div class="high-risk-policy-review">' +
        '<div class="high-risk-policy-item" style="margin:0;border:0;background:transparent;padding:0;">' +
          '<input type="checkbox" id="highRiskPolicyReviewed">' +
          '<label for="highRiskPolicyReviewed">' +
            '사내 고위험작업 6개 분류와 예외조건을 모두 확인했습니다.' +
          '</label>' +
        '</div>' +
      '</div>';

    parentSection.insertAdjacentElement(
      'afterend',
      section
    );
  }

  function injectPolicyResult(){
    if(getElement('highRiskPolicyResult')){
      return;
    }

    var judgmentCard =
      getElement('judgmentCard');

    if(!judgmentCard){
      return;
    }

    var result =
      document.createElement('div');

    result.id =
      'highRiskPolicyResult';

    result.className =
      'high-risk-policy-result normal';

    result.style.display =
      'none';

    judgmentCard.insertAdjacentElement(
      'afterend',
      result
    );
  }

  function renderPolicyResult(assessment, finalLevel){
    var container =
      getElement('highRiskPolicyResult');

    if(!container || !assessment){
      return;
    }

    var high =
      assessment.applicable === true;

    var categories =
      Array.isArray(assessment.categoryLabels)
        ? assessment.categoryLabels
        : [];

    var statusText =
      high
        ? (
            assessment.status === '예외검토'
              ? '고위험 후보 · 예외 승인 검토 필요'
              : '고위험작업 해당'
          )
        : '고위험작업 비해당';

    container.className =
      'high-risk-policy-result ' +
      (high ? 'high' : 'normal');

    container.innerHTML =
      '<div class="high-risk-policy-result-title">' +
        (high ? '🚨 ' : '✅ ') +
        statusText +
      '</div>' +

      '<div class="high-risk-policy-result-text">' +
        '판정 출처: ' +
        (
          assessment.source === 'management-ledger'
            ? '작업관리대장 공식값'
            : '사내 고위험작업 기준'
        ) +
        '<br>' +

        '분류: ' +
        (
          categories.length > 0
            ? categories.join(' · ')
            : '해당 없음'
        ) +
        '<br>' +

        '최종 위험도: ' +
        String(finalLevel || '판정불가') +
      '</div>';

    container.style.display =
      'block';
  }

  function installBasicValidationHook(){
    if(
      typeof global.validateBasicInformation !== 'function' ||
      global.validateBasicInformation.__v320Installed
    ){
      return;
    }

    var previous =
      global.validateBasicInformation;

    var wrapped =
      function(){
        var reviewed =
          isChecked('highRiskPolicyReviewed');

        if(!reviewed){
          if(typeof global.showToast === 'function'){
            global.showToast(
              '사내 고위험작업 기준 검토 완료를 확인해 주세요.',
              'danger'
            );
          }

          var section =
            getElement('highRiskPolicySection');

          if(section){
            section.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }

          return;
        }

        return previous.apply(
          this,
          arguments
        );
      };

    wrapped.__v320Installed =
      true;

    wrapped.__previous =
      previous;

    global.validateBasicInformation =
      wrapped;
  }

  function installRenderHook(){
    if(
      typeof global.renderJudgment !== 'function' ||
      global.renderJudgment.__v320Installed
    ){
      return;
    }

    var previous =
      global.renderJudgment;

    var wrapped =
      function(){
        if(global.riskData){
          applyInternalHighRiskPolicy(
            global.riskData
          );
        }

        return previous.apply(
          this,
          arguments
        );
      };

    wrapped.__v320Installed =
      true;

    wrapped.__previous =
      previous;

    global.renderJudgment =
      wrapped;
  }

  function installSaveHook(){
    if(
      typeof global.buildAssessmentSaveObject !== 'function' ||
      global.buildAssessmentSaveObject.__v320Installed
    ){
      return;
    }

    var previous =
      global.buildAssessmentSaveObject;

    var wrapped =
      function(includeServerTimestamp){
        if(global.riskData){
          applyInternalHighRiskPolicy(
            global.riskData
          );
        }

        var saveObject =
          previous.apply(
            this,
            arguments
          );

        var source =
          global.riskData || saveObject;

        var finalLevel =
          source.finalRiskLevel ||
          '판정불가';

        saveObject.finalRiskLevel =
          finalLevel;

        saveObject.riskLevel =
          finalLevel;

        saveObject.overallRisk =
          finalLevel;

        saveObject.riskScore =
          getRiskScore(finalLevel);

        saveObject.overrideApplied =
          source.overrideApplied === true;

        saveObject.overrideVersion =
          V;

        saveObject.overrideReasons =
          Array.isArray(source.overrideReasons)
            ? source.overrideReasons.slice()
            : [];

        saveObject.originalRiskLevel =
          source.originalRiskLevel ||
          finalLevel;

        saveObject.workSource =
          source.workSource
            ? JSON.parse(
                JSON.stringify(source.workSource)
              )
            : null;

        saveObject.highRiskWorkAssessment =
          source.highRiskWorkAssessment
            ? JSON.parse(
                JSON.stringify(
                  source.highRiskWorkAssessment
                )
              )
            : null;

        saveObject.policyDecision =
          source.policyDecision
            ? JSON.parse(
                JSON.stringify(
                  source.policyDecision
                )
              )
            : null;

        saveObject.managementLedgerReference =
          source.managementLedgerReference
            ? JSON.parse(
                JSON.stringify(
                  source.managementLedgerReference
                )
              )
            : null;

        return saveObject;
      };

    wrapped.__v320Installed =
      true;

    wrapped.__previous =
      previous;

    global.buildAssessmentSaveObject =
      wrapped;
  }

  function install(){
    injectPolicyStyle();
    injectPolicyForm();
    injectPolicyResult();
    installBasicValidationHook();
    installRenderHook();
    installSaveHook();

    console.log(
      '[risk-workdb v3.2.0] 사내 고위험작업 분류 적용 완료'
    );
  }

  var api = {
    version: V,
    policyVersion: POLICY_VERSION,
    apply: applyInternalHighRiskPolicy,
    readInputs: readPolicyInputs,
    evaluate: evaluateInternalPolicy,
    install: install,
    categories: Object.assign({}, CATEGORY_LABELS)
  };

  global.riskHighWorkPolicyV320 =
    api;

  if(document.readyState === 'loading'){
    document.addEventListener(
      'DOMContentLoaded',
      install
    );
  } else {
    install();
  }

})(window);
