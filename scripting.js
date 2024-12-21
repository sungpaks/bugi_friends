const extensions = 'https://developer.chrome.com/docs/extensions';
const webstore = 'https://developer.chrome.com/docs/webstore';

function setPopup(type, tabId) {
  chrome.action.setPopup({
    tabId,
    popup: chrome.runtime.getURL(`popups/${type}.html`),
  });
  chrome.action.openPopup();
}

function isRestrictedBrowserPage(url) {
  if (!url) {
    return true;
  }

  const urlProtocol = new URL(url).protocol;
  return urlProtocol === 'chrome:' || urlProtocol === 'about:';
}

const STATE = {
  ON: 'ON',
  OFF: 'OFF',
  RESTRICTED: 'RESTRICTED',
};

chrome.action.onClicked.addListener(async (tab) => {
  const currentUrl = tab.url;
  const isRestricted = isRestrictedBrowserPage(currentUrl);
  // Retrieve the action badge to check if the extension is 'ON' or 'OFF'
  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
  // Next state will always be the opposite
  const nextState = prevState === 'ON' ? STATE.ON : STATE.OFF;

  if (isRestricted) {
    setPopup('restricted', tab.id);
  } else if (nextState === 'OFF') {
    // Remove the Bugi element
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        window.bugi._destroy();
        delete window.bugi;
      },
    });
  } else {
    chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['bugi.css'],
    });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['bugi.js'],
    });
  }

  // Set the action badge to the next state
  await chrome.action.setBadgeText({
    tabId: tab.id,
    text: isRestricted ? '⚠️' : nextState,
  });
  // if (tab.url.startsWith(extensions) || tab.url.startsWith(webstore)) {

  // }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && isRestrictedBrowserPage(changeInfo.url)) {
    setPopup('restricted', tabId);
  }
});
