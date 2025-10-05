-- Seed default routine items for Fred
INSERT INTO routine_items (period, task, date) VALUES
-- Morning routine
('morning', 'Dar insulina', CURRENT_DATE),
('morning', 'Medir glicemia', CURRENT_DATE),
('morning', 'Dar ração', CURRENT_DATE),
('morning', 'Dar água fresca', CURRENT_DATE),

-- Afternoon routine
('afternoon', 'Medir glicemia', CURRENT_DATE),
('afternoon', 'Dar lanche', CURRENT_DATE),
('afternoon', 'Passeio', CURRENT_DATE),

-- Evening routine
('evening', 'Dar insulina', CURRENT_DATE),
('evening', 'Medir glicemia', CURRENT_DATE),
('evening', 'Dar ração', CURRENT_DATE),
('evening', 'Verificar patas', CURRENT_DATE)

ON CONFLICT DO NOTHING;
