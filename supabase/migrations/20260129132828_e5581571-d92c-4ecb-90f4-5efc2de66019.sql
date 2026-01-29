-- Schedule daily churn check at 8:00 AM UTC
SELECT
  cron.schedule(
    'daily-churn-check',
    '0 8 * * *',
    $$
    SELECT
      net.http_post(
          url:='https://kfpyfcjukqjowridvyqi.supabase.co/functions/v1/cron-check-churn',
          headers:=jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcHlmY2p1a3Fqb3dyaWR2eXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjQ1ODUsImV4cCI6MjA4NTIwMDU4NX0.zdwLXQcDKFZNnwkhwqBNmWC7w16LSkextUqdngycqoc'
          ),
          body:=jsonb_build_object('triggered_at', now()::text)
      ) as request_id;
    $$
  );