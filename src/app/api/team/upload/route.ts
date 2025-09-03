import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';
import teamData from '../../../../data/comprehensive-team-data.json';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase (check if already initialized)
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // If app already exists, get it
  app = initializeApp(firebaseConfig, 'team-upload');
}
const db = getFirestore(app);

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting team data upload to Firebase...');
    
    // Create team collection
    const teamCollection = collection(db, 'team');
    
    let uploadedCount = 0;
    let errors = [];
    
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
        
        uploadedCount++;
        console.log(`✅ Uploaded: ${member.fullName} (${member.role})`);
      } catch (error) {
        console.error(`❌ Error uploading ${member.fullName}:`, error);
        errors.push({
          member: member.fullName,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Create team collection metadata
    try {
      const teamMetaRef = doc(db, 'team', 'metadata');
      await setDoc(teamMetaRef, {
        collectionName: 'team',
        description: 'Cieden team members database',
        totalMembers: teamData.totalMembers,
        uploadedMembers: uploadedCount,
        lastUpdated: new Date(),
        version: '1.0',
        departments: teamData.departments,
        roles: teamData.roles,
        seniorityLevels: teamData.seniorityLevels
      });
      console.log('✅ Team collection metadata created!');
    } catch (error) {
      console.error('❌ Error creating metadata:', error);
    }
    
    console.log('🎉 Team data upload completed!');
    
    return NextResponse.json({
      success: true,
      message: 'Team data uploaded successfully',
      data: {
        totalMembers: teamData.totalMembers,
        uploadedMembers: uploadedCount,
        errors: errors.length,
        errorDetails: errors
      }
    });
    
  } catch (error) {
    console.error('❌ Error during team upload:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error during team upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return team data info
    return NextResponse.json({
      success: true,
      data: {
        totalMembers: teamData.totalMembers,
        departments: teamData.departments,
        roles: teamData.roles,
        seniorityLevels: teamData.seniorityLevels,
        sampleMembers: teamData.members.slice(0, 3).map(m => ({
          id: m.id,
          fullName: m.fullName,
          role: m.role,
          department: m.department
        }))
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get team info' }, 
      { status: 500 }
    );
  }
}
