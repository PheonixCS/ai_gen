import { NextResponse } from 'next/server';
import apiConfig from '../../../../config/api-config';
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    console.log(`Proxy login request for email: ${email}`);
    
    // Call the external API
    const apiUrl = `${apiConfig.domain}/api_log.php?em=${encodeURIComponent(email)}&pass=${encodeURIComponent(password)}`;
    console.log(`Forwarding to external API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // Parse the response
    const data = await response.json();
    console.log('Received response from external API:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { code: 500, message: 'Service error occurred', error: String(error) },
      { status: 500 }
    );
  }
}
