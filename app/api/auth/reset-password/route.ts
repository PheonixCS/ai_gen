import apiConfig from '@/config/api-config';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    let apiUrl = `${apiConfig.domain}/api_reset.php?em=${encodeURIComponent(data.email)}`;
    
    // Add additional parameters based on operation type
    if (data.checkCode) {
      apiUrl += `&check_code=${encodeURIComponent(data.checkCode)}`;
    } else if (data.changeCode) {
      apiUrl += `&change_code=${encodeURIComponent(data.changeCode)}&pass=${encodeURIComponent(data.password)}`;
    }
    
    // Call the external API
    const response = await fetch(apiUrl, { cache: 'no-store' });
    
    // Parse the response
    const responseData = await response.json();
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Password reset proxy error:', error);
    return NextResponse.json(
      { code: 500, message: 'Service error occurred' },
      { status: 500 }
    );
  }
}
