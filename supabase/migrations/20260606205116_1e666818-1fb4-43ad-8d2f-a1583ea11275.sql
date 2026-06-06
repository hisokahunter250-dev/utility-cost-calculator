
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Tab passwords (admin sets, all authed can read to verify)
CREATE TABLE public.tab_passwords (
  tab_key text PRIMARY KEY,
  password text NOT NULL,
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.tab_passwords TO authenticated;
GRANT ALL ON public.tab_passwords TO service_role;
ALTER TABLE public.tab_passwords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read tab pw" ON public.tab_passwords FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage tab pw" ON public.tab_passwords FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.tab_passwords(tab_key,password) VALUES ('installation','1234'),('violation','1234');

-- Generic tariff key/value tables
CREATE TABLE public.tariff_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,  -- meter_price, valve, pipe, slope, install_meter, install_slope, install_valve, install_pipe, insurance, encroachment_water, encroachment_sewage
  key text NOT NULL,        -- e.g. '3/4', '1', '1.5', '2', or '3/4_card', etc
  label text NOT NULL,
  value numeric NOT NULL,
  sort_order int DEFAULT 0,
  UNIQUE(category,key)
);
GRANT SELECT ON public.tariff_items TO authenticated;
GRANT ALL ON public.tariff_items TO service_role;
ALTER TABLE public.tariff_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read tariff" ON public.tariff_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage tariff" ON public.tariff_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Consumption tariff (per category/density/diameter/month)
CREATE TABLE public.consumption_tariff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,    -- 'منزلي','غير منزلي','خدمي وحكومي','اخري'
  density text,              -- 'كثيف','قليل', null for منزلي
  diameter text NOT NULL,    -- 'نص بوصة','تلات تربع','بوصة','بوصة ونص','بوصة وربع','2 بوصة'
  month date NOT NULL,
  water numeric NOT NULL DEFAULT 0,
  sewage numeric NOT NULL DEFAULT 0,
  water_plus_sewage numeric NOT NULL DEFAULT 0,
  sewage_pump numeric NOT NULL DEFAULT 0,
  threshold text,
  UNIQUE(category,density,diameter,month)
);
GRANT SELECT ON public.consumption_tariff TO authenticated;
GRANT ALL ON public.consumption_tariff TO service_role;
ALTER TABLE public.consumption_tariff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read cons" ON public.consumption_tariff FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage cons" ON public.consumption_tariff FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Handle new user trigger creates profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles(id,username) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
