/* ============================================================
 * risk-workdb-match-patch.js v1.0.0
 * 위험성평가 작업DB 실제 매칭 보완
 *
 * 전제:
 * 1. db-loader.js가 먼저 로드되어 있어야 함
 * 2. 위험성평가_v2.html 본체가 먼저 실행되어 있어야 함
 * 3. risk-judgment-patch.js가 먼저 로드되어 있어야 함
 *
 * 적용:
 * - 정적 작업DB 735건 로드
 * - workId 정확 일치
 * - 작업명·유형·설명·회사·장소 유사 매칭
 * - 실제 매칭 결과 화면 표시
 * - 작업DB 위험등급을 작성자 직접판정 참고값으로 제공
 * - 저장 객체에 workDatabaseReference 추가
 * ============================================================ */

(function(global){
  'use strict';

  var PATCH_VERSION = '1.0.0';

  var STRONG_MATCH_SCORE = 80;
  var CANDIDATE_MATCH_SCORE = 60;
  var MAX_VISIBLE_MATCHES = 3;

  var workDatabase = [];

  var workDatabaseState = {
    status: 'idle',
    source: '',
    count: 0,
    error: '',
    loadedAt: ''
  };

  var workDatabaseLoadPromise = null;
  var currentWorkDatabaseMatches = [];
  var selectedWorkDatabaseMatch = null;

  function log(){
    var args =
      Array.prototype.slice.call(
        arguments
      );

    args.unshift(
      '[risk-workdb-match]'
    );

    console.log.apply(
      console,
      args
    );
  }

  function warn(){
    var args =
      Array.prototype.slice.call(
        arguments
      );

    args.unshift(
      '[risk-workdb-match]'
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

  function normalizeText(value){
    if(
      typeof global.normalizeText ===
      'function'
    ){
      return global.normalizeText(value);
    }

    return String(value || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function compactText(value){
    if(
      typeof global.compactText ===
      'function'
    ){
      return global.compactText(value);
    }

    return normalizeText(value)
      .replace(/[^0-9a-z가-힣]/g, '');
  }

  function calculateSimilarity(
    first,
    second
  ){
    if(
      typeof global
        .calculateTextSimilarity ===
      'function'
    ){
      return global
        .calculateTextSimilarity(
          first,
          second
        );
    }

    var firstText =
      compactText(first);

    var secondText =
      compactText(second);

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

  function normalizeRiskLevel(value){
    if(
      global.riskJudgmentPatch &&
      typeof global
        .riskJudgmentPatch
        .normalizeRiskLevel ===
        'function'
    ){
      return global
        .riskJudgmentPatch
        .normalizeRiskLevel(value);
    }

    var raw =
      String(value || '')
        .trim()
        .replace(/\s+/g, '');

    if(
      raw === '저' ||
      raw === '저위험' ||
      raw === '낮음'
    ){
      return '저위험';
    }

    if(
      raw === '중' ||
      raw === '중위험' ||
      raw === '보통'
    ){
      return '중위험';
    }

    if(
      raw === '고' ||
      raw === '고위험' ||
      raw === '높음' ||
      raw === '매우고위험' ||
      raw === '매우높음'
    ){
      return '고위험';
    }

    return '';
  }

  function getRiskOrder(value){
    var order = {
      '저위험': 1,
      '중위험': 2,
      '고위험': 3
    };

    return (
      order[
        normalizeRiskLevel(value)
      ] || 0
    );
  }

  function getHigherRisk(
    first,
    second
  ){
    var firstRisk =
      normalizeRiskLevel(first);

    var secondRisk =
      normalizeRiskLevel(second);

    if(!firstRisk){
      return secondRisk;
    }

    if(!secondRisk){
      return firstRisk;
    }

    return (
      getRiskOrder(secondRisk) >
      getRiskOrder(firstRisk)
        ? secondRisk
        : firstRisk
    );
  }

  function firstValue(
    object,
    keys
  ){
    object = object || {};

    for(
      var index = 0;
      index < keys.length;
      index++
    ){
      var value =
        object[keys[index]];

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

  function getWorkName(work){
    return firstValue(
      work,
      [
        'workName',
        'workNameFull',
        'name',
        'title',
        '작업명'
      ]
    );
  }

  function getWorkDescription(work){
    return firstValue(
      work,
      [
        'workDescription',
        'workDetail',
        'description',
        'workDesc',
        'safety',
        'detail',
        '작업내용',
        '상세내용'
      ]
    );
  }

  function getWorkType(work){
    return firstValue(
      work,
      [
        'workType',
        'type',
        'category',
        '작업유형',
        '작업분류'
      ]
    );
  }

  function getWorkCompany(work){
    return firstValue(
      work,
      [
        'company',
        'companyName',
        'contractorCompany',
        'vendor',
        '협력사'
      ]
    );
  }

  function getWorkLocation(work){
    var location =
      firstValue(
        work,
        [
          'location',
          'workLocation',
          'place',
          'factory',
          '작업장소'
        ]
      );

    if(
      location &&
      typeof location === 'object'
    ){
      return [
        location.factory || '',
        location.line || '',
        location.area || '',
        location.detail || ''
      ]
        .join(' ')
        .trim();
    }

    return String(location || '');
  }

  function getWorkDate(work){
    return String(
      firstValue(
        work,
        [
          'date',
          'workDate',
          'startDate',
          '작업일'
        ]
      ) || ''
    );
  }

  function getWorkOriginalNumber(work){
    return String(
      firstValue(
        work,
        [
          'originalNo',
          'workNo',
          'number',
          'no'
        ]
      ) || ''
    );
  }

  function getWorkId(work){
    var directId =
      firstValue(
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

    var date =
      getWorkDate(work);

    var originalNumber =
      getWorkOriginalNumber(work);

    if(date && originalNumber){
      return (
        date +
        '_' +
        originalNumber
      );
    }

    return '';
  }

  function getWorkRisk(work){
    var original =
      firstValue(
        work,
        [
          'riskLevel',
          'risk',
          'overallRisk',
          'riskGrade',
          '위험등급',
          '위험도'
        ]
      );

    return {
      original:
        String(original || '').trim(),

      normalized:
        normalizeRiskLevel(original)
    };
  }

  async function loadWorkDatabase(
    forceRefresh
  ){
    if(
      workDatabaseLoadPromise &&
      !forceRefresh
    ){
      return workDatabaseLoadPromise;
    }

    workDatabaseLoadPromise =
      (async function(){
        workDatabaseState.status =
          'loading';

        workDatabaseState.error = '';

        try {
          if(
            !global.staticDbLoader ||
            typeof global
              .staticDbLoader
              .load !== 'function'
          ){
            throw new Error(
              '정적 DB 로더를 사용할 수 없습니다.'
            );
          }

          var result =
            await global.staticDbLoader.load(
              'workDatabase',
              {
                forceRefresh:
                  Boolean(forceRefresh)
              }
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
              '작업DB 정적 JSON의 data 배열을 찾을 수 없습니다.'
            );
          }

          var manifestCount =
            Number(result.count || 0);

          if(
            manifestCount > 0 &&
            manifestCount !== rows.length
          ){
            throw new Error(
              '작업DB manifest 건수와 실제 건수가 다릅니다. manifest: ' +
              manifestCount +
              ', 실제: ' +
              rows.length
            );
          }

          workDatabase =
            rows.slice();

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
            '✅ 작업DB 로드 완료',
            {
              source:
                workDatabaseState.source,
              count:
                workDatabase.length,
              filename:
                result.filename,
              sha256:
                result.sha256
            }
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

          console.error(
            '[risk-workdb-match] 작업DB 로드 실패:',
            error
          );

          return [];
        }
      })();

    try {
      return await workDatabaseLoadPromise;
    } finally {
      workDatabaseLoadPromise = null;
    }
  }

  function calculateWorkMatch(
    work,
    current
  ){
    var workId =
      getWorkId(work);

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

    var score = 0;
    var reasons = [];

    var workName =
      String(getWorkName(work) || '');

    var currentName =
      String(current.workName || '');

    var nameSimilarity =
      calculateSimilarity(
        currentName,
        workName
      );

    if(
      compactText(currentName) &&
      compactText(currentName) ===
        compactText(workName)
    ){
      score += 55;

      reasons.push(
        '작업명 정확 일치'
      );
    } else {
      var nameScore =
        Math.round(
          nameSimilarity * 40
        );

      score += nameScore;

      if(nameScore >= 20){
        reasons.push(
          '작업명 유사'
        );
      }
    }

    var currentType =
      String(current.workType || '');

    var workType =
      String(getWorkType(work) || '');

    if(
      compactText(currentType) &&
      compactText(currentType) ===
        compactText(workType)
    ){
      score += 15;

      reasons.push(
        '작업유형 일치'
      );
    } else if(
      currentType &&
      workType &&
      calculateSimilarity(
        currentType,
        workType
      ) >= 0.6
    ){
      score += 9;

      reasons.push(
        '작업유형 유사'
      );
    }

    var descriptionSimilarity =
      calculateSimilarity(
        current.workDescription || '',
        getWorkDescription(work)
      );

    var descriptionScore =
      Math.round(
        descriptionSimilarity * 15
      );

    score += descriptionScore;

    if(descriptionScore >= 7){
      reasons.push(
        '작업내용 유사'
      );
    }

    var currentCompany =
      compactText(
        current.company || ''
      );

    var workCompany =
      compactText(
        getWorkCompany(work)
      );

    if(
      currentCompany &&
      workCompany &&
      currentCompany === workCompany
    ){
      score += 10;

      reasons.push(
        '협력사 일치'
      );
    }

    var currentLocation =
      compactText(
        current.location || ''
      );

    var workLocation =
      compactText(
        getWorkLocation(work)
      );

    if(
      currentLocation &&
      workLocation &&
      (
        currentLocation ===
          workLocation ||
        currentLocation.indexOf(
          workLocation
        ) >= 0 ||
        workLocation.indexOf(
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
        score >= STRONG_MATCH_SCORE
          ? 'similar-strong'
          : 'similar-candidate',

      reasons:
        reasons
    };
  }

  function findWorkDatabaseMatches(){
    if(
      !global.riskData ||
      !Array.isArray(workDatabase)
    ){
      currentWorkDatabaseMatches = [];
      selectedWorkDatabaseMatch = null;

      return [];
    }

    var current = {
      workId:
        global.riskData.workId || '',

      workName:
        global.riskData.workName || '',

      workType:
        global.riskData.workType || '',

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

    var matches =
      workDatabase
        .map(function(work, index){
          var match =
            calculateWorkMatch(
              work,
              current
            );

          var risk =
            getWorkRisk(work);

          return {
            index:
              index,

            work:
              work,

            workId:
              getWorkId(work),

            workName:
              String(
                getWorkName(work) || ''
              ),

            workType:
              String(
                getWorkType(work) || ''
              ),

            company:
              String(
                getWorkCompany(work) || ''
              ),

            location:
              String(
                getWorkLocation(work) || ''
              ),

            sourceRiskLevel:
              risk.original,

            normalizedRiskLevel:
              risk.normalized,

            score:
              match.score,

            method:
              match.method,

            reasons:
              match.reasons
          };
        })
        .filter(function(match){
          return (
            match.score >=
            CANDIDATE_MATCH_SCORE
          );
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

          return (
            getRiskOrder(
              second.normalizedRiskLevel
            ) -
            getRiskOrder(
              first.normalizedRiskLevel
            )
          );
        })
        .slice(
          0,
          MAX_VISIBLE_MATCHES
        );

    currentWorkDatabaseMatches =
      matches;

    selectedWorkDatabaseMatch =
      matches.find(function(match){
        return (
          match.score >=
            STRONG_MATCH_SCORE &&
          Boolean(
            match.normalizedRiskLevel
          )
        );
      }) || null;

    global.riskData
      .workDatabaseReference =
      selectedWorkDatabaseMatch
        ? {
            matched: true,

            method:
              selectedWorkDatabaseMatch
                .method,

            score:
              selectedWorkDatabaseMatch
                .score,

            workId:
              selectedWorkDatabaseMatch
                .workId,

            workName:
              selectedWorkDatabaseMatch
                .workName,

            workType:
              selectedWorkDatabaseMatch
                .workType,

            sourceRiskLevel:
              selectedWorkDatabaseMatch
                .sourceRiskLevel,

            normalizedRiskLevel:
              selectedWorkDatabaseMatch
                .normalizedRiskLevel,

            reasons:
              selectedWorkDatabaseMatch
                .reasons.slice(),

            source:
              workDatabaseState.source,

            matchedAt:
              new Date().toISOString()
          }
        : {
            matched: false,
            source:
              workDatabaseState.source,
            candidateCount:
              matches.length,
            matchedAt:
              new Date().toISOString()
          };

    log(
      '작업DB 매칭 결과',
      {
        selected:
          selectedWorkDatabaseMatch,
        candidates:
          currentWorkDatabaseMatches
      }
    );

    return matches;
  }

  function applyWorkDatabaseJudgment(){
    if(
      !global.riskData ||
      !selectedWorkDatabaseMatch
    ){
      return;
    }

    var workRisk =
      selectedWorkDatabaseMatch
        .normalizedRiskLevel;

    if(!workRisk){
      return;
    }

    var automaticValid =
      global.riskData
        .automaticJudgmentValid ===
        true;

    var automaticRisk =
      normalizeRiskLevel(
        global.riskData
          .finalRiskLevel
      );

    /*
     * 자동판정이 없는 경우 작업DB 위험도를
     * 작성자 직접판정의 사전 추천값으로 제공합니다.
     */
    if(!automaticValid){
      var existingFallback =
        normalizeRiskLevel(
          global.riskData
            .databaseFallbackRisk
        );

      var suggestedRisk =
        getHigherRisk(
          existingFallback,
          workRisk
        );

      global.riskData
        .databaseFallbackRisk =
        suggestedRisk;

      global.riskData
        .workDatabaseFallbackRisk =
        workRisk;

      global.riskData
        .authorJudgmentRequired =
        true;

      global.riskData
        .judgmentMethod =
        existingFallback
          ? 'combined-fallback-pending-author'
          : 'workdb-fallback-pending-author';

      global.riskData
        .finalRiskLevel =
        suggestedRisk;

      global.riskData
        .finalControlAdequacy =
        '';

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
          .matrixCalculation =
          '작성자 판단 필요';

        global.riskData
          .autoJudgment
          .basis =
          '유효한 자동 매트릭스 판정이 없어 작업DB 기존 위험등급을 참고값으로 제시했습니다. 작성자의 현장 확인이 필요합니다.';
      }

      return;
    }

    /*
     * 자동판정과 작업DB 위험등급이 다르면
     * 작성자가 최종 결과를 확인하도록 합니다.
     */
    if(
      automaticRisk &&
      automaticRisk !== workRisk
    ){
      global.riskData
        .authorJudgmentRequired =
        true;

      global.riskData
        .databaseFallbackRisk =
        getHigherRisk(
          automaticRisk,
          workRisk
        );

      global.riskData
        .workDatabaseFallbackRisk =
        workRisk;

      global.riskData
        .judgmentMethod =
        'auto-workdb-conflict-pending-author';

      if(
        global.riskData
          .autoJudgment
      ){
        global.riskData
          .autoJudgment
          .basis =
          (
            global.riskData
              .autoJudgment
              .basis || ''
          ) +
          ' · 작업DB 기존 위험등급(' +
          workRisk +
          ')과 차이가 있어 작성자 확인이 필요합니다.';
      }

      return;
    }

    /*
     * 자동판정과 작업DB가 같으면
     * 자동판정을 그대로 유지합니다.
     */
    global.riskData
      .workDatabaseFallbackRisk =
      workRisk;
  }

  function injectStyles(){
    if(
      document.getElementById(
        'workDatabaseMatchPatchStyle'
      )
    ){
      return;
    }

    var style =
      document.createElement(
        'style'
      );

    style.id =
      'workDatabaseMatchPatchStyle';

    style.textContent = [
      '.workdb-review-panel{',
      'display:none;',
      'margin-bottom:9px;',
      'padding:12px;',
      'border:1.5px solid var(--line);',
      'border-radius:14px;',
      'background:var(--card);',
      'box-shadow:var(--shadow);',
      '}',

      '.workdb-review-panel.active{',
      'display:block;',
      '}',

      '.workdb-review-title{',
      'display:flex;',
      'align-items:center;',
      'justify-content:space-between;',
      'gap:8px;',
      'margin-bottom:8px;',
      'color:var(--posco);',
      'font-size:13px;',
      'font-weight:900;',
      '}',

      '.workdb-source-badge{',
      'padding:3px 7px;',
      'border-radius:6px;',
      'background:var(--tint);',
      'color:var(--posco);',
      'font-size:9px;',
      'font-weight:850;',
      '}',

      '.workdb-match-card{',
      'margin-bottom:6px;',
      'padding:9px;',
      'border:1px solid var(--line);',
      'border-radius:9px;',
      'background:var(--sunk);',
      '}',

      '.workdb-match-card.strong{',
      'border-color:var(--done);',
      'background:var(--done-bg);',
      '}',

      '.workdb-match-name{',
      'margin-bottom:4px;',
      'color:var(--ink);',
      'font-size:11.5px;',
      'font-weight:850;',
      'line-height:1.4;',
      '}',

      '.workdb-match-meta{',
      'display:flex;',
      'gap:5px;',
      'flex-wrap:wrap;',
      'color:var(--sub);',
      'font-size:9.5px;',
      'font-weight:700;',
      '}',

      '.workdb-risk-badge{',
      'padding:2px 6px;',
      'border-radius:5px;',
      'background:var(--warn-bg);',
      'color:var(--warn);',
      'font-weight:900;',
      '}',

      '.workdb-match-note{',
      'margin-top:7px;',
      'color:var(--sub);',
      'font-size:10px;',
      'font-weight:650;',
      'line-height:1.45;',
      '}',

      '.workdb-no-match{',
      'padding:9px;',
      'border-radius:8px;',
      'background:var(--sunk);',
      'color:var(--sub);',
      'font-size:10.5px;',
      'font-weight:700;',
      'line-height:1.45;',
      '}'
    ].join('');

    document.head.appendChild(style);
  }

  function injectWorkDatabasePanel(){
    if(
      document.getElementById(
        'workDatabaseReviewPanel'
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
      'workDatabaseReviewPanel';

    panel.className =
      'workdb-review-panel';

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

  function getMatchMethodLabel(method){
    var labels = {
      'workId-exact':
        '작업번호 정확 일치',

      'similar-strong':
        '유사 작업 강한 일치',

      'similar-candidate':
        '유사 작업 후보'
    };

    return labels[method] ||
      method ||
      '유사 매칭';
  }

  function renderWorkDatabasePanel(){
    var panel =
      document.getElementById(
        'workDatabaseReviewPanel'
      );

    if(!panel){
      return;
    }

    /*
     * 2단계 분석을 진행했을 때만 표시합니다.
     */
    var hasAssessmentInput =
      Boolean(
        global.riskData &&
        (
          global.riskData.workName ||
          global.riskData.workId
        )
      );

    panel.classList.toggle(
      'active',
      hasAssessmentInput
    );

    if(!hasAssessmentInput){
      return;
    }

    var sourceLabels = {
      pages: 'GitHub Pages',
      raw: 'GitHub Raw',
      indexeddb: 'IndexedDB 캐시',
      static: '정적 DB'
    };

    var sourceLabel =
      sourceLabels[
        workDatabaseState.source
      ] ||
      workDatabaseState.source ||
      '확인 불가';

    var html =
      '<div class="workdb-review-title">' +
        '<span>📋 작업DB 검토 결과</span>' +
        '<span class="workdb-source-badge">' +
          escapeHtml(
            workDatabaseState.count +
            '건 · ' +
            sourceLabel
          ) +
        '</span>' +
      '</div>';

    if(
      workDatabaseState.status ===
      'error'
    ){
      html +=
        '<div class="workdb-no-match">' +
          '작업DB를 불러오지 못했습니다.<br>' +
          escapeHtml(
            workDatabaseState.error
          ) +
        '</div>';

      panel.innerHTML = html;
      updateWorkDatabaseReasonOption();

      return;
    }

    if(
      currentWorkDatabaseMatches.length ===
      0
    ){
      html +=
        '<div class="workdb-no-match">' +
          '현재 작업과 충분히 유사한 작업DB 자료를 찾지 못했습니다. ' +
          '작업DB 위험등급은 직접판정 근거로 사용되지 않습니다.' +
        '</div>';

      panel.innerHTML = html;
      updateWorkDatabaseReasonOption();

      return;
    }

    currentWorkDatabaseMatches
      .forEach(function(match, index){
        var strong =
          selectedWorkDatabaseMatch &&
          match.index ===
            selectedWorkDatabaseMatch.index;

        html +=
          '<div class="workdb-match-card' +
          (
            strong
              ? ' strong'
              : ''
          ) +
          '">' +

            '<div class="workdb-match-name">' +
              (
                strong
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

            '<div class="workdb-match-meta">' +
              '<span>' +
                escapeHtml(
                  getMatchMethodLabel(
                    match.method
                  )
                ) +
              '</span>' +

              '<span>일치도 ' +
                escapeHtml(match.score) +
                '점</span>' +

              (
                match.normalizedRiskLevel
                  ? (
                      '<span class="workdb-risk-badge">' +
                        '기존 위험등급 ' +
                        escapeHtml(
                          match.normalizedRiskLevel
                        ) +
                      '</span>'
                    )
                  : (
                      '<span>위험등급 없음</span>'
                    )
              ) +
            '</div>' +

          '</div>';
      });

    if(selectedWorkDatabaseMatch){
      html +=
        '<div class="workdb-match-note">' +
          '초록색 자료가 작업DB의 주요 참고자료입니다. ' +
          '기존 위험등급은 자동 확정값이 아니며 작성자가 현장조건과 통제 수준을 확인해 최종 판단해야 합니다.' +
        '</div>';
    } else {
      html +=
        '<div class="workdb-match-note">' +
          '유사 후보는 확인되었지만 80점 이상의 강한 일치 자료가 없어 작업DB 위험등급을 자동 참고값으로 적용하지 않았습니다.' +
        '</div>';
    }

    panel.innerHTML = html;

    updateWorkDatabaseReasonOption();
  }

  function updateWorkDatabaseReasonOption(){
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

    var available =
      Boolean(
        selectedWorkDatabaseMatch &&
        selectedWorkDatabaseMatch
          .normalizedRiskLevel
      );

    checkbox.disabled =
      !available;

    if(!available){
      checkbox.checked = false;

      if(label){
        label.style.opacity = '.45';
        label.title =
          '80점 이상의 작업DB 위험등급 매칭 자료가 없습니다.';
      }

      return;
    }

    if(label){
      label.style.opacity = '1';
      label.title =
        '실제 작업DB 매칭 결과가 확인되었습니다.';
    }

    /*
     * 작업DB fallback 또는 충돌 확인 상태에서는
     * 실제 참고 근거이므로 자동 선택합니다.
     */
    if(
      global.riskData &&
      (
        global.riskData.judgmentMethod ===
          'workdb-fallback-pending-author' ||
        global.riskData.judgmentMethod ===
          'combined-fallback-pending-author' ||
        global.riskData.judgmentMethod ===
          'auto-workdb-conflict-pending-author'
      )
    ){
      checkbox.checked = true;
    }
  }

  /*
   * 위험성평가 본체 분석을 작업DB 로드 때문에 지연시키지 않습니다.
   *
   * 1. 위험성평가 DB 분석과 화면 렌더링을 먼저 수행
   * 2. 작업DB는 별도로 로드
   * 3. 작업DB 로드 완료 후 매칭 결과만 추가 반영
   * 4. 작업DB 오류가 발생해도 본체 분석은 계속 진행
   */
  var originalRunAssessmentAnalysis =
    global.runAssessmentAnalysis;

  if(
    typeof originalRunAssessmentAnalysis ===
    'function'
  ){
    global.runAssessmentAnalysis =
      async function(){
        var context = this;
        var args = arguments;

        /*
         * 본체 위험성평가 분석을 우선 완료합니다.
         */
        var analysisResult =
          await originalRunAssessmentAnalysis
            .apply(
              context,
              args
            );

        /*
         * 작업DB 처리는 보조 기능입니다.
         * 로드 지연이나 오류가 본체 화면을 막지 않도록
         * 별도 비동기 작업으로 실행합니다.
         */
        loadWorkDatabase(false)
          .then(function(){
            findWorkDatabaseMatches();
            applyWorkDatabaseJudgment();
            renderWorkDatabasePanel();

            if(
              global.riskJudgmentPatch &&
              typeof global
                .riskJudgmentPatch
                .renderAuthorJudgmentPanel ===
                'function'
            ){
              global.riskJudgmentPatch
                .renderAuthorJudgmentPanel();
            }

            updateWorkDatabaseReasonOption();

            /*
             * 작업DB 참고값 적용 후 위험도 카드를 다시 표시합니다.
             */
            if(
              typeof global.renderJudgment ===
              'function'
            ){
              global.renderJudgment();
            }

            log(
              '작업DB 후속 매칭 반영 완료'
            );
          })
          .catch(function(error){
            warn(
              '작업DB 후속 매칭 실패 — 위험성평가 본체는 계속 사용합니다.',
              error
            );

            renderWorkDatabasePanel();
          });

        return analysisResult;
      };
  }


  /*
   * 기존 자동판정 및 직접판정 패치가 처리된 후
   * 작업DB 실제 매칭 결과를 추가합니다.
   */
  var originalCalculateAutomaticJudgment =
    global.calculateAutomaticJudgment;

  if(
    typeof originalCalculateAutomaticJudgment ===
    'function'
  ){
    global.calculateAutomaticJudgment =
      function(searchData){
        originalCalculateAutomaticJudgment(
          searchData
        );

        findWorkDatabaseMatches();
        applyWorkDatabaseJudgment();
      };
  }

  /*
   * 위험도 카드 렌더링 이후 작업DB 검토 결과와
   * 작성자 직접판정 패널을 갱신합니다.
   */
  var originalRenderJudgment =
    global.renderJudgment;

  if(
    typeof originalRenderJudgment ===
    'function'
  ){
    global.renderJudgment =
      function(){
        originalRenderJudgment();

        renderWorkDatabasePanel();

        if(
          global.riskJudgmentPatch &&
          typeof global
            .riskJudgmentPatch
            .renderAuthorJudgmentPanel ===
            'function'
        ){
          global.riskJudgmentPatch
            .renderAuthorJudgmentPanel();
        }

        updateWorkDatabaseReasonOption();
      };
  }

  /*
   * 평가 저장 객체에 실제 작업DB 매칭 근거를 보존합니다.
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

        saveObject
          .workDatabaseReference =
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

        saveObject
          .workDatabaseState = {
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

  /*
   * 최종 요약의 새 판정방식 명칭을 정리합니다.
   */
  var originalRenderReviewSummary =
    global.renderReviewSummary;

  if(
    typeof originalRenderReviewSummary ===
    'function'
  ){
    global.renderReviewSummary =
      function(){
        originalRenderReviewSummary();

        var labels = {
          'workdb-fallback-pending-author':
            '작업DB 참고 후 작성자 직접판정',

          'combined-fallback-pending-author':
            '위험성평가 DB·작업DB 참고 후 작성자 직접판정',

          'auto-workdb-conflict-pending-author':
            '자동판정·작업DB 비교 후 작성자 직접판정'
        };

        var method =
          global.riskData &&
          labels[
            global.riskData
              .judgmentMethod
          ];

        if(!method){
          return;
        }

        var container =
          document.getElementById(
            'reviewSummaryGrid'
          );

        if(!container){
          return;
        }

        var items =
          Array.prototype.slice.call(
            container.querySelectorAll(
              '.review-summary-item'
            )
          );

        var judgmentItem =
          items.reverse().find(
            function(item){
              var label =
                item.querySelector(
                  '.review-summary-label'
                );

              return (
                label &&
                label.textContent.trim() ===
                  '판정 방식'
              );
            }
          );

        if(judgmentItem){
          var value =
            judgmentItem.querySelector(
              '.review-summary-value'
            );

          if(value){
            value.textContent =
              method;
          }
        }
      };
  }

  document.addEventListener(
    'DOMContentLoaded',
    function(){
      injectStyles();
      injectWorkDatabasePanel();

      /*
       * 페이지 진입 시 작업DB를 미리 준비합니다.
       * 동일 SHA256 자료가 있으면 IndexedDB에서 로드됩니다.
       */
      loadWorkDatabase(false)
        .then(function(){
          log(
            '작업DB 준비 완료:',
            workDatabase.length +
            '건'
          );
        });

      log(
        'v' +
        PATCH_VERSION +
        ' 적용 완료'
      );
    }
  );

  global.riskWorkDbMatchPatch = {
    version:
      PATCH_VERSION,

    load:
      loadWorkDatabase,

    findMatches:
      findWorkDatabaseMatches,

    render:
      renderWorkDatabasePanel,

    getState:
      function(){
        return {
          database:
            Object.assign(
              {},
              workDatabaseState
            ),

          selected:
            selectedWorkDatabaseMatch
              ? Object.assign(
                  {},
                  selectedWorkDatabaseMatch
                )
              : null,

          matches:
            currentWorkDatabaseMatches
              .map(function(match){
                return Object.assign(
                  {},
                  match
                );
              })
        };
      }
  };

  log(
    'v' +
    PATCH_VERSION +
    ' loaded'
  );

})(window);
