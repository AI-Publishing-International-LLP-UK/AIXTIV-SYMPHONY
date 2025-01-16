const functions = require('@google-cloud/functions-framework');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const secretClient = new SecretManagerServiceClient();

functions.http('handleApiRequest', async (req, res) => {
  try {
    const gitlabSecret = await secretClient.accessSecretVersion({
      name: 'projects/api-for-warp-drive/secrets/gitlab-access-token/versions/latest'
    });

    const jiraSecret = await secretClient.accessSecretVersion({
      name: 'projects/api-for-warp-drive/secrets/jira-for-warp-drive/versions/latest'
    });

    res.status(200).json({ status: 'operational' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});