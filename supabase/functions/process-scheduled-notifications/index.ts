import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[process-scheduled-notifications] Starting scheduled check...');

    let processedScheduled = 0;
    let processedRecurring = 0;

    // ============================================
    // 1. Process scheduled (one-time) notifications
    // ============================================
    const { data: pendingScheduled, error: schedError } = await supabase.rpc('get_pending_scheduled_notifications');

    if (schedError) {
      console.error('[process-scheduled-notifications] Error fetching scheduled:', schedError);
    } else if (pendingScheduled && pendingScheduled.length > 0) {
      console.log(`[process-scheduled-notifications] Found ${pendingScheduled.length} pending scheduled notifications`);

      for (const notif of pendingScheduled) {
        try {
          // Call send-admin-notification edge function
          const response = await fetch(`${supabaseUrl}/functions/v1/send-admin-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              title: notif.title,
              body: notif.body,
              icon: notif.icon,
              url: notif.url,
              targetType: notif.target_type,
              targetUserId: notif.target_user_id,
              inactiveDays: notif.inactive_days,
              scheduledId: notif.id
            })
          });

          const result = await response.json();

          if (result.success) {
            // Update status to sent
            await supabase
              .from('scheduled_notifications')
              .update({
                status: 'sent',
                sent_count: result.sent,
                failed_count: result.failed,
                sent_at: new Date().toISOString()
              })
              .eq('id', notif.id);

            processedScheduled++;
            console.log(`[process-scheduled-notifications] Scheduled ${notif.id} sent: ${result.sent}/${result.total}`);
          } else {
            // Update status to failed
            await supabase
              .from('scheduled_notifications')
              .update({
                status: 'failed',
                sent_at: new Date().toISOString()
              })
              .eq('id', notif.id);

            console.error(`[process-scheduled-notifications] Scheduled ${notif.id} failed:`, result.error);
          }
        } catch (error) {
          console.error(`[process-scheduled-notifications] Error processing scheduled ${notif.id}:`, error);
          
          await supabase
            .from('scheduled_notifications')
            .update({ status: 'failed', sent_at: new Date().toISOString() })
            .eq('id', notif.id);
        }
      }
    }

    // ============================================
    // 2. Process recurring notifications
    // ============================================
    const { data: dueRecurring, error: recurError } = await supabase.rpc('get_due_recurring_notifications');

    if (recurError) {
      console.error('[process-scheduled-notifications] Error fetching recurring:', recurError);
    } else if (dueRecurring && dueRecurring.length > 0) {
      console.log(`[process-scheduled-notifications] Found ${dueRecurring.length} due recurring notifications`);

      for (const notif of dueRecurring) {
        try {
          // Call send-admin-notification edge function
          const response = await fetch(`${supabaseUrl}/functions/v1/send-admin-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              title: notif.title,
              body: notif.body,
              icon: notif.icon,
              url: notif.url,
              targetType: notif.target_type,
              inactiveDays: notif.inactive_days,
              recurringId: notif.id
            })
          });

          const result = await response.json();

          if (result.success) {
            // Update recurring notification with next run time
            await supabase.rpc('update_recurring_after_send', {
              _recurring_id: notif.id,
              _sent_count: result.sent
            });

            processedRecurring++;
            console.log(`[process-scheduled-notifications] Recurring ${notif.name} sent: ${result.sent}/${result.total}`);
          } else {
            console.error(`[process-scheduled-notifications] Recurring ${notif.name} failed:`, result.error);
            
            // Still update next_run_at to prevent infinite retries
            await supabase.rpc('update_recurring_after_send', {
              _recurring_id: notif.id,
              _sent_count: 0
            });
          }
        } catch (error) {
          console.error(`[process-scheduled-notifications] Error processing recurring ${notif.id}:`, error);
          
          // Update next_run_at to prevent infinite retries
          await supabase.rpc('update_recurring_after_send', {
            _recurring_id: notif.id,
            _sent_count: 0
          });
        }
      }
    }

    console.log(`[process-scheduled-notifications] Processed ${processedScheduled} scheduled, ${processedRecurring} recurring`);

    return new Response(JSON.stringify({
      success: true,
      processed_scheduled: processedScheduled,
      processed_recurring: processedRecurring
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[process-scheduled-notifications] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
