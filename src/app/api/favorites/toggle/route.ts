import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    // Get or create user
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      }
    });

    // Check if favorite exists
    const existingFavorite = await prisma.userFavorite.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: eventId,
        }
      }
    });

    let isFavorited: boolean;

    if (existingFavorite) {
      // Remove favorite
      await prisma.userFavorite.delete({
        where: { id: existingFavorite.id }
      });
      isFavorited = false;
    } else {
      // Add favorite
      await prisma.userFavorite.create({
        data: {
          userId: user.id,
          eventId: eventId,
        }
      });
      isFavorited = true;
    }

    return NextResponse.json({ 
      success: true, 
      isFavorited,
      message: isFavorited ? 'Added to favorites' : 'Removed from favorites'
    });

  } catch (error) {
    console.error('Favorites toggle error:', error);
    return NextResponse.json({ 
      error: 'Failed to toggle favorite',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}