import mongoose from "mongoose";
import Task from "../models/Task.js";

const allowedStatuses = ["todo", "in-progress", "done"];
const allowedPriorities = ["low", "medium", "high"];

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isValidTaskId = (id) => mongoose.Types.ObjectId.isValid(id);

const handleTaskError = (error, res, fallbackMessage) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: Object.values(error.errors)[0].message,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid task data",
    });
  }

  return res.status(500).json({
    message: fallbackMessage,
  });
};

export const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    const normalizedTitle = normalizeString(title);

    if (!normalizedTitle) {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

    const task = await Task.create({
      title: normalizedTitle,
      description,
      status,
      priority,
      dueDate,
      user: req.user._id,
    });

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    return handleTaskError(error, res, "Server error while creating task");
  }
};

export const getTasks = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    const query = { user: req.user._id };

    if (status !== undefined) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid task status",
        });
      }

      query.status = status;
    }

    if (priority !== undefined) {
      if (!allowedPriorities.includes(priority)) {
        return res.status(400).json({
          message: "Invalid task priority",
        });
      }

      query.priority = priority;
    }

    const normalizedSearch = normalizeString(search);

    if (normalizedSearch) {
      const searchRegex = new RegExp(escapeRegex(normalizedSearch), "i");
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    return handleTaskError(error, res, "Server error while fetching tasks");
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidTaskId(id)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const task = await Task.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json({ task });
  } catch (error) {
    return handleTaskError(error, res, "Server error while fetching task");
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate } = req.body;
    const normalizedTitle = normalizeString(title);

    if (!isValidTaskId(id)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    if (title !== undefined && !normalizedTitle) {
      return res.status(400).json({
        message: "Task title cannot be empty",
      });
    }

    const updates = {};

    if (title !== undefined) updates.title = normalizedTitle;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (dueDate !== undefined) updates.dueDate = dueDate;

    const task = await Task.findOneAndUpdate(
      { _id: id, user: req.user._id },
      updates,
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    return handleTaskError(error, res, "Server error while updating task");
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidTaskId(id)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const task = await Task.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    return handleTaskError(error, res, "Server error while deleting task");
  }
};
