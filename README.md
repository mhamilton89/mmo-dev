# 2D MMO Game

A multiplayer 2D game built with Node.js, WebSockets, PostgreSQL, and HTML5 Canvas.

## Features

- Real-time multiplayer gameplay
- WebSocket-based communication
- PostgreSQL database for persistent player data
- Player movement with WASD or arrow keys
- Chat system
- Health and level system
- Responsive HTML5 Canvas rendering

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up PostgreSQL:**
   - Create a database named `mmo_game`
   - Run the schema file:
     ```bash
     psql -U postgres -d mmo_game -f database/schema.sql
     ```

3. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Update database credentials in `.env`

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Open your browser:**
   - Navigate to `http://localhost:3000`
   - Enter a username and start playing!

## Project Structure

```
game_dev/
├── client/           # Frontend files
│   ├── index.html    # Main HTML
│   ├── style.css     # Styles
│   └── game.js       # Game logic and rendering
├── server/           # Backend files
│   └── index.js      # Express + WebSocket server
├── database/         # Database files
│   ├── schema.sql    # Database schema
│   └── db.js         # Database connection
└── package.json      # Dependencies
```

## Controls

- **WASD** or **Arrow Keys**: Move your character
- **Enter**: Open chat
- **Mouse Click**: (Optional) Click to move (can be implemented)

## API Endpoints

- `GET /api/status` - Server status
- `GET /api/players` - List of players (leaderboard)

## WebSocket Events

**Client → Server:**
- `join` - Join the game
- `move` - Update player position
- `chat` - Send chat message

**Server → Client:**
- `init` - Initial game state
- `playerJoined` - New player joined
- `playerLeft` - Player disconnected
- `playerMoved` - Player position update
- `chat` - Chat message

## Development

To run in development mode with auto-restart, install nodemon:

```bash
npm install -g nodemon
nodemon server/index.js
```

## Future Enhancements

- Authentication system
- Combat mechanics
- Inventory system
- NPCs and monsters
- Quests
- Map zones
- Party system