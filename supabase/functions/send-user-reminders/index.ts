import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base64 URL encoding helpers
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/') + padding;
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function uint8ArrayToBase64Url(uint8Array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...uint8Array));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createJWT(vapidPrivateKey: string, endpoint: string): Promise<string> {
  const audience = new URL(endpoint).origin;
  
  const header = {
    typ: 'JWT',
    alg: 'ES256'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: 'mailto:suporte@pedydriver.com'
  };

  const encodedHeader = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Import the private key using JWK format for ECDSA signing
  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
  
  // Convert raw 32-byte private key to JWK format
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: vapidPrivateKey, // Private key component
    x: '', // Will be computed
    y: '', // Will be computed
  };

  // We need to derive x,y from the private key, but since we stored them together
  // Let's use a different approach - import as PKCS8 or use web-push library pattern
  
  // Actually, for ECDSA P-256, we need the full key. Let's use the raw key approach
  // but with the correct key format
  
  try {
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      {
        kty: 'EC',
        crv: 'P-256',
        d: vapidPrivateKey,
        // We need x and y coordinates - but we only stored d
        // This is the issue - we need to store the full JWK or compute x,y
      },
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      cryptoKey,
      new TextEncoder().encode(unsignedToken)
    );

    const signatureBytes = new Uint8Array(signature);
    const encodedSignature = uint8ArrayToBase64Url(signatureBytes);

    return `${unsignedToken}.${encodedSignature}`;
  } catch (error) {
    console.error('[createJWT] Error importing key:', error);
    throw error;
  }
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; icon?: string; url?: string; tag?: string },
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    const jwt = await createJWT(vapidPrivateKey, subscription.endpoint);
    
    const body = JSON.stringify(payload);
    
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
        'Urgency': 'normal'
      },
      body: body
    });

    if (!response.ok) {
      console.error(`Push failed for ${subscription.endpoint}: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response:', text);
      return false;
    }

    console.log(`Push sent successfully to ${subscription.endpoint}`);
    return true;
  } catch (error) {
    console.error(`Error sending push to ${subscription.endpoint}:`, error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[send-user-reminders] Starting reminder check...');

    // Get VAPID keys from system_config (stored as full JWK)
    const { data: vapidRow } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'vapid_keys_jwk')
      .single();

    if (!vapidRow) {
      // Fallback to old format
      const { data: vapidPublicRow } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'vapid_public_key')
        .single();

      const { data: vapidPrivateRow } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'vapid_private_key')
        .single();

      if (!vapidPublicRow || !vapidPrivateRow) {
        console.error('VAPID keys not found in system_config');
        return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Old keys exist but won't work properly - need regeneration
      console.error('Old VAPID key format detected - please regenerate keys');
      return new Response(JSON.stringify({ error: 'VAPID keys need regeneration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const vapidKeys = JSON.parse(vapidRow.value);
    const vapidPublicKey = vapidKeys.publicKey;
    const vapidPrivateKeyJwk = vapidKeys.privateKeyJwk;

    // Get users who are due for a reminder
    const { data: usersToRemind, error: queryError } = await supabase.rpc('get_users_due_for_reminder');

    if (queryError) {
      console.error('Error fetching users due for reminder:', queryError);
      return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!usersToRemind || usersToRemind.length === 0) {
      console.log('[send-user-reminders] No users due for reminder at this time');
      return new Response(JSON.stringify({ success: true, sent: 0, message: 'No reminders due' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[send-user-reminders] Found ${usersToRemind.length} users to remind`);

    const pushPayload = {
      title: '🚗 Hora de registrar!',
      body: 'Não esqueça de registrar seus ganhos de hoje no PEDY Driver.',
      icon: '/icons/icon-192.png',
      url: '/quick-entry',
      tag: 'daily-reminder'
    };

    let successCount = 0;
    const processedUsers = new Set<string>();

    for (const user of usersToRemind) {
      const subscription = {
        endpoint: user.endpoint,
        p256dh: user.p256dh,
        auth: user.auth
      };

      try {
        // Create JWT for this endpoint
        const audience = new URL(subscription.endpoint).origin;
        
        const header = { typ: 'JWT', alg: 'ES256' };
        const now = Math.floor(Date.now() / 1000);
        const jwtPayload = {
          aud: audience,
          exp: now + 12 * 60 * 60,
          sub: 'mailto:suporte@pedydriver.com'
        };

        const encodedHeader = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
        const encodedPayload = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(jwtPayload)));
        const unsignedToken = `${encodedHeader}.${encodedPayload}`;

        // Import private key from JWK
        const cryptoKey = await crypto.subtle.importKey(
          'jwk',
          vapidPrivateKeyJwk,
          { name: 'ECDSA', namedCurve: 'P-256' },
          false,
          ['sign']
        );

        const signature = await crypto.subtle.sign(
          { name: 'ECDSA', hash: 'SHA-256' },
          cryptoKey,
          new TextEncoder().encode(unsignedToken)
        );

        const encodedSignature = uint8ArrayToBase64Url(new Uint8Array(signature));
        const jwt = `${unsignedToken}.${encodedSignature}`;

        // Send push notification
        const response = await fetch(subscription.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '86400',
            'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
            'Urgency': 'normal'
          },
          body: JSON.stringify(pushPayload)
        });

        if (response.ok || response.status === 201) {
          console.log(`[send-user-reminders] Push sent to user ${user.user_id}`);
          successCount++;
          
          if (!processedUsers.has(user.user_id)) {
            await supabase.rpc('mark_reminder_sent', { target_user_id: user.user_id });
            processedUsers.add(user.user_id);
          }
        } else {
          const text = await response.text();
          console.error(`[send-user-reminders] Push failed for ${user.user_id}: ${response.status} - ${text}`);
        }
      } catch (error) {
        console.error(`[send-user-reminders] Error sending to user ${user.user_id}:`, error);
      }
    }

    console.log(`[send-user-reminders] Sent ${successCount}/${usersToRemind.length} reminders to ${processedUsers.size} users`);

    return new Response(JSON.stringify({ 
      success: true, 
      sent: successCount,
      total: usersToRemind.length,
      users: processedUsers.size
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[send-user-reminders] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
