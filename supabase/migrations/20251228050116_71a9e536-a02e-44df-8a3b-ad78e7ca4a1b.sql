-- Crear tabla de canchas deportivas
CREATE TABLE public.courts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sport_type TEXT NOT NULL,
  price_per_hour NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de reservas
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
);

-- Enable RLS
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- RLS policies for courts (all authenticated users can view)
CREATE POLICY "Authenticated users can view courts"
ON public.courts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage courts"
ON public.courts FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS policies for reservations
CREATE POLICY "Users can view their own reservations"
ON public.reservations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reservations"
ON public.reservations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations"
ON public.reservations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reservations"
ON public.reservations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_courts_updated_at
BEFORE UPDATE ON public.courts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default courts
INSERT INTO public.courts (name, sport_type, price_per_hour, description) VALUES
('Cancha 1', 'Fútbol 5', 50000, 'Cancha de césped sintético'),
('Cancha 2', 'Fútbol 5', 50000, 'Cancha de césped sintético'),
('Cancha 3', 'Tenis', 40000, 'Cancha de arcilla');