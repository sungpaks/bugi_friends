const sitting = chrome.runtime.getURL('./sitting.png');
const walking01 = chrome.runtime.getURL('./walking00.png');
const walking02 = chrome.runtime.getURL('./walking01.png');
const walking03 = chrome.runtime.getURL('./walking02.png');
const standing = chrome.runtime.getURL('./standing.png');

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
    this.position = { top: 200, left: 100 };
    this.initMargin = 0;
    this.startTimestamp = 0;

    this.createElements();
    this.addEventListeners();
    this.setupAutoWalk();
    this.setupTooltip();
  }

  createElements() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'bugi';
    this.container.style.position = 'fixed';
    this.container.style.left = `${this.position.left}px`;
    this.container.style.top = `${this.position.top}px`;

    // Create image element
    this.img = document.createElement('img');
    this.img.src = sitting;
    this.img.style.position = 'absolute';
    this.container.appendChild(this.img);

    // Create tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip';
    this.tooltip.style.position = 'fixed';
    this.tooltip.style.visibility = 'hidden';
    this.tooltip.style.left = `${this.position.left - 35}px`;
    this.tooltip.style.top = `${this.position.top}px`;
    this.tooltip.innerText = this.emotions[this.emotionIndex];
    this.container.appendChild(this.tooltip);

    document.body.appendChild(this.container);
  }

  addEventListeners() {
    this.container.addEventListener('mousedown', (e) =>
      this.handleMouseDown(e),
    );
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mouseup', () => this.handleMouseUp());
    this.container.addEventListener('click', () => this.startWalk());
    this.container.addEventListener('mouseenter', () => this.showTooltip());
    this.container.addEventListener('mouseleave', () => this.hideTooltip());
  }

  handleMouseDown(e) {
    this.isDragging = true;
    this.img.src = standing;
    this.shiftX = e.clientX - this.container.offsetLeft;
    this.shiftY = e.clientY - this.container.offsetTop;
    this.updateEmotion();
  }

  handleMouseMove(e) {
    if (!this.isDragging) return;

    this.position.left = e.clientX - this.shiftX;
    this.position.top = e.clientY - this.shiftY;
    this.container.style.left = `${this.position.left}px`;
    this.container.style.top = `${this.position.top}px`;
  }

  handleMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.img.src = sitting;
    }
  }

  showTooltip() {
    this.tooltip.style.visibility = 'visible';
    this.updateEmotion();
  }

  hideTooltip() {
    this.tooltip.style.visibility = 'hidden';
  }

  updateEmotion() {
    this.emotionIndex = Math.floor(Math.random() * this.emotions.length);
    this.tooltip.innerText = this.isDragging
      ? '(o_O)'
      : this.emotions[this.emotionIndex];
  }

  setupTooltip() {
    setInterval(() => {
      if (!this.tooltipVisible && Math.random() < 0.1 && !this.isDragging) {
        this.showTooltip();
        setTimeout(() => this.hideTooltip(), 2000);
      }
    }, 2000);
  }

  setupAutoWalk() {
    setInterval(() => {
      if (!this.isWalking && !this.isDragging && Math.random() < 0.1) {
        this.startWalk();
      }
    }, 2000);
  }

  startWalk() {
    if (this.isWalking) return;

    this.isWalking = true;
    const targetX =
      Math.random() *
      (window.innerWidth - this.container.offsetWidth - this.initMargin);
    const targetY =
      Math.random() *
      (window.innerHeight - this.container.offsetHeight - this.initMargin);
    this.setPose('walking');
    this.isFlipped = this.position.left - targetX > 0;

    this.walkInterval = requestAnimationFrame((timestamp) =>
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

    this.walkInterval = requestAnimationFrame((newTimestamp) =>
      this.animateWalk(newTimestamp, count + 1, targetX, targetY),
    );
  }

  moveTowardsTarget(targetX, targetY) {
    const dx = targetX - this.position.left;
    const dy = targetY - this.position.top;

    this.position.left += dx / 100;
    this.position.top += dy / 100;
    this.container.style.left = `${this.position.left}px`;
    this.container.style.top = `${this.position.top}px`;

    if (dx < 0) this.container.classList.add('flipped');
    else this.container.classList.remove('flipped');
  }

  switchPose() {
    if (this.img.src === walking01) this.img.src = walking02;
    else if (this.img.src === walking02) this.img.src = walking03;
    else this.img.src = walking01;
  }

  stopWalk() {
    this.isWalking = false;
    this.img.src = sitting;
    this.startTimestamp = 0;
    cancelAnimationFrame(this.walkInterval);
  }

  setPose(pose) {
    switch (pose) {
      case 'walking':
        this.img.src = walking01;
        break;
      case 'sitting':
      default:
        this.img.src = sitting;
        break;
    }
  }
}

// 인스턴스 생성
const bugi = new Bugi();
