The Master Architecture Prompt
Project Name: "CipherGrid" (Our Codenames Implementation)

Objective: "Design a full-stack architecture and a high-fidelity React UI for CipherGrid, a real-time multiplayer social deduction game. The game requires a 'Join & Play' experience with zero friction—no login or sign-up. It must handle real-time synchronization across multiple clients using WebSockets."

1. The Tech Stack
Frontend: Next.js 14+ (App Router), Tailwind CSS, Framer Motion (for card flip animations), and Lucide-react for icons.

Backend: Node.js with Express.

Real-time Communication: web socket for bi-directional event handling and room management.

State Management: Redis for active game sessions (volatile state) and Prisma with PostgreSQL for match history and custom word-pack storage.

Authentication: Anonymous JWTs stored in localStorage to identify players across refreshes without a database-backed account.

2. Functional Requirements for the UI
The Lobby: A minimalist entry point where users can 'Create Room' or 'Join by Code'. It should automatically detect a playerId from the browser to reconnect them to an existing session.

The Grid: A 5x5 responsive board.

Operative View: Words only; colors revealed only after a card is 'flipped'.

Spymaster View: An 'Overwatch' mode where all 25 card colors (Red, Blue, Neutral, Assassin) are visible but dimmed.

Game Loop Features: A turn-based indicator (e.g., 'Blue Team's Turn'), a 'Give Clue' input field for Spymasters, and a 'Pass Turn' button for Operatives.

Real-time Sidebar: A scrollable 'Action Log' showing clues given (e.g., "Fruit: 3") and cards flipped.

3. System Design Constraints
Concurrency: The backend must validate card clicks to prevent two players from flipping the same card at the exact same millisecond.

Information Security: The server must never send the 'Assassin' or 'Opposing Team' card data to an Operative's browser until that specific card is officially revealed.

Responsive Design: The 5x5 grid must be perfectly legible on both a 27-inch desktop and a 6-inch smartphone.
