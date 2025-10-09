// spritesheet utilities

(function initSpriteSheet() {
  if (window.spriteSheet) return;

  const FRAME_SIZE = 48;
  const FRAME_COUNT = 5;

  function loadImage(dataUrlOrUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrlOrUrl;
    });
  }

  async function sliceSpriteSheet({ source }) {
    const img = await loadImage(source);
    const isHorizontal =
      img.width === FRAME_SIZE * FRAME_COUNT && img.height === FRAME_SIZE;
    const isVertical =
      img.height === FRAME_SIZE * FRAME_COUNT && img.width === FRAME_SIZE;

    const frames = [];

    function drawNormalizedFrame(sx, sy, sw, sh) {
      const canvas = document.createElement('canvas');
      canvas.width = FRAME_SIZE;
      canvas.height = FRAME_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, FRAME_SIZE, FRAME_SIZE);
      const scale = Math.min(FRAME_SIZE / sw, FRAME_SIZE / sh);
      const dw = Math.floor(sw * scale);
      const dh = Math.floor(sh * scale);
      const dx = Math.floor((FRAME_SIZE - dw) / 2);
      const dy = Math.floor((FRAME_SIZE - dh) / 2);
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
      return canvas;
    }

    if (isHorizontal || isVertical) {
      for (let i = 0; i < FRAME_COUNT; i++) {
        if (isHorizontal) {
          frames.push(
            drawNormalizedFrame(i * FRAME_SIZE, 0, FRAME_SIZE, FRAME_SIZE),
          );
        } else {
          frames.push(
            drawNormalizedFrame(0, i * FRAME_SIZE, FRAME_SIZE, FRAME_SIZE),
          );
        }
      }
      const meta = {
        frameSize: FRAME_SIZE,
        frameCount: FRAME_COUNT,
        orientation: isHorizontal ? 'horizontal' : 'vertical',
        normalized: false,
        sourceSize: { width: img.width, height: img.height },
      };
      return { frames, meta };
    }

    // Fallback: assume horizontal sheet; split width into 5 equal parts, normalize to 48x48
    const assumedFrameWidth = Math.max(1, Math.floor(img.width / FRAME_COUNT));
    const assumedFrameHeight = img.height;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const sx = Math.min(
        i * assumedFrameWidth,
        Math.max(0, img.width - assumedFrameWidth),
      );
      const sy = 0;
      frames.push(
        drawNormalizedFrame(sx, sy, assumedFrameWidth, assumedFrameHeight),
      );
    }
    const meta = {
      frameSize: FRAME_SIZE,
      frameCount: FRAME_COUNT,
      orientation: 'horizontal-assumed',
      normalized: true,
      sourceSize: { width: img.width, height: img.height },
    };
    return { frames, meta };
  }

  async function loadFramesFromEitherSource(name) {
    // new-friend가 아닌 경우 세션 스토리지 체크 안 함
    // 항상 기본 이미지 사용
    const base = chrome.runtime.getURL(`images/${name}`);
    const urls = {
      sitting: `${base}/sitting.png`,
      standing: `${base}/standing.png`,
      walking01: `${base}/walking00.png`,
      walking02: `${base}/walking01.png`,
      walking03: `${base}/walking02.png`,
    };

    async function toCanvas(url) {
      const img = await loadImage(url);
      const canvas = document.createElement('canvas');
      canvas.width = FRAME_SIZE;
      canvas.height = FRAME_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, FRAME_SIZE, FRAME_SIZE);
      ctx.drawImage(img, 0, 0, FRAME_SIZE, FRAME_SIZE);
      return canvas;
    }

    return {
      sitting: await toCanvas(urls.sitting),
      standing: await toCanvas(urls.standing),
      walking01: await toCanvas(urls.walking01),
      walking02: await toCanvas(urls.walking02),
      walking03: await toCanvas(urls.walking03),
    };
  }

  window.spriteSheet = { sliceSpriteSheet, loadFramesFromEitherSource };
})();
