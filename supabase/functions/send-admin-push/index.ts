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
    sub: 'mailto:admin@pedydriver.com'
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

  // Convert signature from DER to raw format if needed
  const signatureBytes = new Uint8Array(signature);
  const encodedSignature = uint8ArrayToBase64Url(signatureBytes);

  return `${unsignedToken}.${encodedSignature}`;
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; icon?: string; url?: string },
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
        'Urgency': 'high'
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

    // Get the alert data from the request
    const { record } = await req.json();
    
    if (!record) {
      console.log('No record in payload, possibly a test call');
      return new Response(JSON.stringify({ success: true, message: 'No record to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Processing admin alert:', record.id, record.event_type);

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

    // Get all admin push subscriptions
    const { data: subscriptions, error: subError } = await supabase.rpc('get_admin_push_subscriptions');

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No admin push subscriptions found');
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${subscriptions.length} admin subscriptions`);

    // Prepare notification payload
    let title = 'Novo Alerta';
    let icon = '/favicon.png';
    
    switch (record.event_type) {
      case 'new_user_free':
        title = '👤 Novo Cadastro';
        break;
      case 'new_user_pro':
        title = '⭐ Novo PRO';
        break;
      case 'payment_failure':
        title = '❌ Falha no Pagamento';
        break;
      case 'churn_inactive_pro':
        title = '⚠️ Risco de Churn';
        break;
      case 'churn_expiring_pro':
        title = '⏰ PRO Expirando';
        break;
      default:
        title = '🔔 Alerta Admin';
    }

    const payload = {
      title,
      body: record.message || 'Nova notificação do sistema',
      icon,
      url: '/admin'
    };

    // Send push to all subscriptions
    let successCount = 0;
    for (const sub of subscriptions) {
      const success = await sendPushNotification(sub, payload, vapidPublicKey, vapidPrivateKey);
      if (success) successCount++;
    }

    console.log(`Push notifications sent: ${successCount}/${subscriptions.length}`);

    return new Response(JSON.stringify({ 
      success: true, 
      sent: successCount,
      total: subscriptions.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error in send-admin-push:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
