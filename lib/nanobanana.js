// Helper to convert Blob to a Base64 string
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]); // Remove data URL prefix
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Tiny wrapper around Gemini-based image generation API (nanobanana)
(function initNanobanana() {
  if (window.nanobanana) return;

  // 예시 스프라이트 시트를 초기화 시점에 한 번만 Blob으로 로드
  let exampleSheetBlob = null;
  (async () => {
    try {
      const url = chrome.runtime.getURL('images/spritesheet-example.png');
      const resp = await fetch(url);
      if (resp.ok) exampleSheetBlob = await resp.blob();
    } catch (e) {
      // 예시 시트 로드 실패 시 조용히 무시
    }
  })();

  /**
   * Generates an image using the Gemini API.
   * @param {object} args - The arguments for the function.
   * @param {string} args.apiKey - Your Google AI API key.
   * @param {Blob} [args.referenceImageBlob] - The reference image as a Blob.
   * @param {string} [args.prompt] - The text prompt describing what to generate.
   * @param {string} [args.model='gemini-2.5-flash-image-preview'] - The model to use.
   * @returns {Promise<Blob>} A promise that resolves with the generated image as a Blob.
   */
  async function generateImage({
    apiKey,
    referenceImageBlob,
    prompt,
    model = 'gemini-2.5-flash-image-preview',
  }) {
    if (!apiKey) throw new Error('API key is required.');
    if (!prompt && !referenceImageBlob)
      throw new Error('Either prompt or referenceImageBlob is required.');

    // 1. Gemini API 엔드포인트 설정
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    // 2. parts 구성
    const parts = [];
    if (prompt) parts.push({ text: prompt });

    // Image #1: 캐릭터 레퍼런스
    if (referenceImageBlob) {
      const base64Ref = await blobToBase64(referenceImageBlob);
      parts.push({ text: 'Image #1: Character reference (appearance/style).' });
      parts.push({
        inlineData: {
          mimeType: referenceImageBlob.type || 'image/png',
          data: base64Ref,
        },
      });
    }

    // Image #2: 스프라이트 레이아웃 예시
    if (exampleSheetBlob) {
      const base64Ex = await blobToBase64(exampleSheetBlob);
      parts.push({
        text: 'Image #2: Sprite layout example (use this tiling/layout ONLY; DO NOT copy its character/content).',
      });
      parts.push({
        inlineData: {
          mimeType: exampleSheetBlob.type || 'image/png',
          data: base64Ex,
        },
      });
    }

    // 3. API 요청 본문(JSON) 구성
    const requestBody = {
      contents: [
        {
          parts,
        },
      ],
      generationConfig: {
        maxOutputTokens: 8192,
      },
    };

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!resp.ok) {
      let errorMessage = '';
      try {
        const errorData = await resp.json();
        const e = errorData?.error || {};
        const code = e.status || e.code;
        const msg = e.message || JSON.stringify(errorData);
        errorMessage = `[${resp.status}${code ? ' ' + code : ''}] ${msg}`;
      } catch (_) {
        const text = await resp.text();
        errorMessage = `[${resp.status}] ${text || resp.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await resp.json();

    // 4. 응답에서 이미지 데이터(Base64) 추출 후 Blob으로 변환
    const candidates = data?.candidates || [];
    for (const cand of candidates) {
      const parts = cand?.content?.parts || [];
      for (const part of parts) {
        if (part?.inlineData?.data) {
          const imageBase64 = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          const byteCharacters = atob(imageBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          return new Blob([byteArray], { type: mimeType });
        }
      }
    }
    console.error('Failed to parse image data from API response:', data);
    throw new Error(
      'Could not find or parse the generated image in the API response.',
    );
  }

  /**
   * Convenience wrapper for our 5-frame sprite sheet spec.
   * Returns the raw PNG Blob of the generated sprite sheet.
   */
  async function generateSprite({ apiKey, referenceImageBlob, prompt }) {
    const basePrompt = [
      'Task: Generate a single transparent PNG sprite sheet for a cute 2D character ("Bugi").',
      'You are given TWO input images:',
      '- Image #1: Character reference (appearance/style). Match this look consistently across all frames.',
      '- Image #2: Sprite layout EXAMPLE (use its tiling/layout structure ONLY; DO NOT copy its character design or content).',
      '',
      'Canvas & Layout:',
      '- Output ONE PNG image only.',
      '- Arrange EXACTLY 5 tiles horizontally (no vertical stack).',
      '- Each tile must be a PERFECT SQUARE, all tiles the SAME size (size is your choice, but all 5 must match), PERFECT WHITE BACKGROUND, NO BORDER in each tile.',
      '- Follow the 2D Pixel Art Style like Image #2. Cute, Simple, Flat 2D, Simple Colors, Pixel Art Style.',
      '',
      'Background / Alpha:',
      '- Fully transparent RGBA background (alpha=0) in all empty areas.',
      '- Do NOT add any background, shadow, outer glow, gradient, vignette, border, watermark, or text.',
      '- Avoid white/colored matte halos on edges. Use clean edges that blend on any background.',
      '',
      'Frames (index 0..4):',
      '- [0] sitting idle',
      '- [1] standing idle',
      '- [2] walk cycle (contact) to the right',
      '- [3] walk cycle (passing) to the right',
      '- [4] walk cycle (contact) to the right',
      'All frames must depict the same character with consistent proportions, palette, and lighting.',
      '',
      'Composition / Alignment / Scale:',
      '- Character faces RIGHT in all frames.',
      '- Keep a small safe padding inside each tile. Do NOT clip the character.',
      '- Keep head height and overall scale consistent across frames (no zooming).',
      '',
      'Style:',
      '- Clean 2D/flat shading (not photorealistic), crisp edges suitable for small pixel sizes.',
      '',
      'Output:',
      '- Return exactly one PNG with 5 horizontal SQUARE tiles of equal size. No additional text. Only 5 frames.',
    ].join('\n');
    const fullPrompt = prompt ? basePrompt + '\n' + String(prompt) : basePrompt;
    return await generateImage({
      apiKey,
      referenceImageBlob,
      prompt: fullPrompt,
    });
  }

  /**
   * 특별 쿠폰 코드 체크 함수
   * @param {string} apiKey - 입력된 API Key 또는 쿠폰 코드
   * @returns {boolean} 특별 코드 여부
   */
  function isSpecialCouponCode(apiKey) {
    const SPECIAL_CODES = ['hamburger'];
    return SPECIAL_CODES.includes(apiKey.toLowerCase().trim());
  }

  /**
   * Remove.bg API를 직접 호출하여 배경 제거
   * @param {object} args - 제거 인자
   * @param {string} args.apiKey - Remove.bg API Key
   * @param {Blob} args.imageBlob - 배경을 제거할 이미지
   * @returns {Promise<Blob>} 배경이 제거된 이미지
   */
  async function removeBackground({ apiKey, imageBlob }) {
    if (!apiKey) {
      throw new Error('Remove.bg API Key가 필요합니다.');
    }
    if (!imageBlob) {
      throw new Error('이미지가 필요합니다.');
    }

    const formData = new FormData();
    formData.append('size', 'auto');
    formData.append('image_file', imageBlob, 'image.png');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = '';
      try {
        const data = await response.json();
        errorMessage =
          data?.errors?.[0]?.title ||
          data?.errors?.[0]?.detail ||
          JSON.stringify(data);
      } catch (_) {
        errorMessage = await response.text();
      }
      throw new Error(
        errorMessage || `Remove.bg API 요청 실패 (HTTP ${response.status})`,
      );
    }

    return await response.blob();
  }

  /**
   * 서버리스 API를 통해 배경 제거 (특별 쿠폰 코드용)
   * @param {object} args - 제거 인자
   * @param {string} args.proxyServerUrl - 프록시 서버 URL
   * @param {string} args.extensionAuthKey - 확장 인증 키
   * @param {Blob} args.imageBlob - 배경을 제거할 이미지
   * @returns {Promise<Blob>} 배경이 제거된 이미지
   */
  async function removeBackgroundViaServerless({
    proxyServerUrl,
    extensionAuthKey,
    imageBlob,
  }) {
    if (!proxyServerUrl) {
      throw new Error('프록시 서버 URL이 설정되지 않았습니다.');
    }
    if (!extensionAuthKey) {
      throw new Error('확장 인증 키가 설정되지 않았습니다.');
    }
    if (!imageBlob) {
      throw new Error('이미지가 필요합니다.');
    }

    const endpoint = `${proxyServerUrl.replace(/\/$/, '')}/api/remove-bg`;

    const formData = new FormData();
    formData.append('image_file', imageBlob, 'sprite.png');
    formData.append('size', 'auto');
    formData.append('format', 'png');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-Extension-Auth': extensionAuthKey,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = '';
      try {
        const data = await response.json();
        errorMessage =
          data?.errors?.[0]?.title ||
          data?.errors?.[0]?.detail ||
          data?.message ||
          JSON.stringify(data);
      } catch (_) {
        errorMessage = await response.text();
      }
      throw new Error(
        errorMessage || `배경 제거 프록시 요청 실패 (HTTP ${response.status})`,
      );
    }

    return await response.blob();
  }

  /**
   * 서버리스 API를 통해 스프라이트 생성 (특별 쿠폰 코드용)
   * @param {object} args - 생성 인자
   * @param {string} args.proxyServerUrl - 프록시 서버 URL
   * @param {string} args.extensionAuthKey - 확장 인증 키
   * @param {Blob} args.referenceImageBlob - 참조 이미지
   * @param {string} [args.prompt] - 추가 프롬프트
   * @returns {Promise<Blob>} 생성된 스프라이트 시트
   */
  async function generateSpriteViaServerless({
    proxyServerUrl,
    extensionAuthKey,
    referenceImageBlob,
    prompt,
  }) {
    if (!proxyServerUrl) {
      throw new Error('프록시 서버 URL이 설정되지 않았습니다.');
    }
    if (!extensionAuthKey) {
      throw new Error('확장 인증 키가 설정되지 않았습니다.');
    }
    if (!referenceImageBlob) {
      throw new Error('참조 이미지가 필요합니다.');
    }

    const endpoint = `${proxyServerUrl.replace(/\/$/, '')}/api/generate-sprite`;

    const formData = new FormData();
    formData.append('image_file', referenceImageBlob, 'reference.png');
    if (prompt) {
      formData.append('prompt', prompt);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-Extension-Auth': extensionAuthKey,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = '';
      try {
        const data = await response.json();
        errorMessage =
          data?.errors?.[0]?.title ||
          data?.errors?.[0]?.detail ||
          data?.message ||
          JSON.stringify(data);
      } catch (_) {
        errorMessage = await response.text();
      }
      throw new Error(
        errorMessage || `서버리스 API 요청 실패 (HTTP ${response.status})`,
      );
    }

    return await response.blob();
  }

  window.nanobanana = {
    generateImage,
    generateSprite,
    isSpecialCouponCode,
    generateSpriteViaServerless,
    removeBackground,
    removeBackgroundViaServerless,
  };
})();
