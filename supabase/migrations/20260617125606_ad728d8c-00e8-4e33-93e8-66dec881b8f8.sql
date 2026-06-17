CREATE POLICY "temp anon read cons" ON public.consumption_tariff FOR SELECT TO anon USING (true);
GRANT SELECT ON public.consumption_tariff TO anon;