using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskHub.Api;


namespace TaskHub.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _db;

        public TasksController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            var tasks = _db.Tasks
                .AsNoTracking()
                .OrderByDescending(t => t.UpdatedAt)
                .ToList();

            return Ok(tasks);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var task = _db.Tasks.AsNoTracking().FirstOrDefault(t => t.Id == id);
            if (task == null) return NotFound();
            return Ok(task);
        }

        [ProducesResponseType(typeof(TaskItem), StatusCodes.Status201Created)]///
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [HttpPost]
        public IActionResult Add([FromBody] CreateTaskRequest request) ///дто
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Title))
                return BadRequest("title is required");

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

            return CreatedAtAction(nameof(GetById), new { id = task.Id }, task);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] UpdateTaskRequest request)
        {
            var task = _db.Tasks.FirstOrDefault(t => t.Id == id);
            if (task == null) return NotFound();

            if (request == null || string.IsNullOrWhiteSpace(request.Title))
                return BadRequest("title is required");

            task.Title = request.Title.Trim();
            task.IsDone = request.IsDone;

            task.DueDate = request.DueDate;
            task.Color = request.Color;
            task.Status = string.IsNullOrWhiteSpace(request.Status) ? "todo" : request.Status;

            task.UpdatedAt = DateTime.UtcNow;

            _db.SaveChanges();

            return Ok(task);
        }

        [HttpPatch("{id}/toggle")]
        public IActionResult ToggleDone(int id)
        {
            var task = _db.Tasks.FirstOrDefault(t => t.Id == id);
            if (task == null) return NotFound();

            task.IsDone = !task.IsDone;
            task.UpdatedAt = DateTime.UtcNow;

            if (task.IsDone)
                task.Status = "done";

            _db.SaveChanges();

            return Ok(task);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var task = _db.Tasks.FirstOrDefault(t => t.Id == id);
            if (task == null) return NotFound();

            _db.Tasks.Remove(task);
            _db.SaveChanges();

            return NoContent();
        }
    }
}
