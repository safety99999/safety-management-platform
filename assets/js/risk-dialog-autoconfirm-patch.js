/**
 * risk-dialog-autoconfirm-patch.js  v1.0.0
 * 종합검토 클릭 시 확인 다이얼로그가 안 보이는 문제 해결
 * - 본체/기존 패치 미수정, 스타일 주입만
 */
(function () {
  'use strict';
  const LOG = (...a) => console.log('[dialog-patch]', ...a);

  const style = document.createElement('style');
  style.textContent = `
    .confirm-dialog-overlay,
    [class*="dialog-overlay"],
    [class*="modal-overlay"] {
      position: fixed !important;
      inset: 0 !important;
      z-index: 999999 !important;
      background: rgba(0,0,0,0.55) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .confirm-dialog,
    [class*="dialog-box"],
    [class*="modal-content"] {
      position: relative !important;
      z-index: 1000000 !important;
      background: #fff !important;
      border-radius: 12px !important;
      box-shadow: 0 20px 60px rgba(0,0,0,0.35), 0 0 0 3px #ff6b35 !important;
      animation: dialogPulse 1.2s ease-in-out infinite;
      max-width: 480px !important;
      width: 90% !important;
    }
    @keyframes dialogPulse {
      0%,100% { box-shadow: 0 20px 60px rgba(0,0,0,0.35), 0 0 0 3px #ff6b35; }
      50%     { box-shadow: 0 20px 60px rgba(0,0,0,0.35), 0 0 0 6px #ffa06b; }
    }
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        const isDialog =
          node.matches?.('[class*="dialog"], [class*="modal"]') ||
          node.querySelector?.('[class*="dialog"], [class*="modal"]');
        if (isDialog) {
          LOG('다이얼로그 감지');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => {
            const dialog = document.querySelector(
              '.confirm-dialog, [class*="dialog-box"], [class*="modal-content"]'
            );
            if (dialog) {
              dialog.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const btn = dialog.querySelector(
                'button.primary-button, button[class*="confirm"], button[class*="primary"]'
              );
              if (btn) btn.focus();
            }
          }, 100);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.__checkDialog = function () {
    const dialogs = document.querySelectorAll('[class*="dialog"], [class*="modal"]');
    if (!dialogs.length) return console.log('열려 있는 다이얼로그 없음');
    dialogs.forEach((d, i) => {
      const r = d.getBoundingClientRect();
      console.log(`[${i}]`, d.className, {
        보임: r.width > 0 && r.height > 0,
        위치: `${r.top}, ${r.left}`,
        크기: `${r.width}x${r.height}`,
      });
    });
  };

  LOG('v1.0.0 로드 완료');
})();
