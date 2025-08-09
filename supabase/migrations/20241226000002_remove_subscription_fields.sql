-- This migration removes the subscription-related fields from user_profiles_sub_mgmt
-- while preserving the email field that was added in the previous migration

-- First, remove the subscription-related fields
ALTER TABLE IF EXISTS public.user_profiles_sub_mgmt 
DROP COLUMN IF EXISTS is_subscribed,
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_subscription_id;

-- Reset free_poems_generated to 0 for all users since we're removing the limit
UPDATE public.user_profiles_sub_mgmt
SET free_poems_generated = 0;

-- Keep the email field as that was part of the previous migration