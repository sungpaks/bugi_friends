const createNewBugi = () => {
  chrome.runtime.sendMessage({ action: 'create-new-bugi' });
};

const destroyBugi = () => {
  chrome.runtime.sendMessage({ action: 'destroy-bugi' });
};

const destroyAllBugis = () => {
  chrome.runtime.sendMessage({ action: 'destroy-all-bugis' });
};

const createNewFrenchFries = () => {
  chrome.runtime.sendMessage({ action: 'create-new-french-fries' });
};

const destroyFrenchFries = () => {
  chrome.runtime.sendMessage({ action: 'destroy-french-fries' });
};

const destroyAllFrenchFries = () => {
  chrome.runtime.sendMessage({ action: 'destroy-all-french-fries' });
};

document
  .getElementById('create-new-bugi')
  .addEventListener('click', createNewBugi);
document.getElementById('destroy-bugi').addEventListener('click', destroyBugi);
document
  .getElementById('destroy-all-bugis')
  .addEventListener('click', destroyAllBugis);
document
  .getElementById('create-new-french-fries')
  .addEventListener('click', createNewFrenchFries);
document
  .getElementById('destroy-french-fries')
  .addEventListener('click', destroyFrenchFries);
document
  .getElementById('destroy-all-french-fries')
  .addEventListener('click', destroyAllFrenchFries);
