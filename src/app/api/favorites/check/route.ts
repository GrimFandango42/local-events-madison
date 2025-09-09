import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ isFavorited: false });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ isFavorited: false });
    }

    // Check if favorite exists
    const favorite = await prisma.userFavorite.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: eventId,
        }
      }
    });

    return NextResponse.json({ isFavorited: !!favorite });

  } catch (error) {
    console.error('Favorites check error:', error);
    return NextResponse.json({ isFavorited: false });
  }
}