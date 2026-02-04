import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert ArrayBuffer to base64url string
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[generate-vapid-keys] Generating new VAPID key pair...');

    // Generate ECDSA P-256 key pair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true, // extractable
      ['sign', 'verify']
    );

    // Export private key as raw bytes (32 bytes for P-256)
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    const privateKeyBase64Url = privateKeyJwk.d!; // The 'd' parameter is the private key

    // Export public key as raw uncompressed format (65 bytes: 0x04 + x + y)
    const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const publicKeyBase64Url = arrayBufferToBase64Url(publicKeyRaw);

    console.log('[generate-vapid-keys] Keys generated successfully');
    console.log('[generate-vapid-keys] Public key length:', publicKeyBase64Url.length);
    console.log('[generate-vapid-keys] Private key length:', privateKeyBase64Url.length);

    // Store keys in system_config using upsert
    const { error: publicError } = await supabase
      .from('system_config')
      .upsert(
        { key: 'vapid_public_key', value: publicKeyBase64Url },
        { onConflict: 'key' }
      );

    if (publicError) {
      console.error('[generate-vapid-keys] Error storing public key:', publicError);
      throw new Error('Failed to store public key');
    }

    const { error: privateError } = await supabase
      .from('system_config')
      .upsert(
        { key: 'vapid_private_key', value: privateKeyBase64Url },
        { onConflict: 'key' }
      );

    if (privateError) {
      console.error('[generate-vapid-keys] Error storing private key:', privateError);
      throw new Error('Failed to store private key');
    }

    console.log('[generate-vapid-keys] Keys stored successfully in system_config');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'VAPID keys generated and stored successfully',
      publicKeyPreview: publicKeyBase64Url.substring(0, 20) + '...'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[generate-vapid-keys] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
