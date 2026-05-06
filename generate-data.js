const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountKey) {
  console.error("FATAL ERROR: FIREBASE_SERVICE_ACCOUNT environment variable is missing!");
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountKey);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bhx-beats.firebaseio.com" 
});

const db = admin.firestore();

async function generateJson() {
  try {
    console.log("Connecting to AnyKan Firestore...");
    const snapshot = await db.collection('anime').get();
    let media = [];
    
    snapshot.forEach(doc => {
      media.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Successfully fetched ${media.length} titles from AnyKan DB.`);

    // --- NEW: MERGE DRAMAKAN DATA ---
    console.log("Fetching external data from Dramakan...");
    try {
        const dramaRes = await fetch('https://dramakan.site/dramas.json');
        
        if (dramaRes.ok) {
            const dramaData = await dramaRes.json();
            media = media.concat(dramaData); // Combine arrays
            console.log(`Successfully imported and merged ${dramaData.length} dramas!`);
        } else {
            console.log("Failed to reach Dramakan JSON. Proceeding with AnyKan data only.");
        }
    } catch (importError) {
        console.log("Network error while fetching Dramakan data:", importError);
    }
    // --------------------------------

    fs.writeFileSync('./anykan.json', JSON.stringify(media));
    console.log('Combined anykan.json file successfully generated!');
    
  } catch (error) {
    console.error("Error generating JSON: ", error);
    process.exit(1); 
  }
}

generateJson();