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
    setPopup('popup', tab.id);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message.action || !currentTabId) {
    return;
  }
  if (message.action === 'create-new-bugi') {
    createNewBugi(currentTabId);
    setBadgeText(bugiCount.toString(), currentTabId);
  } else if (message.action === 'destroy-bugi') {
    destroyBugi(currentTabId);
    setBadgeText(bugiCount.toString(), currentTabId);
  } else if (message.action === 'destroy-all-bugis') {
    destroyAllBugis(currentTabId);
    setBadgeText('', currentTabId);
  }
});
