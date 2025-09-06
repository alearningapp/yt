# HelpYT - YouTube Channel Sharing Platform

A modern web application built with Next.js, better-auth, and PostgreSQL that allows users to discover and share YouTube channels with the community.

## Features

- **User Authentication**: Sign up/sign in with email/password or Google OAuth
- **Channel Management**: Add, edit, and delete YouTube channels
- **Channel Discovery**: Browse channels added by other users, ordered by creation time
- **Click Tracking**: Track clicks on channel links and see who clicked them
- **User Settings**: Change password, update profile, and delete account
- **Responsive Design**: Modern UI built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: better-auth
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Custom components with Lucide React icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google OAuth credentials (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd helpyt
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/helpyt"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email (for password reset)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

5. Set up the database:
```bash
# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main tables:

- **users**: User accounts and profiles
- **accounts**: OAuth account connections
- **sessions**: User sessions
- **channels**: YouTube channel information
- **channel_clicks**: Click tracking for channels

## API Routes

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Get current session

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/auth/          # Authentication API routes
│   ├── channels/[id]/     # Channel detail pages
│   ├── signin/            # Sign in page
│   ├── signup/            # Sign up page
│   ├── settings/          # User settings page
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── ui/                # Reusable UI components
│   └── providers/         # Context providers
├── lib/                   # Utility libraries
│   ├── actions/           # Server actions
│   ├── auth.ts            # Auth configuration
│   └── db/                # Database configuration
└── types/                 # TypeScript type definitions
```

## Features in Detail

### Channel Management
- Users can add YouTube channels with name, description, link, and subscriber count
- Only channel creators can edit or delete their channels
- Channels are displayed in chronological order (newest first)

### Click Tracking
- Each channel click is tracked with user information and timestamp
- Users can see who clicked their channels and when
- Click counts are displayed on both channel cards and detail pages

### User Settings
- Profile management (name, email)
- Password change functionality
- Account deletion with confirmation

## Development

### Database Commands

```bash
# Generate migration files
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

### Code Quality

```bash
# Run ESLint
npm run lint
```

## Deployment

1. Set up a PostgreSQL database (e.g., using Vercel Postgres, Supabase, or Railway)
2. Configure environment variables in your deployment platform
3. Run database migrations
4. Deploy to Vercel, Netlify, or your preferred platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.