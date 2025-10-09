const extensions = 'https://developer.chrome.com/docs/extensions';
const webstore = 'https://developer.chrome.com/docs/webstore';

let currentTabId = null;
let bugiCount = 0;
const bugiMaxCount = 50;

function setPopup(type, tabId) {
  chrome.action.setPopup({
    tabId,
    popup: chrome.runtime.getURL(`popups/${type}.html`),
  });
  chrome.action.openPopup();
}

async function setBadgeText(text, tabId) {
  await chrome.action.setBadgeText({
    tabId,
    text,
  });
}

function createNewBugi(tabId) {
  if (bugiCount >= bugiMaxCount) {
    return;
  }
  chrome.scripting.insertCSS({
    target: { tabId: tabId },
    files: ['bugi.css'],
  });
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['bugi.js'],
  });
  bugiCount++;
}

function destroyBugi(tabId) {
  if (bugiCount <= 0) {
    return;
  }
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: () => {
      const bugiToDestroy = window.bugiArray.shift();
      bugiToDestroy._destroy();
      // delete window.bugi;
    },
  });
  bugiCount--;
}

function destroyAllBugis(tabId) {
  if (bugiCount <= 0) {
    return;
  }
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: () => {
      window.bugiArray.forEach((bugi) => {
        bugi._destroy();
      });
      window.bugiArray = [];
      // delete window.bugi;
    },
  });
  bugiCount = 0;
}

const frenchFriesMaxCount = 50;
let frenchFriesCount = 0;
function createNewFrenchFries(tabId) {
  if (frenchFriesCount >= frenchFriesMaxCount) {
    return;
  }
  chrome.scripting.insertCSS({
    target: { tabId: tabId },
    files: ['bugi.css'],
  });
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['french-fries.js'],
  });
  frenchFriesCount++;
}

function destroyFrenchFries(tabId) {
  if (frenchFriesCount <= 0) {
    return;
  }
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: () => {
      const bugiToDestroy = window.frenchFriesArray.shift();
      bugiToDestroy._destroy();
      // delete window.bugi;
    },
  });
  frenchFriesCount--;
}

function destroyAllFrenchFries(tabId) {
  if (frenchFriesCount <= 0) {
    return;
  }
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: () => {
      window.frenchFriesArray.forEach((frenchFries) => {
        frenchFries._destroy();
      });
      window.frenchFriesArray = [];
    },
  });
  frenchFriesCount = 0;
}

const newFriendMaxCount = 50;
let newFriendCount = 0;
function createNewFriend(tabId) {
  if (newFriendCount >= newFriendMaxCount) {
    return;
  }
  chrome.scripting.insertCSS({
    target: { tabId: tabId },
    files: ['bugi.css'],
  });
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['new-friend.js'],
  });
  newFriendCount++;
}

function destroyNewFriend(tabId) {
  if (newFriendCount <= 0) {
    return;
  }
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: () => {
      const friendToDestroy = window.newFriendArray.shift();
      friendToDestroy._destroy();
    },
  });
  newFriendCount--;
}

function destroyAllNewFriends(tabId) {
  if (newFriendCount <= 0) {
    return;
  }
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: () => {
      window.newFriendArray.forEach((friend) => {
        friend._destroy();
      });
      window.newFriendArray = [];
    },
  });
  newFriendCount = 0;
}

function isRestrictedBrowserPage(url) {
  if (!url) {
    return true;
  }

  const urlProtocol = new URL(url).protocol;
  return urlProtocol === 'chrome:' || urlProtocol === 'about:';
}

chrome.action.onClicked.addListener(async (tab) => {
  currentTabId = tab.id;
  const currentUrl = tab.url;
  const isRestricted = isRestrictedBrowserPage(currentUrl);
  // Retrieve the action badge to check if the extension is 'ON' or 'OFF'
  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
  // Next state will always be the opposite
  const nextState = prevState === 'ON' ? 'OFF' : 'ON';

  if (isRestricted) {
    setPopup('restricted', tab.id);
    await setBadgeText('⚠️', tab.id);
  } else if (nextState === 'OFF') {
    // destroyBugi(tab.id);
  } else {
    // createNewBugi(tab.id);
    // declare-bugi.js보다 먼저 spritesheet 유틸을 주입해야 세션 스프라이트를 읽을 수 있음
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['lib/spritesheet.js'],
    });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['declare-bugi.js'],
    });
    setPopup('popup', tab.id);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message.action || !currentTabId) {
    return;
  }
  switch (message.action) {
    case 'create-new-bugi':
      createNewBugi(currentTabId);
      setBadgeText(bugiCount.toString(), currentTabId);
      break;
    case 'destroy-bugi':
      destroyBugi(currentTabId);
      setBadgeText(bugiCount.toString(), currentTabId);
      break;
    case 'destroy-all-bugis':
      destroyAllBugis(currentTabId);
      setBadgeText('', currentTabId);
      break;
    case 'create-new-french-fries':
      createNewFrenchFries(currentTabId);
      setBadgeText(frenchFriesCount.toString(), currentTabId);
      break;
    case 'destroy-french-fries':
      destroyFrenchFries(currentTabId);
      setBadgeText(frenchFriesCount.toString(), currentTabId);
      break;
    case 'destroy-all-french-fries':
      destroyAllFrenchFries(currentTabId);
      setBadgeText('', currentTabId);
      break;
    case 'create-new-friend':
      createNewFriend(currentTabId);
      setBadgeText(newFriendCount.toString(), currentTabId);
      break;
    case 'destroy-new-friend':
      destroyNewFriend(currentTabId);
      setBadgeText(newFriendCount.toString(), currentTabId);
      break;
    case 'destroy-all-new-friends':
      destroyAllNewFriends(currentTabId);
      setBadgeText('', currentTabId);
      break;
    default:
      break;
  }
});
