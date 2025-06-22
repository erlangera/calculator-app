# Formula Calculator App

This is a web application that allows users to create interactive calculators from mathematical formulas.

## Project Structure

```
calculator-app/
├── frontend/                 # React frontend
└── backend/                  # Node.js backend
```

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Hook Form
- Math.js
- Framer Motion
- Axios

### Backend
- Node.js 18+ + TypeScript
- Express.js
- Math.js
- fs-extra (for JSON file storage)

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm

### 1. Setup the Backend

First, navigate to the backend directory and install the dependencies.

```bash
cd calculator-app/backend
npm install
```

Then, run the development server. It will run on `http://localhost:5000`.

```bash
npm run dev
```

The server will watch for changes and automatically restart.

### 2. Setup the Frontend

In a separate terminal, navigate to the frontend directory and install its dependencies.

```bash
cd calculator-app/frontend
npm install
```

Then, run the development server. It will run on `http://localhost:3000`.

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000` to see the application in action.

## Available Scripts

### Backend (`/backend`)
- `npm run dev`: Starts the development server with `ts-node-dev`.
- `npm run build`: Compiles TypeScript to JavaScript.
- `npm run start`: Runs the compiled application from the `dist` directory.

### Frontend (`/frontend`)
- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Serves the production build locally.
