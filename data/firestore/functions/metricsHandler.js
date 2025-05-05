const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore();

exports.metricsHandler = async (req, res) => {
  const doc = await firestore.collection('agent-metrics').doc('dr-claude').get();
  return res.status(200).json(doc.data());
};
