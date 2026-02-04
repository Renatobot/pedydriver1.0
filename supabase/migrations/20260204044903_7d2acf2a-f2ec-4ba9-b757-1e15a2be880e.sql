-- Insert default notification templates
INSERT INTO public.push_templates (name, title, body, icon, url, is_active) VALUES
  ('Boas-vindas', '👋 Bem-vindo ao PedyDriver!', 'Estamos felizes em ter você! Registre seu primeiro ganho e comece a ter controle total das suas finanças.', '👋', '/quick', true),
  ('Reengajamento', '🚗 Oi, sentimos sua falta!', 'Faz tempo que você não registra seus ganhos. Que tal atualizar agora e ver quanto você ganhou?', '🚗', '/quick', true),
  ('Promoção PRO', '⭐ Oferta especial PRO!', 'Desbloqueie relatórios avançados, metas semanais e muito mais. Aproveite!', '⭐', '/upgrade', true),
  ('Lembrete diário', '📊 Hora de registrar!', 'Não esqueça de registrar os ganhos de hoje. Leva menos de 1 minuto!', '📊', '/quick', true),
  ('Meta atingida', '🎉 Parabéns!', 'Você atingiu sua meta semanal! Continue assim e alcance seus objetivos.', '🎉', '/dashboard', true),
  ('Dica PRO', '💡 Dica para você', 'Sabia que usuários PRO ganham em média 20% mais? Veja como otimizar seus horários.', '💡', '/reports', true),
  ('Atualização', '🔔 Novidades no app!', 'Temos novos recursos esperando por você. Confira as atualizações!', '🔔', '/', true),
  ('Combustível', '⛽ Preço de combustível', 'Confira o preço médio de combustível na sua região e economize!', '⛽', '/settings', true)
ON CONFLICT DO NOTHING;