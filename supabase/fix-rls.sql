-- =============================================
-- FIX: Infinite recursion in profiles RLS policy
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Zones are viewable by everyone" ON zones;
DROP POLICY IF EXISTS "Zones are editable by admins" ON zones;
DROP POLICY IF EXISTS "Zones are modifiable by authenticated" ON zones;

DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
DROP POLICY IF EXISTS "Properties are editable by admins" ON properties;
DROP POLICY IF EXISTS "Properties are modifiable by authenticated" ON properties;

DROP POLICY IF EXISTS "Property images are viewable by everyone" ON property_images;
DROP POLICY IF EXISTS "Property images are editable by admins" ON property_images;
DROP POLICY IF EXISTS "Property images are modifiable by authenticated" ON property_images;

DROP POLICY IF EXISTS "Feasibility is viewable by everyone" ON feasibility;
DROP POLICY IF EXISTS "Feasibility is editable by admins" ON feasibility;
DROP POLICY IF EXISTS "Feasibility is modifiable by authenticated" ON feasibility;

DROP POLICY IF EXISTS "Anyone can create inquiry" ON inquiries;
DROP POLICY IF EXISTS "Users can view own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can manage inquiries" ON inquiries;
DROP POLICY IF EXISTS "Inquiries are viewable by all" ON inquiries;
DROP POLICY IF EXISTS "Inquiries are modifiable by authenticated" ON inquiries;

DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;

-- Recreate simple policies WITHOUT self-referencing
CREATE POLICY "Profiles select" ON profiles FOR SELECT USING (true);
CREATE POLICY "Profiles update own" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Zones select" ON zones FOR SELECT USING (true);
CREATE POLICY "Zones modify" ON zones FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Properties select" ON properties FOR SELECT USING (true);
CREATE POLICY "Properties modify" ON properties FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Property images select" ON property_images FOR SELECT USING (true);
CREATE POLICY "Property images modify" ON property_images FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Feasibility select" ON feasibility FOR SELECT USING (true);
CREATE POLICY "Feasibility modify" ON feasibility FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Inquiries select" ON inquiries FOR SELECT USING (true);
CREATE POLICY "Inquiries insert" ON inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Inquiries modify" ON inquiries FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Favorites manage" ON favorites FOR ALL USING (auth.uid() = user_id);

