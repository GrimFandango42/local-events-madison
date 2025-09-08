// API route for neighborhoods
import { NextRequest, NextResponse } from 'next/server';

// For now, return hardcoded Madison neighborhoods
// In the future, this will be backed by a database table
const MADISON_NEIGHBORHOODS = [
  { id: '1', name: 'Downtown', slug: 'downtown', description: 'Central business district and State Street' },
  { id: '2', name: 'East Side', slug: 'east-side', description: 'East of Lake Mendota, including Atwood and Williamson' },
  { id: '3', name: 'West Side', slug: 'west-side', description: 'West of Park Street, including Hilldale and Shorewood' },
  { id: '4', name: 'Near East', slug: 'near-east', description: 'Between downtown and East Side' },
  { id: '5', name: 'Near West', slug: 'near-west', description: 'Between downtown and West Side' },
  { id: '6', name: 'Middleton', slug: 'middleton', description: 'Western suburb with shopping and dining' },
  { id: '7', name: 'Fitchburg', slug: 'fitchburg', description: 'Southern suburb with parks and trails' },
  { id: '8', name: 'Monona', slug: 'monona', description: 'Eastern suburb on Lake Monona' },
  { id: '9', name: 'Verona', slug: 'verona', description: 'Southwestern suburb' },
  { id: '10', name: 'Sun Prairie', slug: 'sun-prairie', description: 'Northeastern suburb' },
  { id: '11', name: 'University Area', slug: 'university-area', description: 'UW-Madison campus and surrounding areas' },
  { id: '12', name: 'Maple Bluff', slug: 'maple-bluff', description: 'North of downtown along Lake Mendota' },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let neighborhoods = MADISON_NEIGHBORHOODS;
    
    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      neighborhoods = neighborhoods.filter(
        (neighborhood) =>
          neighborhood.name.toLowerCase().includes(searchLower) ||
          neighborhood.description.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      data: neighborhoods,
      meta: {
        total: neighborhoods.length,
        city: 'Madison',
        state: 'Wisconsin',
        country: 'USA',
      },
    });
  } catch (error) {
    console.error('Neighborhoods API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch neighborhoods' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Future: Allow users to suggest new neighborhoods
  return NextResponse.json(
    { success: false, error: 'Neighborhood suggestions not yet implemented' },
    { status: 501 }
  );
}
