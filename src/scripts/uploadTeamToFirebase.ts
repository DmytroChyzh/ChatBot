import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import teamData from '../data/comprehensive-team-data.json';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Upload team data to Firebase Firestore
 */
async function uploadTeamToFirebase() {
  try {
    console.log('🚀 Starting team data upload to Firebase...');
    
    // Create team collection
    const teamCollection = collection(db, 'team');
    
    // Upload each team member
    for (const member of teamData.members) {
      try {
        // Use member ID as document ID for consistency
        const memberRef = doc(teamCollection, member.id);
        
        // Add timestamp
        const memberData = {
          ...member,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Set document with custom ID
        await setDoc(memberRef, memberData);
        
        console.log(`✅ Uploaded: ${member.fullName} (${member.role})`);
      } catch (error) {
        console.error(`❌ Error uploading ${member.fullName}:`, error);
      }
    }
    
    console.log('🎉 Team data upload completed!');
    console.log(`📊 Total members uploaded: ${teamData.totalMembers}`);
    
  } catch (error) {
    console.error('❌ Error during team upload:', error);
  }
}

/**
 * Create team collection structure
 */
async function createTeamCollection() {
  try {
    console.log('🏗️ Creating team collection structure...');
    
    // Create team collection with metadata
    const teamMetaRef = doc(db, 'team', 'metadata');
    await setDoc(teamMetaRef, {
      collectionName: 'team',
      description: 'Cieden team members database',
      totalMembers: teamData.totalMembers,
      lastUpdated: new Date(),
      version: '1.0',
      departments: teamData.departments,
      roles: teamData.roles,
      seniorityLevels: teamData.seniorityLevels
    });
    
    console.log('✅ Team collection structure created!');
    
  } catch (error) {
    console.error('❌ Error creating team collection structure:', error);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🔥 Firebase Team Upload Script');
    console.log('==============================');
    
    // Create collection structure
    await createTeamCollection();
    
    // Upload team data
    await uploadTeamToFirebase();
    
    console.log('🎯 Script completed successfully!');
    
  } catch (error) {
    console.error('💥 Script failed:', error);
  }
}

// Run script if called directly
if (require.main === module) {
  main();
}

export { uploadTeamToFirebase, createTeamCollection };
