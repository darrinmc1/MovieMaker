import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

async function seedData() {
  console.log('Seeding Neon database with backup data...');

  // Seed novels
  const novels = [
    {
      id: '3db25e17-4af4-4651-a057-35b2eb03e42c',
      title: 'Crownless – The Forgotten King',
      description: 'Power has a price—and madness always collects. The cursed crown is one of the Nine, infused with necromantic power. Madness ensues as the Tenth Seal whispers to the new king.',
      cover_image: 'https://hfnsjzdxrzqebzovkusg.supabase.co/storage/v1/object/public/images/novel-covers/1759561228104-x6nuel.png',
      genre: 'Epic Fantasy',
      status: 'Coming Soon',
      total_chapters: 0,
      published_chapters: 0,
      views: 0,
      likes: 0,
      series_order: 4,
      book_number: 3
    },
    {
      id: '75a3d494-b94d-4302-a3fb-4df0e7f7d569',
      title: '[TEST] Tale of Dragons',
      description: 'Novel created from chapter upload',
      cover_image: 'https://hfnsjzdxrzqebzovkusg.supabase.co/storage/v1/object/public/images/novel-covers/1759545881188-16ytym.jpg',
      genre: 'Epic Fantasy',
      status: 'In Progress',
      total_chapters: 2,
      published_chapters: 0,
      views: 0,
      likes: 0,
      series_order: 2,
      book_number: 0
    },
    {
      id: 'd74c1166-e60b-415b-b30e-cc002c09aea1',
      title: 'Mimic Hollow – City of Lies',
      description: 'What you see will deceive you. A relic disguises itself as a city-wide illusion, corrupting mimics who evolve into sentient, organized creatures. It hints at a Seal\'s sentient nature.',
      cover_image: 'https://hfnsjzdxrzqebzovkusg.supabase.co/storage/v1/object/public/images/novel-covers/1759561251526-gmz7pm.png',
      genre: 'Epic Fantasy',
      status: 'Coming Soon',
      total_chapters: 0,
      published_chapters: 0,
      views: 0,
      likes: 0,
      series_order: 5,
      book_number: 4
    },
    {
      id: '2f92baf3-2159-401a-b043-05b28fc26b18',
      title: 'Depthspire – The Dungeon Below',
      description: 'Some depths were never meant to be travelled. Beneath the world, a relic stirs—causing reality to warp. The characters unknowingly retrieve a fragment of the Concord.',
      cover_image: 'https://hfnsjzdxrzqebzovkusg.supabase.co/storage/v1/object/public/images/novel-covers/1759561200766-no55o.png',
      genre: 'Epic Fantasy',
      status: 'Coming Soon',
      total_chapters: 0,
      published_chapters: 0,
      views: 0,
      likes: 0,
      series_order: 3,
      book_number: 2
    },
    {
      id: '0b092de4-97b1-46de-94b8-f94a3e58000d',
      title: 'Moonveil – Blood of the Eclipse',
      description: 'When the moon turns red, the dead walk free. The blood moon awakens a relic—an amulet tied to the Shadow Realm—further weakening the barrier between planes.',
      cover_image: 'https://hfnsjzdxrzqebzovkusg.supabase.co/storage/v1/object/public/images/novel-covers/1759561280994-dlbppa.png',
      genre: 'Epic Fantasy',
      status: 'Coming Soon',
      total_chapters: 0,
      published_chapters: 0,
      views: 0,
      likes: 0,
      series_order: 6,
      book_number: 5
    },
    {
      id: '3fd217e4-4907-4a88-b4c1-4613b45d1dd4',
      title: 'Relics of Chance – The Dice of Fate',
      description: 'Chance is a cruel master. The dice are not just cursed objects—they are pieces of the Tenth Seal. Every roll tightens the cosmic threads around the Concord.',
      cover_image: 'https://hfnsjzdxrzqebzovkusg.supabase.co/storage/v1/object/public/images/novel-covers/1759561309242-iewbrf.png',
      genre: 'Epic Fantasy',
      status: 'Coming Soon',
      total_chapters: 0,
      published_chapters: 0,
      views: 0,
      likes: 0,
      series_order: 7,
      book_number: 6
    },
    {
      id: '73778f33-be35-45c8-a946-4fd678adc17a',
      title: 'Arcana – The Last Spell',
      description: 'One spell. One world. One final chance. The fifth relic holds the last of the Weave, and if used, could either restore magic… or break the Concord entirely.',
      cover_image: 'https://hfnsjzdxrzqebzovkusg.supabase.co/storage/v1/object/public/images/novel-covers/1759561335620-5mz9d.png',
      genre: 'Epic Fantasy',
      status: 'Coming Soon',
      total_chapters: 0,
      published_chapters: 0,
      views: 0,
      likes: 0,
      series_order: 8,
      book_number: 7
    },
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Oath of Flame – The Dragon\'s Legacy',
      description: 'When a dying red dragon leaves behind a cryptic prophecy and a magical egg, a mismatched group of adventurers must unravel the truth behind an ancient pact made between dragons and mortals',
      cover_image: 'https://hfnsjzdxrzqebzovkusg.supabase.co/storage/v1/object/public/images/novel-covers/1759544201050-jwbv0h.png',
      genre: 'Epic Fantasy',
      status: 'In Progress',
      total_chapters: 11,
      published_chapters: 3,
      views: 0,
      likes: 0,
      series_order: 1,
      book_number: 1,
      author: 'Darrin McGILL'
    },
    {
      id: '315580ec-43d9-406d-a8dd-34759598cd49',
      title: 'The Ironmarch Pact – Goblin King Rising',
      description: 'They laughed at goblins… until they marched. The goblin king\'s rise is fueled by one of the relics—lost during the last Great War. His empire becomes a pawn in the greater game.',
      cover_image: 'https://hfnsjzdxrzqebzovkusg.supabase.co/storage/v1/object/public/images/novel-covers/1759561130064-guriv.png',
      genre: 'Epic Fantasy',
      status: 'Coming Soon',
      total_chapters: 0,
      published_chapters: 0,
      views: 0,
      likes: 0,
      series_order: 9,
      book_number: 8
    },
    {
      id: 'a212a40d-df9a-4f79-91f0-7136026e33fe',
      title: 'Wyrmspire\'s Wake – Beneath the Ash',
      description: 'Ancient fire stirs. The mountain remembers. The sixth relic is a core to an ancient doomsday engine. When it activates, the Tenth Seal\'s presence becomes undeniable.',
      cover_image: 'https://hfnsjzdxrzqebzovkusg.supabase.co/storage/v1/object/public/images/novel-covers/1759561174992-4xee4.png',
      genre: 'Epic Fantasy',
      status: 'Coming Soon',
      total_chapters: 0,
      published_chapters: 0,
      views: 0,
      likes: 0,
      series_order: 10,
      book_number: 9
    },
    {
      id: '377db5e8-5dba-4c9b-989a-587f28f44137',
      title: 'Initiate the End – Roll for Reality',
      description: 'When the dice roll, reality breaks. The final act: the adventurers realize they\'re not only in a game but part of the Tenth Seal\'s prison. They must break the fourth wall—and the Seal—to end the cycle.',
      cover_image: 'https://hfnsjzdxrzqebzovkusg.supabase.co/storage/v1/object/public/images/novel-covers/1759559050454-onwr7c.png',
      genre: 'Epic Fantasy',
      status: 'Coming Soon',
      total_chapters: 0,
      published_chapters: 0,
      views: 0,
      likes: 0,
      series_order: 11,
      book_number: 10
    }
  ];

  // Insert novels
  for (const novel of novels) {
    await sql`
      INSERT INTO novels (id, title, description, cover_image, genre, status, total_chapters, published_chapters, views, likes, series_order, book_number, author, world_rules)
      VALUES (${novel.id}, ${novel.title}, ${novel.description}, ${novel.cover_image}, ${novel.genre}, ${novel.status}, ${novel.total_chapters}, ${novel.published_chapters}, ${novel.views}, ${novel.likes}, ${novel.series_order}, ${novel.book_number}, ${novel.author || null}, '[]'::jsonb)
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log(`Inserted ${novels.length} novels`);

  // Seed chapters
  const chapters = [
    {
      id: 'f00c08b9-c6b3-4610-b6e0-f023c4bc2d36',
      novel_id: '75a3d494-b94d-4302-a3fb-4df0e7f7d569',
      chapter_number: 4,
      title: 'chap 4 test',
      content: '<p>chap 4 test upload</p>',
      word_count: 4,
      status: 'draft',
      summary: '',
      directors_notes: ''
    },
    {
      id: '4d437028-ff4e-4cb2-a2f0-4ccd7c113e65',
      novel_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      chapter_number: 1,
      title: 'The Awakening',
      content: `The morning sun cast long shadows across the ancient training grounds. Kael stood alone, his breath forming small clouds in the crisp air. For years, he had trained here, never understanding why the flames seemed to dance at his fingertips.

"Today changes everything," Master Theron had said the night before, his weathered face grave with concern. "Tomorrow, you will learn the truth of your heritage."

Kael practiced the forms he had learned since childhood, each movement precise and deliberate. But something was different today. The air itself seemed to hum with energy, and when he struck out with his palm, a burst of flame erupted from his hand—larger and more intense than ever before.

He stumbled backward, shocked. This was no ordinary fire. It was dragon flame, the kind spoken of only in legends. The kind that had not been seen in the realm for over a thousand years.

Footsteps approached from behind. Kael turned to see Master Theron, accompanied by an elderly woman in flowing robes adorned with dragon symbols.

"Kael," Theron began, his voice heavy with emotion, "this is Elder Lyra. She has traveled far to meet you. It is time you learned who you truly are."

The elder stepped forward, her ancient eyes studying him with an intensity that made Kael uncomfortable. "The blood of the Dragon Lords flows through your veins, young one. You are the last of the Flamebearers, and the realm has great need of you."`,
      word_count: 2847,
      status: 'published',
      summary: 'Kael discovers his heritage as the last Flamebearer when dragon flames manifest during training.',
      directors_notes: ''
    },
    {
      id: '6305d811-d73e-4957-9c03-a7e9041beff0',
      novel_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      chapter_number: 2,
      title: 'Flames of Destiny',
      content: `The revelation of his heritage left Kael reeling. For three days, he had barely slept, his mind racing with questions. Elder Lyra had told him of the Dragon Wars, of how his ancestors had bonded with the great wyrms and wielded their power to protect the realm.

"But the dragons are gone," Kael had protested. "They vanished centuries ago."

"Not gone," Lyra had corrected him. "Sleeping. Waiting for the one who could awaken them once more."

Now, Kael stood before the Flame Sanctum, an ancient temple carved into the mountainside. According to Lyra, this was where the first Flamebearer had bonded with Ignis, the Dragon King.

The entrance was sealed by a massive stone door, covered in glowing runes. As Kael approached, the runes began to pulse with golden light, responding to his presence.

"Place your hand upon the seal," Lyra instructed. "Let your flame answer the call."

Kael hesitated, then pressed his palm against the cold stone. Immediately, fire erupted from his hand, but instead of burning the door, the flames were absorbed into the runes. The ancient symbols blazed brighter and brighter until, with a deep rumble, the door began to open.

Beyond lay a vast chamber, its walls lined with statues of dragons. At the far end, atop a raised dais, sat a massive egg—easily twice Kael's height. It was covered in scales that shimmered with an inner fire.

"Impossible," Master Theron breathed. "A dragon egg... after all these years..."

As if in response to their presence, the egg began to crack.`,
      word_count: 3156,
      status: 'published',
      summary: 'Kael enters the Flame Sanctum and discovers a dragon egg that begins to hatch.',
      directors_notes: ''
    },
    {
      id: '220d251e-15a2-410b-add3-8cb4c9f18ac9',
      novel_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      chapter_number: 3,
      title: "The Dragon's Call",
      content: `The hatching took hours. Kael watched, transfixed, as piece by piece the shell fell away to reveal the creature within. It was smaller than he had expected—no larger than a horse—but there was no mistaking the power that radiated from it.

The dragon's scales were the color of molten gold, and its eyes, when they finally opened, burned with an intelligence that was almost human. It looked directly at Kael, and in that moment, he felt something shift within his very soul.

A bond. Ancient and unbreakable.

"Ignis," Kael whispered, somehow knowing the dragon's name. "You are Ignis Reborn."

The dragon—Ignis—let out a cry that shook the very foundations of the temple. Flames erupted from its maw, not in aggression, but in joy. In recognition.

Elder Lyra fell to her knees, tears streaming down her weathered face. "The prophecy... it's true. The Flamebearer has returned, and with him, the Dragon King."

But their moment of triumph was short-lived. A distant boom echoed through the mountains, followed by another, and another. Master Theron rushed to the temple entrance, his face pale.

"The Shadow Legion," he said, his voice barely above a whisper. "They've found us. They know about the dragon."

Kael felt Ignis's emotions through their bond—determination, protectiveness, and beneath it all, a burning rage at those who would threaten his Flamebearer.

"Then let them come," Kael said, his hand instinctively moving to rest on Ignis's scaled neck. "We will show them why the Dragon Lords were feared."

As if in answer, Ignis spread his wings—still small, but growing stronger by the moment—and roared his challenge to the approaching army.`,
      word_count: 3421,
      status: 'published',
      summary: 'Ignis the dragon hatches and bonds with Kael as the Shadow Legion approaches.',
      directors_notes: ''
    },
    {
      id: '77ca51f0-5792-4ec8-bcd7-372c59142e7a',
      novel_id: '75a3d494-b94d-4302-a3fb-4df0e7f7d569',
      chapter_number: 2,
      title: 'ch 2 Title',
      content: '<p>Ch 2 text</p>',
      word_count: 3,
      status: 'draft',
      summary: '',
      directors_notes: ''
    }
  ];

  // Insert chapters
  for (const chapter of chapters) {
    await sql`
      INSERT INTO chapters (id, novel_id, chapter_number, title, content, word_count, status, summary, directors_notes, scheduled_for_future)
      VALUES (${chapter.id}, ${chapter.novel_id}, ${chapter.chapter_number}, ${chapter.title}, ${chapter.content}, ${chapter.word_count}, ${chapter.status}, ${chapter.summary}, ${chapter.directors_notes}, false)
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log(`Inserted ${chapters.length} chapters`);

  console.log('Data seeding complete!');
}

seedData().catch(console.error);
