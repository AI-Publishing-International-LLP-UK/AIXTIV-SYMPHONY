const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore();

exports.delegateTask = async (req, res) => {
  const agentId = req.body.agent_id;
  const taskDetails = req.body.task;

  console.log(`Delegating task to: ${agentId}`, taskDetails);

  await firestore.collection('task-assignments').add({
    agent: agentId,
    task: taskDetails,
    timestamp: new Date()
  });

  res.status(200).json({ status: 'assigned', agentId });
};
