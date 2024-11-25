if (!window.Bugi) {
  class Bugi {
    constructor() {
      this.isDragging = false;
      this.isWalking = false;
      this.tooltipVisible = false;
      this.emotions = [
        '( ´ ▽ ` )',
        '(´･ω･`)',
        '(´｡• ω •｡`)',
        '(っ˘ڡ˘ς)',
        '(｡•́︿•̀｡)',
        '(´～｀*)｡｡oO',
      ];
      this.emotionIndex = Math.floor(Math.random() * this.emotions.length);
      this.position = { top: 50, left: 50 };
      this.initMargin = 0;
      this.startTimestamp = 0;
      this.currentPose = 'sitting';

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
      this.img.style.left = `${this.position.left}px`;
      this.img.style.top = `${this.position.top}px`;
      this.img.draggable = false;

      // Create tooltip
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'bugi-tooltip';
      this.tooltip.style.position = 'fixed';
      this.tooltip.style.whiteSpace = 'nowrap';
      this.img.onload = () => {
        this.tooltip.style.left = `${this.position.left + this.img.width / 2}px`;
        this.tooltip.style.top = `${this.position.top + this.img.height}px`;
      };

      document.body.appendChild(this.img);
      document.body.appendChild(this.tooltip);

      this.tooltipText = document.createElement('div');
      this.tooltipText.className = 'bugi-tooltip-text';
      this.tooltipText.style = `
      width: 105px;
      height: 40px;
      visibility: ${this.tooltipVisible ? 'visible' : 'hidden'};
      padding-left: 0;
      padding-right: 0;
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

    handleMouseDown(e) {
      this.moved = false;
      this.isDragging = true;
      this.img.src = this.assets.standing;
      this.shiftX = e.clientX - this.img.offsetLeft;
      this.shiftY = e.clientY - this.img.offsetTop;
      this.updateEmotion();
    }

    handleTouchStart(e) {
      this.tooltipVisible = true;
      this.isDragging = true;
      this.img.src = this.assets.standing;
      const touch = e.touches[0];
      this.shiftX = touch.clientX - this.img.offsetLeft;
      this.shiftY = touch.clientY - this.img.offsetTop;
      this.updateEmotion();
    }

    handleMouseMove(e) {
      if (!this.isDragging) return;

      this.moved = true;
      this.position.left = e.clientX - this.shiftX;
      this.position.top = e.clientY - this.shiftY;
      this.updatePosition();
    }

    handleTouchMove(e) {
      if (!this.isDragging) return;
      const touch = e.touches[0];
      e.preventDefault();
      this.position.left = touch.clientX - this.shiftX;
      this.position.top = touch.clientY - this.shiftY;
      this.updatePosition();
    }

    handleMouseUp() {
      if (this.isDragging) {
        this.isDragging = false;
        this.img.src = this.assets.sitting;
        this.updateEmotion();
      }
    }

    handleTouchEnd() {
      this.tooltipVisible = false;
      if (this.isDragging) {
        this.isDragging = false;
        this.img.src = this.assets.sitting;
        this.updateEmotion();
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
      if (this.isWalking) return;
      if (method === 'click' && this.moved) return;

      this.getNewRandomEmotion();
      this.isWalking = true;
      const targetX =
        Math.random() *
        (window.innerWidth - this.img.offsetWidth - this.initMargin);
      const targetY =
        Math.random() *
        (window.innerHeight - this.img.offsetHeight - this.initMargin);
      this.setPose('walking');
      this.isFlipped = this.position.left - targetX > 0;

      this.walkRAF = requestAnimationFrame((timestamp) =>
        this.animateWalk(timestamp, 0, targetX, targetY),
      );
    }

    animateWalk(timestamp, count, targetX, targetY) {
      if (!this.startTimestamp) this.startTimestamp = timestamp;
      const elapsed = timestamp - this.startTimestamp;

      if (elapsed > 5000) {
        this.stopWalk();
        return;
      }

      if (count % 30 === 0) this.switchPose();
      if (count % 10 === 0) this.moveTowardsTarget(targetX, targetY);

      this.walkRAF = requestAnimationFrame((newTimestamp) =>
        this.animateWalk(newTimestamp, count + 1, targetX, targetY),
      );
    }

    moveTowardsTarget(targetX, targetY) {
      const dx = targetX - this.position.left;
      const dy = targetY - this.position.top;

      this.position.left += dx / 100;
      this.position.top += dy / 100;
      this.updatePosition();

      if (dx < 0) this.img.classList.add('flipped');
      else this.img.classList.remove('flipped');
    }

    updatePosition() {
      // img와 tooltip의 위치를 함께 업데이트
      this.img.style.left = `${this.position.left}px`;
      this.img.style.top = `${this.position.top}px`;
      this.tooltip.style.left = `${this.position.left + this.img.width / 2}px`;
      this.tooltip.style.top = `${this.position.top + this.img.height}px`;
    }

    switchPose() {
      if (this.img.src === this.assets.walking01)
        this.img.src = this.assets.walking02;
      else if (this.img.src === this.assets.walking02)
        this.img.src = this.assets.walking03;
      else this.img.src = this.assets.walking01;
    }

    stopWalk() {
      this.isWalking = false;
      this.img.src = this.assets.sitting;
      this.startTimestamp = 0;
      cancelAnimationFrame(this.walkRAF);
    }

    setPose(pose) {
      switch (pose) {
        case 'walking':
          this.img.src = this.assets.walking01;
          break;
        case 'sitting':
        default:
          this.img.src = this.assets.sitting;
          break;
      }
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

window.bugi = new window.Bugi();
