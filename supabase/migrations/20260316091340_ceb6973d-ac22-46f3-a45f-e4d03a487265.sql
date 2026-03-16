
-- Add insert/update policies for properties table
CREATE POLICY "Properties are publicly insertable"
ON public.properties FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Properties are publicly updatable"
ON public.properties FOR UPDATE
TO public
USING (true);
