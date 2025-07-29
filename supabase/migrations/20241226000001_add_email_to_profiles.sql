-- Add email column to user_profiles_sub_mgmt table
ALTER TABLE IF EXISTS public.user_profiles_sub_mgmt 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill email for existing users
UPDATE public.user_profiles_sub_mgmt AS upsm
SET email = au.email
FROM auth.users AS au
WHERE upsm.id = au.id AND upsm.email IS NULL;

-- Make email NOT NULL after backfilling
ALTER TABLE IF EXISTS public.user_profiles_sub_mgmt 
ALTER COLUMN email SET NOT NULL;

-- Ensure RLS is enabled
ALTER TABLE public.user_profiles_sub_mgmt ENABLE ROW LEVEL SECURITY;

-- Create or replace INSERT policy for authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to create their own profile" ON public.user_profiles_sub_mgmt;
CREATE POLICY "Allow authenticated users to create their own profile" 
ON public.user_profiles_sub_mgmt 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Create index on email column for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles_sub_mgmt(email);

-- Add trigger to automatically create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles_sub_mgmt (
    id, 
    email,
    free_poems_generated, 
    is_subscribed, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email,
    0, 
    FALSE, 
    NOW(), 
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Sync any missing profiles from auth.users
INSERT INTO public.user_profiles_sub_mgmt (
  id, 
  email, 
  free_poems_generated, 
  is_subscribed, 
  created_at, 
  updated_at
)
SELECT 
  au.id, 
  au.email, 
  0, 
  FALSE, 
  NOW(), 
  NOW()
FROM 
  auth.users au
LEFT JOIN 
  public.user_profiles_sub_mgmt upsm ON au.id = upsm.id
WHERE 
  upsm.id IS NULL
ON CONFLICT (id) DO NOTHING;