if (!window.bugiContainer) {
  const container = document.createElement('div');
  container.id = 'bugi-container';
  container.className = 'bugi-container'; // CSS 클래스 추가
  document.body.appendChild(container);
  window.bugiContainer = container;
}

if (!window.Bugi) {
  class Bugi {
    constructor(name = 'bugi') {
      this.name = name;
      this.createdAt = Date.now();
      this.assetsPromise = this.initAssets();
      this.isDragging = false;
      this.isWalking = false;
      this.tooltipVisible = false;
      this.emotions = [
        '( ੭ •౩• )੭',
        '(*•؎ •*)',
        "( 'ч' )",
        '٩( ᐛ )',
        '(´｡• ω •｡`)',
        '(っ˘ڡ˘ς)',
        '(｡•́︿•̀｡)',
        '( ｡ •̀ ⤙ •́ ｡ )',
        '¸◕ˇ‸ˇ◕˛',
        '৻(  •̀ ᗜ •́  ৻)',
        'ദ്ദി⑉･̆-･̆⑉)',
        '(๑•̀ – •́)و',
        '(𐐫ㆍ𐐃)',
        '〳 ͡° Ĺ̯ ͡° 〵',
        '٩( °ꇴ °)۶',
        '( ⸝⸝•ᴗ•⸝⸝ )੭⁾⁾',
        ',,ᴗ ̯ᴗ,,',
        '(๑ᵔ⤙ᵔ๑)',
        '( ˘༥˘  )',
        'ᴗ.ᴗᶻ ᶻ ᶻ',
        '[▓▓]ε¦)💤',
        'ᐠ( ᑒ  )ᐟ',
        '(´～｀*)｡｡oO',
      ];
      this.emotionIndex = Math.floor(Math.random() * this.emotions.length);
      this.position = {
        top: Math.random() * (window.innerHeight - 40),
        left: Math.random() * (window.innerWidth - 40),
      };
      this.initMargin = 0;
      this.startTimestamp = 0;
      this.currentPose = 'sitting';
      this.poseIndex = 1;

      // 관성운동 관련
      this.velocity = { x: 0, y: 0 };
      this.lastPosition = { x: 0, y: 0 };
      this.lastTimestamp = 0;

      this.inertiaRAF = null;
      this.walkRAF = null;
      this.autoWalkInterval = null;
      this.tooltipInterval = null;

      this.createElements();
      this.addEventListeners();
      this.setupAutoWalk();
      this.setuptooltip();
    }

    async initAssets() {
      this.assets = await this.constructor.preloadAssets(this.name);
      return this.assets;
    }

    async createElements() {
      // Create image element
      this.img = document.createElement('img');
      this.img.id = `${this.name}-img-${new Date().getTime()}`;
      this.img.className = 'bugi';
      if (!this.assetsPromise) {
        this.assetsPromise = this.initAssets();
      }
      await this.assetsPromise;
      if (this.assets && this.assets.sitting)
        this.img.src = this.assets.sitting;
      // this.img.style.width = '40px';
      // this.img.style.height = '40px';
      this.img.style.left = `${0}px`;
      this.img.style.top = `${0}px`;
      this.img.style.transform = `translate(${this.position.left}px, ${this.position.top}px)`;
      this.img.draggable = false;

      // Create tooltip
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'bugi-tooltip';
      this.tooltip.style.position = 'fixed';
      this.tooltip.style.whiteSpace = 'nowrap';
      this.tooltip.style.left = `${0}px`;
      this.tooltip.style.top = `${0}px`;
      this.img.onload = () => {
        this.tooltip.style.transform = `translate(${this.position.left + this.imgOffsetWidth / 2}px, ${this.position.top + this.imgOffsetHeight}px)`;
      };

      window.bugiContainer.appendChild(this.img);
      window.bugiContainer.appendChild(this.tooltip);

      this.tooltipText = document.createElement('div');
      this.tooltipText.className = 'bugi-tooltip-text';
      this.tooltipText.style = `
      visibility: ${this.tooltipVisible ? 'visible' : 'hidden'};
    `;
      this.tooltipText.innerText = this.emotions[this.emotionIndex];
      this.tooltip.appendChild(this.tooltipText);
    }

    static async preloadAssets(name) {
      if (!this.assetCache) this.assetCache = {};
      if (this.assetCache[name]) return this.assetCache[name];

      if (!this.assetPromises) this.assetPromises = {};
      if (!this.assetPromises[name]) {
        this.assetPromises[name] = this.loadAssets(name)
          .then((assets) => {
            this.assetCache[name] = assets;
            delete this.assetPromises[name];
            return assets;
          })
          .catch((error) => {
            delete this.assetPromises[name];
            throw error;
          });
      }

      return this.assetPromises[name];
    }

    static async loadAssets(name) {
      if (name === 'new-friend') {
        try {
          const canUseSession =
            typeof chrome !== 'undefined' &&
            chrome.storage &&
            chrome.storage.session &&
            typeof chrome.storage.session.get === 'function';
          if (canUseSession) {
            const { generatedSpriteSheet } = await chrome.storage.session.get([
              'generatedSpriteSheet',
            ]);
            if (generatedSpriteSheet && window.spriteSheet?.sliceSpriteSheet) {
              const { frames } = await window.spriteSheet.sliceSpriteSheet({
                source: generatedSpriteSheet,
              });
              return {
                sitting: frames[0].toDataURL('image/png'),
                standing: frames[1].toDataURL('image/png'),
                walking01: frames[2].toDataURL('image/png'),
                walking02: frames[3].toDataURL('image/png'),
                walking03: frames[4].toDataURL('image/png'),
              };
            }
          }
        } catch (e) {
          // ignore session read errors
        }
      }

      const baseAssets = {
        sitting: this.resolveAssetURL(`images/${name}/sitting.png`),
        standing: this.resolveAssetURL(`images/${name}/standing.png`),
        walking01: this.resolveAssetURL(`images/${name}/walking00.png`),
        walking02: this.resolveAssetURL(`images/${name}/walking01.png`),
        walking03: this.resolveAssetURL(`images/${name}/walking02.png`),
      };

      return this.preloadStaticAssets(baseAssets);
    }

    static async preloadStaticAssets(urlMap) {
      const entries = await Promise.all(
        Object.entries(urlMap).map(async ([pose, url]) => [
          pose,
          await this.fetchObjectURL(url),
        ]),
      );
      return Object.fromEntries(entries);
    }

    static async fetchObjectURL(url) {
      if (typeof url !== 'string') return url;
      if (url.startsWith('data:') || url.startsWith('blob:')) return url;

      try {
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(`Failed to load asset: ${response.status}`);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } catch (error) {
        console.warn('[Bugi] Failed to preload asset', url, error);
        return url;
      }
    }

    static resolveAssetURL(path) {
      try {
        if (
          typeof chrome !== 'undefined' &&
          chrome.runtime &&
          typeof chrome.runtime.getURL === 'function'
        ) {
          return chrome.runtime.getURL(path);
        }
      } catch (_) {}
      return path;
    }

    addEventListeners() {
      this.img.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      document.addEventListener('mouseup', () => this.handleMouseUp());
      this.img.addEventListener('click', () => this.startWalk('click'));
      this.img.addEventListener('mouseenter', () => this.showtooltip());
      this.img.addEventListener('mouseleave', () => this.hidetooltip());
      this.img.addEventListener('touchstart', (e) => this.handleTouchStart(e));
      document.addEventListener('touchmove', (e) => this.handleTouchMove(e), {
        passive: false,
      });
      document.addEventListener('touchend', () => this.handleTouchEnd());
    }

    get imgOffsetWidth() {
      return this?.img?.offsetWidth || 0;
    }

    get imgOffsetHeight() {
      return this?.img?.offsetHeight || 0;
    }

    handleMouseDown(e) {
      if (this.inertiaRAF || this.walkRAF) return;
      this.moved = false;
      this.isDragging = true;
      this.setPose('standing');
      this.shiftX = e.clientX - this.position.left;
      this.shiftY = e.clientY - this.position.top;
      this.updateEmotion();
    }

    handleTouchStart(e) {
      if (this.inertiaRAF || this.walkRAF) return;
      this.tooltipVisible = true;
      this.isDragging = true;
      this.setPose('standing');
      const touch = e.touches[0];
      this.shiftX = touch.clientX - this.position.left;
      this.shiftY = touch.clientY - this.position.top;
      this.updateEmotion();
    }

    handleMouseMove(e) {
      if (!this.isDragging) return;
      const clickX = e.clientX;
      const clickY = e.clientY;

      if (
        clickX - this.shiftX < 0 ||
        clickX + this.imgOffsetWidth - this.shiftX > window.innerWidth ||
        clickY - this.shiftY < 0 ||
        clickY + this.imgOffsetHeight - this.shiftY > window.innerHeight
      ) {
        this.isDragging = false;
        this.setPose('sitting');
        document.dispatchEvent(new MouseEvent('mouseup'));
        return;
      }

      this.moved = true;
      this.position.left = clickX - this.shiftX;
      this.position.top = clickY - this.shiftY;
      this.updatePosition();

      // 관성운동 관련
      const currentTimestamp = e.timeStamp;
      const dx = clickX - this.lastPosition.x;
      const dy = clickY - this.lastPosition.y;
      const dt = (currentTimestamp - this.lastTimestamp) / 1000;
      if (dt) {
        this.velocity.x = dx / dt;
        this.velocity.y = dy / dt;
      }
      this.lastPosition = { x: clickX, y: clickY };
      this.lastTimestamp = currentTimestamp;
    }

    handleTouchMove(e) {
      if (!this.isDragging) return;
      const touch = e.touches[0];
      const touchX = touch.clientX;
      const touchY = touch.clientY;

      if (
        touchX - this.shiftX < 0 ||
        touchX + this.imgOffsetWidth - this.shiftX > window.innerWidth ||
        touchY - this.shiftY < 0 ||
        touchY + this.imgOffsetHeight - this.shiftY > window.innerHeight
      ) {
        this.isDragging = false;
        this.setPose('sitting');
        document.dispatchEvent(new MouseEvent('touchend'));
        return;
      }

      e.preventDefault();
      this.position.left = touchX - this.shiftX;
      this.position.top = touchY - this.shiftY;
      this.updatePosition();

      // 관성운동 관련
      const currentTimestamp = e.timeStamp;
      const dx = touchX - this.lastPosition.x;
      const dy = touchY - this.lastPosition.y;
      const dt = (currentTimestamp - this.lastTimestamp) / 1000;
      if (dt) {
        this.velocity.x = dx / dt;
        this.velocity.y = dy / dt;
      }
      this.lastPosition = { x: touchX, y: touchY };
      this.lastTimestamp = currentTimestamp;
    }

    handleMouseUp() {
      if (this.isDragging) {
        this.isDragging = false;
        this.setPose('sitting');
        this.updateEmotion();
        // drop debug log removed
        if (this.moved) this.startInertiaAnimation();
      }
    }

    handleTouchEnd() {
      this.tooltipVisible = false;
      if (this.isDragging) {
        this.isDragging = false;
        this.setPose('sitting');
        this.updateEmotion();
        this.startInertiaAnimation();
        if (this.moved) this.startInertiaAnimation();
      }
    }

    showtooltip() {
      this.tooltipVisible = true;
      this.tooltipText.style.visibility = 'visible';
      // this.tooltipText.innerText = this.emotions[this.emotionIndex];
    }

    hidetooltip() {
      this.tooltipVisible = false;
      this.tooltipText.style.visibility = 'hidden';
    }

    updateEmotion() {
      this.tooltipText.innerText = this.isDragging
        ? '(o_O)'
        : this.emotions[this.emotionIndex];
    }

    setuptooltip() {
      this.tooltipInterval = setInterval(() => {
        if (!this.tooltipVisible && Math.random() < 0.1 && !this.isDragging) {
          this.showtooltip();
          this.getNewRandomEmotion();
          setTimeout(() => this.hidetooltip(), 2000);
        }
      }, 1000);
    }

    getNewRandomEmotion() {
      this.emotionIndex = Math.floor(Math.random() * this.emotions.length);
    }

    setupAutoWalk() {
      this.autoWalkInterval = setInterval(() => {
        if (!this.isWalking && !this.isDragging && Math.random() < 0.1) {
          this.startWalk('auto');
        }
      }, 1000);
    }

    /**
     *
     * @param {"auto" | "click"} method
     * @returns
     */
    startWalk(method) {
      if (this.isWalking || this.inertiaRAF) return;
      if (method === 'click' && this.moved) return;

      const range = 300;
      this.getNewRandomEmotion();
      this.isWalking = true;
      const targetX = Math.random() * range * 2 - range + this.position.left; // 현재 위치에서 -300 ~ +300 범위
      const targetY = Math.random() * range * 2 - range + this.position.top; // 현재 위치에서 -300 ~ +300 범위
      const clampedX = Math.max(
        0,
        Math.min(targetX, window.innerWidth - this.imgOffsetWidth),
      ); // 화면 내로 제한
      const clampedY = Math.max(
        0,
        Math.min(targetY, window.innerHeight - this.imgOffsetHeight),
      ); // 화면 내로 제한

      this.poseIndex = 1;
      this.setPose(`walking0${this.poseIndex}`);
      this.setFlipped(this.position.left - targetX > 0);

      this.walkRAF = requestAnimationFrame((timestamp) =>
        this.animateWalk(timestamp, clampedX, clampedY),
      );
    }

    animateWalk(timestamp, targetX, targetY) {
      if (!this.startTimestamp) this.startTimestamp = timestamp;
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;

      const elapsed = timestamp - this.startTimestamp;
      const deltaTime = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;

      if (elapsed > 5000) {
        this.stopWalk();
        return;
      }

      const currentPoseIndex = (Math.floor(elapsed / 500) % 3) + 1;
      if (currentPoseIndex !== this.poseIndex) {
        this.poseIndex = currentPoseIndex;
        this.setPose(`walking0${this.poseIndex}`);
      }

      this.moveTowardsTarget(targetX, targetY, deltaTime);

      this.walkRAF = requestAnimationFrame((newTimestamp) =>
        this.animateWalk(newTimestamp + 1, targetX, targetY),
      );
    }

    moveTowardsTarget(targetX, targetY, deltaTime = 16.67) {
      const normalizedDeltaTime = deltaTime / 16.67; // 60fps기준으로 정규화.
      const easeFactor = 0.001 * normalizedDeltaTime;

      const dx = targetX - this.position.left;
      const dy = targetY - this.position.top;

      this.position.left += dx * easeFactor;
      this.position.top += dy * easeFactor;
      this.updatePosition();
    }

    updatePosition() {
      // 요소가 아직 생성되지 않았거나 제거된 경우 안전 가드
      if (!this.img || !this.tooltip) return;
      // img와 tooltip의 위치를 함께 업데이트
      this.img.style.transform = `translate(${this.position.left}px, ${this.position.top}px) ${this.isFlipped ? 'scaleX(-1)' : ''} rotate(${this.degree || 0}deg)`;
      this.tooltip.style.transform = `translate(${this.position.left + this.img.width / 2}px, ${this.position.top + this.img.height}px)`;
      // this.img.style.left = `${this.position.left}px`;
      // this.img.style.top = `${this.position.top}px`;
      // this.tooltip.style.left = `${this.position.left + this.img.width / 2}px`;
      // this.tooltip.style.top = `${this.position.top + this.img.height}px`;
    }

    stopWalk() {
      this.isWalking = false;
      this.setPose('sitting');
      this.startTimestamp = 0;
      cancelAnimationFrame(this.walkRAF);
      this.walkRAF = null;
      this.lastTimestamp = 0;
    }

    setPose(pose) {
      const newSrc = this.assets?.[pose] || this.assets?.sitting || '';
      if (this.img.src === newSrc) return;
      this.img.src = newSrc;
      this.currentPose = pose;
    }

    async reloadAssetsFromSession() {
      // new-friend만 세션에서 리로드 가능
      if (this.name !== 'new-friend') return;

      // storage 권한이 불가한 문맥에서는 조용히 반환
      if (
        typeof chrome === 'undefined' ||
        !chrome.storage ||
        !chrome.storage.session
      )
        return;
      if (!window.spriteSheet?.sliceSpriteSheet) return;
      try {
        const { generatedSpriteSheet } = await chrome.storage.session.get([
          'generatedSpriteSheet',
        ]);
        if (generatedSpriteSheet) {
          const { frames } = await window.spriteSheet.sliceSpriteSheet({
            source: generatedSpriteSheet,
          });
          this.assets = {
            sitting: frames[0].toDataURL('image/png'),
            standing: frames[1].toDataURL('image/png'),
            walking01: frames[2].toDataURL('image/png'),
            walking02: frames[3].toDataURL('image/png'),
            walking03: frames[4].toDataURL('image/png'),
          };
          this.constructor.assetCache = this.constructor.assetCache || {};
          this.constructor.assetCache[this.name] = this.assets;
          this.assetsPromise = Promise.resolve(this.assets);
          // 현재 포즈 유지하여 즉시 반영
          this.setPose(this.currentPose);
        }
      } catch (e) {
        // ignore reload errors
      }
    }

    setFlipped(flipped) {
      this.isFlipped = flipped;
      if (flipped) this.img.classList.add('bugi-flipped');
      else this.img.classList.remove('bugi-flipped');
    }

    /**
     *
     * @param {string} degree
     */
    setRotate(degree) {
      // 회전의 중심을 현재 위치로 설정
      this.img.style.transformOrigin = `${this.position.left + this.img.width / 2}px ${this.position.top + this.img.height / 2}px`;

      // 회전 적용
      this.img.style.rotate = degree + 'deg';
    }

    startInertiaAnimation() {
      const baseDecay = 0.95;
      const baseEaseFactor = 0.0075;
      const rotationFactor = -0.2;
      this.setPose('standing');

      let lastTimestamp = 0;

      const animate = (timestamp, currentVelocity) => {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        const normalizedDeltaTime = deltaTime / 16.67; // 60fps기준으로 정규화.
        const decay = Math.pow(baseDecay, normalizedDeltaTime);
        const easeFactor = baseEaseFactor * normalizedDeltaTime;

        currentVelocity.x *= decay;
        currentVelocity.y *= decay;

        this.collisionCheckWhileInertiaAnimation(currentVelocity);

        let nextLeft = this.position.left + currentVelocity.x * easeFactor;
        let nextTop = this.position.top + currentVelocity.y * easeFactor;
        if (
          nextLeft < 0 ||
          nextLeft + this.imgOffsetWidth > window.innerWidth
        ) {
          currentVelocity.x *= -1;
        }
        if (
          nextTop < 0 ||
          nextTop + this.imgOffsetHeight > window.innerHeight
        ) {
          currentVelocity.y *= -1;
        }
        nextLeft = this.position.left + currentVelocity.x * easeFactor;
        nextTop = this.position.top + currentVelocity.y * easeFactor;
        this.position.left = nextLeft;
        this.position.top = nextTop;

        const rotateDegree =
          Math.sqrt(currentVelocity.x ** 2 + currentVelocity.y ** 2) *
          rotationFactor;
        this.degree = rotateDegree;
        this.updatePosition();
        this.setFlipped(currentVelocity.x < 0);

        if (
          Math.abs(currentVelocity.x) < 0.1 &&
          Math.abs(currentVelocity.y) < 0.1
        ) {
          this.stopInertiaAnimation();
          return;
        }
        this.inertiaRAF = requestAnimationFrame((newTimestamp) =>
          animate(newTimestamp, currentVelocity),
        );
      };

      this.inertiaRAF = requestAnimationFrame((timestamp) =>
        animate(timestamp, this.velocity),
      );
    }

    collisionCheckWhileInertiaAnimation(currentVelocity) {
      let arrayToCheck = [...window.bugiArray, ...window.frenchFriesArray];
      arrayToCheck.forEach((anotherBugi) => {
        if (anotherBugi.createdAt === this.createdAt) return;
        const thisCenter = {
          x: this.position.left + this.imgOffsetWidth / 2,
          y: this.position.top + this.imgOffsetHeight / 2,
        };
        const anotherCenter = {
          x: anotherBugi.position.left + anotherBugi.imgOffsetWidth / 2,
          y: anotherBugi.position.top + anotherBugi.imgOffsetHeight / 2,
        };
        const isColliding = checkCollision(
          thisCenter.x,
          thisCenter.y,
          anotherCenter.x,
          anotherCenter.y,
          this.imgOffsetWidth / 2,
          anotherBugi.imgOffsetWidth / 2,
        );
        if (isColliding && anotherBugi.createdAt !== this.lastCollisionBugi) {
          const { v1x, v1y, v2x, v2y } = performCollision(
            thisCenter.x,
            thisCenter.y,
            anotherCenter.x,
            anotherCenter.y,
            currentVelocity.x,
            currentVelocity.y,
            anotherBugi.velocity.x,
            anotherBugi.velocity.y,
          );
          currentVelocity.x = v1x;
          currentVelocity.y = v1y;

          anotherBugi.velocity.x = v2x;
          anotherBugi.velocity.y = v2y;

          if (anotherBugi.isWalking) {
            anotherBugi.stopWalk();
          }
          anotherBugi.startInertiaAnimation();
          this.lastCollisionBugi = anotherBugi.createdAt;
          anotherBugi.lastCollisionBugi = this.createdAt;

          return {
            v1x,
            v1y,
          };
        }
      });
    }

    stopInertiaAnimation() {
      if (this.inertiaRAF) {
        cancelAnimationFrame(this.inertiaRAF);
        this.inertiaRAF = null;
      }
      this.setPose('sitting');
      this.lastCollisionBugi = null;
      this.lastTimestamp = 0;
      this.startTimestamp = 0;
    }

    _destroy() {
      if (this.img) this.img.remove();
      if (this.tooltip) this.tooltip.remove();

      // 이벤트 리스너 제거
      document.removeEventListener('mousemove', this.handleMouseMove);
      document.removeEventListener('mouseup', this.handleMouseUp);
      this.img.removeEventListener('mousedown', this.handleMouseDown);
      this.img.removeEventListener('click', this.startWalk);
      this.img.removeEventListener('mouseenter', this.showtooltip);
      this.img.removeEventListener('mouseleave', this.hidetooltip);
      this.img.removeEventListener('touchstart', this.handleTouchStart);
      document.removeEventListener('touchend', this.handleTouchEnd);
      document.removeEventListener('touchmove', this.handleTouchMove);

      // interval 제거
      clearInterval(this.autoWalkInterval);
      clearInterval(this.tooltipInterval);

      // 애니메이션 중지
      cancelAnimationFrame(this.walkRAF);
      // removed debug log
    }
  }

  window.Bugi = Bugi;
}
