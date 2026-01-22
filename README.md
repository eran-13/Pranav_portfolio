# Neon Frames Portfolio

A modern, responsive portfolio website built with React, TypeScript, and Tailwind CSS. Features a dynamic admin panel for content management with Supabase backend integration.

## Features

- **Dynamic Content Management**: Admin panel to manage all portfolio content
- **Media Management**: Upload and organize images and videos
- **Carousel Support**: Group multiple images into carousels
- **Before/After Sliders**: Photo editing showcase with interactive sliders
- **Contact Form**: Integrated contact form with message management
- **Responsive Design**: Fully responsive with modern UI/UX
- **Real-time Updates**: Content updates reflect immediately on the website

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Storage, Authentication)
- **UI Components**: shadcn/ui
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd neon-frames-folio-main
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:
- Run the SQL scripts in Supabase SQL Editor to create necessary tables
- Set up storage buckets: `portfolio-images` and `portfolio-videos`
- Configure Row Level Security (RLS) policies

5. Start the development server:
```bash
npm run dev
```

6. Access the admin panel:
- Navigate to `/admin/login`
- Login with your admin credentials

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin panel components
│   ├── sections/       # Portfolio section components
│   └── ui/             # Reusable UI components
├── contexts/           # React contexts (Auth)
├── hooks/              # Custom React hooks
├── integrations/       # Supabase integration
├── lib/                # Utility functions
└── pages/              # Page components
```

## Admin Panel Features

- **Dashboard**: Overview and quick access to all sections
- **Content Editor**: Edit text content for About and Contact sections
- **Media Manager**: Upload, organize, and manage images/videos
- **Before/After Manager**: Manage photo editing before/after pairs
- **Messages**: View and manage contact form submissions
- **Carousel Management**: Group images into carousels

## Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider (Vercel, Netlify, etc.)

3. Ensure environment variables are set in your hosting platform

## License

This project is private and proprietary.
