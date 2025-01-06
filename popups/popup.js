const createNewBugi = () => {
  chrome.runtime.sendMessage({ action: 'create-new-bugi' });
};

const destroyBugi = () => {
  chrome.runtime.sendMessage({ action: 'destroy-bugi' });
};

const destroyAllBugis = () => {
  chrome.runtime.sendMessage({ action: 'destroy-all-bugis' });
};

document
  .getElementById('create-new-bugi')
  .addEventListener('click', createNewBugi);
document.getElementById('destroy-bugi').addEventListener('click', destroyBugi);
document
  .getElementById('destroy-all-bugis')
  .addEventListener('click', destroyAllBugis);
