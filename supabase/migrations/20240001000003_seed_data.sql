-- ============================================================
-- Flint Dating App
-- Migration: 003 — Seed data
--   • Prompt templates (standard + Flint-branded)
--   • Commons prompts
-- ============================================================

-- ============================================================
-- PROMPT TEMPLATES
-- ============================================================

INSERT INTO prompt_templates (prompt_text, is_flint_branded, display_order) VALUES

-- Flint-branded prompts (reflect the app's values & voice)
('The thing I need someone to understand about me is...', TRUE, 1),
('I know it''s going somewhere when...', TRUE, 2),
('My version of a perfect Tuesday looks like...', TRUE, 3),
('I''m more ___ than I look / less ___ than I seem...', TRUE, 4),
('The opinion I hold that surprises people...', TRUE, 5),
('What I actually want from this app...', TRUE, 6),

-- Standard prompts (familiar, lower-friction)
('Two truths and a lie...', FALSE, 10),
('The last thing that made me laugh out loud...', FALSE, 11),
('I''m looking for someone who...', FALSE, 12),
('My most irrational opinion is...', FALSE, 13),
('I''m weirdly passionate about...', FALSE, 14),
('A green flag I''ve learned to look for...', FALSE, 15),
('The best way to get to know me is...', FALSE, 16),
('I won''t shut up about...', FALSE, 17),
('The most adventurous thing I''ve done is...', FALSE, 18),
('We''ll get along if you...', FALSE, 19),
('On weekends you''ll find me...', FALSE, 20),
('The cause I care most about...', FALSE, 21),
('I take pride in...', FALSE, 22),
('My love language is...', FALSE, 23);

-- ============================================================
-- COMMONS PROMPTS
-- ============================================================

INSERT INTO commons_prompts (prompt_template) VALUES
('You both have strong opinions about {shared_value}. What''s yours?'),
('It looks like {shared_value} matters to both of you. Where does that come from for you?'),
('You both listed {shared_value} as important. What does that look like in your daily life?'),
('You''re both passionate about {shared_value}. What''s a hot take you have on it?'),
('Given you both care about {shared_value} — what would your ideal Saturday look like?');
