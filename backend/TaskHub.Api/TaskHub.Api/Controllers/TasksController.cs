using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace TaskHub.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TasksController : ControllerBase
    {

        private static readonly List<TaskItem> Tasks = new()
        {
            new TaskItem { Id = 1, Title = "Learn C#", IsDone = false }
        };
        private static int _nextId = 2;

        [HttpGet]
        public IActionResult GetAll()
        {
            return Ok(Tasks);
        }
        [ProducesResponseType(typeof(TaskItem), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [HttpPost]
        public IActionResult Add([FromBody] CreateTaskRequest request)
        {
            var task = new TaskItem
            {
                Id = _nextId,
                Title = request.Title,
                IsDone = false
            };

            _nextId++;
            Tasks.Add(task);

            return CreatedAtAction(nameof(GetById), new { id = task.Id }, task);
        }

        [HttpPatch("{id}/toggle")]
        public IActionResult ToggleDone(int id)
        {
            var task = Tasks.FirstOrDefault(t => t.Id == id);

            if (task == null)
                return NotFound();

            task.IsDone = !task.IsDone;

            return Ok(task);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var task = Tasks.FirstOrDefault(t => t.Id == id);

            if (task == null) return NotFound();

            return Ok(task);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var task = Tasks.FirstOrDefault(t => t.Id == id);

            if (task == null)
                return NotFound();

            Tasks.Remove(task);
            return NoContent(); // 204
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] UpdateTaskRequest request)
        {
            var task = Tasks.FirstOrDefault(t => t.Id == id);
            if (task == null)
                return NotFound();

            if (request == null || string.IsNullOrWhiteSpace(request.Title))
                return BadRequest("title is required");

            task.Title = request.Title.Trim();
            task.IsDone = request.IsDone;

            return Ok(task);
        }


    }
}
