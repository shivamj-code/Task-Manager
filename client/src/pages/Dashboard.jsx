import React from "react";
import { useCallback, useMemo, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import Column from "../components/Column.jsx";
import Navbar from "../components/Navbar.jsx";
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from "../hooks/useTasks.js";

const columns = [
  { key: "todo", title: "Todo" },
  { key: "in-progress", title: "In Progress" },
  { key: "done", title: "Done" },
];

const initialTaskForm = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
};

const Dashboard = () => {
  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState("");

  const filters = useMemo(() => {
    return search.trim() ? { search: search.trim() } : {};
  }, [search]);

  const { data: tasks = [], isFetching, isLoading, isError, error } = useTasks(filters);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const isMutating = createTask.isPending || updateTask.isPending || deleteTask.isPending;
  const updatingTaskId = updateTask.variables?.id || null;
  const deletingTaskId = deleteTask.variables || null;

  const groupedTasks = useMemo(() => {
    return columns.reduce((groups, column) => {
      groups[column.key] = tasks.filter((task) => task.status === column.key);
      return groups;
    }, {});
  }, [tasks]);

  const handleFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormError("");
    setTaskForm((current) => ({ ...current, [name]: value }));
  }, []);

  const handleCreateTask = useCallback(async (event) => {
    event.preventDefault();

    if (!taskForm.title.trim()) {
      setFormError("Task title is required.");
      return;
    }

    try {
      await createTask.mutateAsync({
        ...taskForm,
        title: taskForm.title.trim(),
        dueDate: taskForm.dueDate || null,
      });

      setTaskForm(initialTaskForm);
      setFormError("");
    } catch (err) {
      setFormError(err.message || "Unable to create task. Please try again.");
    }
  }, [createTask, taskForm]);

  const handleStatusChange = useCallback((id, status) => {
    updateTask.mutate({ id, updates: { status } });
  }, [updateTask]);

  const handleDeleteTask = useCallback((id) => {
    deleteTask.mutate(id);
  }, [deleteTask]);

  const handleDragEnd = useCallback((result) => {
    const { destination, draggableId, source } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    updateTask.mutate({
      id: draggableId,
      updates: {
        status: destination.droppableId,
      },
    });
  }, [updateTask]);

  const mutationError = createTask.error || updateTask.error || deleteTask.error;
  const alertMessage = formError || mutationError?.message;

  return (
    <main className="dashboard">
      <Navbar />

      <section className="dashboard__controls">
        <form className="task-form" onSubmit={handleCreateTask}>
          <input
            name="title"
            type="text"
            placeholder="Task title"
            value={taskForm.title}
            onChange={handleFormChange}
            required
          />
          <input
            name="description"
            type="text"
            placeholder="Description"
            value={taskForm.description}
            onChange={handleFormChange}
          />
          <select name="priority" value={taskForm.priority} onChange={handleFormChange}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input
            name="dueDate"
            type="date"
            value={taskForm.dueDate}
            onChange={handleFormChange}
          />
          <button className="button button--primary" type="submit" disabled={isMutating}>
            {createTask.isPending ? "Adding..." : "Add Task"}
          </button>
        </form>

        <input
          className="search-input"
          type="search"
          placeholder="Search tasks"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </section>

      {alertMessage && (
        <div className="toast toast--error" role="alert">
          {alertMessage}
        </div>
      )}
      {isLoading && <p className="page-state">Loading your board...</p>}
      {!isLoading && isFetching && <p className="page-state">Refreshing tasks...</p>}
      {isError && (
        <p className="page-error">
          {error?.message || "Unable to load tasks. Please try again."}
        </p>
      )}
      {!isLoading && !isFetching && !isError && tasks.length === 0 && (
        <p className="page-state">No tasks yet. Create your first task to start the board.</p>
      )}

      {!isLoading && !isError && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <section className="board" aria-label="Task board">
            {columns.map((column) => (
              <Column
                key={column.key}
                id={column.key}
                title={column.title}
                tasks={groupedTasks[column.key] || []}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
                isActionInProgress={isMutating}
                updatingTaskId={updatingTaskId}
                deletingTaskId={deletingTaskId}
                showEmptyState={tasks.length > 0}
              />
            ))}
          </section>
        </DragDropContext>
      )}
    </main>
  );
};

export default Dashboard;
