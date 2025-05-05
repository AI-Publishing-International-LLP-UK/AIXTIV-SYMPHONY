const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

exports.onAgentMetricsUpdate = functions.firestore
  .document("agent-metrics/{agentId}")
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    const before = change.before.data();

    if (after.load > 0.85 && after.responseTime > before.responseTime) {
      const taskSnapshot = await db.collection('task-assignments')
        .where('agent', '==', context.params.agentId)
        .where('status', '==', 'assigned')
        .limit(3)
        .get();

      taskSnapshot.forEach(doc => {
        doc.ref.update({ status: 'reassign-pending' });
      });

      console.log(`Agent ${context.params.agentId} rebalanced.`);
    }
    return null;
  });
