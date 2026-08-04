-- Only meaningful on a database where V0 actually ran (i.e. a fresh instance where V0
-- wasn't skipped by baseline-version) - drops everything V0 created. CASCADE handles FK
-- dependency order automatically.
DROP TABLE IF EXISTS
    audio_book_tracks, audio_tracks, audit_logs, authors, book_authors, book_copies,
    book_views, bookmarks, books, borrow_records, categories, course_books, courses,
    exam_questions, fine_payments, fines, institutions, notifications,
    password_reset_codes, pickup_slots, publishers, reading_list_items, reading_lists,
    reservations, roles, search_logs, student_reading_progress, study_sessions,
    study_summaries, user_audio_progress, user_roles, users, voice_commands
    CASCADE;
