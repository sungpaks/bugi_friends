const createNewBugi = () => {
  chrome.runtime.sendMessage({ action: 'create-new-bugi' });
};

const destroyBugi = () => {
  chrome.runtime.sendMessage({ action: 'destroy-bugi' });
};

const destroyAllBugis = () => {
  chrome.runtime.sendMessage({ action: 'destroy-all-bugis' });
};

const createNewFrenchFries = () => {
  chrome.runtime.sendMessage({ action: 'create-new-french-fries' });
};

const destroyFrenchFries = () => {
  chrome.runtime.sendMessage({ action: 'destroy-french-fries' });
};

const destroyAllFrenchFries = () => {
  chrome.runtime.sendMessage({ action: 'destroy-all-french-fries' });
};

document
  .getElementById('create-new-bugi')
  .addEventListener('click', createNewBugi);
document.getElementById('destroy-bugi').addEventListener('click', destroyBugi);
document
  .getElementById('destroy-all-bugis')
  .addEventListener('click', destroyAllBugis);
document
  .getElementById('create-new-french-fries')
  .addEventListener('click', createNewFrenchFries);
document
  .getElementById('destroy-french-fries')
  .addEventListener('click', destroyFrenchFries);
document
  .getElementById('destroy-all-french-fries')
  .addEventListener('click', destroyAllFrenchFries);

// ===== 새 친구 생성하기 (Gemini 기반) =====
(function initNewFriendSection() {
  const $file = document.getElementById('reference-file');
  const $apiKey = document.getElementById('api-key');
  const $prompt = document.getElementById('prompt');
  const $rememberKey = document.getElementById('remember-key');
  const $btnGenerate = document.getElementById('btn-generate');
  const $btnApply = document.getElementById('btn-apply');
  const $status = document.getElementById('status-text');
  const $refCanvas = document.getElementById('ref-canvas');
  const $sheetCanvas = document.getElementById('sheet-canvas');
  const frameCanvases = [0, 1, 2, 3, 4].map((i) =>
    document.getElementById(`frame-${i}`),
  );

  if (!$file) return; // 섹션이 없으면 스킵

  const refCtx = $refCanvas.getContext('2d');
  const sheetCtx = $sheetCanvas.getContext('2d');

  // 기존 저장된 API Key 불러오기 (선택)
  chrome.storage.local.get(['geminiApiKey'], (res) => {
    if (res.geminiApiKey) {
      $apiKey.value = res.geminiApiKey;
      $rememberKey.checked = true;
    }
  });

  let generatedBlob = null; // 세션 저장 전 임시 보관
  let generatedDataUrl = null;
  let meta = null;

  function setStatus(text) {
    $status.textContent = text;
  }

  function drawImageToCanvas(img, canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(
      canvas.width / img.width,
      canvas.height / img.height,
    );
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;
    ctx.drawImage(img, x, y, w, h);
  }

  $file.addEventListener('change', () => {
    const file = $file.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => drawImageToCanvas(img, $refCanvas);
    img.src = URL.createObjectURL(file);
  });

  $btnGenerate.addEventListener('click', async () => {
    try {
      const file = $file.files?.[0];
      if (!file) {
        setStatus('이미지를 업로드하세요');
        return;
      }
      const apiKey = $apiKey.value.trim();
      if (!apiKey) {
        setStatus('API Key를 입력하세요');
        return;
      }

      if ($rememberKey.checked) {
        chrome.storage.local.set({ geminiApiKey: apiKey });
      } else {
        chrome.storage.local.remove(['geminiApiKey']);
      }

      setStatus('생성 중...');
      $btnGenerate.disabled = true;
      const blob = await window.nanobanana.generateSprite({
        apiKey,
        referenceImageBlob: file,
        prompt: $prompt.value || undefined,
      });
      generatedBlob = blob;
      generatedDataUrl = await (async () => {
        const reader = new FileReader();
        return await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      })();

      // 시트/프레임 미리보기
      const info = await window.spriteSheet.sliceSpriteSheet({
        source: generatedDataUrl,
      });
      meta = info.meta;
      // sheet
      const img = new Image();
      img.onload = () => {
        drawImageToCanvas(img, $sheetCanvas);
      };
      img.src = generatedDataUrl;
      // frames
      info.frames.forEach((frame, idx) => {
        const ctx = frameCanvases[idx].getContext('2d');
        ctx.clearRect(0, 0, 48, 48);
        ctx.drawImage(frame, 0, 0);
      });

      // 세션 스토리지에 저장
      await chrome.storage.session.setAccessLevel({
        accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
      });
      await chrome.storage.session.set({
        generatedSpriteSheet: generatedDataUrl,
        generatedSpriteMeta: meta,
      });
      setStatus('생성 완료. 적용을 눌러 반영하세요.');
      $btnApply.disabled = false;
    } catch (e) {
      console.error(e);
      const message = e && e.message ? e.message : String(e);
      setStatus(`생성 실패: ${message}`);
      $btnApply.disabled = true;
    } finally {
      $btnGenerate.disabled = false;
    }
  });

  $btnApply.addEventListener('click', async () => {
    setStatus('적용 중...');
    chrome.runtime.sendMessage({ action: 'APPLY_NEW_SPRITE' });
    setStatus('적용 요청 완료');
  });
})();
