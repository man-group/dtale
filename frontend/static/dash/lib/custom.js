require('./publicDashPath');

import axios from 'axios';

const updateLanguage = (e, language) => {
  e.preventDefault();
  let path = `/dtale/update-language?language=${language}`;
  if (window.resourceBaseUrl) {
    path = `${window.resourceBaseUrl}/${path}`;
  }
  axios
    .get(path)
    .then(() => {
      window.location.reload();
    })
    .catch((err) => console.log(err)); // eslint-disable-line no-console
};

const openCodeSnippet = (e) => {
  e.preventDefault();
  window.code_popup = { code: document.getElementById('chart-code').value, title: 'Charts' };

  let path = 'dtale/code-popup';
  if (window.resourceBaseUrl) {
    path = `${window.resourceBaseUrl}/${path}`;
  }
  window.open(`${window.location.origin}/${path}`, '_blank', `titlebar=1,location=1,status=1,width=700,height=450`);
};

const copy = (e) => {
  e.preventDefault();
  const textCmp = document.getElementById('copy-text');
  let chartLink = e.target.parentNode.getAttribute('href');
  const webRoot = window.resourceBaseUrl;
  if (webRoot) {
    chartLink = `${webRoot}${chartLink}`;
  }
  textCmp.value = `${window.location.origin}/${chartLink}`;
  textCmp.select();
  document.execCommand('copy');
  e.target.focus();
  const ttHide = e.target.parentNode.parentNode.querySelector('.copy-tt-hide');
  const ttHideClasses = ttHide.className.split(' ').filter((className) => className !== 'fade-in');
  ttHide.className = [...ttHideClasses, 'fade-out'].join(' ');
  setTimeout(() => {
    ttHide.className = [...ttHideClasses, 'fade-in'].join(' ');
  }, 300);
  const ttBottom = e.target.parentNode.parentNode.querySelector('.copy-tt-bottom');
  const ttBottomClasses = ttBottom.className.split(' ').filter((className) => className !== 'fade-out');
  ttBottom.className = [...ttBottomClasses, 'fade-in'].join(' ');
  setTimeout(() => {
    ttBottom.className = [...ttBottomClasses, 'fade-out'].join(' ');
  }, 300);
};

const exportChart = (e, href) => {
  e.preventDefault();
  window.open(href + '&_id=' + new Date().getTime(), '_blank');
};

window.onload = () => {
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.parentNode.classList.contains('code-snippet-btn')) {
      openCodeSnippet(e);
    } else if (target.parentNode.classList.contains('copy-link-btn')) {
      copy(e);
    } else if (target.classList.contains('export-chart-btn')) {
      exportChart(e, target.getAttribute('href'));
    } else if (target.parentNode.classList.contains('export-chart-btn')) {
      exportChart(e, target.parentNode.getAttribute('href'));
    } else if (target.classList.contains('export-png-btn')) {
      exportChart(e, target.getAttribute('href') + '&export_type=png');
    } else if (target.parentNode.classList.contains('export-png-btn')) {
      exportChart(e, target.parentNode.getAttribute('href') + '&export_type=png');
    } else if (target.classList.contains('lang-link')) {
      updateLanguage(e, target.getAttribute('href'));
    }
  });
};
