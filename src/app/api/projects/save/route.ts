import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, projectData, contact, messages } = body;

    if (!sessionId || !projectData || !contact) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save project to Firestore
    const projectRef = await addDoc(collection(db, 'projects'), {
      sessionId,
      projectData,
      contact,
      messages,
      createdAt: serverTimestamp(),
      status: 'submitted'
    });

    return NextResponse.json({
      success: true,
      projectId: projectRef.id,
      message: 'Project saved successfully'
    });

  } catch (error) {
    console.error('Error saving project:', error);
    return NextResponse.json(
      { error: 'Failed to save project' },
      { status: 500 }
    );
  }
} 