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

const createNewFriend = () => {
  chrome.runtime.sendMessage({ action: 'create-new-friend' });
};

const destroyNewFriend = () => {
  chrome.runtime.sendMessage({ action: 'destroy-new-friend' });
};

const destroyAllNewFriends = () => {
  chrome.runtime.sendMessage({ action: 'destroy-all-new-friends' });
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
document
  .getElementById('create-new-friend')
  .addEventListener('click', createNewFriend);
document
  .getElementById('destroy-new-friend')
  .addEventListener('click', destroyNewFriend);
document
  .getElementById('destroy-all-new-friends')
  .addEventListener('click', destroyAllNewFriends);

// ===== 새 친구 생성하기 (Gemini 기반) =====
(function initNewFriendSection() {
  const $file = document.getElementById('reference-file');
  const $apiKey = document.getElementById('api-key');
  const $prompt = document.getElementById('prompt');
  const $rememberKey = document.getElementById('remember-key');
  const $removebgApiKey = document.getElementById('removebg-api-key');
  const $rememberRemovebgKey = document.getElementById('remember-removebg-key');
  const $btnGenerate = document.getElementById('btn-generate');
  const $btnRemoveBackground = document.getElementById('btn-remove-background');
  const $btnDownloadSprite = document.getElementById('btn-download-sprite');
  const $btnCreateFriend = document.getElementById('create-new-friend');
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
  chrome.storage.local.get(['geminiApiKey', 'removebgApiKey'], (res) => {
    if (res.geminiApiKey) {
      $apiKey.value = res.geminiApiKey;
      $rememberKey.checked = true;
    }
    if (res.removebgApiKey) {
      $removebgApiKey.value = res.removebgApiKey;
      $rememberRemovebgKey.checked = true;
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

  // DataURL을 Blob으로 변환하는 헬퍼 함수
  function dataUrlToBlob(dataUrl) {
    return new Promise((resolve, reject) => {
      try {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        resolve(new Blob([u8arr], { type: mime }));
      } catch (e) {
        reject(e);
      }
    });
  }

  // Blob을 DataURL로 변환하는 헬퍼 함수
  async function blobToDataUrl(blob) {
    const reader = new FileReader();
    return await new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const loadSecrets = (() => {
    let promise;
    return () => {
      if (!promise) {
        promise = import(chrome.runtime.getURL('secrets.js')).catch((err) => {
          console.warn('secrets.js를 불러오지 못했습니다.', err);
          return {};
        });
      }
      return promise;
    };
  })();

  // 저장된 스프라이트 복원하기
  async function restoreSavedSprite() {
    try {
      const result = await chrome.storage.local.get([
        'savedSpriteDataUrl',
        'savedSpriteMeta',
      ]);

      if (result.savedSpriteDataUrl) {
        generatedDataUrl = result.savedSpriteDataUrl;
        meta = result.savedSpriteMeta;
        generatedBlob = await dataUrlToBlob(generatedDataUrl);

        // 시트 미리보기 복원
        const img = new Image();
        img.onload = () => {
          drawImageToCanvas(img, $sheetCanvas);
        };
        img.src = generatedDataUrl;

        // 프레임 미리보기 복원
        const info = await window.spriteSheet.sliceSpriteSheet({
          source: generatedDataUrl,
        });
        info.frames.forEach((frame, idx) => {
          const ctx = frameCanvases[idx].getContext('2d');
          ctx.clearRect(0, 0, 48, 48);
          ctx.drawImage(frame, 0, 0);
        });

        // 버튼들 활성화
        $btnRemoveBackground.disabled = false;
        $btnRemoveBackground.style.opacity = '1';
        $btnDownloadSprite.disabled = false;
        $btnDownloadSprite.style.opacity = '1';
        $btnCreateFriend.disabled = false;
        $btnCreateFriend.style.opacity = '1';

        setStatus('✅ 이전에 생성한 스프라이트가 복원되었습니다.');
      }
    } catch (e) {
      console.error('스프라이트 복원 실패:', e);
    }
  }

  // 팝업 열릴 때 저장된 스프라이트 복원
  restoreSavedSprite();

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
        setStatus('❌ 이미지를 업로드하세요');
        return;
      }
      const apiKey = $apiKey.value.trim();
      if (!apiKey) {
        setStatus('❌ API Key를 입력하세요');
        return;
      }

      if ($rememberKey.checked) {
        chrome.storage.local.set({ geminiApiKey: apiKey });
      } else {
        chrome.storage.local.remove(['geminiApiKey']);
      }

      setStatus('⏳ AI가 스프라이트를 생성하는 중...');
      $btnGenerate.disabled = true;

      let blob;
      // 특별 쿠폰 코드 체크
      const isSpecialCode = window.nanobanana.isSpecialCouponCode(apiKey);

      if (isSpecialCode) {
        // 서버리스 API를 통해 생성 (제작자가 쏩니다! 🍔)
        setStatus('⏳ 특별 쿠폰 코드가 적용되었습니다! 제작자가 쏩니다 🍔');
        const { PROXY_SERVER_URL, EXTENSION_AUTH_KEY } = await loadSecrets();
        const proxyServerUrl = (PROXY_SERVER_URL || '').trim();
        const extensionAuthKey = (EXTENSION_AUTH_KEY || '').trim();

        if (!proxyServerUrl || !extensionAuthKey) {
          throw new Error(
            '서버리스 API 설정이 올바르지 않습니다. secrets.js를 확인하세요.',
          );
        }

        blob = await window.nanobanana.generateSpriteViaServerless({
          proxyServerUrl,
          extensionAuthKey,
          referenceImageBlob: file,
          prompt: $prompt.value || undefined,
        });
      } else {
        // 일반적인 API Key 사용
        blob = await window.nanobanana.generateSprite({
          apiKey,
          referenceImageBlob: file,
          prompt: $prompt.value || undefined,
        });
      }

      generatedBlob = blob;
      generatedDataUrl = await blobToDataUrl(blob);

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

      // 세션 스토리지에 저장 (화면에 캐릭터 생성용)
      await chrome.storage.session.setAccessLevel({
        accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
      });
      await chrome.storage.session.set({
        generatedSpriteSheet: generatedDataUrl,
        generatedSpriteMeta: meta,
      });

      // 로컬 스토리지에 영구 저장 (팝업 재시작 시 복원용)
      await chrome.storage.local.set({
        savedSpriteDataUrl: generatedDataUrl,
        savedSpriteMeta: meta,
      });

      // 버튼들 활성화
      setStatus(
        '✅ 생성 완료! "배경 제거" 또는 "다운로드"하거나, "새 친구 생성"으로 새 친구를 추가해보세요.',
      );
      $btnRemoveBackground.disabled = false;
      $btnRemoveBackground.style.opacity = '1';
      $btnDownloadSprite.disabled = false;
      $btnDownloadSprite.style.opacity = '1';
      $btnCreateFriend.disabled = false;
      $btnCreateFriend.style.opacity = '1';
    } catch (e) {
      console.error(e);
      const message = e && e.message ? e.message : String(e);
      setStatus(`❌ 생성 실패: ${message}`);
      $btnRemoveBackground.disabled = true;
      $btnRemoveBackground.style.opacity = '0.5';
      $btnDownloadSprite.disabled = true;
      $btnDownloadSprite.style.opacity = '0.5';
      $btnCreateFriend.disabled = true;
      $btnCreateFriend.style.opacity = '0.5';
    } finally {
      $btnGenerate.disabled = false;
    }
  });

  // ===== 배경 제거 기능 =====
  $btnRemoveBackground.addEventListener('click', async () => {
    try {
      if (!generatedBlob) {
        setStatus('❌ 먼저 스프라이트를 생성하세요.');
        return;
      }

      const removebgApiKey = $removebgApiKey.value.trim();
      if (!removebgApiKey) {
        setStatus('❌ Remove.bg API Key를 입력하세요.');
        return;
      }

      if ($rememberRemovebgKey.checked) {
        chrome.storage.local.set({ removebgApiKey });
      } else {
        chrome.storage.local.remove(['removebgApiKey']);
      }

      setStatus('⏳ 배경을 제거하는 중...');
      $btnRemoveBackground.disabled = true;

      let processedBlob;
      // 특별 쿠폰 코드 체크
      const isSpecialCode =
        window.nanobanana.isSpecialCouponCode(removebgApiKey);

      if (isSpecialCode) {
        // 서버리스 API를 통해 배경 제거 (제작자가 쏩니다! 🍔)
        setStatus('⏳ 특별 쿠폰 코드가 적용되었습니다! 제작자가 쏩니다 🍔');
        const { PROXY_SERVER_URL, EXTENSION_AUTH_KEY } = await loadSecrets();
        const proxyServerUrl = (PROXY_SERVER_URL || '').trim();
        const extensionAuthKey = (EXTENSION_AUTH_KEY || '').trim();

        if (!proxyServerUrl || !extensionAuthKey) {
          throw new Error(
            '서버리스 API 설정이 올바르지 않습니다. secrets.js를 확인하세요.',
          );
        }

        processedBlob = await window.nanobanana.removeBackgroundViaServerless({
          proxyServerUrl,
          extensionAuthKey,
          imageBlob: generatedBlob,
        });
      } else {
        // 일반적인 API Key 사용 (직접 Remove.bg API 호출)
        processedBlob = await window.nanobanana.removeBackground({
          apiKey: removebgApiKey,
          imageBlob: generatedBlob,
        });
      }

      generatedBlob = processedBlob;
      generatedDataUrl = await blobToDataUrl(processedBlob);

      const img = new Image();
      img.onload = () => {
        drawImageToCanvas(img, $sheetCanvas);
      };
      img.src = generatedDataUrl;

      const info = await window.spriteSheet.sliceSpriteSheet({
        source: generatedDataUrl,
      });
      info.frames.forEach((frame, idx) => {
        const ctx = frameCanvases[idx].getContext('2d');
        ctx.clearRect(0, 0, 48, 48);
        ctx.drawImage(frame, 0, 0);
      });
      meta = info.meta;

      await chrome.storage.local.set({
        savedSpriteDataUrl: generatedDataUrl,
        savedSpriteMeta: meta,
      });
      await chrome.storage.session.set({
        generatedSpriteSheet: generatedDataUrl,
        generatedSpriteMeta: meta,
      });

      setStatus('✅ 배경 제거 완료!');
    } catch (e) {
      console.error(e);
      const message = e && e.message ? e.message : String(e);
      setStatus(`❌ 배경 제거 실패: ${message}`);
    } finally {
      $btnRemoveBackground.disabled = false;
    }
  });

  // ===== 스프라이트 다운로드 기능 =====
  $btnDownloadSprite.addEventListener('click', async () => {
    try {
      if (!generatedBlob) {
        setStatus('❌ 다운로드할 스프라이트가 없습니다.');
        return;
      }

      setStatus('💾 다운로드 중...');

      // Blob을 다운로드 가능한 URL로 변환
      const downloadUrl = URL.createObjectURL(generatedBlob);

      // 현재 시간을 파일명에 포함
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, -5);
      const filename = `bugi-sprite-${timestamp}.png`;

      // 다운로드 트리거
      const $downloadLink = document.createElement('a');
      $downloadLink.href = downloadUrl;
      $downloadLink.download = filename;
      document.body.appendChild($downloadLink);
      $downloadLink.click();
      document.body.removeChild($downloadLink);

      // URL 해제 (메모리 정리)
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);

      setStatus(`✅ 다운로드 완료: ${filename}`);
    } catch (e) {
      console.error(e);
      const message = e && e.message ? e.message : String(e);
      setStatus(`❌ 다운로드 실패: ${message}`);
    }
  });
})();
