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

  // Import the private key
  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    privateKeyBytes.buffer as ArrayBuffer,
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

    // Get VAPID keys from system_config
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

    const vapidPublicKey = vapidPublicRow.value;
    const vapidPrivateKey = vapidPrivateRow.value;

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

    const payload = {
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

      const success = await sendPushNotification(subscription, payload, vapidPublicKey, vapidPrivateKey);
      
      if (success) {
        successCount++;
        
        // Mark as sent for this user (only once per user, even if they have multiple subscriptions)
        if (!processedUsers.has(user.user_id)) {
          await supabase.rpc('mark_reminder_sent', { target_user_id: user.user_id });
          processedUsers.add(user.user_id);
        }
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
