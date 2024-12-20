const extensions = 'https://developer.chrome.com/docs/extensions';
const webstore = 'https://developer.chrome.com/docs/webstore';

let currentTabId = null;

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
  chrome.scripting.insertCSS({
    target: { tabId: tabId },
    files: ['bugi.css'],
  });
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['bugi.js'],
  });
}

function destroyBugi(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: () => {
      window.bugi._destroy();
      delete window.bugi;
    },
  });
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
    setBadgeText('ON', currentTabId);
  } else if (message.action === 'destroy-bugi') {
    destroyBugi(currentTabId);
    setBadgeText('OFF', currentTabId);
  }
});
