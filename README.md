# TaskHub 📝

TaskHub is a fullstack practice project built to learn and demonstrate
how a modern frontend connects to a real backend API.


### Backend
- ASP.NET Core Web API (.NET 8)
- Entity Framework Core
- SQLite
- Swagger
- Docker

### Frontend
- React
- Vite
- JavaScript
- Fetch API

## 🧩 Architecture

- Backend runs on `https://localhost:7102`
- Frontend (React + Vite) runs on `http://localhost:5173`
- Frontend communicates with backend via REST API
- CORS is explicitly configured to allow React dev server

## 🔗 API Endpoints

- `GET /api/Tasks` — get all tasks
- `POST /api/Tasks` — create task
- `PUT /api/Tasks/{id}` — update task
- `PATCH /api/Tasks/{id}/toggle` — toggle task status
- `DELETE /api/Tasks/{id}` — delete task

## ⚠️ Development Notes

During development, several real-world issues were encountered and solved:
- CORS configuration between React and ASP.NET Core
- HTTPS vs HTTP port mismatch
- Running frontend and backend as separate services
- Handling SQLite with EF Core
