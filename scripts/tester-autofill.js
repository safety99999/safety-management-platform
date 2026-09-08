/* ═══════════════════════════════════════════════════════════
   🧪 TESTER AUTOFILL v1.0
   - 테스터 로그인 시 모든 입력창 자동 채움
   - 페이지 로드 후 200ms 뒤 자동 실행
   - window.TESTER_AUTOFILL_CONFIG로 페이지별 커스터마이징 가능
   ═══════════════════════════════════════════════════════════ */
(function(global){
  'use strict';

  var VERSION = '1.0.0';

  // ─── 세션 판별 ─────────────────────────
  function readSession(){
    try{
      return JSON.parse(
        sessionStorage.getItem('appSession') || 'null'
      );
    }catch(e){
      return null;
    }
  }

  function isTester(){
    var session = readSession();
    return Boolean(
      session &&
      session.environment === 'test' &&
      session.accessMode === 'tester' &&
      session.role === 'tester'
    );
  }

  // ─── 오늘 날짜/시간 유틸 ─────────────────
  function pad(n){ return ('0' + n).slice(-2); }

  function fmtDate(d){
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
  }

  function fmtDateTime(d){
    d = d || new Date();
    return fmtDate(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function fmtTime(d){
    d = d || new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  // ─── 샘플 데이터 사전 ───────────────────
  var SAMPLE_DATA = {
    // 이름·인물
    name: 'TEST 담당자',
    supervisor: 'TEST 작업책임자',
    manager: 'TEST 관리감독자',
    worker: 'TEST 작업자',
    representative: 'TEST 대표',
    assessor: 'TEST 평가자',
    measurer: 'TEST 측정자',
    reporter: 'TEST 신고자',
    
    // 조직·회사
    company: 'TEST 협력사',
    department: 'TEST부서',
    team: 'TEST팀',
    
    // 연락처
    phone: '010-0000-0000',
    email: 'test@test.co.kr',
    
    // 작업 정보
    workName: 'TEST 설비 점검 및 안전조치',
    workDesc: '테스트용 작업 내용입니다. 실제 작업이 아닙니다.',
    location: '1공장 · 1라인',
    detailLocation: '1층 A구역',
    workers: '3',
    
    // 위험·안전
    hazard: '작업 중 설비 접촉 및 협착 위험',
    measure: '설비 정지 확인, 작업구역 통제 및 보호구 착용',
    opinion: 'TEST 종합의견입니다. 안전작업 절차를 준수하여 진행합니다.',
    reason: 'TEST 사유',
    
    // 가스 측정 (밀폐공간)
    o2: '20.9',
    co: '0',
    h2s: '0',
    co2: '0',
    lel: '0',
    
    // 참여자
    participants: 'TEST 작업자1, TEST 작업자2, TEST 작업자3',
    
    // 기타
    permitNo: '',
    workOrderNo: 'WO-TEST-001',
    remark: 'TEST 비고'
  };

  // ─── 필드 ID/placeholder 기반 매칭 규칙 ──
  // 우선순위: id > name > placeholder
  var FIELD_PATTERNS = [
    // 서명 관련은 별도 처리하므로 여기서 제외
    
    // 이름·직책
    { pattern: /(supervisor|작업책임자|책임자)/i, value: 'supervisor' },
    { pattern: /(manager|감독자|관리감독)/i, value: 'manager' },
    { pattern: /(representative|rep-name|대표)/i, value: 'representative' },
    { pattern: /(assessor|평가자)/i, value: 'assessor' },
    { pattern: /(measurer|측정자)/i, value: 'measurer' },
    { pattern: /(reporter|신고자|등록자)/i, value: 'reporter' },
    { pattern: /(worker.*name|작업자.*이름)/i, value: 'worker' },
    { pattern: /(name|이름|성명)/i, value: 'name' },
    
    // 조직
    { pattern: /(company|회사|협력사|업체)/i, value: 'company' },
    { pattern: /(department|부서|소속)/i, value: 'department' },
    { pattern: /(team|팀)/i, value: 'team' },
    
    // 연락처
    { pattern: /(phone|tel|전화|연락처|휴대폰)/i, value: 'phone' },
    { pattern: /(email|메일|이메일)/i, value: 'email' },
    
    // 작업
    { pattern: /(work-name|workname|작업명)/i, value: 'workName' },
    { pattern: /(work-desc|workdesc|description|작업내용|상세.*내용|내용)/i, value: 'workDesc' },
    { pattern: /(detail.*location|detail-location|세부.*위치|상세.*위치)/i, value: 'detailLocation' },
    { pattern: /(location|장소|위치)/i, value: 'location' },
    { pattern: /(worker.*count|workers|작업.*인원|인원)/i, value: 'workers' },
    { pattern: /(work.*order|work-order|WO)/i, value: 'workOrderNo' },
    
    // 위험·안전
    { pattern: /(hazard|위험요인|잠재.*위험)/i, value: 'hazard' },
    { pattern: /(measure|대책|안전.*조치|조치)/i, value: 'measure' },
    { pattern: /(opinion|의견|종합.*의견)/i, value: 'opinion' },
    { pattern: /(reason|사유|이유)/i, value: 'reason' },
    { pattern: /(participants|참여자|명단)/i, value: 'participants' },
    { pattern: /(remark|비고|메모)/i, value: 'remark' },
    
    // 가스 측정
    { pattern: /(o2|산소)/i, value: 'o2' },
    { pattern: /(h2s|황화수소)/i, value: 'h2s' },
    { pattern: /(co2|이산화탄소)/i, value: 'co2' },
    { pattern: /(lel|가연성)/i, value: 'lel' },
    { pattern: /(^co$|^g-co$|일산화탄소)/i, value: 'co' }
  ];

  // ─── 특정 ID 직접 매핑 (우선순위 최상) ──
  function getCustomConfig(){
    return global.TESTER_AUTOFILL_CONFIG || {};
  }

  // ─── 값 채우기 (빈 필드만) ─────────────
  function fillIfBlank(el, value){
    if(!el) return false;
    
    var currentValue = String(el.value || '').trim();
    if(currentValue) return false;  // 이미 값 있으면 skip
    
    el.value = value;
    el.classList.add('tester-autofilled');
    
    // 시각적 피드백
    el.style.transition = 'background 0.3s';
    var origBg = el.style.background;
    el.style.background = 'rgba(14, 138, 107, 0.08)';
    setTimeout(function(){
      el.style.background = origBg;
    }, 800);
    
    return true;
  }

  // ─── 필드 타입 감지 ──────────────────
  function detectFieldType(el){
    var id = (el.id || '').toLowerCase();
    var name = (el.name || '').toLowerCase();
    var placeholder = (el.placeholder || '').toLowerCase();
    var label = '';
    
    // 근처 label 텍스트 확인
    if(el.id){
      var labelEl = document.querySelector('label[for="' + el.id + '"]');
      if(labelEl) label = labelEl.textContent.toLowerCase();
    }
    
    // 부모의 label 확인
    var parentLabel = el.closest('label');
    if(parentLabel) label += ' ' + parentLabel.textContent.toLowerCase();
    
    var combined = id + ' ' + name + ' ' + placeholder + ' ' + label;
    
    // 패턴 매칭
    for(var i = 0; i < FIELD_PATTERNS.length; i++){
      var rule = FIELD_PATTERNS[i];
      if(rule.pattern.test(combined)){
        return rule.value;
      }
    }
    
    return null;
  }

  // ─── input 타입별 처리 ───────────────
  function fillByInputType(el){
    var type = (el.type || 'text').toLowerCase();
    
    // 날짜/시간
    if(type === 'date'){
      return fillIfBlank(el, fmtDate());
    }
    if(type === 'datetime-local'){
      return fillIfBlank(el, fmtDateTime());
    }
    if(type === 'time'){
      return fillIfBlank(el, fmtTime());
    }
    
    // 이메일
    if(type === 'email'){
      return fillIfBlank(el, SAMPLE_DATA.email);
    }
    
    // 전화
    if(type === 'tel'){
      return fillIfBlank(el, SAMPLE_DATA.phone);
    }
    
    // 숫자
    if(type === 'number'){
      var min = parseFloat(el.min);
      var max = parseFloat(el.max);
      // 인원 관련이면 3, 아니면 1
      var placeholder = (el.placeholder || '').toLowerCase();
      if(/인원|worker|명/.test(placeholder + el.id)){
        return fillIfBlank(el, '3');
      }
      return fillIfBlank(el, min && !isNaN(min) ? String(min) : '1');
    }
    
    return false;
  }

  // ─── 개별 필드 채우기 ────────────────
  function fillField(el){
    // 이미 채워졌으면 skip
    if(el.classList.contains('tester-autofilled')) return false;
    
    // readonly/disabled면 skip
    if(el.readOnly || el.disabled) return false;
    
    // hidden 필드는 skip
    if(el.type === 'hidden') return false;
    
    // 1️⃣ 커스텀 config 우선 매칭
    var customConfig = getCustomConfig();
    if(customConfig[el.id]){
      return fillIfBlank(el, customConfig[el.id]);
    }
    if(el.name && customConfig[el.name]){
      return fillIfBlank(el, customConfig[el.name]);
    }
    
    // 2️⃣ 필드 타입별 매칭
    var fieldType = detectFieldType(el);
    if(fieldType && SAMPLE_DATA[fieldType]){
      return fillIfBlank(el, SAMPLE_DATA[fieldType]);
    }
    
    // 3️⃣ input 타입 기반 처리 (date, email 등)
    if(fillByInputType(el)) return true;
    
    // 4️⃣ textarea에 기본값
    if(el.tagName === 'TEXTAREA'){
      return fillIfBlank(el, 'TEST 입력값');
    }
    
    // 5️⃣ 그 외 텍스트 input
    if(el.tagName === 'INPUT' && (!el.type || el.type === 'text')){
      return fillIfBlank(el, 'TEST');
    }
    
    return false;
  }

  // ─── select 처리 ──────────────────
  function fillSelect(el){
    if(el.readOnly || el.disabled) return false;
    if(el.value && el.value.trim()) return false; // 이미 선택됨
    
    var options = el.options;
    if(!options || options.length <= 1) return false;
    
    // 첫 번째 유효한 옵션 선택 (빈 값 제외)
    for(var i = 0; i < options.length; i++){
      var opt = options[i];
      if(opt.value && opt.value.trim() && !opt.disabled){
        el.value = opt.value;
        el.classList.add('tester-autofilled');
        
        // change 이벤트 발생 (다른 로직 트리거용)
        try{
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }catch(e){}
        return true;
      }
    }
    return false;
  }

  // ─── 서명 캔버스 자동 렌더링 ─────────
  function drawTestSignature(canvas, label){
    if(!canvas || canvas.dataset.testerAutofilled === 'true') return false;
    
    // 이미 서명이 있는지 확인
    var ctx = canvas.getContext('2d');
    if(!ctx) return false;
    
    try{
      var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for(var i = 3; i < data.length; i += 4){
        if(data[i] > 0){
          canvas.dataset.testerAutofilled = 'true';
          return false; // 이미 서명 있음
        }
      }
    }catch(e){
      return false; // 캔버스 접근 실패 시 skip
    }
    
    // 서명 그리기
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#1C2B3A';
    ctx.fillStyle = '#1C2B3A';
    ctx.lineWidth = 2.5;
    ctx.font = 'bold 26px sans-serif';
    
    var text = label || 'TEST';
    var textWidth = ctx.measureText(text).width;
    var x = (canvas.width - textWidth) / 2;
    var y = canvas.height / 2 + 8;
    
    ctx.fillText(text, x, y);
    
    // 밑줄
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 8);
    ctx.lineTo(x + textWidth + 10, y + 8);
    ctx.stroke();
    
    ctx.restore();
    
    canvas.dataset.testerAutofilled = 'true';
    return true;
  }

  // ─── 서명 캔버스 자동 감지 & 채움 ────
  function fillAllSignatures(){
    var count = 0;
    
    // 일반적인 서명 canvas 셀렉터들
    var selectors = [
      '.sig-canvas',
      '.signature-canvas',
      '.sig-pad',
      '[data-signature]',
      'canvas[id*="sig"]',
      'canvas[id*="signature"]'
    ];
    
    selectors.forEach(function(sel){
      try{
        document.querySelectorAll(sel).forEach(function(canvas){
          if(canvas.tagName !== 'CANVAS') return;
          
          // 근처 label에서 이름 추출
          var label = 'TEST';
          var parent = canvas.closest('.form-group, .sig-wrap, .signature-wrap');
          if(parent){
            var labelEl = parent.querySelector('label, .f-label, .sig-label');
            if(labelEl){
              var text = labelEl.textContent.replace(/[*<>]/g, '').trim();
              if(text.length > 0 && text.length < 20){
                label = 'TEST ' + text.split(/[·\s]/)[0];
              }
            }
          }
          
          // 근처 이름 input에서 이름 가져오기
          var nameInput = parent && parent.querySelector('input[type="text"]');
          if(nameInput && nameInput.value){
            label = nameInput.value;
          }
          
          if(drawTestSignature(canvas, label)){
            count++;
          }
        });
      }catch(e){}
    });
    
    return count;
  }

  // ─── 라디오/체크박스 자동 선택 ─────
  function fillRadiosAndCheckboxes(){
    // 라디오: 그룹별로 첫 번째 선택
    var radioGroups = {};
    document.querySelectorAll('input[type="radio"]').forEach(function(el){
      if(el.disabled || el.readOnly) return;
      if(!el.name) return;
      if(!radioGroups[el.name]) radioGroups[el.name] = [];
      radioGroups[el.name].push(el);
    });
    
    Object.keys(radioGroups).forEach(function(name){
      var group = radioGroups[name];
      var anyChecked = group.some(function(r){ return r.checked; });
      if(!anyChecked && group.length > 0){
        group[0].checked = true;
        group[0].classList.add('tester-autofilled');
        try{
          group[0].dispatchEvent(new Event('change', { bubbles: true }));
        }catch(e){}
      }
    });
    
    // 체크박스: "동의", "확인", "이해" 같은 필수 체크박스만 체크
    document.querySelectorAll('input[type="checkbox"]').forEach(function(el){
      if(el.disabled || el.readOnly || el.checked) return;
      
      var label = '';
      if(el.id){
        var labelEl = document.querySelector('label[for="' + el.id + '"]');
        if(labelEl) label = labelEl.textContent;
      }
      var parentLabel = el.closest('label');
      if(parentLabel) label += ' ' + parentLabel.textContent;
      
      // "동의", "확인", "이해했습니다" 등의 문구가 있으면 체크
      if(/동의|확인|이해|숙지|서약|서명|고지받|알고 있음/.test(label)){
        el.checked = true;
        el.classList.add('tester-autofilled');
        try{
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }catch(e){}
      }
    });
  }

  // ─── 커스텀 토글 버튼 처리 (밀폐공간 등) ─
  function fillToggleButtons(){
    // .toggle-yn-btn 같은 커스텀 토글 버튼
    // "아니오"를 우선 선택 (안전한 기본값)
    var toggleGroups = document.querySelectorAll('.toggle-yn-row');
    
    toggleGroups.forEach(function(row){
      var buttons = row.querySelectorAll('.toggle-yn-btn');
      var alreadySelected = Array.from(buttons).some(function(b){
        return b.classList.contains('active-yes') || 
               b.classList.contains('active-no');
      });
      
      if(!alreadySelected && buttons.length > 0){
        // "아니오" 버튼 찾기
        var noBtn = Array.from(buttons).find(function(b){
          return /아니오|no/i.test(b.textContent);
        });
        
        if(noBtn){
          noBtn.click();  // onclick 핸들러 트리거
        }
      }
    });
  }

  // ─── 메인 실행 함수 ─────────────────
  function runAutofill(){
    if(!isTester()){
      console.log('[TesterAutofill] 테스터 세션 아님 · 건너뜀');
      return { skipped: true };
    }
    
    var stats = {
      inputs: 0,
      textareas: 0,
      selects: 0,
      signatures: 0,
      total: 0
    };
    
    // 1️⃣ 일반 input
    document.querySelectorAll('input').forEach(function(el){
      var type = el.type;
      if(type === 'radio' || type === 'checkbox' || 
         type === 'hidden' || type === 'submit' || type === 'button'){
        return;
      }
      if(fillField(el)){
        stats.inputs++;
      }
    });
    
    // 2️⃣ textarea
    document.querySelectorAll('textarea').forEach(function(el){
      if(fillField(el)){
        stats.textareas++;
      }
    });
    
    // 3️⃣ select
    document.querySelectorAll('select').forEach(function(el){
      if(fillSelect(el)){
        stats.selects++;
      }
    });
    
    // 4️⃣ 서명 캔버스
    stats.signatures = fillAllSignatures();
    
    // 5️⃣ 라디오/체크박스
    fillRadiosAndCheckboxes();
    
    // 6️⃣ 커스텀 토글 버튼
    fillToggleButtons();
    
    stats.total = stats.inputs + stats.textareas + stats.selects + stats.signatures;
    
    console.log(
      '%c[TesterAutofill v' + VERSION + '] ✅ 자동 채움 완료',
      'background:#0E8A6B;color:#fff;padding:3px 10px;border-radius:4px;font-weight:bold;',
      stats
    );
    
    // 커스텀 이벤트 발생 (페이지에서 추가 처리 필요 시)
    try{
      global.dispatchEvent(new CustomEvent('tester-autofill-complete', {
        detail: stats
      }));
    }catch(e){}
    
    return stats;
  }

  // ─── 스타일 주입 ────────────────────
  function injectStyle(){
    if(document.getElementById('tester-autofill-style')) return;
    
    var style = document.createElement('style');
    style.id = 'tester-autofill-style';
    style.textContent = 
      '.tester-autofilled{' +
        'background: linear-gradient(90deg, rgba(14,138,107,0.06), transparent) !important;' +
        'border-color: rgba(14,138,107,0.3) !important;' +
      '}' +
      '[data-theme="dark"] .tester-autofilled{' +
        'background: linear-gradient(90deg, rgba(61,217,174,0.1), transparent) !important;' +
      '}' +
      '.tester-autofill-badge{' +
        'position: fixed;' +
        'bottom: 80px;' +
        'right: 16px;' +
        'z-index: 9998;' +
        'padding: 8px 14px;' +
        'background: linear-gradient(135deg, #0B7A5F, #0E8A6B);' +
        'color: #fff;' +
        'border-radius: 20px;' +
        'font-size: 12px;' +
        'font-weight: 800;' +
        'box-shadow: 0 4px 12px rgba(14,138,107,0.35);' +
        'pointer-events: none;' +
        'opacity: 0;' +
        'transform: translateY(10px);' +
        'transition: all 0.3s;' +
      '}' +
      '.tester-autofill-badge.show{' +
        'opacity: 1;' +
        'transform: translateY(0);' +
      '}';
    document.head.appendChild(style);
  }

  // ─── 배지 표시 ─────────────────────
  function showBadge(stats){
    if(!stats || !stats.total) return;
    
    var badge = document.createElement('div');
    badge.className = 'tester-autofill-badge';
    badge.textContent = '🧪 TEST 자동입력 ' + stats.total + '개';
    document.body.appendChild(badge);
    
    setTimeout(function(){
      badge.classList.add('show');
    }, 100);
    
    setTimeout(function(){
      badge.classList.remove('show');
      setTimeout(function(){
        if(badge.parentNode) badge.parentNode.removeChild(badge);
      }, 300);
    }, 3500);
  }

  // ─── 초기화 ─────────────────────────
  function init(){
    injectStyle();
    
    // 페이지 로드 후 약간의 딜레이 (다른 스크립트가 필드 초기화 완료할 시간)
    var delay = (global.TESTER_AUTOFILL_DELAY || 300);
    
    setTimeout(function(){
      var stats = runAutofill();
      if(stats && !stats.skipped){
        showBadge(stats);
      }
    }, delay);
  }

  // ─── DOM 준비 대기 ──────────────────
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }

  // ─── 외부 API 노출 ─────────────────
  global.TesterAutofill = {
    version: VERSION,
    isTester: isTester,
    run: runAutofill,
    fillField: fillField,
    sampleData: SAMPLE_DATA,
    // 수동 재실행용
    refresh: function(){
      return runAutofill();
    }
  };

})(window);
