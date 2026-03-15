-- Create organizations table
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizations are publicly readable" ON public.organizations FOR SELECT USING (true);

-- Create users table
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users are publicly readable" ON public.users FOR SELECT USING (true);

-- Create org_memberships table
CREATE TABLE public.org_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text, 'viewer'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT org_memberships_pkey PRIMARY KEY (id),
  CONSTRAINT org_memberships_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT org_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org memberships are publicly readable" ON public.org_memberships FOR SELECT USING (true);

-- Create deals table
CREATE TABLE public.deals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  deal_id text NOT NULL,
  deal_name text NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['New'::text, 'Active'::text, 'Bid Placed'::text, 'Closed'::text, 'Dormant'::text, 'Passed'::text, 'Lost'::text, 'Withdrawn'::text, 'Exited'::text, 'Owned Property'::text, 'Property Comp'::text])),
  asset_type text NOT NULL,
  deal_type text,
  fund text,
  bid_due_date date,
  due_diligence_date date,
  broker text,
  broker_email text,
  broker_phone text,
  comments text,
  is_starred boolean NOT NULL DEFAULT false,
  flags_r boolean NOT NULL DEFAULT false,
  flags_h boolean NOT NULL DEFAULT false,
  flags_m boolean NOT NULL DEFAULT false,
  date_added timestamp with time zone NOT NULL DEFAULT now(),
  date_modified timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT deals_pkey PRIMARY KEY (id),
  CONSTRAINT deals_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deals are publicly readable" ON public.deals FOR SELECT USING (true);
CREATE POLICY "Deals are publicly insertable" ON public.deals FOR INSERT WITH CHECK (true);
CREATE POLICY "Deals are publicly updatable" ON public.deals FOR UPDATE USING (true);

-- Create properties table
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  deal_pk uuid NOT NULL UNIQUE,
  address text,
  city text,
  state text,
  zip text,
  market text,
  parcel text,
  building_type text,
  year_built integer,
  year_renovated integer,
  buildings integer,
  stories integer,
  residential_sqft numeric,
  total_units integer,
  acres numeric,
  parking_spaces integer,
  asset_quality text,
  location_quality text,
  age_restricted boolean,
  affordable_units_pct numeric,
  affordability_status text,
  multifamily_housing_type text,
  property_manager text,
  university_affiliation text,
  amenities jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT properties_pkey PRIMARY KEY (id),
  CONSTRAINT properties_deal_pk_fkey FOREIGN KEY (deal_pk) REFERENCES public.deals(id)
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Properties are publicly readable" ON public.properties FOR SELECT USING (true);

-- Create rent_rolls table
CREATE TABLE public.rent_rolls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  deal_pk uuid NOT NULL,
  report_date date NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  uploaded_by_user_id uuid,
  has_anomalies boolean NOT NULL DEFAULT false,
  total_units integer,
  occupied_units integer,
  occupancy_pct numeric,
  CONSTRAINT rent_rolls_pkey PRIMARY KEY (id),
  CONSTRAINT rent_rolls_deal_pk_fkey FOREIGN KEY (deal_pk) REFERENCES public.deals(id),
  CONSTRAINT rent_rolls_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(id)
);
ALTER TABLE public.rent_rolls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rent rolls are publicly readable" ON public.rent_rolls FOR SELECT USING (true);

-- Create rent_roll_units table
CREATE TABLE public.rent_roll_units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rent_roll_id uuid NOT NULL,
  unit_no text,
  floor_plan text,
  net_sqft integer,
  bedrooms integer,
  bathrooms numeric,
  unit_type text,
  lease_type text,
  renovation_status text,
  occupancy_status text,
  market_rent numeric,
  contractual_rent numeric,
  recurring_concessions numeric,
  net_effective_rent numeric,
  lease_start_date date,
  lease_end_date date,
  move_in_date date,
  move_out_date date,
  tenant_name text,
  lease_term_months integer,
  CONSTRAINT rent_roll_units_pkey PRIMARY KEY (id),
  CONSTRAINT rent_roll_units_rent_roll_id_fkey FOREIGN KEY (rent_roll_id) REFERENCES public.rent_rolls(id)
);
ALTER TABLE public.rent_roll_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rent roll units are publicly readable" ON public.rent_roll_units FOR SELECT USING (true);

-- Create operating_statements table
CREATE TABLE public.operating_statements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  deal_pk uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  period_type text NOT NULL CHECK (period_type = ANY (ARRAY['Monthly'::text, 'Annual'::text])),
  budget_type text NOT NULL CHECK (budget_type = ANY (ARRAY['Actuals'::text, 'Proforma 1'::text, 'Proforma 2'::text, 'Proforma 3'::text])),
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  uploaded_by_user_id uuid,
  CONSTRAINT operating_statements_pkey PRIMARY KEY (id),
  CONSTRAINT operating_statements_deal_pk_fkey FOREIGN KEY (deal_pk) REFERENCES public.deals(id),
  CONSTRAINT operating_statements_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(id)
);
ALTER TABLE public.operating_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operating statements are publicly readable" ON public.operating_statements FOR SELECT USING (true);

-- Create operating_statement_line_items table
CREATE TABLE public.operating_statement_line_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL,
  account_name text NOT NULL,
  account_code text,
  category text,
  is_income boolean NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  CONSTRAINT operating_statement_line_items_pkey PRIMARY KEY (id),
  CONSTRAINT operating_statement_line_items_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.operating_statements(id)
);
ALTER TABLE public.operating_statement_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "OS line items are publicly readable" ON public.operating_statement_line_items FOR SELECT USING (true);

-- Create update_date_modified function and trigger for deals
CREATE OR REPLACE FUNCTION public.update_date_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.date_modified = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_deals_date_modified
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_date_modified();