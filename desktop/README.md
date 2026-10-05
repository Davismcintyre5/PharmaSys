# PharmaSys Client (:3000)

Frontend for PharmaSys — public landing and tenant dashboard.

## Requirements

- Node 20+
- Backend running on http://localhost:5000

## Setup

    cp .env.example .env
    npm install
    npm run dev

Opens on http://localhost:3000.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on :3000 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |

## Structure

    src/
    ├── api/           — axios + endpoint wrappers
    ├── context/       — providers (auth, theme, socket, site, cart)
    ├── types/         — shared TypeScript types
    ├── utils/         — pure helpers (format, colors, enums, validators)
    ├── components/
    │   ├── ui/            — primitives (button, input, modal, ...)
    │   ├── layout/        — chrome for app and public
    │   └── public/        — landing sections
    ├── pages/
    │   ├── public/        — landing + auth + invoice + pending
    │   └── app/           — tenant dashboard
    ├── routes/        — route tree + guards
    └── styles/        — global CSS (Tailwind + theme variables)

## Theme

Light and dark modes are supported. Colors come from CSS variables
defined in `src/styles/index.css`, mapped to Tailwind tokens in
`tailwind.config.js`. Components must never hardcode colors.

## Environment

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SOCKET_URL` | Backend base URL (for socket.io) |
| `VITE_APP_NAME` | Display name (fallback) |

## License

Proprietary — HDM. All rights reserved.