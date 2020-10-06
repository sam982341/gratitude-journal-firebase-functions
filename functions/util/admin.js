const admin = require('firebase-admin');

admin.initializeApp();
firebase.analytics();
const db = admin.firestore();

module.exports = { admin, db };
