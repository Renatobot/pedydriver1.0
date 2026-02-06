-- Create analytics_events table
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  page TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  referrer TEXT,
  device_type TEXT DEFAULT 'unknown',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_analytics_events_session_created ON public.analytics_events (session_id, created_at DESC);
CREATE INDEX idx_analytics_events_type_created ON public.analytics_events (event_type, created_at DESC);
CREATE INDEX idx_analytics_events_page_created ON public.analytics_events (page, created_at DESC);
CREATE INDEX idx_analytics_events_created ON public.analytics_events (created_at DESC);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert events (for tracking)
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (true);

-- Only admins can read events
CREATE POLICY "Admins can view analytics events"
ON public.analytics_events
FOR SELECT
USING (is_admin());

-- RPC: Get funnel data
CREATE OR REPLACE FUNCTION get_analytics_funnel(_days INTEGER DEFAULT 7)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT json_build_object(
    'landing_views', (
      SELECT COUNT(DISTINCT session_id) 
      FROM analytics_events 
      WHERE event_type = 'page_view' 
      AND page = '/landing' 
      AND created_at >= NOW() - (_days || ' days')::INTERVAL
    ),
    'cta_clicks', (
      SELECT COUNT(DISTINCT session_id) 
      FROM analytics_events 
      WHERE event_type = 'cta_click' 
      AND created_at >= NOW() - (_days || ' days')::INTERVAL
    ),
    'auth_views', (
      SELECT COUNT(DISTINCT session_id) 
      FROM analytics_events 
      WHERE event_type = 'page_view' 
      AND page = '/auth' 
      AND created_at >= NOW() - (_days || ' days')::INTERVAL
    ),
    'form_starts', (
      SELECT COUNT(DISTINCT session_id) 
      FROM analytics_events 
      WHERE event_type = 'form_start' 
      AND created_at >= NOW() - (_days || ' days')::INTERVAL
    ),
    'form_submits', (
      SELECT COUNT(DISTINCT session_id) 
      FROM analytics_events 
      WHERE event_type = 'form_submit' 
      AND created_at >= NOW() - (_days || ' days')::INTERVAL
    ),
    'signup_errors', (
      SELECT COUNT(*) 
      FROM analytics_events 
      WHERE event_type = 'signup_error' 
      AND created_at >= NOW() - (_days || ' days')::INTERVAL
    ),
    'signup_complete', (
      SELECT COUNT(DISTINCT session_id) 
      FROM analytics_events 
      WHERE event_type = 'signup_complete' 
      AND created_at >= NOW() - (_days || ' days')::INTERVAL
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- RPC: Get error breakdown
CREATE OR REPLACE FUNCTION get_analytics_errors(_days INTEGER DEFAULT 7)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT 
      metadata->>'error' as error_message,
      COUNT(*) as count,
      ROUND((COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM analytics_events WHERE event_type = 'signup_error' AND created_at >= NOW() - (_days || ' days')::INTERVAL), 0) * 100), 1) as percentage
    FROM analytics_events
    WHERE event_type = 'signup_error'
    AND created_at >= NOW() - (_days || ' days')::INTERVAL
    GROUP BY metadata->>'error'
    ORDER BY count DESC
    LIMIT 10
  ) t INTO result;

  RETURN result;
END;
$$;

-- RPC: Get sessions with events
CREATE OR REPLACE FUNCTION get_analytics_sessions(_limit INTEGER DEFAULT 50, _filter TEXT DEFAULT 'all')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT 
      s.session_id,
      s.first_seen,
      s.last_seen,
      s.device_type,
      s.referrer,
      s.completed,
      s.events
    FROM (
      SELECT 
        session_id,
        MIN(created_at) as first_seen,
        MAX(created_at) as last_seen,
        MAX(device_type) as device_type,
        MAX(referrer) as referrer,
        BOOL_OR(event_type = 'signup_complete') as completed,
        json_agg(
          json_build_object(
            'type', event_type,
            'page', page,
            'metadata', metadata,
            'created_at', created_at
          ) ORDER BY created_at
        ) as events
      FROM analytics_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY session_id
      ORDER BY MAX(created_at) DESC
      LIMIT _limit * 2
    ) s
    WHERE 
      _filter = 'all' 
      OR (_filter = 'completed' AND s.completed = true)
      OR (_filter = 'abandoned' AND s.completed = false)
    LIMIT _limit
  ) t INTO result;

  RETURN result;
END;
$$;

-- RPC: Get summary metrics
CREATE OR REPLACE FUNCTION get_analytics_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT json_build_object(
    'today', json_build_object(
      'visitors', (SELECT COUNT(DISTINCT session_id) FROM analytics_events WHERE created_at >= CURRENT_DATE),
      'signups', (SELECT COUNT(DISTINCT session_id) FROM analytics_events WHERE event_type = 'signup_complete' AND created_at >= CURRENT_DATE)
    ),
    'week', json_build_object(
      'visitors', (SELECT COUNT(DISTINCT session_id) FROM analytics_events WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
      'signups', (SELECT COUNT(DISTINCT session_id) FROM analytics_events WHERE event_type = 'signup_complete' AND created_at >= CURRENT_DATE - INTERVAL '7 days')
    ),
    'month', json_build_object(
      'visitors', (SELECT COUNT(DISTINCT session_id) FROM analytics_events WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'),
      'signups', (SELECT COUNT(DISTINCT session_id) FROM analytics_events WHERE event_type = 'signup_complete' AND created_at >= CURRENT_DATE - INTERVAL '30 days')
    ),
    'top_error', (
      SELECT metadata->>'error' 
      FROM analytics_events 
      WHERE event_type = 'signup_error' 
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY metadata->>'error'
      ORDER BY COUNT(*) DESC
      LIMIT 1
    )
  ) INTO result;

  RETURN result;
END;
$$;