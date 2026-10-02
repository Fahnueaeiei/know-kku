# Know KKU (รู้ไหม มข.)

A mobile application designed to help Khon Kaen University students access university information, campus locations, events, checklists, and an AI assistant in one platform.

Academic project for **CP354771 Computer Project I**  , College of Computing, Khon Kaen University.

## Features

- Home
  - View featured university information
  - View news and announcements
  - Quick access to useful university resources
- AI Assistant
  - Ask questions about Khon Kaen University
  - RAG-based AI assistant
  - Retrieve relevant information from university sources
- Place
  - Browse university locations
  - Search for places around campus
  - View place details
  - View locations on Google Maps
- Events
  - Browse university events
  - View event details
- Checklist
  - Manage important student tasks
  - Track completed and incomplete items
- Profile
  - View and manage user information
- Authentication
  - Sign in with KKU email
  - KKU email verification using `@kku.ac.th`

## Tech Stack

### Mobile
- React Native
- Expo
- Expo Router
- TypeScript

### Backend
- Node.js
- Express.js
- TypeScript

### Database
- PostgreSQL
- Neon PostgreSQL
- Drizzle ORM

### Authentication
- Clerk

### AI / RAG
- Python
- FastAPI
- P'Din-Dang RAG Service
- Embeddings
- Vector Search

### External Services
- Google Maps API
- Cloudinary

### Development Tools
- VS Code
- Git
- GitHub
- Postman

## System Architecture

```text
┌─────────────────────────┐
│       Mobile App        │
│ React Native + Expo     │
│ TypeScript + Expo Router│
└────────────┬────────────┘
             │
             │ HTTP API
             ▼
┌─────────────────────────┐
│      Node.js Server     │
│   Express + TypeScript  │
│       Drizzle ORM       │
└───────┬─────────┬───────┘
        │         │
        │         │ HTTP API
        │         ▼
        │   ┌────────────────────┐
        │   │   P'Din-Dang RAG   │
        │   │   Python / FastAPI │
        │   └────────────────────┘
        │
        ▼
┌─────────────────────────┐
│    Neon PostgreSQL      │
│        Database         │
└─────────────────────────┘
```

## Project Structure

```text
know-kku/
├── mobile/
│   ├── app/
│   ├── components/
│   ├── constants/
│   ├── assets/
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
│
├── server/
│   ├── src/
│   ├── dindang/
│   │   ├── src/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── .gitignore
├── README.md
└── ...
```

## Requirements

- Node.js
- npm
- Python 3
- Git
- Expo Go or Android/iOS development environment

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd know-kku
```

Install Mobile dependencies:

```bash
cd mobile
npm install
```

Install Server dependencies:

```bash
cd ../server
npm install
```

Install P'Din-Dang dependencies:

```bash
cd dindang
pip install -r requirements.txt
```

## Environment Variables

Create the required `.env` files for each service.

### Mobile

```env
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
```

### Server

```env
DATABASE_URL=
CLERK_SECRET_KEY=
DINDANG_RAG_URL=
```

### P'Din-Dang

Use the environment variables required by the RAG service.

Do not commit `.env` files to the repository.

## How to Run

### Mobile

```bash
cd mobile
npm run start
```

### Server

Open another terminal:

```bash
cd server
npm run dev
```

### P'Din-Dang

Open another terminal:

```bash
cd server/dindang
python3 -m uvicorn src.api:app --reload --port 8000
```

All required services should be running at the same time.

```text
Mobile          → localhost:8081
Node.js Server  → localhost:3000
P'Din-Dang      → localhost:8000
```

## Database

The project uses PostgreSQL hosted on Neon.

Drizzle ORM is used to communicate with the database from the Node.js server.

The database stores application data such as:

- Users
- Places
- Rooms
- News
- Events
- Checklist
- Favorites
- Reports
- Chat Logs

The database connection is configured using the `DATABASE_URL` environment variable.

## AI Assistant

Know KKU uses P'Din-Dang as a Retrieval-Augmented Generation (RAG) service.

```text
User
 │
 ▼
Mobile App
 │
 ▼
Node.js Server
 │
 ▼
P'Din-Dang RAG
 │
 ├── Retrieve relevant information
 ├── Process university information
 └── Generate response
 │
 ▼
Node.js Server
 │
 ▼
Mobile App
 │
 ▼
User
```

The AI assistant is designed to answer questions using relevant university information.

## Development

The project uses Git and GitHub for version control.

```text
main
└── Stable version

frontend
└── Development version
```

Changes are developed on development branches and merged into `main` through Pull Requests.

## Testing

The application should be tested across:

- Mobile application
- Node.js server
- Database connection
- Authentication
- API communication
- P'Din-Dang RAG service
- AI assistant
- Navigation and user flow
- Place and event features
- Checklist functionality

## Limitations

- Some features require an internet connection.
- External services require valid API keys and environment variables.
- AI-generated responses may not always be completely accurate.
- University information depends on the available data sources.
- The application is designed primarily for Khon Kaen University students.
