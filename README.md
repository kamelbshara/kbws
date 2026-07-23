# kbws — AI School Intelligence Platform (MVP)

A bilingual (Arabic-first / English) school intelligence platform. This repo currently implements the **foundational MVP slice**: authentication & roles, minimal school/academic-year setup, and the full Lesson Planning flow (weekly schedule → pick lesson/learning outcome → AI-generate a structured lesson plan → edit → save → print to PDF).

Built with Next.js (App Router), Prisma + PostgreSQL, Auth.js, OpenAI, and next-intl.

## Getting Started

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `AUTH_SECRET`, and `OPENAI_API_KEY`.
2. Install dependencies: `npm install`
3. Run migrations and seed data: `npx prisma migrate dev && npx prisma db seed`
4. Start the dev server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

Seeded accounts (see `prisma/seed.ts` for passwords):
- Admin: `admin@school.edu`
- Principal: `principal@school.edu`
- Teachers: `teacher1@school.edu`, `teacher2@school.edu`

## Scope

See `/root/.claude/plans/i-understand-since-you-streamed-melody.md` in this session, or the project's implementation plan, for what is in/out of scope for this MVP slice.
