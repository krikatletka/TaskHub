import { apiGet, apiSend } from "./api.js";

export function getTasks() {
  return apiGet("/api/Tasks");
}

export function createTask(title) {
  return apiSend("/api/Tasks", "POST", { title });
}

export function toggleTask(id) {
  return apiSend(`/api/Tasks/${id}/toggle`, "PATCH");
}

export function updateTask(id, payload) {
  return apiSend(`/api/Tasks/${id}`, "PUT", payload);
}

export function deleteTask(id) {
  return apiSend(`/api/Tasks/${id}`, "DELETE");
}
