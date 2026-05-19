import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login.jsx";
import { loginRequest } from "../api/taskApi.js";

const mockNavigate = jest.fn();

jest.mock("../api/taskApi.js", () => ({
  loginRequest: jest.fn(),
}));

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
  loginRequest.mockReset();
  mockNavigate.mockReset();
});

describe("Login", () => {
  it("renders the login form", () => {
    renderLogin();

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("accepts user input", async () => {
    const user = userEvent.setup();

    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    expect(screen.getByLabelText(/email/i)).toHaveValue("test@example.com");
    expect(screen.getByLabelText(/password/i)).toHaveValue("password123");
  });

  it("calls the login API on submit", async () => {
    const user = userEvent.setup();
    loginRequest.mockResolvedValueOnce({
      user: { id: "user-1", name: "Test User", email: "test@example.com" },
      token: "jwt-token",
    });

    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(loginRequest).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });
});
