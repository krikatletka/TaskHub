using System.ComponentModel.DataAnnotations;

namespace TaskHub.Api
{
    public class UpdateTaskRequest
    {
        [Required]
        [MinLength(1)]
        public string Title { get; set; } = string.Empty;
        public bool IsDone { get; set; }
    }
}
