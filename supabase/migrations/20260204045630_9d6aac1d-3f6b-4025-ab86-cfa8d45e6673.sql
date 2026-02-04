-- Remove templates duplicados, mantendo apenas os essenciais
DELETE FROM push_templates WHERE id IN (
  'd2aee900-927d-448a-bd44-038bf821fd1c',  -- Duplicado de Reengajamento
  'af07cb0d-5df7-4156-884c-aeff0e4de548',  -- Duplicado de Promoção PRO
  '73cb8c86-e0f9-4bb2-b1b2-5e753a6080df',  -- Duplicado de Atualização
  'ea46f555-40f2-4899-84b3-e109ba1a065d',  -- Duplicado de Lembrete
  '19bf624c-139d-40aa-8988-1696f81fa480',  -- Duplicado de Atualização
  'bdb18a86-52d1-4202-9c2b-969593b96590'   -- Duplicado de Atualização
);