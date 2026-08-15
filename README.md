# Know KKU (รู้ไหม มข.)

An information and community app for Khon Kaen University students — built to bring together official university info, campus navigation, events, and student-to-student knowledge sharing into a single platform.

Academic project for CP354771 โครงงานคอมพิวเตอร์ 1, College of Computing, Khon Kaen University.

## Features

- **Community Feed** — posts, comments, likes, saves, reports, and anonymous posting for sensitive topics
- **AI Chatbot & Auto-Comment** — RAG-based assistant that answers questions using scraped official KKU sources (registration, กยศ., scholarships, dorms, etc.), and automatically responds to question-like posts in the feed
- **Place Discovery** — search buildings, restaurants, and rooms; view shuttle bus routes; navigate via Google Maps; community reviews and place-status reporting
- **Events** — browse university events, join events, add them to your checklist
- **Checklist** — track onboarding tasks (document submission, registration, orientation) with progress tracking
- **KKU Mail–only access** — every account is tied to a verified `@kku.ac.th` email

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo (TypeScript), Expo Router |
| Backend | Node.js + Express |
| ORM | Drizzle ORM |
| Database | Neon PostgreSQL (AWS ap-southeast-1, Singapore) |
| Auth | Clerk, restricted to `@kku.ac.th` emails |
| AI / RAG | Embeddings + vector search over scraped KKU sources |
| Maps | Google Maps API |
