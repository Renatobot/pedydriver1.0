-- Reset last_sent_at e ajustar horário para teste imediato
UPDATE user_reminder_settings 
SET 
  last_sent_at = NULL,
  reminder_time = '01:15:00'
WHERE user_id = 'fb0660c5-87ad-41dc-a640-61e46f5d5d3f';