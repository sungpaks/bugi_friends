if (!window.Bugi) {
  class Bugi {
    constructor() {
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
        top: Math.random() * (window.innerWidth - 40),
        left: Math.random() * (window.innerHeight - 40),
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

    assets = {
      sitting: chrome.runtime.getURL('images/bugi/sitting.png'),
      standing: chrome.runtime.getURL('images/bugi/standing.png'),
      walking01: chrome.runtime.getURL('images/bugi/walking00.png'),
      walking02: chrome.runtime.getURL('images/bugi/walking01.png'),
      walking03: chrome.runtime.getURL('images/bugi/walking02.png'),
    };

    createElements() {
      // Create image element
      this.img = document.createElement('img');
      this.img.id = 'bugi';
      this.img.className = 'bugi';
      this.img.src = this.assets.sitting;
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

      document.body.appendChild(this.img);
      document.body.appendChild(this.tooltip);

      this.tooltipText = document.createElement('div');
      this.tooltipText.className = 'bugi-tooltip-text';
      this.tooltipText.style = `
      visibility: ${this.tooltipVisible ? 'visible' : 'hidden'};
    `;
      this.tooltipText.innerText = this.emotions[this.emotionIndex];
      this.tooltip.appendChild(this.tooltipText);
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
      this.img.src = this.assets.standing;
      this.shiftX = e.clientX - this.position.left;
      this.shiftY = e.clientY - this.position.top;
      this.updateEmotion();
    }

    handleTouchStart(e) {
      if (this.inertiaRAF || this.walkRAF) return;
      this.tooltipVisible = true;
      this.isDragging = true;
      this.img.src = this.assets.standing;
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
        this.img.src = this.assets.sitting;
        this.updateEmotion();
        console.log(
          '놓는다!',
          this.position.left,
          this.position.top,
          this.velocity.x,
          this.velocity.y,
        );
        if (this.moved) this.startInertiaAnimation();
      }
    }

    handleTouchEnd() {
      this.tooltipVisible = false;
      if (this.isDragging) {
        this.isDragging = false;
        this.img.src = this.assets.sitting;
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
      const elapsed = timestamp - this.startTimestamp;

      if (elapsed > 5000) {
        this.stopWalk();
        this.walkRAF = null;
        return;
      }

      const currentPoseIndex = (Math.floor(elapsed / 500) % 3) + 1;
      if (currentPoseIndex !== this.poseIndex) {
        this.poseIndex = currentPoseIndex;
        this.setPose(`walking0${this.poseIndex}`);
      }

      this.moveTowardsTarget(targetX, targetY);

      this.walkRAF = requestAnimationFrame((newTimestamp) =>
        this.animateWalk(newTimestamp + 1, targetX, targetY),
      );
    }

    moveTowardsTarget(targetX, targetY) {
      const easeFactor = 0.001;
      const dx = targetX - this.position.left;
      const dy = targetY - this.position.top;

      this.position.left += dx * easeFactor;
      this.position.top += dy * easeFactor;
      this.updatePosition();
    }

    updatePosition() {
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
      this.img.src = this.assets.sitting;
      this.startTimestamp = 0;
      cancelAnimationFrame(this.walkRAF);
    }

    setPose(pose) {
      this.img.src = this.assets[pose] || this.assets.sitting;
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
      const decay = 0.95;
      const easeFactor = 0.0075;
      const rotationFactor = -0.2;
      this.setPose('standing');

      const animate = (timestamp, currentVelocity) => {
        currentVelocity.x *= decay;
        currentVelocity.y *= decay;

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
          if (this.inertiaRAF) {
            cancelAnimationFrame(this.inertiaRAF);
            this.inertiaRAF = null;
          }
          this.setPose('sitting');
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
      // console.log('Bugi removed');
    }
  }

  window.Bugi = Bugi;
}

if (!window.bugiArray) {
  window.bugiArray = [];
}
window.bugiArray.push(new window.Bugi());
