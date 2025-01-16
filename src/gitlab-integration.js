const { Gitlab } = require('@gitbeaker/node');

async function setupGitLabIntegration(token) {
  const api = new Gitlab({
    token,
    host: 'https://c2100lab.coaching2100.com'
  });

  return api;
}