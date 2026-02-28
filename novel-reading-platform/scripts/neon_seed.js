import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

async function seed() {
  console.log("Starting Neon seed...");

  // Check if novels already exist
  const existing = await sql`SELECT COUNT(*) as count FROM novels`;
  if (parseInt(existing[0].count, 10) > 0) {
    console.log("Novels already exist, skipping seed.");
    return;
  }

  // Insert sample novels from backup
  await sql`
    INSERT INTO novels (id, title, description, cover_image, status, genres, tags, total_chapters, published_chapters, author, book_number, series_order)
    VALUES 
      ('ce1a55e3-a5b4-401e-9b70-15780f12c4a5', 'Oath of Flame – The Dragon''s Legacy', 'An epic fantasy adventure about a young warrior who discovers his dragon heritage and must unite the warring kingdoms.', NULL, 'ongoing', ARRAY['Fantasy', 'Adventure'], ARRAY['dragons', 'magic', 'epic'], 15, 12, 'Unknown', 1, 1),
      ('cdc37423-7df8-4a48-be79-84e8abf99dd3', 'Oath of Flame – Book 2', 'The saga continues as our hero faces new challenges.', NULL, 'ongoing', ARRAY['Fantasy', 'Adventure'], ARRAY['dragons', 'magic'], 0, 0, 'Unknown', 2, 2),
      ('2da1f7e1-f5dd-478f-9f70-8d65b46697ad', 'Oath of Flame – Book 3', 'The third installment of the epic series.', NULL, 'ongoing', ARRAY['Fantasy', 'Adventure'], ARRAY['dragons', 'magic'], 0, 0, 'Unknown', 3, 3),
      ('a0b1ed86-de3a-4f36-8cfe-c94aa98d04d7', 'Oath of Flame – Book 4', 'The journey reaches new heights.', NULL, 'ongoing', ARRAY['Fantasy', 'Adventure'], ARRAY['dragons', 'magic'], 0, 0, 'Unknown', 4, 4),
      ('cb2a5fc7-b7c9-4e91-b2e7-8c6e445f4c88', 'Oath of Flame – Book 5', 'Alliances are tested in this pivotal book.', NULL, 'ongoing', ARRAY['Fantasy', 'Adventure'], ARRAY['dragons', 'magic'], 0, 0, 'Unknown', 5, 5),
      ('14ad65e7-96d5-406b-b62b-20af358ae4be', 'Oath of Flame – Book 6', 'Ancient secrets come to light.', NULL, 'ongoing', ARRAY['Fantasy', 'Adventure'], ARRAY['dragons', 'magic'], 0, 0, 'Unknown', 6, 6),
      ('fdd39e63-0b45-449f-bdc3-5b1bbaa1e3e0', 'Oath of Flame – Book 7', 'The stakes have never been higher.', NULL, 'ongoing', ARRAY['Fantasy', 'Adventure'], ARRAY['dragons', 'magic'], 0, 0, 'Unknown', 7, 7),
      ('9db78b5b-bf34-4a45-a7b4-f6b5ca1b3bdb', 'Oath of Flame – Book 8', 'War looms on the horizon.', NULL, 'ongoing', ARRAY['Fantasy', 'Adventure'], ARRAY['dragons', 'magic'], 0, 0, 'Unknown', 8, 8),
      ('56c8f8b6-a94d-4f55-b0c2-cd6aa3a5a7e7', 'Oath of Flame – Book 9', 'The penultimate chapter of the saga.', NULL, 'ongoing', ARRAY['Fantasy', 'Adventure'], ARRAY['dragons', 'magic'], 0, 0, 'Unknown', 9, 9),
      ('e2d4a1c3-b5f6-4789-a012-34567890abcd', 'Oath of Flame – Book 10', 'The epic conclusion.', NULL, 'ongoing', ARRAY['Fantasy', 'Adventure'], ARRAY['dragons', 'magic'], 0, 0, 'Unknown', 10, 10)
  `;
  console.log("Inserted sample novels");

  console.log("Seed completed successfully!");
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
