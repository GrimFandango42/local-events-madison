import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { google } from 'googleapis';
import { prisma } from '@/lib/db';

// Add event to user's Google Calendar
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

    // Get the event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        venue: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get access token from JWT session
    const accessToken = session.accessToken;
    const refreshToken = session.refreshToken;

    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Google Calendar access not available. Please sign in again.',
        needsReauth: true 
      }, { status: 403 });
    }

    // Initialize Google Calendar API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Format event location
    let location = event.customLocation;
    if (event.venue) {
      location = event.venue.name;
      if (event.venue.address) {
        location += `, ${event.venue.address}`;
      }
    }

    // Create calendar event
    const calendarEvent = {
      summary: event.title,
      description: `${event.description || ''}

📍 Found on Madison Events
🔗 ${event.sourceUrl || 'https://madison-events.com'}

Privacy notice: This event was added from Madison Events, a privacy-focused local events platform.`,
      location: location,
      start: {
        dateTime: event.allDay ? undefined : event.startDateTime.toISOString(),
        date: event.allDay ? event.startDateTime.toISOString().split('T')[0] : undefined,
        timeZone: event.timezone,
      },
      end: {
        dateTime: event.allDay ? undefined : (event.endDateTime || event.startDateTime).toISOString(),
        date: event.allDay ? (event.endDateTime || event.startDateTime).toISOString().split('T')[0] : undefined,
        timeZone: event.timezone,
      },
      source: {
        title: 'Madison Events',
        url: 'https://madison-events.com',
      },
    };

    const result = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: calendarEvent,
    });

    // Log successful calendar addition (privacy-compliant)
    console.log(`Calendar event added for user ${session.user.email}: ${event.title}`);

    return NextResponse.json({ 
      success: true, 
      calendarEventId: result.data.id,
      message: 'Event added to your Google Calendar!'
    });

  } catch (error) {
    console.error('Calendar API error:', error);
    
    // Handle token refresh if needed
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      return NextResponse.json({ 
        error: 'Calendar access expired. Please sign in again to refresh permissions.',
        needsReauth: true 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      error: 'Failed to add event to calendar',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}