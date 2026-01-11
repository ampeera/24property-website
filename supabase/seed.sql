-- =============================================
-- 24Property Seed Data
-- Run this AFTER schema.sql
-- =============================================

-- Insert Zones
INSERT INTO zones (id, name, icon, center_lat, center_lng, zoom, radius, description) VALUES
('A', 'Tomorrowland (Pong)', '🎵', 12.9236, 101.0186, 14, ARRAY[1000, 3000, 5000], 'Prime area for Luxury Villas & Resorts'),
('B', 'Highway Rest Stop (Surasak)', '🛣️', 13.1485, 100.9576, 15, ARRAY[500, 1000], 'Future commercial hub & Rest Area'),
('C', 'Industrial (Phanat Nikhom)', '🏭', 13.4522, 101.1772, 13, ARRAY[2000, 5000], 'Heavy industrial & Warehouse zone');

-- Insert Properties
INSERT INTO properties (id, zone_id, title, description, price, grade, type, status, lat, lng, current_image, future_image) VALUES
('A-01', 'A', 
    '{"en": "Prime Villa Land 1 Rai", "th": "ที่ดินวิลล่า 1 ไร่ โป่ง", "zh": "豪华别墅用地 1 莱"}'::jsonb,
    '{"en": "Perfect for Private Pool Villas. 3 mins from Wisdom Valley.", "th": "เหมาะทำพูลวิลล่า ใกล้ Wisdom Valley 3 นาที"}'::jsonb,
    12000000, 'S', 'OWNER', 'AVAILABLE', 12.9236, 101.0186,
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    '/images/ai-renders/villa-render.png'),

('A-02', 'A',
    '{"en": "Hillside Plot", "th": "ที่ดินเนินเขา วิวสวย", "zh": "山景地块"}'::jsonb,
    '{"en": "Great view, priced to sell.", "th": "วิวสวย ราคาดี รีบขาย"}'::jsonb,
    8500000, 'A', 'HOT', 'AVAILABLE', 12.9250, 101.0200,
    'https://images.unsplash.com/photo-1513836279014-a936c4e12716?auto=format&fit=crop&w=1200&q=80',
    NULL),

('A-03', 'A',
    '{"en": "Garden Plot", "th": "ที่ดินสวนเกษตร", "zh": "花园地块"}'::jsonb,
    '{"en": "Good for long term hold.", "th": "เหมาะเก็บเก็งกำไรระยะยาว"}'::jsonb,
    5000000, 'B', 'POTENTIAL', 'AVAILABLE', 12.9210, 101.0150,
    'https://images.unsplash.com/photo-1598543789391-494892c9431e?auto=format&fit=crop&w=1200&q=80',
    NULL),

('B-01', 'B',
    '{"en": "Highway Frontage 2 Rai", "th": "ที่ดินติดหน้าถนน 2 ไร่", "zh": "高速公路临街地块"}'::jsonb,
    '{"en": "Ideal for Gas Station or Rest Area.", "th": "เหมาะทำปั๊มน้ำมัน หรือจุดพักรถ"}'::jsonb,
    15000000, 'S', 'OWNER', 'AVAILABLE', 13.1485, 100.9576,
    'https://images.unsplash.com/photo-1565610261709-672565625a69?auto=format&fit=crop&w=1200&q=80',
    '/images/ai-renders/reststop-render.png'),

('C-01', 'C',
    '{"en": "Industrial Estate 30 Rai", "th": "ที่ดินนิคมอุตสาหกรรม 30 ไร่", "zh": "工业用地 30 莱"}'::jsonb,
    '{"en": "Ready for Factory construction.", "th": "พื้นที่สีม่วง พร้อมสร้างโรงงาน"}'::jsonb,
    45000000, 'S', 'OWNER', 'AVAILABLE', 13.4522, 101.1772,
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    '/images/ai-renders/factory-render.png');

-- Insert feasibility data
INSERT INTO feasibility (property_id, project_type, yield, breakeven_years, best_for, nightly_rate_min, nightly_rate_max) VALUES
('A-01', 'Pool Villa', 8.5, 5.2, 'Daily Rental', 4500, 6000),
('A-02', 'Vacation Home', 6.0, 7.5, 'Long-term Hold', 3000, 3000),
('A-03', 'Agriculture / Cafe', 4.5, 9.0, 'Cafe Business', NULL, NULL),
('B-01', 'Commercial Stop', 12.0, 4.0, 'Gas Station / Retail', NULL, NULL),
('C-01', 'Factory / Warehouse', 10.5, 6.0, 'Logistics Hub', NULL, NULL);

-- Insert property images
INSERT INTO property_images (property_id, url, type, "order") VALUES
('A-01', '/images/ai-renders/villa-render.png', 'AI_RENDER', 1),
('B-01', '/images/ai-renders/reststop-render.png', 'AI_RENDER', 1),
('C-01', '/images/ai-renders/factory-render.png', 'AI_RENDER', 1);
