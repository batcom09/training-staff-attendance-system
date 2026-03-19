-- Insert reference data for genders
INSERT INTO ref_genders (code, label, sort_order) VALUES
('male', 'Male', 1),
('female', 'Female', 2),
('other', 'Other', 3),
('prefer_not_to_say', 'Prefer not to say', 4)
ON CONFLICT (code) DO NOTHING;

-- Insert reference data for nationalities
INSERT INTO ref_nationalities (code, label, requires_other, sort_order) VALUES
('filipino', 'Filipino', FALSE, 1),
('filipino_american', 'Filipino-American', FALSE, 2),
('dual_citizen', 'Dual Citizen', FALSE, 3),
('other', 'Other', TRUE, 4)
ON CONFLICT (code) DO NOTHING;

-- Insert Philippine Army ranks data
INSERT INTO ref_philippine_army_ranks (rank_code, rank_name, rank_category, grade, display_order) VALUES
-- Commissioned Officers
('2LT', 'Second Lieutenant', 'commissioned_officer', 'O-1', 1),
('1LT', 'First Lieutenant', 'commissioned_officer', 'O-2', 2),
('CPT', 'Captain', 'commissioned_officer', 'O-3', 3),
('MAJ', 'Major', 'commissioned_officer', 'O-4', 4),
('LTC', 'Lieutenant Colonel', 'commissioned_officer', 'O-5', 5),
('COL', 'Colonel', 'commissioned_officer', 'O-6', 6),
('BG', 'Brigadier General', 'commissioned_officer', 'O-7', 7),
('MG', 'Major General', 'commissioned_officer', 'O-8', 8),
('LTG', 'Lieutenant General', 'commissioned_officer', 'O-9', 9),
('GEN', 'General', 'commissioned_officer', 'O-10', 10),

-- Enlisted Personnel
('Pvt', 'Private', 'enlisted_personnel', 'E-1', 11),
('PFC', 'Private First Class', 'enlisted_personnel', 'E-2', 12),
('CPL', 'Corporal', 'enlisted_personnel', 'E-3', 13),
('Sgt', 'Sergeant', 'enlisted_personnel', 'E-4', 14),
('SSg', 'Staff Sergeant', 'enlisted_personnel', 'E-5', 15),
('TSg', 'Technical Sergeant', 'enlisted_personnel', 'E-6', 16),
('MSg', 'Master Sergeant', 'enlisted_personnel', 'E-7', 17),
('SMS', 'Senior Master Sergeant', 'enlisted_personnel', 'E-8', 18),
('CSM', 'Chief Master Sergeant', 'enlisted_personnel', 'E-9', 19)
ON CONFLICT (rank_code) DO NOTHING;
