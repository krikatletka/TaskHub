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
    }
}
