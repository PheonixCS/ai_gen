import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // Call the external API
    const response = await fetch(
      `http://193.188.23.43/imageni_clean/api_reg.php?em=${encodeURIComponent(email)}&pass=${encodeURIComponent(password)}`,
      { cache: 'no-store' }
    );
    
    // Parse the response
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Register proxy error:', error);
    return NextResponse.json(
      { code: 500, message: 'Service error occurred' },
      { status: 500 }
    );
  }
}
