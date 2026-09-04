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
   risk-workdb-match-patch 확장 v3.0.2
   관리대장(safetyDatabase.workHistory) 최우선 반영
   
   [규칙]
   1) 관리대장 매칭 시 risk === '고위험' → 무조건 고위험
   2) '점검' 키워드 (정비/수리 없음) → 일반작업으로 하향
   3) 관리대장 매칭 시 risk === '일반' → 상한 '중위험'
   4) '정비 + 분해/조립' → 최소 중위험
   
   ※ 훅 지점: buildAssessmentSaveObject (기존 v3.0.0 훅 뒤에 연결)
   ============================================================ */
(function(global){
  'use strict';

  var V = '3.0.2';
  if(global.riskWorkDbPatchV302){ console.log('[v3.0.2] 이미 적용'); return; }

  var LEVEL_ORDER = {
    '일반작업': 0, '저위험': 1, '일반': 1,
    '중위험': 2, '고위험': 3, '매우고위험': 4
  };

  /* ---------- 관리대장 유사 작업 검색 ---------- */
  function findInWorkHistory(workName){
    try {
      var raw = localStorage.getItem('safetyDatabase');
      if(!raw) return null;
      
      var db = JSON.parse(raw);
      var history = db.workHistory || [];
      if(!workName || history.length === 0) return null;

      var keywords = String(workName).replace(/\s+/g,'').match(/[가-힣]{2,}/g) || [];
      if(keywords.length === 0) return null;

      var best = null, bestScore = 0, candidates = [];

      history.forEach(function(w){
        var name = (String(w.workName||'') + String(w.workNameFull||'')).replace(/\s+/g,'');
        var score = 0;
        keywords.forEach(function(kw){ if(name.indexOf(kw) >= 0) score++; });
        if(score > 0) candidates.push({ work: w, score: score });
        if(score > bestScore){ bestScore = score; best = w; }
      });

      var threshold = Math.ceil(keywords.length / 2);
      if(bestScore >= threshold){
        return { work: best, score: bestScore, total: keywords.length, candidateCount: candidates.length };
      }
      return null;
    } catch(e){
      console.warn('[v3.0.2] 관리대장 조회 실패:', e);
      return null;
    }
  }

  /* ---------- 키워드 규칙 ---------- */
  function inferByKeyword(workName, workDescription){
    var text = String(workName || '') + ' ' + String(workDescription || '');
    
    /* 점검 (정비/수리/교체/분해/조립 없을 때) → 일반작업 */
    if(/점검|순찰|육안|외관|측정|판독/.test(text) 
       && !/정비|수리|교체|분해|조립/.test(text)){
      return { level: '일반작업', reason: '점검 작업으로 판정' };
    }
    
    /* 정비 + 분해/조립 → 중위험 */
    if(/정비|수리/.test(text) && /분해|조립/.test(text)){
      return { level: '중위험', reason: '정비-분해/조립 작업' };
    }
    
    return null;
  }

  function capRiskLevel(current, max){
    var ci = LEVEL_ORDER[current], mi = LEVEL_ORDER[max];
    if(ci === undefined || mi === undefined) return current;
    return ci > mi ? max : current;
  }

  /* ---------- 오버라이드 로직 ---------- */
  function overrideDecision(riskData){
    if(!riskData || !riskData.workName) return riskData;

    var workName = riskData.workName;
    var workDescription = riskData.workDescription || '';
    var original = riskData.finalRiskLevel || '';
    var reasons = [];
    var applied = false;

    console.log('[v3.0.2] 판정 시작:', { workName: workName, original: original });

    /* Step 1: 관리대장 매칭 (최우선) */
    var match = findInWorkHistory(workName);
    if(match){
      var mgRisk = String(match.work.risk || '').trim();
      console.log('[v3.0.2] 📋 관리대장 매칭:', 
        match.work.workName, '| risk:', mgRisk,
        '| 점수:', match.score + '/' + match.total,
        '| 후보:', match.candidateCount + '건');

      if(mgRisk === '고위험'){
        if(original !== '고위험'){
          riskData.finalRiskLevel = '고위험';
          reasons.push('관리대장 고위험 분류 최우선 적용 (기존: ' + original + ')');
          applied = true;
        }
      } else if(mgRisk === '일반' || mgRisk === '일반작업'){
        var capped = capRiskLevel(original, '중위험');
        if(capped !== original){
          riskData.finalRiskLevel = capped;
          reasons.push('관리대장 일반 → 상한 중위험 적용 (기존: ' + original + ')');
          applied = true;
        }
      }
    } else {
      console.log('[v3.0.2] 관리대장 매칭 실패');
    }

    /* Step 2: 키워드 규칙 (관리대장 고위험 아닐 때만) */
    if(riskData.finalRiskLevel !== '고위험'){
      var ruled = inferByKeyword(workName, workDescription);
      if(ruled){
        var current = riskData.finalRiskLevel;
        
        if(ruled.level === '일반작업' && LEVEL_ORDER[current] > 0){
          riskData.finalRiskLevel = '일반작업';
          reasons.push(ruled.reason + ' (기존: ' + current + ')');
          applied = true;
        } else if(ruled.level === '중위험' && current !== '중위험'){
          riskData.finalRiskLevel = '중위험';
          reasons.push(ruled.reason + ' (기존: ' + current + ')');
          applied = true;
        }
      }
    }

    /* Step 3: 로깅 및 근거 저장 */
    if(applied){
      riskData.overrideApplied = true;
      riskData.overrideVersion = V;
      riskData.overrideReasons = reasons;
      riskData.originalRiskLevel = original;
      
      console.log('[v3.0.2] ✅ 오버라이드 적용:', original, '→', riskData.finalRiskLevel);
      reasons.forEach(function(r){ console.log('[v3.0.2]   · ' + r); });
    } else {
      console.log('[v3.0.2] 변경 없음:', original);
    }

    return riskData;
  }

  /* ---------- 훅 설치: buildAssessmentSaveObject 감싸기 ---------- */
  function installHook(){
    if(typeof global.buildAssessmentSaveObject !== 'function'){
      setTimeout(installHook, 100);
      return;
    }
    if(global.buildAssessmentSaveObject.__v302Installed) return;

    var previous = global.buildAssessmentSaveObject;

    var wrapped = function(includeServerTimestamp){
      var saveObject = previous.apply(this, arguments);
      
      /* riskData 자체에도 반영 (UI/저장 양쪽 동기화) */
      if(global.riskData){
        overrideDecision(global.riskData);
        /* saveObject 도 갱신 */
        saveObject.finalRiskLevel = global.riskData.finalRiskLevel;
        saveObject.overrideApplied = global.riskData.overrideApplied;
        saveObject.overrideVersion = global.riskData.overrideVersion;
        saveObject.overrideReasons = global.riskData.overrideReasons;
        saveObject.originalRiskLevel = global.riskData.originalRiskLevel;
      } else {
        overrideDecision(saveObject);
      }
      
      return saveObject;
    };

    wrapped.__v302Installed = true;
    wrapped.__previous = previous;
    global.buildAssessmentSaveObject = wrapped;
    
    console.log('[v3.0.2] ✅ buildAssessmentSaveObject 훅 설치 완료');
  }

  /* ---------- 부트 ---------- */
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', installHook);
  } else {
    installHook();
  }

  global.riskWorkDbPatchV302 = {
    version: V,
    override: overrideDecision,
    findInHistory: findInWorkHistory,
    ruleByKeyword: inferByKeyword,
    reinstall: installHook,
    restore: function(){
      if(global.buildAssessmentSaveObject.__v302Installed){
        global.buildAssessmentSaveObject = global.buildAssessmentSaveObject.__previous;
      }
      delete global.riskWorkDbPatchV302;
      console.log('[v3.0.2] 해제 완료');
    }
  };

  console.log('[risk-workdb v3.0.2] 관리대장 최우선 반영 로드 완료');
})(window);

