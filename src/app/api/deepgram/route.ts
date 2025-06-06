import { NextResponse } from "next/server";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// Remove the GET method that exposes the API key
// export async function GET() {
//     return NextResponse.json({
//       key: process.env.DEEPGRAM_API_KEY ?? "",
//     });
// }

// New secure WebSocket proxy for Deepgram
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(request);
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Validate Deepgram API key
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      console.error('Deepgram API key not configured');
      return new Response('Service unavailable', { status: 503 });
    }

    // Get transcription options from request
    const { options = {} } = await request.json();

    // Create Deepgram client server-side
    const deepgram = createClient(apiKey);

    // Return connection details without exposing the API key
    // In a real implementation, you'd set up a WebSocket proxy here
    return NextResponse.json({
      url: 'wss://api.deepgram.com/v1/listen',
      // Don't send the API key to the client
      // Instead, implement a proxy that adds auth headers server-side
      options: {
        model: options.model || 'nova-2',
        language: options.language || 'en',
        smart_format: true,
        ...options
      }
    });
  } catch (error) {
    console.error('Deepgram proxy error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}