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

    // 2. 이미지를 Base64로 인코딩
    const base64Image = await blobToBase64(referenceImageBlob);

    // 3. API 요청 본문(JSON) 구성
    const requestBody = {
      // "contents"는 대화의 한 턴을 의미합니다.
      contents: [
        {
          // "parts"에 텍스트와 이미지를 함께 넣어 멀티모달 입력을 구성합니다.
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: referenceImageBlob.type || 'image/png',
                data: base64Image,
              },
            },
          ],
        },
      ],
      // 이미지 생성을 위한 추가 설정 (필요 시)
      generationConfig: {
        // temperature: 0.4,
        // topK: 32,
        // topP: 1,
        maxOutputTokens: 8192, // 모델에 따라 최댓값 상이
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
   * Convenience wrapper for our 5-frame 48x48 sprite sheet spec.
   * Returns the raw PNG Blob of the generated sprite sheet.
   */
  async function generateSprite({ apiKey, referenceImageBlob, prompt }) {
    const basePrompt = [
      'Create a single PNG sprite sheet for a cute character.',
      'The sheet must contain exactly 5 frames, each 48x48 pixels.',
      'Frames must be ordered: [sitting, standing, walking0, walking1, walking2].',
      'Use a fully transparent background (no padding, no margins).',
      'Return the 5 frames in a single row of 240x48 OR a single column of 48x240. (prefer row - 240x48)',
      'Ensure clean edges and consistent style across frames.',
    ].join('\n');
    const fullPrompt = prompt ? basePrompt + '\n' + String(prompt) : basePrompt;
    return await generateImage({
      apiKey,
      referenceImageBlob,
      prompt: fullPrompt,
    });
  }

  window.nanobanana = { generateImage, generateSprite };
})();
