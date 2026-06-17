DROP POLICY IF EXISTS "temp anon read cons" ON public.consumption_tariff;
REVOKE SELECT ON public.consumption_tariff FROM anon;