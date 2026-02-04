-- Ajustar para horário atual (01:10 São Paulo = 04:10 UTC)
UPDATE user_reminder_settings 
SET 
  last_sent_at = NULL,
  reminder_time = '01:10:00'
WHERE user_id = 'fb0660c5-87ad-41dc-a640-61e46f5d5d3f';