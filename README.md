# To-Do List Web App

A simple full-stack to-do list where you can **add, edit, delete, and complete** tasks.
Tasks are stored in MongoDB, served through a Node.js/Express REST API.

## Tech stack

- **Front-end:** HTML, CSS, vanilla JavaScript (`fetch`)
- **Back-end:** Node.js + Express
- **Database:** MongoDB (Atlas) via Mongoose

## Project structure

```
├── server.js           # Express server + REST API
├── models/Task.js      # Mongoose task schema
├── public/             # Front-end served by Express
│   ├── index.html
│   ├── style.css
│   └── script.js
├── .env.example        # Template for environment variables
└── package.json
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure the database**

   Copy the example env file and add your MongoDB Atlas connection string:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and set `MONGODB_URI`. In Atlas: **Database → Connect →
   Drivers**, copy the string, and replace `<username>` / `<password>` with your
   database user credentials. Add a database name (e.g. `todos`) before the `?`.

   > In Atlas, make sure your current IP is allowed under **Network Access**
   > (or use `0.0.0.0/0` for development).

3. **Run the server**
   ```bash
   npm start        # or: npm run dev  (auto-reload with nodemon)
   ```

4. Open <http://localhost:3000> in your browser.

## REST API

| Method | Endpoint          | Description              |
| ------ | ----------------- | ------------------------ |
| GET    | `/api/tasks`      | List all tasks           |
| POST   | `/api/tasks`      | Create a task            |
| PUT    | `/api/tasks/:id`  | Update text or completed |
| DELETE | `/api/tasks/:id`  | Delete a task            |

Request body for POST/PUT is JSON, e.g. `{ "text": "Buy milk", "completed": false }`.
