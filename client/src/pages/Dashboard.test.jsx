import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard.jsx";
import {
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUpdateTask,
} from "../hooks/useTasks.js";

jest.mock("../hooks/useTasks.js", () => ({
  useTasks: jest.fn(),
  useCreateTask: jest.fn(),
  useDeleteTask: jest.fn(),
  useUpdateTask: jest.fn(),
}));

jest.mock("@hello-pangea/dnd", () => {
  const React = jest.requireActual("react");

  return {
    DragDropContext: ({ children }) => React.createElement("div", null, children),
    Droppable: ({ children }) =>
      children(
        {
          innerRef: jest.fn(),
          droppableProps: {},
          placeholder: null,
        },
        { isDraggingOver: false }
      ),
    Draggable: ({ children }) =>
      children(
        {
          innerRef: jest.fn(),
          draggableProps: {},
          dragHandleProps: {},
        },
        { isDragging: false }
      ),
  };
});

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

const mockMutations = () => {
  useCreateTask.mockReturnValue({
    isPending: false,
    error: null,
    mutateAsync: jest.fn(),
  });
  useUpdateTask.mockReturnValue({
    isPending: false,
    error: null,
    mutate: jest.fn(),
    variables: null,
  });
  useDeleteTask.mockReturnValue({
    isPending: false,
    error: null,
    mutate: jest.fn(),
    variables: null,
  });
};

beforeEach(() => {
  localStorage.setItem(
    "task-manager-auth",
    JSON.stringify({
      token: "test-token",
      user: { id: "user-1", name: "Test User", email: "test@example.com" },
    })
  );
  mockMutations();
});

afterEach(() => {
  localStorage.clear();
});

describe("Dashboard", () => {
  it("renders without crashing", () => {
    useTasks.mockReturnValue({
      data: [],
      isFetching: false,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderDashboard();

    expect(screen.getByRole("heading", { name: /workspace board/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add task/i })).toBeInTheDocument();
  });

  it('shows "No tasks" when empty', () => {
    useTasks.mockReturnValue({
      data: [],
      isFetching: false,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderDashboard();

    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it("renders tasks when provided", () => {
    useTasks.mockReturnValue({
      data: [
        {
          _id: "task-1",
          title: "Plan sprint",
          description: "Review backlog and capacity",
          status: "todo",
          priority: "high",
          dueDate: "2026-06-01T00:00:00.000Z",
        },
        {
          _id: "task-2",
          title: "Ship dashboard",
          description: "Finish UI polish",
          status: "done",
          priority: "medium",
        },
      ],
      isFetching: false,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderDashboard();

    expect(screen.getByText("Plan sprint")).toBeInTheDocument();
    expect(screen.getByText("Review backlog and capacity")).toBeInTheDocument();
    expect(screen.getByText("Ship dashboard")).toBeInTheDocument();
    expect(screen.getByText("Finish UI polish")).toBeInTheDocument();
  });
});
