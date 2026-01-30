using Microsoft.EntityFrameworkCore;
using TaskHub.Api;

namespace TaskHub.Api.Services
{
    public class TaskService : ITaskService
    {
        private readonly AppDbContext _db;

        public TaskService(AppDbContext db)
        {
            _db = db;
        }

        public List<TaskItem> GetAll()
        {
            return _db.Tasks
                .AsNoTracking()
                .OrderByDescending(t => t.UpdatedAt)
                .ToList();
        }

        public TaskItem? GetById(int id)
        {
            return _db.Tasks.AsNoTracking().FirstOrDefault(t => t.Id == id);
        }

        public (bool ok, TaskItem? task, string? error) Create(CreateTaskRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Title))
                return (false, null, "title is required");

            var now = DateTime.UtcNow;

            var task = new TaskItem
            {
                Title = request.Title.Trim(),
                IsDone = false,

                DueDate = request.DueDate,
                Color = request.Color,
                Status = string.IsNullOrWhiteSpace(request.Status) ? "todo" : request.Status,

                CreatedAt = now,
                UpdatedAt = now
            };

            _db.Tasks.Add(task);
            _db.SaveChanges();

            return (true, task, null);
        }

        public (bool ok, TaskItem? task, string? error) Update(int id, UpdateTaskRequest request)
        {
            var task = _db.Tasks.FirstOrDefault(t => t.Id == id);
            if (task == null) return (false, null, null); // NotFound

            if (request == null || string.IsNullOrWhiteSpace(request.Title))
                return (false, null, "title is required");

            task.Title = request.Title.Trim();
            task.IsDone = request.IsDone;

            task.DueDate = request.DueDate;
            task.Color = request.Color;
            task.Status = string.IsNullOrWhiteSpace(request.Status) ? "todo" : request.Status;

            task.UpdatedAt = DateTime.UtcNow;

            _db.SaveChanges();

            return (true, task, null);
        }

        public (bool ok, TaskItem? task) ToggleDone(int id)
        {
            var task = _db.Tasks.FirstOrDefault(t => t.Id == id);
            if (task == null) return (false, null);

            task.IsDone = !task.IsDone;
            task.UpdatedAt = DateTime.UtcNow;

            if (task.IsDone)
                task.Status = "done";

            _db.SaveChanges();

            return (true, task);
        }

        public bool Delete(int id)
        {
            var task = _db.Tasks.FirstOrDefault(t => t.Id == id);
            if (task == null) return false;

            _db.Tasks.Remove(task);
            _db.SaveChanges();

            return true;
        }
    }
}
