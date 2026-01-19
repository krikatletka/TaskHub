using System.ComponentModel.DataAnnotations;

namespace TaskHub.Api
{
    public class TaskItem
    {
        public int Id { get; set; }

        [Required]
        [MinLength(1)]
        public string Title { get; set; } = string.Empty;
        public bool IsDone { get; set; }

        public DateTime? DueDate { get; set; }    
        public string? Color { get; set; }         
        public string Status { get; set; } = "todo"; 

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
