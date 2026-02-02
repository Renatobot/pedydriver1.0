-- Corrigir política permissiva na tabela pending_payments
-- Remover a política "Service role can insert pending payments" que usa WITH CHECK (true)
-- E substituir por uma mais restritiva

-- Drop existing permissive policy
DROP POLICY IF EXISTS "Service role can insert pending payments" ON public.pending_payments;

-- Create new policy that only allows insertion via service role (edge functions)
-- This is still needed for webhooks but is now more explicit
CREATE POLICY "Edge functions can insert pending payments"
ON public.pending_payments
FOR INSERT
TO authenticated, anon
WITH CHECK (
  -- Only allow if user is admin (for manual entries)
  -- Or the request comes from service role (webhooks will use service role key)
  public.is_admin()
);

-- Add a separate policy for service role to handle webhook insertions
-- Note: Service role bypasses RLS, so this policy only affects authenticated/anon users