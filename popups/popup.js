document
  .getElementById('create-new-bugi')
  .addEventListener('click', () =>
    chrome.runtime.sendMessage({ action: 'create-new-bugi' }),
  );
document
  .getElementById('destroy-bugi')
  .addEventListener('click', () =>
    chrome.runtime.sendMessage({ action: 'destroy-bugi' }),
  );
