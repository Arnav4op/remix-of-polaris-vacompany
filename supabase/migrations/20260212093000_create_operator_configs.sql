CREATE TABLE public.operator_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view operators"
ON public.operator_configs
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage operators"
ON public.operator_configs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.operator_configs (name, order_index) VALUES
  ('Aeroflot', 1),
  ('Azerbaijan Airlines', 2),
  ('Uzbekistan Airways', 3),
  ('Belavia', 4),
  ('S7 Airlines', 5),
  ('AirBridge Cargo', 6),
  ('Saudia', 7),
  ('Emirates', 8),
  ('Fly Dubai', 9),
  ('Emirates SkyCargo', 10),
  ('Aegean Airlines', 11),
  ('Qatar Airways', 12),
  ('SunCountry Airlines', 13),
  ('IndiGo', 14),
  ('Oman Air', 15),
  ('Others', 16)
ON CONFLICT (name) DO NOTHING;
