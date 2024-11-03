const extensions = 'https://developer.chrome.com/docs/extensions';
const webstore = 'https://developer.chrome.com/docs/webstore';

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.startsWith(extensions) || tab.url.startsWith(webstore)) {
    // Retrieve the action badge to check if the extension is 'ON' or 'OFF'
    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
    // Next state will always be the opposite
    const nextState = prevState === 'ON' ? 'OFF' : 'ON';

    if (nextState === 'OFF') {
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
      chrome.scripting
        .executeScript({
          target: { tabId: tab.id },
          files: ['bugi.js'],
        })
        .then(() => {
          console.log('Bugi injected');
        })
        .catch((error) => {
          console.error('Failed to inject bugi:', error);
        });
    }

    // Set the action badge to the next state
    await chrome.action.setBadgeText({
      tabId: tab.id,
      text: nextState,
    });
  }
});
