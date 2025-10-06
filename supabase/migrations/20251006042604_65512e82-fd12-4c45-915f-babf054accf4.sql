-- Add weight tracking columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS average_weight DECIMAL(8,3),
ADD COLUMN IF NOT EXISTS weight_tolerance DECIMAL(5,3) DEFAULT 0.05;

-- Create cart monitoring table for weight and item tracking
CREATE TABLE IF NOT EXISTS public.cart_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  measured_weight DECIMAL(8,3) NOT NULL,
  expected_weight DECIMAL(8,3) NOT NULL,
  discrepancy DECIMAL(8,3) NOT NULL,
  unbilled_items JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for cart_monitoring
ALTER TABLE public.cart_monitoring ENABLE ROW LEVEL SECURITY;

-- Policies for cart_monitoring
CREATE POLICY "Users can view their own monitoring data"
ON public.cart_monitoring
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monitoring data"
ON public.cart_monitoring
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all monitoring data"
ON public.cart_monitoring
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_cart_monitoring_updated_at
BEFORE UPDATE ON public.cart_monitoring
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update sample products with weight data
UPDATE public.products 
SET average_weight = CASE 
  WHEN category = 'Beverages' THEN 0.5
  WHEN category = 'Dairy' THEN 0.5
  WHEN category = 'Snacks' THEN 0.2
  WHEN category = 'Personal Care' THEN 0.3
  WHEN category = 'Household' THEN 1.0
  ELSE 0.5
END
WHERE average_weight IS NULL;