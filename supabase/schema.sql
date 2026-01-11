-- =============================================
-- 24Property Database Schema for Supabase
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. ZONES TABLE
-- =============================================
CREATE TABLE zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📍',
    center_lat FLOAT NOT NULL,
    center_lng FLOAT NOT NULL,
    zoom INT DEFAULT 14,
    radius INT[] DEFAULT ARRAY[1000, 3000, 5000],
    description TEXT
);

-- =============================================
-- 2. PROPERTIES TABLE
-- =============================================
CREATE TABLE properties (
    id TEXT PRIMARY KEY,
    zone_id TEXT REFERENCES zones(id) ON DELETE SET NULL,
    title JSONB NOT NULL DEFAULT '{}',
    description JSONB DEFAULT '{}',
    price BIGINT NOT NULL DEFAULT 0,
    price_per_rai BIGINT,
    area_rai FLOAT,
    area_sqm FLOAT,
    grade TEXT CHECK (grade IN ('S', 'A', 'B', 'C')) DEFAULT 'B',
    type TEXT CHECK (type IN ('OWNER', 'HOT', 'POTENTIAL')) DEFAULT 'POTENTIAL',
    status TEXT CHECK (status IN ('AVAILABLE', 'SOLD', 'RESERVED')) DEFAULT 'AVAILABLE',
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    address TEXT,
    land_deed TEXT,
    zoning_color TEXT,
    road_access TEXT,
    current_image TEXT,
    future_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. PROPERTY_IMAGES TABLE
-- =============================================
CREATE TABLE property_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type TEXT CHECK (type IN ('CURRENT', 'AI_RENDER', 'AERIAL', 'DOCUMENT')) DEFAULT 'CURRENT',
    "order" INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. FEASIBILITY TABLE
-- =============================================
CREATE TABLE feasibility (
    property_id TEXT PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
    project_type TEXT,
    yield FLOAT,
    breakeven_years FLOAT,
    best_for TEXT,
    nightly_rate_min INT,
    nightly_rate_max INT,
    investment_score INT CHECK (investment_score >= 0 AND investment_score <= 100)
);

-- =============================================
-- 5. PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    name TEXT,
    phone TEXT,
    role TEXT CHECK (role IN ('BUYER', 'SELLER', 'AGENT', 'ADMIN')) DEFAULT 'BUYER',
    language TEXT DEFAULT 'th',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. INQUIRIES TABLE
-- =============================================
CREATE TABLE inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    message TEXT,
    status TEXT CHECK (status IN ('NEW', 'CONTACTED', 'CLOSED')) DEFAULT 'NEW',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. FAVORITES TABLE
-- =============================================
CREATE TABLE favorites (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, property_id)
);

-- =============================================
-- INDEXES for better query performance
-- =============================================
CREATE INDEX idx_properties_zone ON properties(zone_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_grade ON properties(grade);
CREATE INDEX idx_inquiries_property ON inquiries(property_id);
CREATE INDEX idx_inquiries_user ON inquiries(user_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_favorites_user ON favorites(user_id);

-- =============================================
-- TRIGGER: Auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =============================================
-- TRIGGER: Auto-create profile on user signup
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS) Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE feasibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- ZONES: Everyone can read
CREATE POLICY "Zones are viewable by everyone" ON zones FOR SELECT USING (true);
CREATE POLICY "Zones are editable by admins" ON zones FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- PROPERTIES: Everyone can read, only admins can modify
CREATE POLICY "Properties are viewable by everyone" ON properties FOR SELECT USING (true);
CREATE POLICY "Properties are editable by admins" ON properties FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- PROPERTY_IMAGES: Everyone can read, only admins can modify
CREATE POLICY "Property images are viewable by everyone" ON property_images FOR SELECT USING (true);
CREATE POLICY "Property images are editable by admins" ON property_images FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- FEASIBILITY: Everyone can read, only admins can modify
CREATE POLICY "Feasibility is viewable by everyone" ON feasibility FOR SELECT USING (true);
CREATE POLICY "Feasibility is editable by admins" ON feasibility FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- PROFILES: Users can view all, but only edit their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- INQUIRIES: Users can create, view own, admins can see all
CREATE POLICY "Anyone can create inquiry" ON inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own inquiries" ON inquiries FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Admins can manage inquiries" ON inquiries FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- FAVORITES: Users can manage their own favorites
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);
