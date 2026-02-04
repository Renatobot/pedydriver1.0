import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
  
  const { publicKey: serverPublicKey, privateKey: serverPrivateKey } = await generateLocalKeys();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const sharedSecret = await deriveSharedSecret(serverPrivateKey, clientPublicKey);
  
  const ikmInfo = buildIkmInfo(clientPublicKey, serverPublicKey);
  const ikm = await hkdf(authSecret, sharedSecret, ikmInfo, 32);
  
  const cekInfo = createAes128gcmInfo('aes128gcm', new Uint8Array(0));
  const contentEncryptionKey = await hkdf(salt, ikm, cekInfo, 16);
  
  const nonceInfo = createAes128gcmInfo('nonce', new Uint8Array(0));
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);
  
  const payloadBytes = new TextEncoder().encode(payload);
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes, 0);
  paddedPayload[payloadBytes.length] = 0x02;
  
  const aesKey = await crypto.subtle.importKey(
    'raw',
    contentEncryptionKey.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
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
  
  // WebCrypto returns DER format, we need IEEE P1363 (raw 64 bytes for ES256)
  const rawSignature = new Uint8Array(signature);
  let r: Uint8Array;
  let s: Uint8Array;
  
  // Check if signature is in DER format (starts with 0x30)
  if (rawSignature[0] === 0x30) {
    // Parse DER format
    const rLen = rawSignature[3];
    const rStart = 4;
    const rEnd = rStart + rLen;
    const sLen = rawSignature[rEnd + 1];
    const sStart = rEnd + 2;
    
    // Extract r and s, removing leading zeros if present
    let rBytes = rawSignature.slice(rStart, rEnd);
    let sBytes = rawSignature.slice(sStart, sStart + sLen);
    
    // Ensure exactly 32 bytes for each
    r = new Uint8Array(32);
    s = new Uint8Array(32);
    
    if (rBytes.length > 32) {
      rBytes = rBytes.slice(rBytes.length - 32);
    }
    if (sBytes.length > 32) {
      sBytes = sBytes.slice(sBytes.length - 32);
    }
    
    r.set(rBytes, 32 - rBytes.length);
    s.set(sBytes, 32 - sBytes.length);
  } else if (rawSignature.length === 64) {
    // Already in IEEE P1363 format
    r = rawSignature.slice(0, 32);
    s = rawSignature.slice(32, 64);
  } else {
    throw new Error(`Unexpected signature format: length=${rawSignature.length}`);
  }
  
  // Combine into IEEE P1363 format (exactly 64 bytes)
  const ieeeSignature = new Uint8Array(64);
  ieeeSignature.set(r, 0);
  ieeeSignature.set(s, 32);
  
  const encodedSignature = base64UrlEncode(ieeeSignature);
  
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
    const { encrypted, serverPublicKey, salt } = await encryptPayload(payloadString, p256dh, auth);
    
    const recordSize = 4096;
    const body = new Uint8Array(16 + 4 + 1 + serverPublicKey.length + encrypted.length);
    let offset = 0;
    
    body.set(salt, offset);
    offset += 16;
    
    body[offset++] = (recordSize >> 24) & 0xff;
    body[offset++] = (recordSize >> 16) & 0xff;
    body[offset++] = (recordSize >> 8) & 0xff;
    body[offset++] = recordSize & 0xff;
    
    body[offset++] = serverPublicKey.length;
    body.set(serverPublicKey, offset);
    offset += serverPublicKey.length;
    body.set(encrypted, offset);
    
    const audience = new URL(endpoint).origin;
    const jwt = await createVapidJwt(vapidPrivateKeyJwk, audience);
    
    console.log(`[send-push] Sending to endpoint: ${endpoint.substring(0, 80)}...`);
    console.log(`[send-push] Payload size: ${payloadString.length}, body size: ${body.length}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Content-Length': body.length.toString(),
        'TTL': '86400',
        'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
        'Urgency': 'high'
      },
      body: body
    });
    
    console.log(`[send-push] Response status: ${response.status}`);
    
    if (response.ok || response.status === 201) {
      return { success: true, status: response.status };
    }
    
    const text = await response.text();
    console.error(`[send-push] Error response: ${text}`);
    return { success: false, status: response.status, error: text };
  } catch (error) {
    console.error(`[send-push] Exception:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

interface NotificationRequest {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  targetType: 'all' | 'pro' | 'free' | 'inactive' | 'user';
  targetUserId?: string;
  inactiveDays?: number;
  scheduledId?: string;
  recurringId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header to verify admin or service role
    const authHeader = req.headers.get('Authorization');
    let adminId: string | null = null;
    let isServiceRoleCall = false;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      // Check if this is a service role call (from cron/scheduled functions)
      if (token === supabaseServiceKey) {
        console.log('[send-admin-notification] Service role call detected (cron/scheduled)');
        isServiceRoleCall = true;
        adminId = null; // No specific admin for automated calls
      } else {
        // Create a client with the user's token to verify admin role
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } }
        });
        
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          // Verify admin role using the user's context
          const { data: isAdmin, error: adminError } = await userClient.rpc('is_admin');
          console.log(`[send-admin-notification] Admin check for ${user.id}: ${isAdmin}, error: ${adminError?.message}`);
          
          if (!isAdmin) {
            return new Response(JSON.stringify({ error: 'Unauthorized - Admin only' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          adminId = user.id;
        } else {
          return new Response(JSON.stringify({ error: 'Unauthorized - Invalid token' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    } else {
      return new Response(JSON.stringify({ error: 'Unauthorized - No token provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body: NotificationRequest = await req.json();
    const { title, body: notifBody, icon = '📢', url, targetType, targetUserId, inactiveDays, scheduledId, recurringId } = body;

    console.log(`[send-admin-notification] Sending to targetType: ${targetType}`);

    // Get VAPID keys
    const { data: vapidRow } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'vapid_keys_jwk')
      .single();

    if (!vapidRow) {
      return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const vapidKeys = JSON.parse(vapidRow.value);
    const vapidPublicKey = vapidKeys.publicKey;
    const vapidPrivateKeyJwk = vapidKeys.privateKeyJwk;

    // Get recipients using the database function
    const { data: recipients, error: recipientsError } = await supabase.rpc('get_push_recipients', {
      _target_type: targetType,
      _target_user_id: targetUserId || null,
      _inactive_days: inactiveDays || null
    });

    if (recipientsError) {
      console.error('[send-admin-notification] Error getting recipients:', recipientsError);
      return new Response(JSON.stringify({ error: 'Failed to get recipients' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!recipients || recipients.length === 0) {
      console.log('[send-admin-notification] No recipients found');
      return new Response(JSON.stringify({ success: true, sent: 0, failed: 0, total: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[send-admin-notification] Found ${recipients.length} recipients`);

    const pushPayload = {
      title,
      body: notifBody,
      icon: `/icons/icon-192.png`,
      badge: '/icons/icon-192.png',
      url: url || '/',
      tag: `admin-${Date.now()}`
    };

    let successCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      const result = await sendPushNotification(
        recipient.endpoint,
        recipient.p256dh,
        recipient.auth,
        pushPayload,
        vapidPublicKey,
        vapidPrivateKeyJwk
      );

      if (result.success) {
        successCount++;
      } else {
        failedCount++;
        console.error(`[send-admin-notification] Failed for user ${recipient.user_id}: ${result.status} - ${result.error}`);
        
        // Remove invalid subscriptions (410 Gone or 404 Not Found)
        if (result.status === 410 || result.status === 404) {
          await supabase
            .from('user_push_subscriptions')
            .delete()
            .eq('endpoint', recipient.endpoint);
          console.log(`[send-admin-notification] Removed invalid subscription for ${recipient.user_id}`);
        }
      }
    }

    console.log(`[send-admin-notification] Sent ${successCount}/${recipients.length}, failed ${failedCount}`);

    // Also save to user_notifications (in-app notifications for users without push)
    // Get all unique user IDs from recipients AND users who match criteria but don't have push
    const { data: allTargetUsers } = await supabase.rpc('get_push_recipients', {
      _target_type: targetType,
      _target_user_id: targetUserId || null,
      _inactive_days: inactiveDays || null
    });

    // Get unique user IDs
    const userIds = new Set<string>();
    if (allTargetUsers) {
      for (const u of allTargetUsers) {
        userIds.add(u.user_id);
      }
    }

    // For "all" target type, also get users without push subscriptions
    if (targetType === 'all' || targetType === 'pro' || targetType === 'free') {
      let query = supabase.from('subscriptions').select('user_id');
      
      if (targetType === 'pro') {
        query = query.eq('plan', 'pro').eq('status', 'active');
      } else if (targetType === 'free') {
        query = query.eq('plan', 'free');
      }
      
      const { data: allUsers } = await query;
      if (allUsers) {
        for (const u of allUsers) {
          userIds.add(u.user_id);
        }
      }
    }

    // Insert in-app notifications for all target users
    if (userIds.size > 0) {
      const notifications = Array.from(userIds).map(userId => ({
        user_id: userId,
        title,
        message: notifBody,
        type: 'admin_push',
        is_read: false
      }));

      const { error: notifError } = await supabase.from('user_notifications').insert(notifications);
      if (notifError) {
        console.error('[send-admin-notification] Error saving in-app notifications:', notifError);
      } else {
        console.log(`[send-admin-notification] Saved ${notifications.length} in-app notifications`);
      }
    }

    // Log the send
    await supabase.from('push_send_logs').insert({
      notification_id: scheduledId || null,
      recurring_id: recurringId || null,
      title,
      body: notifBody,
      target_type: targetType,
      total_recipients: recipients.length,
      success_count: successCount,
      failure_count: failedCount,
      sent_by: adminId
    });

    // Log admin action if manual send
    if (adminId && !scheduledId && !recurringId) {
      await supabase.from('admin_logs').insert({
        admin_id: adminId,
        action: 'send_push_notification',
        details: {
          title,
          body: notifBody,
          target_type: targetType,
          target_user_id: targetUserId,
          inactive_days: inactiveDays,
          sent: successCount,
          failed: failedCount
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      sent: successCount,
      failed: failedCount,
      total: recipients.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[send-admin-notification] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
