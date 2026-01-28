using System.ComponentModel.DataAnnotations;

namespace TaskHub.Api
{
    public class UpdateTaskRequest
    {
        [Required(ErrorMessage = "Title is required.")]
        [MinLength(1, ErrorMessage = "Title must be at least 1 character.")]
        [MaxLength(120, ErrorMessage = "Title must be at most 120 characters.")]
        public string Title { get; set; } = string.Empty;

        public bool IsDone { get; set; }

        public DateTime? DueDate { get; set; }

        [MaxLength(30, ErrorMessage = "Color must be at most 30 characters.")]
        public string? Color { get; set; }

        [Required(ErrorMessage = "Status is required.")]
        [MinLength(1, ErrorMessage = "Status must be at least 1 character.")]
        [MaxLength(20, ErrorMessage = "Status must be at most 20 characters.")]
        public string Status { get; set; } = "todo";
    }
}
