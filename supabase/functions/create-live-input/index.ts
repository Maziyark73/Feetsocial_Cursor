import { corsHeaders } from '../_shared/cors.ts';

interface CreateLiveInputRequest {
  title: string;
  description?: string;
}

interface CloudflareLiveInputResponse {
  result: {
    uid: string;
    rtmps: {
      url: string;
      streamKey: string;
    };
    rtmpsPlayback: {
      url: string;
    };
    webRTCPlayback: {
      url: string;
    };
    srt: {
      url: string;
      streamId: string;
    };
    status: {
      current: string;
    };
    meta: {
      name: string;
    };
    created: string;
    modified: string;
  };
  success: boolean;
  errors: any[];
  messages: any[];
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get environment variables
    const CF_ACCOUNT_ID = Deno.env.get('VITE_CF_ACCOUNT_ID');
    const CF_STREAM_TOKEN = Deno.env.get('VITE_CF_STREAM_TOKEN');

    if (!CF_ACCOUNT_ID || !CF_STREAM_TOKEN) {
      throw new Error('Cloudflare credentials not configured');
    }

    // Parse request body
    const { title, description }: CreateLiveInputRequest = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create live input on Cloudflare Stream
    const cloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/live_inputs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_STREAM_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta: {
            name: title,
            description: description || '',
          },
          recording: {
            mode: 'automatic',
            timeoutSeconds: 0,
            requireSignedURLs: false,
          },
        }),
      }
    );

    if (!cloudflareResponse.ok) {
      const errorText = await cloudflareResponse.text();
      console.error('Cloudflare API error:', errorText);
      throw new Error(`Cloudflare API error: ${cloudflareResponse.status}`);
    }

    const liveInputData: CloudflareLiveInputResponse = await cloudflareResponse.json();

    if (!liveInputData.success) {
      throw new Error('Failed to create live input');
    }

    // Return the live input details
    return new Response(
      JSON.stringify({
        success: true,
        liveInput: {
          id: liveInputData.result.uid,
          rtmpUrl: liveInputData.result.rtmps.url,
          streamKey: liveInputData.result.rtmps.streamKey,
          playbackUrl: liveInputData.result.webRTCPlayback.url,
          srtUrl: liveInputData.result.srt.url,
          srtStreamId: liveInputData.result.srt.streamId,
          status: liveInputData.result.status.current,
          title: liveInputData.result.meta.name,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating live input:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});