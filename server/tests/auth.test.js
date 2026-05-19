import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import app from "../src/server.js";
import Task from "../src/models/Task.js";
import User from "../src/models/User.js";

let mongoServer;

const userPayload = {
  name: "Test User",
  email: "test@example.com",
  password: "password123",
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await Task.deleteMany({});
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Auth API", () => {
  it("registers a user successfully", async () => {
    const response = await request(app).post("/api/auth/register").send(userPayload);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("User registered successfully");
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      name: userPayload.name,
      email: userPayload.email,
    });
    expect(response.body.user.password).toBeUndefined();
  });

  it("prevents duplicate email registration", async () => {
    await request(app).post("/api/auth/register").send(userPayload);

    const response = await request(app).post("/api/auth/register").send({
      ...userPayload,
      email: "TEST@example.com",
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("User with this email already exists");
  });

  it("logs in a user successfully", async () => {
    await request(app).post("/api/auth/register").send(userPayload);

    const response = await request(app).post("/api/auth/login").send({
      email: userPayload.email,
      password: userPayload.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user.email).toBe(userPayload.email);
  });

  it("rejects an invalid password", async () => {
    await request(app).post("/api/auth/register").send(userPayload);

    const response = await request(app).post("/api/auth/login").send({
      email: userPayload.email,
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
    expect(response.body.token).toBeUndefined();
  });

  it("rejects missing registration fields", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "missing@example.com",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Name, email, and password are required");
  });
});
