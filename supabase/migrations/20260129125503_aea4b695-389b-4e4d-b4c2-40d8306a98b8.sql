-- Inserir usuário como admin
INSERT INTO public.user_roles (user_id, role) 
VALUES ('af5d792e-2f73-4d6b-8b53-392f49c059da', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;