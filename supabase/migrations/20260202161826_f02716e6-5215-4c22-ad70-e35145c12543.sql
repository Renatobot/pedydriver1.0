-- Create user notifications table
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.user_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.user_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.user_notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Admin can insert notifications for any user
CREATE POLICY "Admin can insert notifications"
ON public.user_notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create function to notify user about subscription update
CREATE OR REPLACE FUNCTION public.notify_subscription_update(
  _target_user_id UUID,
  _plan TEXT,
  _status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _title TEXT;
  _message TEXT;
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  -- Build notification message based on plan change
  IF _plan = 'pro' AND _status = 'active' THEN
    _title := '🎉 Plano PRO Ativado!';
    _message := 'Seu plano foi atualizado para PRO. Aproveite todos os recursos premium!';
  ELSIF _plan = 'pro' AND _status = 'trialing' THEN
    _title := '🎁 Período de Teste Ativado!';
    _message := 'Você agora tem acesso ao plano PRO em período de teste. Aproveite!';
  ELSIF _plan = 'free' THEN
    _title := '📋 Plano Atualizado';
    _message := 'Seu plano foi alterado para o plano Gratuito.';
  ELSIF _status = 'cancelled' THEN
    _title := '⚠️ Assinatura Cancelada';
    _message := 'Sua assinatura foi cancelada pelo administrador.';
  ELSIF _status = 'expired' THEN
    _title := '⏰ Assinatura Expirada';
    _message := 'Sua assinatura PRO expirou. Renove para continuar com os recursos premium.';
  ELSE
    _title := '📋 Plano Atualizado';
    _message := 'Seu plano foi atualizado pelo administrador.';
  END IF;

  -- Insert notification
  INSERT INTO public.user_notifications (user_id, type, title, message)
  VALUES (_target_user_id, 'subscription_update', _title, _message);

  RETURN TRUE;
END;
$$;