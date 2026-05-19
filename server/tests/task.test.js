import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import app from "../src/server.js";
import Task from "../src/models/Task.js";
import User from "../src/models/User.js";

let mongoServer;
let primaryUser;
let secondaryUser;

const registerUser = async (overrides = {}) => {
  const payload = {
    name: "Task User",
    email: `user-${Date.now()}-${Math.random()}@example.com`,
    password: "password123",
    ...overrides,
  };

  const response = await request(app).post("/api/auth/register").send(payload);

  return {
    token: response.body.token,
    user: response.body.user,
  };
};

const createTask = async (token, payload = {}) => {
  const response = await request(app)
    .post("/api/tasks")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Integration task",
      description: "Created by test suite",
      priority: "medium",
      status: "todo",
      ...payload,
    });

  return response.body.task;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await Task.deleteMany({});
  await User.deleteMany({});

  primaryUser = await registerUser({
    name: "Primary User",
    email: "primary@example.com",
  });

  secondaryUser = await registerUser({
    name: "Secondary User",
    email: "secondary@example.com",
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Task API", () => {
  it("creates a task successfully", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${primaryUser.token}`)
      .send({
        title: "Write tests",
        description: "Cover task creation",
        priority: "high",
        dueDate: "2026-06-01",
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Task created successfully");
    expect(response.body.task).toMatchObject({
      title: "Write tests",
      description: "Cover task creation",
      status: "todo",
      priority: "high",
    });
    expect(response.body.task.user).toBe(primaryUser.user.id);
  });

  it("rejects task creation without a token", async () => {
    const response = await request(app).post("/api/tasks").send({
      title: "Unauthorized task",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Not authorized, token missing");
  });

  it("rejects requests with an invalid JWT", async () => {
    const response = await request(app)
      .get("/api/tasks")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Not authorized, token failed");
  });

  it("fetches only the authenticated user's tasks", async () => {
    await createTask(primaryUser.token, { title: "Primary task one" });
    await createTask(primaryUser.token, { title: "Primary task two", status: "done" });
    await createTask(secondaryUser.token, { title: "Secondary task" });

    const response = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${primaryUser.token}`);

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(2);
    expect(response.body.tasks).toHaveLength(2);
    expect(response.body.tasks.every((task) => task.user === primaryUser.user.id)).toBe(true);
  });

  it("updates a task successfully", async () => {
    const task = await createTask(primaryUser.token, { title: "Update me" });

    const response = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${primaryUser.token}`)
      .send({
        status: "done",
        priority: "high",
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Task updated successfully");
    expect(response.body.task.status).toBe("done");
    expect(response.body.task.priority).toBe("high");
  });

  it("deletes a task successfully", async () => {
    const task = await createTask(primaryUser.token, { title: "Delete me" });

    const deleteResponse = await request(app)
      .delete(`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${primaryUser.token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe("Task deleted successfully");

    const fetchResponse = await request(app)
      .get(`/api/tasks/${task._id}`)
      .set("Authorization", `Bearer ${primaryUser.token}`);

    expect(fetchResponse.status).toBe(404);
  });

  it("rejects an invalid task ID", async () => {
    const response = await request(app)
      .get("/api/tasks/not-a-valid-id")
      .set("Authorization", `Bearer ${primaryUser.token}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid task ID");
  });

  it("prevents users from accessing another user's task", async () => {
    const secondaryTask = await createTask(secondaryUser.token, {
      title: "Private secondary task",
    });

    const fetchResponse = await request(app)
      .get(`/api/tasks/${secondaryTask._id}`)
      .set("Authorization", `Bearer ${primaryUser.token}`);

    const updateResponse = await request(app)
      .put(`/api/tasks/${secondaryTask._id}`)
      .set("Authorization", `Bearer ${primaryUser.token}`)
      .send({ status: "done" });

    const deleteResponse = await request(app)
      .delete(`/api/tasks/${secondaryTask._id}`)
      .set("Authorization", `Bearer ${primaryUser.token}`);

    expect(fetchResponse.status).toBe(404);
    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });
});
