/* ============================================================
 * risk-judgment-patch.js v1.0.0
 * 위험성평가 판정 보완
 *
 * 적용 내용
 * 1. 통제 적정성 표기 정규화
 * 2. 위험도 3단계 정규화
 * 3. DB 등록 위험도 보조
 * 4. 자동판정 근거 부족 시 작성자 직접판정
 * 5. 직접판정 사유 복수 선택
 *
 * 제외 내용
 * - 작업분류별 위험도 하한
 * - 승인권자·결재선 자동 적용
 * - CCTV·생명지킴이 자동 요구
 * - 보호구 등급 자동 결정
 * - 법령·사내 기준 자동 구분
 * ============================================================ */

(function(global){
  'use strict';

  var PATCH_VERSION = '1.0.0';

  var AUTHOR_REASON_LABELS = {
    RISK_DB_REFERENCE:
      '위험성평가 DB 유사자료',

    WORK_DB_RISK:
      '작업DB 기존 위험등급',

    WORK_CLASSIFICATION:
      '작업분류 체크사항',

    FIELD_CONDITION:
      '현장 작업환경',

    LOCATION_CONDITION:
      '작업장소와 주변 조건',

    EQUIPMENT_TOOL:
      '사용 장비·공구',

    MATERIAL_ENERGY:
      '취급 물질·에너지',

    WORK_METHOD:
      '작업방법과 작업순서',

    CONTROL_STATUS:
      '적용 안전조치 상태',

    SIMULTANEOUS_WORK:
      '동시작업 또는 작업 간 간섭',

    INCIDENT_REFERENCE:
      '유사 사고·아차사례',

    OTHER:
      '기타'
  };

  function log(){
    var args =
      Array.prototype.slice.call(
        arguments
      );

    args.unshift(
      '[risk-judgment-patch]'
    );

    console.log.apply(
      console,
      args
    );
  }

  function normalizeControlValue(value){
    var raw =
      String(value || '')
        .trim();

    var compact =
      raw
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[()]/g, '');

    if(
      raw === '○' ||
      compact === 'o' ||
      compact === '0' ||
      compact === '적정' ||
      compact === '양호' ||
      compact === '적합'
    ){
      return '○';
    }

    if(
      raw === '△' ||
      compact === '보완' ||
      compact === '보완필요' ||
      compact === '일부보완' ||
      compact === '주의'
    ){
      return '△';
    }

    if(
      raw === '×' ||
      raw === '✕' ||
      compact === 'x' ||
      compact === '미흡' ||
      compact === '부적정' ||
      compact === '부적합'
    ){
      return '×';
    }

    return '';
  }

  function normalizeRiskLevel(value){
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

  function getThreeLevelRiskOrder(value){
    var normalized =
      normalizeRiskLevel(value);

    var order = {
      '저위험': 1,
      '중위험': 2,
      '고위험': 3
    };

    return order[normalized] || 0;
  }

  function getHighestDatabaseRisk(
    searchData
  ){
    var results =
      searchData &&
      Array.isArray(searchData.results)
        ? searchData.results
        : [];

    var selected = null;

    results.forEach(function(result){
      var item =
        result.item || {};

      var normalized =
        normalizeRiskLevel(
          item.riskLevel
        );

      if(!normalized){
        return;
      }

      var candidate = {
        normalized:
          normalized,

        original:
          String(
            item.riskLevel || ''
          ).trim(),

        workName:
          item.workName || '',

        relevance:
          Number(
            result.relevance || 0
          )
      };

      if(!selected){
        selected = candidate;
        return;
      }

      var candidateOrder =
        getThreeLevelRiskOrder(
          candidate.normalized
        );

      var selectedOrder =
        getThreeLevelRiskOrder(
          selected.normalized
        );

      if(
        candidateOrder >
        selectedOrder
      ){
        selected = candidate;
        return;
      }

      if(
        candidateOrder ===
          selectedOrder &&
        candidate.relevance >
          selected.relevance
      ){
        selected = candidate;
      }
    });

    return selected;
  }

  function hasValidAutomaticJudgment(){
    if(!global.riskData){
      return false;
    }

    return (
      global.riskData
        .automaticJudgmentValid ===
        true
    );
  }

  function hasConfirmedAuthorJudgment(){
    return Boolean(
      global.riskData &&
      global.riskData.authorJudgment &&
      global.riskData
        .authorJudgment
        .confirmed === true
    );
  }

  function isAuthorJudgmentRequired(){
    return Boolean(
      global.riskData &&
      global.riskData
        .authorJudgmentRequired === true
    );
  }

  function ensureAuthorJudgmentState(){
    if(!global.riskData){
      return;
    }

    if(
      !global.riskData
        .authorJudgment
    ){
      global.riskData.authorJudgment = {
        riskLevel: '',
        controlAdequacy: '',
        reasonCodes: [],
        reasonLabels: [],
        otherReason: '',
        confirmed: false,
        confirmedBy: '',
        confirmedAt: ''
      };
    }
  }

  function injectStyles(){
    if(
      document.getElementById(
        'authorJudgmentPatchStyle'
      )
    ){
      return;
    }

    var style =
      document.createElement(
        'style'
      );

    style.id =
      'authorJudgmentPatchStyle';

    style.textContent = [
      '.author-judgment-panel{',
      'display:none;',
      'margin-bottom:9px;',
      'padding:13px;',
      'border:2px solid var(--warn);',
      'border-radius:14px;',
      'background:var(--card);',
      'box-shadow:var(--shadow);',
      '}',

      '.author-judgment-panel.active{',
      'display:block;',
      '}',

      '.author-judgment-title{',
      'margin-bottom:6px;',
      'color:var(--warn);',
      'font-size:14px;',
      'font-weight:900;',
      '}',

      '.author-judgment-description{',
      'margin-bottom:12px;',
      'color:var(--body);',
      'font-size:11.5px;',
      'font-weight:650;',
      'line-height:1.55;',
      '}',

      '.author-choice-grid{',
      'display:grid;',
      'grid-template-columns:repeat(3,minmax(0,1fr));',
      'gap:6px;',
      'margin-bottom:12px;',
      '}',

      '.author-choice{',
      'position:relative;',
      'display:flex;',
      'align-items:center;',
      'justify-content:center;',
      'min-height:44px;',
      'padding:8px 5px;',
      'border:1.5px solid var(--line);',
      'border-radius:9px;',
      'background:var(--sunk);',
      'color:var(--body);',
      'font-size:11px;',
      'font-weight:850;',
      'text-align:center;',
      'cursor:pointer;',
      '}',

      '.author-choice input{',
      'position:absolute;',
      'opacity:0;',
      'pointer-events:none;',
      '}',

      '.author-choice:has(input:checked){',
      'border-color:var(--posco);',
      'background:var(--tint);',
      'color:var(--posco);',
      'box-shadow:0 0 0 2px rgba(0,103,177,.1);',
      '}',

      '.author-reason-grid{',
      'display:grid;',
      'grid-template-columns:minmax(0,1fr) minmax(0,1fr);',
      'gap:6px;',
      'margin-bottom:10px;',
      '}',

      '.author-reason{',
      'display:flex;',
      'align-items:flex-start;',
      'gap:6px;',
      'min-height:42px;',
      'padding:8px;',
      'border:1px solid var(--line);',
      'border-radius:8px;',
      'background:var(--sunk);',
      'color:var(--body);',
      'font-size:10.5px;',
      'font-weight:700;',
      'line-height:1.35;',
      'cursor:pointer;',
      '}',

      '.author-reason input{',
      'flex-shrink:0;',
      'width:17px;',
      'height:17px;',
      'margin-top:1px;',
      'accent-color:var(--posco);',
      '}',

      '.author-confirm-row{',
      'display:flex;',
      'align-items:flex-start;',
      'gap:8px;',
      'margin:10px 0;',
      'padding:9px;',
      'border-radius:8px;',
      'background:var(--warn-bg);',
      'color:var(--warn);',
      'font-size:10.5px;',
      'font-weight:750;',
      'line-height:1.45;',
      '}',

      '.author-confirm-row input{',
      'flex-shrink:0;',
      'width:18px;',
      'height:18px;',
      'margin-top:1px;',
      'accent-color:var(--warn);',
      '}',

      '.author-apply-button{',
      'width:100%;',
      'min-height:46px;',
      'padding:11px;',
      'border:0;',
      'border-radius:10px;',
      'background:linear-gradient(135deg,var(--deep),var(--bright));',
      'color:#fff;',
      'font-size:13px;',
      'font-weight:900;',
      '}',

      '.author-result{',
      'display:none;',
      'margin-bottom:10px;',
      'padding:9px;',
      'border-left:4px solid var(--done);',
      'border-radius:0 8px 8px 0;',
      'background:var(--done-bg);',
      'color:var(--done);',
      'font-size:10.5px;',
      'font-weight:750;',
      'line-height:1.5;',
      '}',

      '@media(max-width:340px){',
      '.author-choice-grid,',
      '.author-reason-grid{',
      'grid-template-columns:1fr;',
      '}',
      '}'
    ].join('');

    document.head.appendChild(
      style
    );
  }

  function getReasonCheckboxHtml(
    code,
    label
  ){
    return (
      '<label class="author-reason">' +
        '<input type="checkbox" ' +
        'name="authorReason" ' +
        'value="' +
        code +
        '">' +
        '<span>' +
        label +
        '</span>' +
      '</label>'
    );
  }

  function injectAuthorJudgmentPanel(){
    if(
      document.getElementById(
        'authorJudgmentPanel'
      )
    ){
      return;
    }

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
      'authorJudgmentPanel';

    panel.className =
      'author-judgment-panel';

    panel.innerHTML =
      '<div class="author-judgment-title">' +
        '⚠️ 작성자 판단 필요' +
      '</div>' +

      '<div class="author-judgment-description">' +
        '자동판정에 필요한 유효한 통제 수준 또는 사고유형 근거가 충분하지 않습니다. ' +
        '현장조건과 적용대책을 확인한 후 작성자가 직접 판단해 주세요.' +
      '</div>' +

      '<div class="author-result" id="authorJudgmentResult"></div>' +

      '<div class="form-label">' +
        '예상 위험도' +
        '<span class="required">*</span>' +
      '</div>' +

      '<div class="author-choice-grid">' +
        '<label class="author-choice">' +
          '<input type="radio" name="authorRiskLevel" value="저위험">' +
          '<span>저위험</span>' +
        '</label>' +

        '<label class="author-choice">' +
          '<input type="radio" name="authorRiskLevel" value="중위험">' +
          '<span>중위험</span>' +
        '</label>' +

        '<label class="author-choice">' +
          '<input type="radio" name="authorRiskLevel" value="고위험">' +
          '<span>고위험</span>' +
        '</label>' +
      '</div>' +

      '<div class="form-label">' +
        '현장 통제 수준' +
        '<span class="required">*</span>' +
      '</div>' +

      '<div class="author-choice-grid">' +
        '<label class="author-choice">' +
          '<input type="radio" name="authorControlLevel" value="○">' +
          '<span>○ 적정</span>' +
        '</label>' +

        '<label class="author-choice">' +
          '<input type="radio" name="authorControlLevel" value="△">' +
          '<span>△ 보완 필요</span>' +
        '</label>' +

        '<label class="author-choice">' +
          '<input type="radio" name="authorControlLevel" value="×">' +
          '<span>× 미흡</span>' +
        '</label>' +
      '</div>' +

      '<div class="form-label">' +
        '판단 근거 — 복수 선택 가능' +
        '<span class="required">*</span>' +
      '</div>' +

      '<div class="author-reason-grid">' +
        getReasonCheckboxHtml(
          'RISK_DB_REFERENCE',
          AUTHOR_REASON_LABELS
            .RISK_DB_REFERENCE
        ) +

        getReasonCheckboxHtml(
          'WORK_DB_RISK',
          AUTHOR_REASON_LABELS
            .WORK_DB_RISK
        ) +

        getReasonCheckboxHtml(
          'WORK_CLASSIFICATION',
          AUTHOR_REASON_LABELS
            .WORK_CLASSIFICATION
        ) +

        getReasonCheckboxHtml(
          'FIELD_CONDITION',
          AUTHOR_REASON_LABELS
            .FIELD_CONDITION
        ) +

        getReasonCheckboxHtml(
          'LOCATION_CONDITION',
          AUTHOR_REASON_LABELS
            .LOCATION_CONDITION
        ) +

        getReasonCheckboxHtml(
          'EQUIPMENT_TOOL',
          AUTHOR_REASON_LABELS
            .EQUIPMENT_TOOL
        ) +

        getReasonCheckboxHtml(
          'MATERIAL_ENERGY',
          AUTHOR_REASON_LABELS
            .MATERIAL_ENERGY
        ) +

        getReasonCheckboxHtml(
          'WORK_METHOD',
          AUTHOR_REASON_LABELS
            .WORK_METHOD
        ) +

        getReasonCheckboxHtml(
          'CONTROL_STATUS',
          AUTHOR_REASON_LABELS
            .CONTROL_STATUS
        ) +

        getReasonCheckboxHtml(
          'SIMULTANEOUS_WORK',
          AUTHOR_REASON_LABELS
            .SIMULTANEOUS_WORK
        ) +

        getReasonCheckboxHtml(
          'INCIDENT_REFERENCE',
          AUTHOR_REASON_LABELS
            .INCIDENT_REFERENCE
        ) +

        getReasonCheckboxHtml(
          'OTHER',
          AUTHOR_REASON_LABELS
            .OTHER
        ) +
      '</div>' +

      '<div class="form-group" ' +
      'id="authorOtherReasonWrap" ' +
      'style="display:none;">' +
        '<label class="form-label" for="authorOtherReason">' +
          '기타 판단 근거' +
          '<span class="required">*</span>' +
        '</label>' +

        '<input type="text" ' +
        'class="form-input" ' +
        'id="authorOtherReason" ' +
        'placeholder="기타 판단 근거를 5자 이상 입력하세요." ' +
        'autocomplete="off">' +
      '</div>' +

      '<label class="author-confirm-row">' +
        '<input type="checkbox" id="authorJudgmentConfirmed">' +
        '<span>' +
          '현장조건과 적용대책을 확인하고 작성자가 직접 판단했습니다.' +
        '</span>' +
      '</label>' +

      '<button type="button" ' +
      'class="author-apply-button" ' +
      'id="authorJudgmentApplyButton">' +
        '직접판정 적용' +
      '</button>';

    judgmentCard.insertAdjacentElement(
      'afterend',
      panel
    );

    panel
      .querySelectorAll(
        'input[name="authorReason"]'
      )
      .forEach(function(checkbox){
        checkbox.addEventListener(
          'change',
          function(){
            var other =
              panel.querySelector(
                'input[name="authorReason"]' +
                '[value="OTHER"]'
              );

            var wrap =
              document.getElementById(
                'authorOtherReasonWrap'
              );

            if(wrap){
              wrap.style.display =
                other && other.checked
                  ? 'block'
                  : 'none';
            }
          }
        );
      });

    var applyButton =
      document.getElementById(
        'authorJudgmentApplyButton'
      );

    if(applyButton){
      applyButton.addEventListener(
        'click',
        applyAuthorJudgment
      );
    }
  }

  function getSelectedRadioValue(name){
    var selected =
      document.querySelector(
        'input[name="' +
        name +
        '"]:checked'
      );

    return selected
      ? selected.value
      : '';
  }

  function getSelectedReasonCodes(){
    return Array.prototype
      .slice.call(
        document.querySelectorAll(
          'input[name="authorReason"]:checked'
        )
      )
      .map(function(input){
        return input.value;
      });
  }

  function renderAuthorJudgmentPanel(){
    ensureAuthorJudgmentState();

    var panel =
      document.getElementById(
        'authorJudgmentPanel'
      );

    if(!panel){
      return;
    }

    var required =
      isAuthorJudgmentRequired();

    panel.classList.toggle(
      'active',
      required
    );

    if(!required){
      return;
    }

    var authorJudgment =
      global.riskData.authorJudgment;

    if(
      authorJudgment &&
      authorJudgment.riskLevel
    ){
      var riskInput =
        panel.querySelector(
          'input[name="authorRiskLevel"]' +
          '[value="' +
          authorJudgment.riskLevel +
          '"]'
        );

      if(riskInput){
        riskInput.checked = true;
      }
    } else if(
      global.riskData
        .databaseFallbackRisk
    ){
      var fallbackInput =
        panel.querySelector(
          'input[name="authorRiskLevel"]' +
          '[value="' +
          global.riskData
            .databaseFallbackRisk +
          '"]'
        );

      if(fallbackInput){
        fallbackInput.checked = true;
      }
    }

    if(
      authorJudgment &&
      authorJudgment.controlAdequacy
    ){
      var controlInput =
        panel.querySelector(
          'input[name="authorControlLevel"]' +
          '[value="' +
          authorJudgment.controlAdequacy +
          '"]'
        );

      if(controlInput){
        controlInput.checked = true;
      }
    }

    var result =
      document.getElementById(
        'authorJudgmentResult'
      );

    if(
      result &&
      hasConfirmedAuthorJudgment()
    ){
      result.style.display =
        'block';

      result.textContent =
        '작성자 직접판정 완료 · ' +
        authorJudgment.riskLevel +
        ' / 통제 ' +
        authorJudgment.controlAdequacy;
    } else if(result){
      result.style.display =
        'none';

      result.textContent = '';
    }
  }

  function showAuthorValidationMessage(
    message
  ){
    if(
      typeof global.showToast ===
      'function'
    ){
      global.showToast(
        message,
        'warning'
      );
    } else {
      alert(message);
    }
  }

  function applyAuthorJudgment(){
    ensureAuthorJudgmentState();

    var riskLevel =
      getSelectedRadioValue(
        'authorRiskLevel'
      );

    var controlLevel =
      getSelectedRadioValue(
        'authorControlLevel'
      );

    var reasonCodes =
      getSelectedReasonCodes();

    var confirmation =
      document.getElementById(
        'authorJudgmentConfirmed'
      );

    var otherReasonElement =
      document.getElementById(
        'authorOtherReason'
      );

    var otherReason =
      otherReasonElement
        ? String(
            otherReasonElement.value ||
            ''
          ).trim()
        : '';

    if(!riskLevel){
      showAuthorValidationMessage(
        '예상 위험도를 선택해 주세요.'
      );

      return;
    }

    if(!controlLevel){
      showAuthorValidationMessage(
        '현장 통제 수준을 선택해 주세요.'
      );

      return;
    }

    if(reasonCodes.length === 0){
      showAuthorValidationMessage(
        '판단 근거를 1개 이상 선택해 주세요.'
      );

      return;
    }

    if(
      reasonCodes.indexOf(
        'OTHER'
      ) >= 0 &&
      otherReason.length < 5
    ){
      showAuthorValidationMessage(
        '기타 판단 근거를 5자 이상 입력해 주세요.'
      );

      return;
    }

    if(
      !confirmation ||
      !confirmation.checked
    ){
      showAuthorValidationMessage(
        '현장조건과 적용대책 확인란을 체크해 주세요.'
      );

      return;
    }

    var authorName =
      sessionStorage.getItem(
        'userName'
      ) ||
      (
        typeof global.getInputValue ===
          'function'
          ? global.getInputValue(
              'assessorInput'
            )
          : ''
      );

    if(
      !authorName ||
      authorName === 'anonymous'
    ){
      showAuthorValidationMessage(
        '작성자 이름을 확인해 주세요.'
      );

      return;
    }

    var previousValue =
      (
        global.riskData
          .finalRiskLevel ||
        '판정불가'
      ) +
      '/' +
      (
        global.riskData
          .finalControlAdequacy ||
        '-'
      );

    var reasonLabels =
      reasonCodes.map(function(code){
        return (
          AUTHOR_REASON_LABELS[code] ||
          code
        );
      });

    global.riskData.authorJudgment = {
      riskLevel:
        riskLevel,

      controlAdequacy:
        controlLevel,

      reasonCodes:
        reasonCodes,

      reasonLabels:
        reasonLabels,

      otherReason:
        otherReason,

      confirmed:
        true,

      confirmedBy:
        authorName,

      confirmedAt:
        new Date().toISOString()
    };

    global.riskData.finalRiskLevel =
      riskLevel;

    global.riskData
      .finalControlAdequacy =
      controlLevel;

    global.riskData.judgmentMethod =
      'author-direct';

    global.riskData
      .authorJudgmentRequired =
      true;

    if(
      typeof global.addStatusHistory ===
      'function'
    ){
      global.addStatusHistory(
        previousValue,
        riskLevel +
          '/' +
          controlLevel,
        '작성자 직접판정: ' +
          reasonLabels.join(', ')
      );
    }

    if(
      typeof global.renderJudgment ===
      'function'
    ){
      global.renderJudgment();
    }

    showAuthorValidationMessage(
      '작성자 직접판정을 적용했습니다.'
    );
  }

  /*
   * 통제 적정성 정규화
   */
  var originalEvaluateReferenceRisk =
    global.evaluateReferenceRisk;

  if(
    typeof originalEvaluateReferenceRisk ===
    'function'
  ){
    global.evaluateReferenceRisk =
      function(searchResult){
        var copiedResult =
          Object.assign(
            {},
            searchResult || {}
          );

        copiedResult.item =
          Object.assign(
            {},
            (
              searchResult &&
              searchResult.item
            ) ||
            {}
          );

        copiedResult.item
          .originalControlAdequacy =
          copiedResult.item
            .controlAdequacy || '';

        var normalizedControl =
          normalizeControlValue(
            copiedResult.item
              .controlAdequacy
          );

        if(normalizedControl){
          copiedResult.item
            .controlAdequacy =
            normalizedControl;
        }

        var judgment =
          originalEvaluateReferenceRisk(
            copiedResult
          );

        judgment
          .originalControlAdequacy =
          copiedResult.item
            .originalControlAdequacy;

        return judgment;
      };
  }

  /*
   * 기존 자동판정을 실행한 뒤 3단계 위험도로 정규화하고,
   * 자동판정 실패 시 DB의 등록 위험도를 보조값으로 제공합니다.
   */
  var originalCalculateAutomaticJudgment =
    global.calculateAutomaticJudgment;

  if(
    typeof originalCalculateAutomaticJudgment ===
    'function'
  ){
    global.calculateAutomaticJudgment =
      function(searchData){
        ensureAuthorJudgmentState();

        global.riskData.authorJudgment = {
          riskLevel: '',
          controlAdequacy: '',
          reasonCodes: [],
          reasonLabels: [],
          otherReason: '',
          confirmed: false,
          confirmedBy: '',
          confirmedAt: ''
        };

        originalCalculateAutomaticJudgment(
          searchData
        );

        var originalRisk =
          global.riskData
            .autoJudgment
            .riskLevel ||
          global.riskData
            .finalRiskLevel ||
          '';

        var normalizedAutomaticRisk =
          normalizeRiskLevel(
            originalRisk
          );

        var normalizedControl =
          normalizeControlValue(
            global.riskData
              .autoJudgment
              .controlAdequacy ||
            global.riskData
              .finalControlAdequacy
          );

        global.riskData
          .sourceRiskLevel =
          originalRisk;

        if(
          normalizedAutomaticRisk &&
          normalizedControl
        ){
          global.riskData
            .automaticJudgmentValid =
            true;

          global.riskData
            .authorJudgmentRequired =
            false;

          global.riskData
            .judgmentMethod =
            'auto';

          global.riskData
            .autoJudgment
            .sourceRiskLevel =
            originalRisk;

          global.riskData
            .autoJudgment
            .riskLevel =
            normalizedAutomaticRisk;

          global.riskData
            .autoJudgment
            .controlAdequacy =
            normalizedControl;

          global.riskData
            .finalRiskLevel =
            normalizedAutomaticRisk;

          global.riskData
            .finalControlAdequacy =
            normalizedControl;

          return;
        }

        var databaseFallback =
          getHighestDatabaseRisk(
            searchData
          );

        global.riskData
          .automaticJudgmentValid =
          false;

        global.riskData
          .authorJudgmentRequired =
          true;

        if(databaseFallback){
          global.riskData
            .databaseFallbackRisk =
            databaseFallback.normalized;

          global.riskData
            .databaseFallbackSourceRisk =
            databaseFallback.original;

          global.riskData
            .judgmentMethod =
            'database-fallback-pending-author';

          global.riskData
            .finalRiskLevel =
            databaseFallback.normalized;

          global.riskData
            .finalControlAdequacy =
            '';

          global.riskData
            .autoJudgment
            .riskLevel =
            databaseFallback.normalized;

          global.riskData
            .autoJudgment
            .sourceRiskLevel =
            databaseFallback.original;

          global.riskData
            .autoJudgment
            .basis =
            '유효한 매트릭스 판정이 없어 위험성평가 DB의 등록 위험도를 참고값으로 제시했습니다. 작성자 확인이 필요합니다.';

          global.riskData
            .autoJudgment
            .matrixCalculation =
            '작성자 판단 필요';

          log(
            'DB 등록 위험도 참고:',
            databaseFallback
          );

          return;
        }

        global.riskData
          .databaseFallbackRisk =
          '';

        global.riskData
          .databaseFallbackSourceRisk =
          '';

        global.riskData
          .judgmentMethod =
          'author-direct-required';

        global.riskData
          .finalRiskLevel =
          '판정불가';

        global.riskData
          .finalControlAdequacy =
          '';

        global.riskData
          .autoJudgment
          .riskLevel =
          '판정불가';

        global.riskData
          .autoJudgment
          .matrixCalculation =
          '작성자 판단 필요';

        global.riskData
          .autoJudgment
          .basis =
          '유효한 자동판정 근거가 없어 작성자가 현장조건과 적용대책을 확인한 후 직접 판단해야 합니다.';
      };
  }

  /*
   * 기존 위험도 카드가 렌더링될 때 직접판정 영역도 갱신합니다.
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
        renderAuthorJudgmentPanel();
      };
  }

  /*
   * 직접판정이 필요한 상태에서는 직접판정 완료 전
   * 3단계 진입을 막습니다.
   */
  var originalValidateMeasureSelection =
    global.validateMeasureSelection;

  if(
    typeof originalValidateMeasureSelection ===
    'function'
  ){
    global.validateMeasureSelection =
      function(){
        if(
          isAuthorJudgmentRequired() &&
          !hasConfirmedAuthorJudgment()
        ){
          showAuthorValidationMessage(
            '작성자 직접판정을 먼저 완료해 주세요.'
          );

          var panel =
            document.getElementById(
              'authorJudgmentPanel'
            );

          if(panel){
            panel.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }

          return;
        }

        originalValidateMeasureSelection();
      };
  }

  /*
   * 최종 제출 직전에도 직접판정 완료 여부를 다시 확인합니다.
   */
  var originalSubmitAssessment =
    global.submitAssessment;

  if(
    typeof originalSubmitAssessment ===
    'function'
  ){
    global.submitAssessment =
      function(){
        if(
          isAuthorJudgmentRequired() &&
          !hasConfirmedAuthorJudgment()
        ){
          showAuthorValidationMessage(
            '작성자 직접판정을 완료한 후 제출해 주세요.'
          );

          return;
        }

        return originalSubmitAssessment();
      };
  }

  /*
   * 저장 객체에 직접판정 정보와 3단계 위험도 정보를 추가합니다.
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

        saveObject.riskScale =
          '3-level';

        saveObject.judgmentMethod =
          global.riskData
            .judgmentMethod ||
          'auto';

        saveObject
          .automaticJudgmentValid =
          global.riskData
            .automaticJudgmentValid ===
            true;

        saveObject
          .sourceRiskLevel =
          global.riskData
            .sourceRiskLevel ||
          '';

        saveObject
          .databaseFallbackRisk =
          global.riskData
            .databaseFallbackRisk ||
          '';

        saveObject.authorJudgment =
          global.riskData
            .authorJudgment
            ? JSON.parse(
                JSON.stringify(
                  global.riskData
                    .authorJudgment
                )
              )
            : null;

        return saveObject;
      };
  }

  /*
   * 최종 요약 화면에 판정 방식을 표시합니다.
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

        var container =
          document.getElementById(
            'reviewSummaryGrid'
          );

        if(!container){
          return;
        }

        var methodLabels = {
          auto:
            '자동판정',

          'database-fallback-pending-author':
            'DB 참고 후 작성자 직접판정',

          'author-direct-required':
            '작성자 직접판정 필요',

          'author-direct':
            '작성자 직접판정'
        };

        var method =
          methodLabels[
            global.riskData
              .judgmentMethod
          ] ||
          global.riskData
            .judgmentMethod ||
          '확인 필요';

        var item =
          document.createElement(
            'div'
          );

        item.className =
          'review-summary-item wide';

        item.innerHTML =
          '<div class="review-summary-label">' +
            '판정 방식' +
          '</div>' +
          '<div class="review-summary-value">' +
            String(method)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;') +
          '</div>';

        container.appendChild(item);
      };
  }

  document.addEventListener(
    'DOMContentLoaded',
    function(){
      injectStyles();
      injectAuthorJudgmentPanel();

      log(
        'v' +
        PATCH_VERSION +
        ' 적용 완료'
      );
    }
  );

  global.riskJudgmentPatch = {
    version:
      PATCH_VERSION,

    normalizeControlValue:
      normalizeControlValue,

    normalizeRiskLevel:
      normalizeRiskLevel,

    renderAuthorJudgmentPanel:
      renderAuthorJudgmentPanel,

    applyAuthorJudgment:
      applyAuthorJudgment
  };

  log(
    'v' +
    PATCH_VERSION +
    ' loaded'
  );

})(window);
