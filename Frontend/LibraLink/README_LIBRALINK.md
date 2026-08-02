LibraLink — Minimal Expo MVP scaffold

This repository contains a small Expo/React Native scaffold that implements
the core navigation and placeholder screens for the LibraLink project.

Getting started

1. Install dependencies:

```bash
npm install
```

2. Run the app:

```bash
npx expo start
```

Screens added

- Home (`src/app/index.tsx`)
- Search (`src/app/search.tsx`)
- Book detail (`src/app/book/[id].tsx`)
- Borrowed books (`src/app/borrowed.tsx`)
- Admin dashboard (`src/app/admin.tsx`)
- AI Mode placeholder (`src/app/ai.tsx`)

Component

- `src/components/BookCard.tsx` — simple list item with link to book details.

Next steps

- Implement backend APIs and integrate search, reservations, and auth.
- Add offline cache, TTS and voice integration in Phase 2.
