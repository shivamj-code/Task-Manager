import axios from "axios";
import { clearAuth, getToken } from "../utils/auth.js";

export const apiClient = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Cache-Control": "no-cache",
    "Content-Type": "application/json",
    Pragma: "no-cache",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();

  config.headers["Cache-Control"] = "no-cache";
  config.headers.Pragma = "no-cache";

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();

      if (!["/login", "/register"].includes(window.location.pathname)) {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);

const getErrorMessage = (error, fallbackMessage) =>
  error.response?.data?.message || fallbackMessage;

export const registerRequest = async (payload) => {
  try {
    const { data } = await apiClient.post("/auth/register", payload);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Registration failed"));
  }
};

export const loginRequest = async (payload) => {
  try {
    const { data } = await apiClient.post("/auth/login", payload);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Login failed"));
  }
};

export const getTasksRequest = async (filters = {}) => {
  try {
    const { data } = await apiClient.get("/tasks", {
      params: filters,
    });
    return data.tasks || [];
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to load tasks"));
  }
};

export const createTaskRequest = async (payload) => {
  try {
    const { data } = await apiClient.post("/tasks", payload);
    return data.task;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to create task"));
  }
};

export const updateTaskRequest = async ({ id, updates }) => {
  try {
    const { data } = await apiClient.put(`/tasks/${id}`, updates);
    return data.task;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to update task"));
  }
};

export const deleteTaskRequest = async (id) => {
  try {
    const { data } = await apiClient.delete(`/tasks/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to delete task"));
  }
};
