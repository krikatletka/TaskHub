using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TaskHub.Api;
using TaskHub.Api.Services;

namespace TaskHub.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _service;

        public TasksController(ITaskService service)
        {
            _service = service;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            var tasks = _service.GetAll();
            return Ok(tasks);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var task = _service.GetById(id);
            if (task == null) return NotFound();
            return Ok(task);
        }

        [ProducesResponseType(typeof(TaskItem), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [HttpPost]
        public IActionResult Add([FromBody] CreateTaskRequest request)
        {
            var result = _service.Create(request);
            return CreatedAtAction(nameof(GetById), new { id = result.task!.Id }, result.task);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] UpdateTaskRequest request)
        {
            var result = _service.Update(id, request);
            if (result.task == null)
                return NotFound();

            return Ok(result.task);
        }

        [HttpPatch("{id}/toggle")]
        public IActionResult ToggleDone(int id)
        {
            var (ok, task) = _service.ToggleDone(id);
            if (!ok) return NotFound();
            return Ok(task);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var deleted = _service.Delete(id);
            if (!deleted) return NotFound();
            return NoContent();
        }
    }
}
