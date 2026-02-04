import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper functions for base64url encoding/decoding
function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

// Generate ECDH key pair for encryption
async function generateLocalKeys(): Promise<{ publicKey: Uint8Array; privateKey: CryptoKey }> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  
  const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  
  return {
    publicKey: new Uint8Array(publicKeyRaw),
    privateKey: keyPair.privateKey
  };
}

// Derive shared secret using ECDH
async function deriveSharedSecret(
  localPrivateKey: CryptoKey,
  clientPublicKeyBytes: Uint8Array
): Promise<Uint8Array> {
  const clientPublicKey = await crypto.subtle.importKey(
    'raw',
    clientPublicKeyBytes.buffer as ArrayBuffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey },
    localPrivateKey,
    256
  );
  
  return new Uint8Array(sharedSecret);
}

// HKDF implementation
async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const saltBuffer = salt.length ? salt.buffer as ArrayBuffer : new ArrayBuffer(32);
  const key = await crypto.subtle.importKey(
    'raw',
    saltBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', key, ikm.buffer as ArrayBuffer));
  
  const prkKey = await crypto.subtle.importKey(
    'raw',
    prk.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const infoWithCounter = new Uint8Array(info.length + 1);
  infoWithCounter.set(info);
  infoWithCounter[info.length] = 1;
  
  const result = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, infoWithCounter.buffer as ArrayBuffer));
  return result.slice(0, length);
}

// Create info for aes128gcm (RFC 8291)
function createAes128gcmInfo(type: string, context: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const typeLabel = encoder.encode(`Content-Encoding: ${type}\0`);
  
  const info = new Uint8Array(typeLabel.length + context.length);
  info.set(typeLabel, 0);
  info.set(context, typeLabel.length);
  
  return info;
}

// Build IKM info for aes128gcm
function buildIkmInfo(clientPublicKey: Uint8Array, serverPublicKey: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const keyLabel = encoder.encode('WebPush: info\0');
  
  // Format: "WebPush: info\0" + client public key (65 bytes) + server public key (65 bytes)
  const info = new Uint8Array(keyLabel.length + clientPublicKey.length + serverPublicKey.length);
  let offset = 0;
  
  info.set(keyLabel, offset);
  offset += keyLabel.length;
  
  info.set(clientPublicKey, offset);
  offset += clientPublicKey.length;
  
  info.set(serverPublicKey, offset);
  
  return info;
}

// Encrypt payload using aes128gcm content encoding (RFC 8291)
async function encryptPayload(
  payload: string,
  clientPublicKeyBase64: string,
  authSecretBase64: string
): Promise<{ encrypted: Uint8Array; serverPublicKey: Uint8Array; salt: Uint8Array }> {
  const clientPublicKey = base64UrlDecode(clientPublicKeyBase64);
  const authSecret = base64UrlDecode(authSecretBase64);
  
  // Generate local ephemeral key pair
  const { publicKey: serverPublicKey, privateKey: serverPrivateKey } = await generateLocalKeys();
  
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Derive shared secret via ECDH
  const sharedSecret = await deriveSharedSecret(serverPrivateKey, clientPublicKey);
  
  // Build IKM info: "WebPush: info\0" + client key + server key
  const ikmInfo = buildIkmInfo(clientPublicKey, serverPublicKey);
  
  // Derive IKM from auth secret and shared secret
  const ikm = await hkdf(authSecret, sharedSecret, ikmInfo, 32);
  
  // Derive content encryption key using aes128gcm info
  const cekInfo = createAes128gcmInfo('aes128gcm', new Uint8Array(0));
  const contentEncryptionKey = await hkdf(salt, ikm, cekInfo, 16);
  
  // Derive nonce
  const nonceInfo = createAes128gcmInfo('nonce', new Uint8Array(0));
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);
  
  // aes128gcm padding: delimiter byte (0x02) at the end
  const payloadBytes = new TextEncoder().encode(payload);
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes, 0);
  paddedPayload[payloadBytes.length] = 0x02; // Record delimiter
  
  // Import content encryption key
  const aesKey = await crypto.subtle.importKey(
    'raw',
    contentEncryptionKey.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce.buffer as ArrayBuffer },
    aesKey,
    paddedPayload.buffer as ArrayBuffer
  );
  
  return {
    encrypted: new Uint8Array(encrypted),
    serverPublicKey,
    salt
  };
}

// Create VAPID JWT
async function createVapidJwt(
  privateKeyJwk: JsonWebKey,
  audience: string
): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: 'mailto:suporte@pedydriver.com'
  };
  
  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  
  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );
  
  // Web Crypto returns signature in IEEE P1363 format (raw 64 bytes: r || s)
  // This is exactly what JWT ES256 requires - no conversion needed
  const rawSignature = new Uint8Array(signature);
  
  // Ensure we have exactly 64 bytes (32 for r, 32 for s)
  if (rawSignature.length !== 64) {
    console.error(`Unexpected signature length: ${rawSignature.length}, expected 64`);
  }
  
  const encodedSignature = base64UrlEncode(rawSignature);
  
  return `${unsignedToken}.${encodedSignature}`;
}

// Send encrypted push notification
async function sendPushNotification(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: object,
  vapidPublicKey: string,
  vapidPrivateKeyJwk: JsonWebKey
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const payloadString = JSON.stringify(payload);
    
    // Encrypt the payload
    const { encrypted, serverPublicKey, salt } = await encryptPayload(payloadString, p256dh, auth);
    
    // Build aes128gcm body: salt (16) + rs (4) + idlen (1) + keyid (65) + encrypted content
    const recordSize = 4096;
    const body = new Uint8Array(16 + 4 + 1 + serverPublicKey.length + encrypted.length);
    let offset = 0;
    
    // Salt (16 bytes)
    body.set(salt, offset);
    offset += 16;
    
    // Record size (4 bytes, big endian)
    body[offset++] = (recordSize >> 24) & 0xff;
    body[offset++] = (recordSize >> 16) & 0xff;
    body[offset++] = (recordSize >> 8) & 0xff;
    body[offset++] = recordSize & 0xff;
    
    // Key ID length (1 byte)
    body[offset++] = serverPublicKey.length;
    
    // Key ID (server public key)
    body.set(serverPublicKey, offset);
    offset += serverPublicKey.length;
    
    // Encrypted content
    body.set(encrypted, offset);
    
    // Create VAPID JWT
    const audience = new URL(endpoint).origin;
    const jwt = await createVapidJwt(vapidPrivateKeyJwk, audience);
    
    // Send request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Content-Length': body.length.toString(),
        'TTL': '86400',
        'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
        'Urgency': 'normal'
      },
      body: body
    });
    
    if (response.ok || response.status === 201) {
      return { success: true, status: response.status };
    }
    
    const text = await response.text();
    return { success: false, status: response.status, error: text };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
    const { data: vapidRow } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'vapid_keys_jwk')
      .single();

    if (!vapidRow) {
      console.error('VAPID keys not found in system_config');
      return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
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

    console.log(`[send-user-reminders] Found ${usersToRemind.length} subscriptions to notify`);

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
      const result = await sendPushNotification(
        user.endpoint,
        user.p256dh,
        user.auth,
        pushPayload,
        vapidPublicKey,
        vapidPrivateKeyJwk
      );

      if (result.success) {
        console.log(`[send-user-reminders] Push sent to user ${user.user_id}`);
        successCount++;
        
        if (!processedUsers.has(user.user_id)) {
          await supabase.rpc('mark_reminder_sent', { target_user_id: user.user_id });
          processedUsers.add(user.user_id);
        }
      } else {
        console.error(`[send-user-reminders] Push failed for ${user.user_id}: ${result.status} - ${result.error}`);
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
