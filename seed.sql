-- Xóa dữ liệu cũ (nếu muốn làm sạch)
-- delete from votes;
-- delete from candidates;
-- delete from categories;

-- 1. Tạo Giải: Man of the Match
WITH cat1 AS (
    INSERT INTO categories (name) VALUES ('Cầu thủ xuất sắc nhất (Man of the Match)') RETURNING id
)
INSERT INTO candidates (name, number, category_id) VALUES 
('Lionel Messi', 10, (SELECT id FROM cat1)),
('Cristiano Ronaldo', 7, (SELECT id FROM cat1)),
('Kylian Mbappé', 9, (SELECT id FROM cat1)),
('Erling Haaland', 9, (SELECT id FROM cat1)),
('Kevin De Bruyne', 17, (SELECT id FROM cat1)),
('Jude Bellingham', 5, (SELECT id FROM cat1)),
('Vinícius Júnior', 7, (SELECT id FROM cat1)),
('Mohamed Salah', 11, (SELECT id FROM cat1)),
('Harry Kane', 9, (SELECT id FROM cat1)),
('Luka Modrić', 10, (SELECT id FROM cat1)),
('Rodri', 16, (SELECT id FROM cat1)),
('Virgil van Dijk', 4, (SELECT id FROM cat1)),
('Bruno Fernandes', 8, (SELECT id FROM cat1)),
('Bukayo Saka', 7, (SELECT id FROM cat1)),
('Son Heung-min', 7, (SELECT id FROM cat1));

-- 2. Tạo Giải: Cầu thủ trẻ triển vọng
WITH cat2 AS (
    INSERT INTO categories (name) VALUES ('Cầu thủ trẻ triển vọng') RETURNING id
)
INSERT INTO candidates (name, number, category_id) VALUES 
('Lamine Yamal', 19, (SELECT id FROM cat2)),
('Pedri', 8, (SELECT id FROM cat2)),
('Gavi', 6, (SELECT id FROM cat2)),
('Jamal Musiala', 10, (SELECT id FROM cat2)),
('Florian Wirtz', 10, (SELECT id FROM cat2)),
('Alejandro Garnacho', 17, (SELECT id FROM cat2)),
('Kobbie Mainoo', 37, (SELECT id FROM cat2)),
('Endrick', 16, (SELECT id FROM cat2)),
('Arda Güler', 24, (SELECT id FROM cat2)),
('Warren Zaïre-Emery', 33, (SELECT id FROM cat2));

-- 3. Tạo Giải: Thủ môn xuất sắc nhất
WITH cat3 AS (
    INSERT INTO categories (name) VALUES ('Thủ môn xuất sắc nhất') RETURNING id
)
INSERT INTO candidates (name, number, category_id) VALUES 
('Alisson Becker', 1, (SELECT id FROM cat3)),
('Thibaut Courtois', 1, (SELECT id FROM cat3)),
('Ederson', 31, (SELECT id FROM cat3)),
('Emiliano Martínez', 23, (SELECT id FROM cat3)),
('Marc-André ter Stegen', 1, (SELECT id FROM cat3));
