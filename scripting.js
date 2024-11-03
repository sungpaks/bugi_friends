const extensions = 'https://developer.chrome.com/docs/extensions';
const webstore = 'https://developer.chrome.com/docs/webstore';

chrome.action.onClicked.addListener(async (tab) => {
  console.log("I'm clicked");

  if (tab.url.startsWith(extensions) || tab.url.startsWith(webstore)) {
    // Retrieve the action badge to check if the extension is 'ON' or 'OFF'
    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
    // Next state will always be the opposite
    const nextState = prevState === 'ON' ? 'OFF' : 'ON';

    // Set the action badge to the next state
    await chrome.action.setBadgeText({
      tabId: tab.id,
      text: nextState,
    });
  }

  chrome.scripting
    .executeScript({
      target: { tabId: tab.id },
      // files: ['bugi.js'],
      function: mountBugi,
    })
    .then(() => {
      console.log('Bugi injected');
    })
    .catch((error) => {
      console.error('Failed to inject bugi:', error);
    });
});

function mountBugi() {
  console.log('bugibugi');
  const bugi = document.createElement('div');
  bugi.id = 'bugi';
  bugi.className = 'bugi';
  bugi.style.width = '50vw';
  bugi.style.height = '50vh';
  bugi.style.position = 'fixed';
  bugi.style.top = '25vh';
  bugi.style.left = '25vw';
  bugi.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  document.body.appendChild(bugi);
}
