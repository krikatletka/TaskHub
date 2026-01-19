using System.ComponentModel.DataAnnotations;

namespace TaskHub.Api
{
    public class CreateTaskRequest
    {
        [Required]
        [MinLength(1)]
        public string Title { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public string? Color { get; set; }
        public string? Status { get; set; }
    }
}
