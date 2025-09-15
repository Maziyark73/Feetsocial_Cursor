const CF_ACCOUNT_ID = import.meta.env.VITE_CF_ACCOUNT_ID;
const CF_STREAM_TOKEN = import.meta.env.VITE_CF_STREAM_TOKEN;

if (!CF_ACCOUNT_ID || !CF_STREAM_TOKEN) {
  console.warn('Cloudflare Stream environment variables not configured');
}

export interface CloudflareUploadResponse {
  result: {
    uid: string;
    thumbnail: string;
    readyToStream: boolean;
    status: {
      state: string;
    };
  };
  success: boolean;
  errors: any[];
  messages: any[];
}

export async function uploadVideoToCloudflare(file: File): Promise<CloudflareUploadResponse> {
  if (!CF_ACCOUNT_ID || !CF_STREAM_TOKEN) {
    throw new Error('Cloudflare Stream is not configured. Please set VITE_CF_ACCOUNT_ID and VITE_CF_STREAM_TOKEN in your .env file.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_STREAM_TOKEN}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare upload failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

export function getCloudflareVideoUrl(videoId: string): string {
  if (!CF_ACCOUNT_ID) {
    return '';
  }
  return `https://customer-${CF_ACCOUNT_ID.replace(/-/g, '')}.cloudflarestream.com/${videoId}/iframe`;
}

export function getCloudflareVideoEmbedUrl(videoId: string): string {
  if (!CF_ACCOUNT_ID || videoId.startsWith('demo-')) {
    return '';
  }
  return `https://embed.cloudflarestream.com/${videoId}/iframe`;
}