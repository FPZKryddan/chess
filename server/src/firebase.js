const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth')


const serviceAccount = require('../creds.json');

const app = initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

module.exports = {db, auth}