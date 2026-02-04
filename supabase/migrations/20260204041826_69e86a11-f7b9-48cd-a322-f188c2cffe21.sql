-- Deletar subscription corrompida do Android para permitir nova inscrição
DELETE FROM user_push_subscriptions 
WHERE id = '35e74626-dac8-4622-902e-2ce6a0d31aec';