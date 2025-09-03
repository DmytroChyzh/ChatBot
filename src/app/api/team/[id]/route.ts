import { NextRequest, NextResponse } from 'next/server';
import { getTeamMember, getAllTeamMembers } from '../../../../utils/teamUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID parameter required' }, { status: 400 });
    }

    // Try to find by ID first
    let member = getAllTeamMembers().find(m => m.id === id);
    
    // If not found by ID, try to find by name
    if (!member) {
      member = getTeamMember(id);
    }

    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: member
    });

  } catch (error) {
    console.error('Team Member API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
