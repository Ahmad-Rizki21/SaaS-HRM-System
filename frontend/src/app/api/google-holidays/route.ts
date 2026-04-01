import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const url = 'https://calendar.google.com/calendar/ical/id.indonesian%23holiday%40group.v.calendar.google.com/public/basic.ics';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch from Google Calendar');
    
    const text = await response.text();
    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar',
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
      },
    });
  } catch (error) {
    console.error('ICS Proxy Error:', error);
    return new NextResponse('Error fetching calendar data', { status: 500 });
  }
}
