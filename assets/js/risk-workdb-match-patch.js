/* ============================================================
 * risk-workdb-match-patch.js v2.0.0
 * 위험성평가 작업DB 비차단 검토
 *
 * 원칙
 * - 위험성평가 본체 분석을 먼저 완료
 * - 작업DB는 분석 완료 후 별도로 검토
 * - 핵심 판정 함수를 덮어쓰지 않음
 * - 작업DB 오류가 평가 화면을 막지 않음
 *
 * 작업DB 해석
 * - 고위험: 내부 프로세스를 거친 신뢰 가능한 고위험 분류
 * - 일반: 저위험으로 변환하지 않음
 *
 * 자동 보완
 * - 작업DB 정확 일치 고위험 → 고위험 근거로 반영
 * - 위험성평가 DB 등록 위험도·통제값 → 보조판정
 * - 근거가 충분하면 자동판정
 * - 위험도 또는 통제값이 부족하면 작성자 직접판정에 사전 선택
 * ============================================================ */

(function(global){
  'use strict';

  var PATCH_VERSION = '2.0.0';

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

  function log(){
    var args = Array.prototype.slice.call(arguments);

    args.unshift(
      '[risk-workdb-v2]'
    );

    console.log.apply(
      console,
      args
    );
  }

  function warn(){
    var args = Array.prototype.slice.call(arguments);

    args.unshift(
      '[risk-workdb-v2]'
    );

    console.warn.apply(
      console,
      args
    );
  }

  function escapeHtml(value){
    return String(
      value === undefined ||
      value === null
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
    if(
      typeof global.compactText ===
      'function'
    ){
      return global.compactText(value);
    }

    return String(value || '')
      .toLowerCase()
      .replace(/패널/g, '판넬')
      .replace(/\s+/g, '')
      .replace(/[^0-9a-z가-힣]/g, '');
  }

  function similarity(first, second){
    if(
      typeof global.calculateTextSimilarity ===
      'function'
    ){
      return global.calculateTextSimilarity(
        first,
        second
      );
    }

    var firstText = compact(first);
    var secondText = compact(second);

    if(
      !firstText ||
      !secondText
    ){
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
        Math.min(
          firstText.length,
          secondText.length
        ) /
        Math.max(
          firstText.length,
          secondText.length
        )
      );
    }

    return 0;
  }

  function normalizeRisk(value){
    if(
      global.riskJudgmentPatch &&
      typeof global.riskJudgmentPatch
        .normalizeRiskLevel ===
        'function'
    ){
      return global.riskJudgmentPatch
        .normalizeRiskLevel(value);
    }

    var text = String(value || '')
      .trim()
      .replace(/\s+/g, '');

    if(
      text === '저' ||
      text === '저위험' ||
      text === '낮음'
    ){
      return '저위험';
    }

    if(
      text === '중' ||
      text === '중위험' ||
      text === '보통'
    ){
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
      typeof global.riskJudgmentPatch
        .normalizeControlValue ===
        'function'
    ){
      return global.riskJudgmentPatch
        .normalizeControlValue(value);
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

  function riskOrder(value){
    var order = {
      '저위험': 1,
      '중위험': 2,
      '고위험': 3
    };

    return order[
      normalizeRisk(value)
    ] || 0;
  }

  function controlOrder(value){
    var order = {
      '○': 1,
      '△': 2,
      '×': 3
    };

    return order[
      normalizeControl(value)
    ] || 0;
  }

  function firstValue(object, keys){
    object = object || {};

    for(
      var index = 0;
      index < keys.length;
      index++
    ){
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

  function getWorkId(work){
    var directId = firstValue(
      work,
      [
        'workId',
        'id',
        'docId'
      ]
    );

    if(directId){
      return String(directId);
    }

    var date = firstValue(
      work,
      [
        'date',
        'workDate',
        'startDate'
      ]
    );

    var originalNo = firstValue(
      work,
      [
        'originalNo',
        'workNo',
        'number',
        'no'
      ]
    );

    if(date && originalNo){
      return (
        String(date) +
        '_' +
        String(originalNo)
      );
    }

    return '';
  }

  function getWorkName(work){
    return String(
      firstValue(
        work,
        [
          'workName',
          'workNameFull',
          'name',
          'title'
        ]
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
      [
        'location',
        'locationRaw',
        'permitLocation'
      ]
    );

    if(
      value &&
      typeof value === 'object'
    ){
      return [
        value.factory || '',
        value.line || '',
        value.area || '',
        value.detail || ''
      ]
        .join(' ')
        .trim();
    }

    return String(value || '');
  }

  function getWorkRiskInfo(work){
    var risk = String(
      firstValue(
        work,
        [
          'risk',
          'riskLevel',
          'overallRisk'
        ]
      ) || ''
    ).trim();

    var highRiskFlag =
      work &&
      work.isHighRiskFromSource === true;

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
          : (
              risk === '일반'
                ? '일반'
                : risk
            )
    };
  }

  async function loadWorkDatabase(){
    if(
      Array.isArray(workDatabase) &&
      workDatabase.length > 0
    ){
      return workDatabase;
    }

    if(workDatabaseLoadPromise){
      return workDatabaseLoadPromise;
    }

    workDatabaseState.status = 'loading';
    workDatabaseState.error = '';

    workDatabaseLoadPromise =
      (async function(){
        try {
          if(
            !global.staticDbLoader ||
            typeof global.staticDbLoader.load !==
              'function'
          ){
            throw new Error(
              '정적 DB 로더를 사용할 수 없습니다.'
            );
          }

          var result =
            await global.staticDbLoader.load(
              'workDatabase'
            );

          var payload =
            result && result.data
              ? result.data
              : null;

          var rows =
            Array.isArray(payload)
              ? payload
              : (
                  payload &&
                  Array.isArray(payload.data)
                    ? payload.data
                    : null
                );

          if(!rows){
            throw new Error(
              '작업DB data 배열을 찾을 수 없습니다.'
            );
          }

          if(
            Number(result.count || 0) > 0 &&
            Number(result.count) !==
              rows.length
          ){
            throw new Error(
              '작업DB 건수 불일치: manifest ' +
              result.count +
              '건 / 실제 ' +
              rows.length +
              '건'
            );
          }

          workDatabase = rows.slice();

          workDatabaseState = {
            status: 'loaded',
            source:
              result.source || 'static',
            count:
              workDatabase.length,
            error: '',
            loadedAt:
              new Date().toISOString()
          };

          log(
            '작업DB 준비 완료',
            workDatabaseState
          );

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
            loadedAt:
              new Date().toISOString()
          };

          warn(
            '작업DB 로드 실패 — 본체 평가는 계속됩니다.',
            error
          );

          return [];
        } finally {
          workDatabaseLoadPromise = null;
        }
      })();

    return workDatabaseLoadPromise;
  }

  function calculateMatch(work, current){
    var workId = getWorkId(work);

    if(
      current.workId &&
      workId &&
      String(current.workId) ===
        String(workId)
    ){
      return {
        score: 100,
        method: 'workId-exact',
        reasons: [
          '작업번호 정확 일치'
        ]
      };
    }

    var workDate = String(
      firstValue(
        work,
        [
          'date',
          'workDate',
          'startDate'
        ]
      ) || ''
    );

    var workOriginalNo = String(
      firstValue(
        work,
        [
          'originalNo',
          'workNo'
        ]
      ) || ''
    );

    var combinedId =
      workDate && workOriginalNo
        ? (
            workDate +
            '_' +
            workOriginalNo
          )
        : '';

    if(
      current.workId &&
      combinedId &&
      String(current.workId) ===
        combinedId
    ){
      return {
        score: 98,
        method: 'date-originalNo-exact',
        reasons: [
          '작업일자·원본번호 일치'
        ]
      };
    }

    var score = 0;
    var reasons = [];

    var currentName = String(
      current.workName || ''
    );

    var databaseName =
      getWorkName(work);

    var currentNameKey =
      compact(currentName);

    var databaseNameKey =
      compact(databaseName);

    if(
      currentNameKey &&
      currentNameKey ===
        databaseNameKey
    ){
      score += 60;

      reasons.push(
        '작업명 정확 일치'
      );
    } else {
      var nameScore = Math.round(
        similarity(
          currentName,
          databaseName
        ) * 45
      );

      score += nameScore;

      if(nameScore >= 20){
        reasons.push(
          '작업명 유사'
        );
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
      reasons.push(
        '상세 작업내용 유사'
      );
    }

    var currentCompany =
      compact(current.company);

    var databaseCompany =
      compact(getCompany(work));

    if(
      currentCompany &&
      databaseCompany &&
      currentCompany ===
        databaseCompany
    ){
      score += 10;

      reasons.push(
        '협력사 일치'
      );
    }

    var currentLocation =
      compact(current.location);

    var databaseLocation =
      compact(getLocation(work));

    if(
      currentLocation &&
      databaseLocation &&
      (
        currentLocation ===
          databaseLocation ||
        currentLocation.indexOf(
          databaseLocation
        ) >= 0 ||
        databaseLocation.indexOf(
          currentLocation
        ) >= 0
      )
    ){
      score += 10;

      reasons.push(
        '작업장소 일치'
      );
    }

    return {
      score:
        Math.min(99, score),

      method:
        score >= 80
          ? 'similar-strong'
          : 'similar-candidate',

      reasons: reasons
    };
  }

  function findMatches(){
    if(
      !global.riskData ||
      !Array.isArray(workDatabase)
    ){
      currentMatches = [];
      selectedMatch = null;

      return [];
    }

    var current = {
      workId:
        global.riskData.workId || '',

      workName:
        global.riskData.workName || '',

      workDescription:
        global.riskData
          .workDescription || '',

      company:
        global.riskData.company || '',

      location:
        [
          global.riskData.location || '',
          global.riskData
            .detailLocation || ''
        ]
          .join(' ')
          .trim()
    };

    currentMatches =
      workDatabase
        .map(function(work, index){
          var match =
            calculateMatch(
              work,
              current
            );

          var riskInfo =
            getWorkRiskInfo(work);

          return {
            rowIndex: index,
            workId:
              getWorkId(work),
            workName:
              getWorkName(work),
            company:
              getCompany(work),
            location:
              getLocation(work),
            score:
              match.score,
            method:
              match.method,
            reasons:
              match.reasons,
            riskOriginal:
              riskInfo.original,
            riskLabel:
              riskInfo.label,
            isHighRisk:
              riskInfo.isHigh
          };
        })
        .filter(function(match){
          return match.score >= 60;
        })
        .sort(function(first, second){
          if(
            second.score !== first.score
          ){
            return (
              second.score -
              first.score
            );
          }

          if(
            first.isHighRisk !==
            second.isHighRisk
          ){
            return first.isHighRisk
              ? -1
              : 1;
          }

          return 0;
        })
        .slice(0, 3);

    selectedMatch =
      currentMatches.find(function(match){
        return (
          match.score >= 80
        );
      }) || null;

    return currentMatches;
  }

  function buildRiskDbEvidence(){
    var results =
      Array.isArray(
        global.currentSearchResults
      )
        ? global.currentSearchResults
        : [];

    var riskVotes = {
      '저위험': 0,
      '중위험': 0,
      '고위험': 0
    };

    var controlVotes = {
      '○': 0,
      '△': 0,
      '×': 0
    };

    var validRiskCount = 0;
    var validControlCount = 0;
    var maximumRelevance = 0;

    results.forEach(function(result){
      var relevance = Math.max(
        1,
        Number(result.relevance || 0)
      );

      maximumRelevance = Math.max(
        maximumRelevance,
        relevance
      );

      var item = result.item || {};

      var risk =
        normalizeRisk(
          item.riskLevel
        );

      if(risk){
        riskVotes[risk] += relevance;
        validRiskCount++;
      }

      var control =
        normalizeControl(
          item.controlAdequacy
        );

      if(control){
        controlVotes[control] +=
          relevance;

        validControlCount++;
      }
    });

    function selectVote(votes, orderFunction){
      var selected = '';
      var selectedScore = -1;

      Object.keys(votes)
        .forEach(function(value){
          var score = votes[value];

          if(score > selectedScore){
            selected = value;
            selectedScore = score;
            return;
          }

          if(
            score === selectedScore &&
            orderFunction(value) >
              orderFunction(selected)
          ){
            selected = value;
          }
        });

      return selectedScore > 0
        ? selected
        : '';
    }

    var risk = selectVote(
      riskVotes,
      riskOrder
    );

    var control = selectVote(
      controlVotes,
      controlOrder
    );

    return {
      risk: risk,
      control: control,
      validRiskCount:
        validRiskCount,
      validControlCount:
        validControlCount,
      maximumRelevance:
        maximumRelevance,
      riskVotes:
        riskVotes,
      controlVotes:
        controlVotes
    };
  }

  function selectAuthorRisk(risk){
    if(!risk){
      return;
    }

    var input = document.querySelector(
      'input[name="authorRiskLevel"]' +
      '[value="' +
      risk +
      '"]'
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
      'input[name="authorControlLevel"]' +
      '[value="' +
      control +
      '"]'
    );

    if(input){
      input.checked = true;
    }
  }

  function updateWorkDbReasonCheckbox(
    available
  ){
    var checkbox =
      document.querySelector(
        'input[name="authorReason"]' +
        '[value="WORK_DB_RISK"]'
      );

    if(!checkbox){
      return;
    }

    var label =
      checkbox.closest(
        '.author-reason'
      );

    checkbox.disabled =
      !available;

    if(!available){
      checkbox.checked = false;

      if(label){
        label.style.opacity = '.45';
        label.title =
          '신뢰 가능한 작업DB 위험등급 매칭이 없습니다.';
      }

      return;
    }

    if(label){
      label.style.opacity = '1';
      label.title =
        '작업DB의 실제 매칭 결과가 확인되었습니다.';
    }
  }

  function applyIntegratedDecision(
    riskEvidence
  ){
    if(!global.riskData){
      return;
    }

    var originalAutomaticValid =
      global.riskData
        .automaticJudgmentValid ===
        true;

    var currentRisk =
      normalizeRisk(
        global.riskData
          .finalRiskLevel
      );

    var currentControl =
      normalizeControl(
        global.riskData
          .finalControlAdequacy
      );

    var exactHighRisk =
      Boolean(
        selectedMatch &&
        (
          selectedMatch.method ===
            'workId-exact' ||
          selectedMatch.method ===
            'date-originalNo-exact'
        ) &&
        selectedMatch.isHighRisk
      );

    var suggestedRisk = '';

    var suggestedControl =
      currentControl ||
      riskEvidence.control;

    var method = '';
    var reasons = [];

    if(exactHighRisk){
      suggestedRisk = '고위험';

      method =
        'internal-workdb-high';

      reasons.push(
        '내부 작업DB 고위험 분류와 정확 일치'
      );
    } else if(
      originalAutomaticValid &&
      currentRisk &&
      currentControl
    ){
      /*
       * 기존 자동 매트릭스 결과가 유효하면
       * 그대로 유지합니다.
       */
      suggestedRisk = currentRisk;
      suggestedControl = currentControl;

      method =
        global.riskData
          .judgmentMethod ||
        'auto';

      reasons.push(
        '위험성평가 DB 매트릭스 판정'
      );
    } else if(
      riskEvidence.risk
    ){
      suggestedRisk =
        riskEvidence.risk;

      method =
        'riskdb-registered-fallback';

      reasons.push(
        '위험성평가 DB 등록 위험도 ' +
        riskEvidence.validRiskCount +
        '건 종합'
      );
    }

    if(
      exactHighRisk &&
      currentRisk &&
      riskOrder(currentRisk) >
        riskOrder(suggestedRisk)
    ){
      suggestedRisk =
        currentRisk;
    }

    global.riskData
      .workDatabaseReference =
      selectedMatch
        ? {
            matched: true,
            workId:
              selectedMatch.workId,
            workName:
              selectedMatch.workName,
            method:
              selectedMatch.method,
            score:
              selectedMatch.score,
            riskOriginal:
              selectedMatch.riskOriginal,
            riskLabel:
              selectedMatch.riskLabel,
            isHighRisk:
              selectedMatch.isHighRisk,
            reasons:
              selectedMatch.reasons.slice(),
            source:
              workDatabaseState.source,
            reviewedAt:
              new Date().toISOString()
          }
        : {
            matched: false,
            candidateCount:
              currentMatches.length,
            source:
              workDatabaseState.source,
            reviewedAt:
              new Date().toISOString()
          };

    global.riskData
      .integratedJudgment = {
        suggestedRisk:
          suggestedRisk,
        suggestedControl:
          suggestedControl,
        method:
          method,
        reasons:
          reasons,
        riskDbEvidence:
          riskEvidence,
        workDbHighRiskExact:
          exactHighRisk,
        calculatedAt:
          new Date().toISOString()
      };

    var sufficient =
      Boolean(
        suggestedRisk &&
        suggestedControl
      );

    if(sufficient){
      global.riskData
        .finalRiskLevel =
        suggestedRisk;

      global.riskData
        .finalControlAdequacy =
        suggestedControl;

      global.riskData
        .judgmentMethod =
        method;

      global.riskData
        .automaticJudgmentValid =
        true;

      global.riskData
        .authorJudgmentRequired =
        false;

      if(
        global.riskData
          .autoJudgment
      ){
        global.riskData
          .autoJudgment
          .riskLevel =
          suggestedRisk;

        global.riskData
          .autoJudgment
          .controlAdequacy =
          suggestedControl;

        global.riskData
          .autoJudgment
          .basis =
          reasons.join(' · ');

        global.riskData
          .autoJudgment
          .matrixCalculation =
          method ===
            'internal-workdb-high'
            ? '내부 작업DB 고위험 정확 일치'
            : 'DB 등록값 기반 보조판정';
      }

      updateWorkDbReasonCheckbox(
        exactHighRisk
      );

      return;
    }

    /*
     * 위험도 또는 통제 수준 중 하나만 확보된 경우
     * 작성자 직접판정 화면에 사전 선택합니다.
     */
    global.riskData
      .automaticJudgmentValid =
      false;

    global.riskData
      .authorJudgmentRequired =
      true;

    global.riskData
      .judgmentMethod =
      suggestedRisk
        ? 'integrated-suggestion-pending-author'
        : 'author-direct-required';

    if(suggestedRisk){
      global.riskData
        .databaseFallbackRisk =
        suggestedRisk;

      global.riskData
        .finalRiskLevel =
        suggestedRisk;
    }

    if(suggestedControl){
      global.riskData
        .finalControlAdequacy =
        suggestedControl;
    } else {
      global.riskData
        .finalControlAdequacy =
        '';
    }

    selectAuthorRisk(
      suggestedRisk
    );

    selectAuthorControl(
      suggestedControl
    );

    updateWorkDbReasonCheckbox(
      exactHighRisk
    );
  }

  function sourceLabel(source){
    var labels = {
      pages: 'GitHub Pages',
      raw: 'GitHub Raw',
      indexeddb: 'IndexedDB 캐시',
      static: '정적 DB'
    };

    return (
      labels[source] ||
      source ||
      '확인 불가'
    );
  }

  function matchMethodLabel(method){
    var labels = {
      'workId-exact':
        '작업번호 정확 일치',
      'date-originalNo-exact':
        '작업일자·원본번호 일치',
      'similar-strong':
        '유사 작업 강한 일치',
      'similar-candidate':
        '유사 작업 후보'
    };

    return (
      labels[method] ||
      method ||
      '유사 매칭'
    );
  }

  function injectStyles(){
    if(
      document.getElementById(
        'riskWorkDbV2Style'
      )
    ){
      return;
    }

    var style =
      document.createElement(
        'style'
      );

    style.id =
      'riskWorkDbV2Style';

    style.textContent = [
      '.workdb-v2-panel{',
      'display:none;',
      'margin-bottom:9px;',
      'padding:12px;',
      'border:1.5px solid var(--line);',
      'border-radius:14px;',
      'background:var(--card);',
      'box-shadow:var(--shadow);',
      '}',

      '.workdb-v2-panel.active{',
      'display:block;',
      '}',

      '.workdb-v2-header{',
      'display:flex;',
      'align-items:center;',
      'justify-content:space-between;',
      'gap:8px;',
      'margin-bottom:8px;',
      '}',

      '.workdb-v2-title{',
      'color:var(--posco);',
      'font-size:13px;',
      'font-weight:900;',
      '}',

      '.workdb-v2-source{',
      'padding:3px 7px;',
      'border-radius:6px;',
      'background:var(--tint);',
      'color:var(--posco);',
      'font-size:9px;',
      'font-weight:850;',
      '}',

      '.workdb-v2-card{',
      'margin-bottom:6px;',
      'padding:9px;',
      'border:1px solid var(--line);',
      'border-radius:9px;',
      'background:var(--sunk);',
      '}',

      '.workdb-v2-card.selected{',
      'border-color:var(--done);',
      'background:var(--done-bg);',
      '}',

      '.workdb-v2-name{',
      'margin-bottom:4px;',
      'color:var(--ink);',
      'font-size:11.5px;',
      'font-weight:850;',
      'line-height:1.4;',
      '}',

      '.workdb-v2-meta{',
      'display:flex;',
      'gap:5px;',
      'flex-wrap:wrap;',
      'color:var(--sub);',
      'font-size:9.5px;',
      'font-weight:700;',
      '}',

      '.workdb-v2-risk{',
      'padding:2px 6px;',
      'border-radius:5px;',
      'background:var(--warn-bg);',
      'color:var(--warn);',
      'font-weight:900;',
      '}',

      '.workdb-v2-risk.high{',
      'background:var(--stop-bg);',
      'color:var(--stop);',
      '}',

      '.workdb-v2-note{',
      'margin-top:7px;',
      'color:var(--sub);',
      'font-size:10px;',
      'font-weight:650;',
      'line-height:1.45;',
      '}'
    ].join('');

    document.head.appendChild(style);
  }

  function injectPanel(){
    if(
      document.getElementById(
        'workDbV2Panel'
      )
    ){
      return;
    }

    var authorPanel =
      document.getElementById(
        'authorJudgmentPanel'
      );

    var judgmentCard =
      document.getElementById(
        'judgmentCard'
      );

    if(!judgmentCard){
      return;
    }

    var panel =
      document.createElement(
        'section'
      );

    panel.id =
      'workDbV2Panel';

    panel.className =
      'workdb-v2-panel';

    if(authorPanel){
      authorPanel.parentNode.insertBefore(
        panel,
        authorPanel
      );
    } else {
      judgmentCard.insertAdjacentElement(
        'afterend',
        panel
      );
    }
  }

  function renderPanel(){
    var panel =
      document.getElementById(
        'workDbV2Panel'
      );

    if(!panel){
      return;
    }

    panel.classList.add('active');

    var html =
      '<div class="workdb-v2-header">' +
        '<div class="workdb-v2-title">' +
          '📋 작업DB 검토 결과' +
        '</div>' +
        '<div class="workdb-v2-source">' +
          escapeHtml(
            workDatabaseState.count +
            '건 · ' +
            sourceLabel(
              workDatabaseState.source
            )
          ) +
        '</div>' +
      '</div>';

    if(
      workDatabaseState.status ===
      'error'
    ){
      html +=
        '<div class="workdb-v2-note">' +
          '작업DB 검토에 실패했지만 위험성평가는 정상적으로 계속할 수 있습니다.' +
        '</div>';

      panel.innerHTML = html;
      return;
    }

    if(currentMatches.length === 0){
      html +=
        '<div class="workdb-v2-note">' +
          '현재 작업과 충분히 유사한 작업DB 자료를 찾지 못했습니다.' +
        '</div>';

      panel.innerHTML = html;
      return;
    }

    currentMatches.forEach(
      function(match, index){
        var selected =
          selectedMatch &&
          selectedMatch.rowIndex ===
            match.rowIndex;

        html +=
          '<div class="workdb-v2-card' +
          (
            selected
              ? ' selected'
              : ''
          ) +
          '">' +

            '<div class="workdb-v2-name">' +
              (
                selected
                  ? '✅ '
                  : (
                      index + 1
                    ) +
                    '. '
              ) +
              escapeHtml(
                match.workName ||
                '작업명 없음'
              ) +
            '</div>' +

            '<div class="workdb-v2-meta">' +
              '<span>' +
                escapeHtml(
                  matchMethodLabel(
                    match.method
                  )
                ) +
              '</span>' +

              '<span>일치도 ' +
                escapeHtml(
                  match.score
                ) +
                '점</span>' +

              '<span class="workdb-v2-risk' +
                (
                  match.isHighRisk
                    ? ' high'
                    : ''
                ) +
              '">' +
                '내부 분류 ' +
                escapeHtml(
                  match.riskLabel ||
                  '미분류'
                ) +
              '</span>' +
            '</div>' +

          '</div>';
      }
    );

    if(
      selectedMatch &&
      selectedMatch.isHighRisk &&
      (
        selectedMatch.method ===
          'workId-exact' ||
        selectedMatch.method ===
          'date-originalNo-exact'
      )
    ){
      html +=
        '<div class="workdb-v2-note">' +
          '내부 프로세스를 거친 고위험 작업과 정확히 일치하여 고위험 근거로 반영했습니다.' +
        '</div>';
    } else {
      html +=
        '<div class="workdb-v2-note">' +
          '작업DB의 일반 분류는 저위험을 의미하지 않으며, 위험성평가 DB와 함께 참고합니다.' +
        '</div>';
    }

    panel.innerHTML = html;
  }

  async function reviewCurrentAssessment(){
    var token =
      ++currentReviewToken;

    if(
      !global.riskData ||
      !global.riskData.workName
    ){
      return;
    }

    injectPanel();

    var panel =
      document.getElementById(
        'workDbV2Panel'
      );

    if(panel){
      panel.classList.add('active');

      panel.innerHTML =
        '<div class="workdb-v2-header">' +
          '<div class="workdb-v2-title">' +
            '📋 작업DB 검토 결과' +
          '</div>' +
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

    var riskEvidence =
      buildRiskDbEvidence();

    applyIntegratedDecision(
      riskEvidence
    );

    renderPanel();

    /*
     * 여기서 기존 renderJudgment 함수를 덮어쓰지 않습니다.
     * 한 번만 호출하여 변경된 결과를 화면에 반영합니다.
     */
    if(
      typeof global.renderJudgment ===
      'function'
    ){
      global.renderJudgment();
    }

    if(
      global.riskJudgmentPatch &&
      typeof global.riskJudgmentPatch
        .renderAuthorJudgmentPanel ===
        'function'
    ){
      global.riskJudgmentPatch
        .renderAuthorJudgmentPanel();
    }

    log(
      '비차단 작업DB 검토 완료',
      {
        selected:
          selectedMatch,
        evidence:
          riskEvidence,
        finalRisk:
          global.riskData
            .finalRiskLevel,
        control:
          global.riskData
            .finalControlAdequacy,
        method:
          global.riskData
            .judgmentMethod
      }
    );
  }

  /*
   * initializeStepTwo 하나만 감쌉니다.
   *
   * 원본 initializeStepTwo가 위험성평가 분석과 렌더링을
   * 모두 완료한 후 작업DB 검토를 별도 실행합니다.
   *
   * reviewCurrentAssessment를 await하지 않으므로
   * 작업DB 때문에 화면이 멈추지 않습니다.
   */
  var originalInitializeStepTwo =
    global.initializeStepTwo;

  if(
    typeof originalInitializeStepTwo ===
    'function'
  ){
    global.initializeStepTwo =
      async function(){
        var result =
          await originalInitializeStepTwo
            .apply(
              this,
              arguments
            );

        Promise.resolve()
          .then(function(){
            return reviewCurrentAssessment();
          })
          .catch(function(error){
            warn(
              '작업DB 보조 검토 실패 — 본체 평가는 계속됩니다.',
              error
            );
          });

        return result;
      };
  }

  /*
   * 저장 객체에 작업DB 검토 근거를 보존합니다.
   * 판정 및 화면 함수에는 영향을 주지 않습니다.
   */
  var originalBuildAssessmentSaveObject =
    global.buildAssessmentSaveObject;

  if(
    typeof originalBuildAssessmentSaveObject ===
    'function'
  ){
    global.buildAssessmentSaveObject =
      function(includeServerTimestamp){
        var saveObject =
          originalBuildAssessmentSaveObject(
            includeServerTimestamp
          );

        saveObject.workDatabaseReference =
          global.riskData &&
          global.riskData
            .workDatabaseReference
            ? JSON.parse(
                JSON.stringify(
                  global.riskData
                    .workDatabaseReference
                )
              )
            : null;

        saveObject.integratedJudgment =
          global.riskData &&
          global.riskData
            .integratedJudgment
            ? JSON.parse(
                JSON.stringify(
                  global.riskData
                    .integratedJudgment
                )
              )
            : null;

        saveObject.workDatabaseState = {
          source:
            workDatabaseState.source,
          count:
            workDatabaseState.count,
          loadedAt:
            workDatabaseState.loadedAt
        };

        return saveObject;
      };
  }

  document.addEventListener(
    'DOMContentLoaded',
    function(){
      injectStyles();
      injectPanel();

      log(
        'v' +
        PATCH_VERSION +
        ' 적용 완료 — 비차단 방식'
      );
    }
  );

  global.riskWorkDbMatchPatch = {
    version:
      PATCH_VERSION,

    review:
      reviewCurrentAssessment,

    load:
      loadWorkDatabase,

    getState:
      function(){
        return {
          database:
            Object.assign(
              {},
              workDatabaseState
            ),

          selected:
            selectedMatch
              ? Object.assign(
                  {},
                  selectedMatch
                )
              : null,

          matches:
            currentMatches.map(
              function(match){
                return Object.assign(
                  {},
                  match
                );
              }
            )
        };
      }
  };

  log(
    'v' +
    PATCH_VERSION +
    ' loaded'
  );

})(window);
