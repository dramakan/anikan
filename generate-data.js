const admin = require('firebase-admin');
const fs = require('fs');

// 1. Grab the secret key from Netlify's secure vault
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountKey) {
  console.error("FATAL ERROR: FIREBASE_SERVICE_ACCOUNT environment variable is missing!");
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountKey);

// 2. Connect to the AnyKan Firebase project
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bhx-beats.firebaseio.com" 
});

const db = admin.firestore();

async function generateJson() {
  try {
    console.log("Connecting to AnyKan Firestore...");
    // Note: We are keeping the collection name "anime" so you don't lose existing data, 
    // but the frontend will treat it as universal media.
    const snapshot = await db.collection('anime').get();
    const media = [];
    
    snapshot.forEach(doc => {
      media.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Successfully fetched ${media.length} media titles.`);
    
    // 3. Save the data to a static file right next to your index.html
    fs.writeFileSync('./anykan.json', JSON.stringify(media));
    console.log('anykan.json file successfully generated!');
    
  } catch (error) {
    console.error("Error generating JSON: ", error);
    process.exit(1); 
  }
}

generateJson();