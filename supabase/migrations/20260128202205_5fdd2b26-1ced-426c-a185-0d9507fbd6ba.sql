-- Enum para tipos de veículo
CREATE TYPE public.vehicle_type AS ENUM ('carro', 'moto');

-- Enum para regra de rateio
CREATE TYPE public.cost_distribution_rule AS ENUM ('km', 'horas', 'receita');

-- Enum para tipo de serviço
CREATE TYPE public.service_type AS ENUM ('corrida', 'entrega', 'outro');

-- Enum para tipo de ganho
CREATE TYPE public.earning_type AS ENUM ('corrida_entrega', 'gorjeta', 'bonus', 'ajuste');

-- Enum para tipo de recebimento
CREATE TYPE public.payment_type AS ENUM ('imediato', 'app');

-- Enum para categoria de gasto
CREATE TYPE public.expense_category AS ENUM ('combustivel', 'manutencao', 'alimentacao', 'seguro', 'aluguel', 'internet', 'pedagio_estacionamento', 'outros');

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de configurações do usuário
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  cost_per_km DECIMAL(10,2) DEFAULT 0.50 NOT NULL,
  vehicle_type vehicle_type DEFAULT 'carro' NOT NULL,
  cost_distribution_rule cost_distribution_rule DEFAULT 'km' NOT NULL,
  week_starts_on TEXT DEFAULT 'segunda' NOT NULL CHECK (week_starts_on IN ('domingo', 'segunda')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de plataformas
CREATE TABLE public.platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT DEFAULT '#3b82f6',
  is_default BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Inserir plataformas padrão (sem user_id = disponíveis para todos)
INSERT INTO public.platforms (name, icon, color, is_default) VALUES
  ('Uber', 'car', '#000000', true),
  ('99', 'car', '#FFCB00', true),
  ('inDrive', 'car', '#2DB56D', true),
  ('Cabify', 'car', '#7B5CFF', true),
  ('iFood', 'bike', '#EA1D2C', true),
  ('99 Food', 'bike', '#FFCB00', true),
  ('Lalamove', 'truck', '#F47920', true),
  ('Shopee Entregas', 'package', '#EE4D2D', true),
  ('Mercado Livre Entregas', 'package', '#FFE600', true),
  ('Loggi', 'package', '#00B4CC', true);

-- Tabela de entradas (receitas)
CREATE TABLE public.earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  platform_id UUID REFERENCES public.platforms(id) ON DELETE SET NULL,
  service_type service_type NOT NULL DEFAULT 'corrida',
  earning_type earning_type NOT NULL DEFAULT 'corrida_entrega',
  payment_type payment_type NOT NULL DEFAULT 'app',
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  service_count INTEGER NOT NULL DEFAULT 1 CHECK (service_count >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de saídas (gastos)
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category expense_category NOT NULL DEFAULT 'combustivel',
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  platform_id UUID REFERENCES public.platforms(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de turnos/jornadas
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  platform_id UUID REFERENCES public.platforms(id) ON DELETE SET NULL,
  hours_worked DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (hours_worked >= 0),
  km_driven DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (km_driven >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para user_settings
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para platforms (permitir ver defaults ou próprias)
CREATE POLICY "Users can view platforms" ON public.platforms FOR SELECT USING (is_default = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own platforms" ON public.platforms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own platforms" ON public.platforms FOR UPDATE USING (auth.uid() = user_id AND is_default = false);
CREATE POLICY "Users can delete own platforms" ON public.platforms FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- Políticas RLS para earnings
CREATE POLICY "Users can view own earnings" ON public.earnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own earnings" ON public.earnings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own earnings" ON public.earnings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own earnings" ON public.earnings FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para expenses
CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para shifts
CREATE POLICY "Users can view own shifts" ON public.shifts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shifts" ON public.shifts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shifts" ON public.shifts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shifts" ON public.shifts FOR DELETE USING (auth.uid() = user_id);

-- Trigger para criar profile e settings automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_earnings_updated_at BEFORE UPDATE ON public.earnings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();