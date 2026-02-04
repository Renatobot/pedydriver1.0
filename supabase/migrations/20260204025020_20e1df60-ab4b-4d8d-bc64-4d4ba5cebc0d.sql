-- Schedule the send-user-reminders function to run every 5 minutes
SELECT cron.schedule(
  'send-user-reminders',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://kfpyfcjukqjowridvyqi.supabase.co/functions/v1/send-user-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcHlmY2p1a3Fqb3dyaWR2eXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjQ1ODUsImV4cCI6MjA4NTIwMDU4NX0.zdwLXQcDKFZNnwkhwqBNmWC7w16LSkextUqdngycqoc"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);