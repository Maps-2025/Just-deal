
-- Add processing columns to rent_rolls
ALTER TABLE public.rent_rolls
  ADD COLUMN IF NOT EXISTS raw_data jsonb,
  ADD COLUMN IF NOT EXISTS column_mapping jsonb,
  ADD COLUMN IF NOT EXISTS processing_status text NOT NULL DEFAULT 'draft';

-- Add rent_escalations to rent_roll_units
ALTER TABLE public.rent_roll_units
  ADD COLUMN IF NOT EXISTS rent_escalations jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Allow public insert/update/delete on rent_rolls (for API edge function with anon key)
CREATE POLICY "Rent rolls are publicly insertable" ON public.rent_rolls FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Rent rolls are publicly updatable" ON public.rent_rolls FOR UPDATE TO public USING (true);
CREATE POLICY "Rent rolls are publicly deletable" ON public.rent_rolls FOR DELETE TO public USING (true);

-- Allow public insert/update/delete on rent_roll_units
CREATE POLICY "Rent roll units are publicly insertable" ON public.rent_roll_units FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Rent roll units are publicly updatable" ON public.rent_roll_units FOR UPDATE TO public USING (true);
CREATE POLICY "Rent roll units are publicly deletable" ON public.rent_roll_units FOR DELETE TO public USING (true);
