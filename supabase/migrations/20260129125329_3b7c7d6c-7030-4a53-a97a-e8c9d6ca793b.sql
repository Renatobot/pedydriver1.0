-- Remover política permissiva e criar uma mais restritiva
DROP POLICY IF EXISTS "System can insert alerts" ON public.admin_alerts;

-- Alertas só podem ser inseridos por funções SECURITY DEFINER (triggers)
-- Nenhum usuário pode inserir diretamente
CREATE POLICY "No direct insert on alerts"
ON public.admin_alerts
FOR INSERT
TO authenticated
WITH CHECK (false);