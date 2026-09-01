/*
# Fix handle_new_user trigger function

## Changes
- Sets a fixed search_path on the function to resolve the security advisor warning
- Updates the function to also save phone and workshop_name from user_meta_data
- Revokes EXECUTE from anon and authenticated (only the trigger should call it)
- Replaces the existing trigger

## Why
The original function had a mutable search_path which can cause runtime issues.
The SignupPage was also using a fragile setTimeout to update the profile after
signup — instead, we now pass all profile data through user_meta_data and the
trigger handles it in one atomic step.
*/

-- Drop old trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate function with fixed search_path and more data
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, phone, workshop_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'workshop_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke execute from anon and authenticated
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon, authenticated;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
