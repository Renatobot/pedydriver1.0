-- Adicionar template de Atualização do App com passo a passo
INSERT INTO push_templates (name, title, body, icon, url, is_active) VALUES 
(
  'Atualização disponível',
  '🚀 Nova atualização disponível!',
  'Novidades te esperando! Abra o app, toque em "Atualizar agora" no aviso que aparecer ou feche e abra novamente.',
  '🚀',
  '/',
  true
),
(
  'Nova funcionalidade',
  '✨ Novidade no PEDY!',
  'Acabamos de lançar uma nova funcionalidade! Abra o app e toque em "Atualizar agora" para conferir as melhorias.',
  '✨',
  '/',
  true
);