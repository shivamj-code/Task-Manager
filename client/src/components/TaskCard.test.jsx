import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskCard from "./TaskCard.jsx";

jest.mock("@hello-pangea/dnd", () => ({
  Draggable: ({ children }) =>
    children(
      {
        innerRef: jest.fn(),
        draggableProps: {},
        dragHandleProps: {},
      },
      { isDragging: false }
    ),
}));

const task = {
  _id: "task-1",
  title: "Test task",
  description: "Task description",
  status: "todo",
  priority: "high",
  dueDate: "2026-06-01T00:00:00.000Z",
};

const renderTaskCard = (props = {}) =>
  render(
    <TaskCard
      task={task}
      index={0}
      onDelete={jest.fn()}
      onStatusChange={jest.fn()}
      isActionInProgress={false}
      updatingTaskId={null}
      deletingTaskId={null}
      {...props}
    />
  );

describe("TaskCard", () => {
  it("renders title, description, and priority", () => {
    renderTaskCard();

    expect(screen.getByText("Test task")).toBeInTheDocument();
    expect(screen.getByText("Task description")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
  });

  it("shows the correct status", () => {
    renderTaskCard();

    expect(screen.getByText("Todo")).toBeInTheDocument();
  });

  it("calls the status handler when move button is clicked", async () => {
    const user = userEvent.setup();
    const onStatusChange = jest.fn();

    renderTaskCard({ onStatusChange });

    await user.click(screen.getByRole("button", { name: /move to in progress/i }));

    expect(onStatusChange).toHaveBeenCalledWith("task-1", "in-progress");
  });
});
