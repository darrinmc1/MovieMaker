-- Restore novel data and set up storage

-- First, ensure the novels table exists with all necessary columns
-- (This is safe to run even if table exists)

-- Insert the main novel
INSERT INTO public.novels (
  id,
  title,
  description,
  cover_image,
  genre,
  status,
  total_chapters,
  published_chapters,
  views,
  likes
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Oath of Flame – The Dragon''s Legacy',
  'In a world where ancient dragons once ruled, a young warrior discovers they are the last heir to a legendary bloodline. As dark forces rise to claim the power of the dragons, they must master the flames within or watch their world burn.',
  '/placeholder.svg?height=400&width=300',
  'Epic Fantasy',
  'In Progress',
  3,
  3,
  0,
  0
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  cover_image = EXCLUDED.cover_image,
  genre = EXCLUDED.genre,
  status = EXCLUDED.status,
  total_chapters = EXCLUDED.total_chapters,
  published_chapters = EXCLUDED.published_chapters;

-- Insert all chapters for the novel
INSERT INTO public.chapters (
  novel_id,
  chapter_number,
  title,
  content,
  word_count,
  status,
  published_at,
  summary
) VALUES 
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  1,
  'The Awakening',
  E'The morning sun cast long shadows across the ancient training grounds. Kael stood alone, his breath forming small clouds in the crisp air. For years, he had trained here, never understanding why the flames seemed to dance at his fingertips.\n\n"Today changes everything," Master Theron had said the night before, his weathered face grave with concern. "Tomorrow, you will learn the truth of your heritage."\n\nKael practiced the forms he had learned since childhood, each movement precise and deliberate. But something was different today. The air itself seemed to hum with energy, and when he struck out with his palm, a burst of flame erupted from his hand—larger and more intense than ever before.\n\nHe stumbled backward, shocked. This was no ordinary fire. It was dragon flame, the kind spoken of only in legends. The kind that had not been seen in the realm for over a thousand years.\n\nFootsteps approached from behind. Kael turned to see Master Theron, accompanied by an elderly woman in flowing robes adorned with dragon symbols.\n\n"Kael," Theron began, his voice heavy with emotion, "this is Elder Lyra. She has traveled far to meet you. It is time you learned who you truly are."\n\nThe elder stepped forward, her ancient eyes studying him with an intensity that made Kael uncomfortable. "The blood of the Dragon Lords flows through your veins, young one. You are the last of the Flamebearers, and the realm has great need of you."',
  2847,
  'published',
  NOW(),
  'Kael discovers his heritage as the last Flamebearer when dragon flames manifest during training.'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  2,
  'Flames of Destiny',
  E'The revelation of his heritage left Kael reeling. For three days, he had barely slept, his mind racing with questions. Elder Lyra had told him of the Dragon Wars, of how his ancestors had bonded with the great wyrms and wielded their power to protect the realm.\n\n"But the dragons are gone," Kael had protested. "They vanished centuries ago."\n\n"Not gone," Lyra had corrected him. "Sleeping. Waiting for the one who could awaken them once more."\n\nNow, Kael stood before the Flame Sanctum, an ancient temple carved into the mountainside. According to Lyra, this was where the first Flamebearer had bonded with Ignis, the Dragon King.\n\nThe entrance was sealed by a massive stone door, covered in glowing runes. As Kael approached, the runes began to pulse with golden light, responding to his presence.\n\n"Place your hand upon the seal," Lyra instructed. "Let your flame answer the call."\n\nKael hesitated, then pressed his palm against the cold stone. Immediately, fire erupted from his hand, but instead of burning the door, the flames were absorbed into the runes. The ancient symbols blazed brighter and brighter until, with a deep rumble, the door began to open.\n\nBeyond lay a vast chamber, its walls lined with statues of dragons. At the far end, atop a raised dais, sat a massive egg—easily twice Kael''s height. It was covered in scales that shimmered with an inner fire.\n\n"Impossible," Master Theron breathed. "A dragon egg... after all these years..."\n\nAs if in response to their presence, the egg began to crack.',
  3156,
  'published',
  NOW(),
  'Kael enters the Flame Sanctum and discovers a dragon egg that begins to hatch.'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  3,
  'The Dragon''s Call',
  E'The hatching took hours. Kael watched, transfixed, as piece by piece the shell fell away to reveal the creature within. It was smaller than he had expected—no larger than a horse—but there was no mistaking the power that radiated from it.\n\nThe dragon''s scales were the color of molten gold, and its eyes, when they finally opened, burned with an intelligence that was almost human. It looked directly at Kael, and in that moment, he felt something shift within his very soul.\n\nA bond. Ancient and unbreakable.\n\n"Ignis," Kael whispered, somehow knowing the dragon''s name. "You are Ignis Reborn."\n\nThe dragon—Ignis—let out a cry that shook the very foundations of the temple. Flames erupted from its maw, not in aggression, but in joy. In recognition.\n\nElder Lyra fell to her knees, tears streaming down her weathered face. "The prophecy... it''s true. The Flamebearer has returned, and with him, the Dragon King."\n\nBut their moment of triumph was short-lived. A distant boom echoed through the mountains, followed by another, and another. Master Theron rushed to the temple entrance, his face pale.\n\n"The Shadow Legion," he said, his voice barely above a whisper. "They''ve found us. They know about the dragon."\n\nKael felt Ignis''s emotions through their bond—determination, protectiveness, and beneath it all, a burning rage at those who would threaten his Flamebearer.\n\n"Then let them come," Kael said, his hand instinctively moving to rest on Ignis''s scaled neck. "We will show them why the Dragon Lords were feared."\n\nAs if in answer, Ignis spread his wings—still small, but growing stronger by the moment—and roared his challenge to the approaching army.',
  3421,
  'published',
  NOW(),
  'Ignis the dragon hatches and bonds with Kael as the Shadow Legion approaches.'
)
ON CONFLICT (novel_id, chapter_number) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  word_count = EXCLUDED.word_count,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  summary = EXCLUDED.summary;
