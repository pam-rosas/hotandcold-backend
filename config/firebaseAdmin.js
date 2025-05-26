const admin = require('firebase-admin');
const serviceAccount = require('../hotandcold-15168-firebase-adminsdk-fbsvc-8f106b30ec.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { admin, db };
