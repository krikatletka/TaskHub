# TaskHub 📝

TaskHub is a fullstack practice project built to learn and demonstrate
how a modern frontend connects to a real backend API.

## ✨ What this project demonstrates

This project was built as a hands-on exercise to understand how real frontend applications communicate with a backend API.

It demonstrates:
- Designing a RESTful API with ASP.NET Core
- Separating backend and frontend into independent services
- Connecting a React frontend to a real backend using Fetch API
- Handling common development issues such as CORS and HTTPS configuration
- Working with a relational database via Entity Framework Core
- DTO-based API requests and responses

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
