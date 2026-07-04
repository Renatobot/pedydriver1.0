
-- 1) fuel_prices: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view fuel prices" ON public.fuel_prices;
CREATE POLICY "Authenticated users can view fuel prices"
ON public.fuel_prices
FOR SELECT
TO authenticated
USING (true);

REVOKE SELECT ON public.fuel_prices FROM anon;

-- 2) analytics_events: replace permissive INSERT with validated one
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Insert validated analytics events"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type IS NOT NULL
  AND length(event_type) BETWEEN 1 AND 100
  AND session_id IS NOT NULL
  AND length(session_id) BETWEEN 1 AND 200
  AND (page IS NULL OR length(page) <= 500)
);

-- 3) Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated
DO $$
DECLARE
  fn text;
  admin_only text[] := ARRAY[
    'admin_cancel_pending_payment','admin_close_ticket','admin_get_user_for_reset',
    'admin_link_payment_to_user','admin_notify_inactivity_warning','admin_reply_ticket',
    'admin_reset_monthly_limit','admin_toggle_user_block','admin_update_subscription',
    'admin_update_user_profile','generate_churn_alerts','get_admin_alerts',
    'get_admin_logs','get_admin_metrics','get_admin_push_subscriptions',
    'get_admin_users','get_analytics_errors','get_analytics_funnel',
    'get_analytics_sessions','get_analytics_summary','get_pending_payments',
    'get_support_tickets','get_unread_alerts_count','mark_alert_as_read',
    'mark_all_alerts_as_read','notify_subscription_update','create_payment_failure_alert',
    'count_push_recipients','get_push_recipients',
    'get_users_due_for_reminder','mark_reminder_sent','get_due_recurring_notifications',
    'get_pending_scheduled_notifications','update_recurring_after_send','calculate_next_run_at'
  ];
  trigger_only text[] := ARRAY[
    'create_new_user_alert','create_pro_subscription_alert','create_pro_upgrade_notification',
    'create_welcome_notification','handle_new_user','trigger_admin_push_notification',
    'update_gamification_stats','update_last_login','update_updated_at_column'
  ];
BEGIN
  FOREACH fn IN ARRAY admin_only LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I FROM PUBLIC, anon, authenticated', fn);
    EXCEPTION WHEN undefined_function THEN NULL;
    END;
  END LOOP;
  FOREACH fn IN ARRAY trigger_only LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I FROM PUBLIC, anon, authenticated', fn);
    EXCEPTION WHEN undefined_function THEN NULL;
    END;
  END LOOP;
END $$;

-- Revoke anon from authenticated-only user-facing DEFINER functions
REVOKE EXECUTE ON FUNCTION public.get_referral_stats() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_or_create_referral_code(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_pending_referrals() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_referral(text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.register_pending_referral(text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_weekly_goals(uuid) FROM anon, PUBLIC;
