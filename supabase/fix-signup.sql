-- =============================================
-- FIX: Allow profile creation on user signup
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard → Your Project → SQL Editor
-- =============================================

-- STEP 1: Drop existing profiles policies
DROP POLICY IF EXISTS "Profiles select" ON profiles;
DROP POLICY IF EXISTS "Profiles update own" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow insert for auth trigger" ON profiles;
DROP POLICY IF EXISTS "Profiles insert own" ON profiles;

-- STEP 2: Recreate policies with INSERT permission
-- Allow anyone to read profiles
CREATE POLICY "Profiles select" ON profiles 
FOR SELECT USING (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Profiles insert own" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Profiles update own" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- STEP 3: Make sure the trigger function has proper security
-- This ensures the trigger can insert into profiles regardless of RLS
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER  -- This allows the function to bypass RLS
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'BUYER'  -- Default role for new users
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, ignore
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail the signup
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 4: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- STEP 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- =============================================
-- VERIFICATION: Run this to check if it works
-- =============================================
-- SELECT * FROM profiles LIMIT 5;
