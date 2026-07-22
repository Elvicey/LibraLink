-- Seed Institutions
INSERT INTO institutions (name, short_name, tier, city, country, email, phone, is_active, created_at, updated_at) 
VALUES ('KNUST Main Campus', 'KNUST', 'BASIC', 'Kumasi', 'Ghana', 'info@knust.edu.gh', '+233322060444', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed Users (Password: password)
INSERT INTO users (institution_id, first_name, last_name, email, password, phone_number, is_active) 
VALUES (1, 'Esther', 'Asamoah', 'esther@knust.edu.gh', 'password', '+233241234567', true);

-- Seed Courses
INSERT INTO courses (institution_id, name, code, description, status, created_at, updated_at) 
VALUES (1, 'Data Structures', 'CS 301', 'Introduction to elementary data structures.', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO courses (institution_id, name, code, description, status, created_at, updated_at) 
VALUES (1, 'Algorithms', 'CS 302', 'Design and analysis of computer algorithms.', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO courses (institution_id, name, code, description, status, created_at, updated_at) 
VALUES (1, 'Database Systems', 'CS 401', 'Relational database concepts and indexing techniques.', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed Books
INSERT INTO books (institution_id, title, subtitle, isbn, isbn13, total_copies, available_copies, is_digital_only, is_active, borrow_count, created_at, updated_at) 
VALUES (1, 'Things Fall Apart', 'Classic Novel', '9780385474542', '978-0385474542', 5, 5, false, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO books (institution_id, title, subtitle, isbn, isbn13, total_copies, available_copies, is_digital_only, is_active, borrow_count, created_at, updated_at) 
VALUES (1, 'Introduction to Calculus', 'Exam Prep Study Guide', '9780534393397', '978-0534393397', 3, 2, false, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO books (institution_id, title, subtitle, isbn, isbn13, total_copies, available_copies, is_digital_only, is_active, borrow_count, created_at, updated_at) 
VALUES (1, 'African Economics', 'Policy and Growth Analysis', '9780199687770', '978-0199687770', 4, 4, false, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO books (institution_id, title, subtitle, isbn, isbn13, total_copies, available_copies, is_digital_only, is_active, borrow_count, created_at, updated_at) 
VALUES (1, 'African Economic Dev.', 'Policy Perspectives', '9780198744894', '978-0198744894', 2, 1, false, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO books (institution_id, title, subtitle, isbn, isbn13, total_copies, available_copies, is_digital_only, is_active, borrow_count, created_at, updated_at) 
VALUES (1, 'Data Structures in Practice', 'Computing Handbook', '9780132847377', '978-0132847377', 6, 6, false, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed Reading Lists
INSERT INTO reading_lists (course_id, created_by, title, description, semester, academic_year, is_published, published_at, created_at, updated_at) 
VALUES (1, 1, 'CS 301 Semester Readings', 'Core textbook and guides for CS 301.', 'Semester 1', '2026/2027', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed Reading List Items
INSERT INTO reading_list_items (reading_list_id, book_id, notes, required_by, created_at, updated_at) 
VALUES (1, 5, 'Please read chapters 1 to 5.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
