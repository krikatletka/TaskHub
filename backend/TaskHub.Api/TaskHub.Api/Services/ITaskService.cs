using TaskHub.Api;

namespace TaskHub.Api.Services
{
    public interface ITaskService
    {
        List<TaskItem> GetAll();
        TaskItem? GetById(int id);
        (bool ok, TaskItem? task, string? error) Create(CreateTaskRequest request);
        (bool ok, TaskItem? task, string? error) Update(int id, UpdateTaskRequest request);
        (bool ok, TaskItem? task) ToggleDone(int id);
        bool Delete(int id);
    }
}
