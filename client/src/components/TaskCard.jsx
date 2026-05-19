import React from "react";
import { Draggable } from "@hello-pangea/dnd";

const nextStatusMap = {
  todo: "in-progress",
  "in-progress": "done",
  done: "todo",
};

const statusLabels = {
  todo: "Todo",
  "in-progress": "In Progress",
  done: "Done",
};

const formatDate = (date) => {
  if (!date) return null;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

const TaskCard = ({
  task,
  index,
  onDelete,
  onStatusChange,
  isActionInProgress,
  updatingTaskId,
  deletingTaskId,
}) => {
  const nextStatus = nextStatusMap[task.status];
  const isMoving = updatingTaskId === task._id;
  const isDeleting = deletingTaskId === task._id;
  const cardClassName = [
    "task-card",
    isMoving ? "task-card--updating" : "",
    isDeleting ? "task-card--deleting" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Draggable draggableId={task._id} index={index} isDragDisabled={isActionInProgress}>
      {(provided, snapshot) => (
        <article
          className={[cardClassName, snapshot.isDragging ? "task-card--dragging" : ""]
            .filter(Boolean)
            .join(" ")}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="task-card__header">
            <h3>{task.title}</h3>
            <span className={`priority priority--${task.priority}`}>{task.priority}</span>
          </div>

          {task.description && <p className="task-card__description">{task.description}</p>}

      <div className="task-card__meta">
        <span>{statusLabels[task.status] || task.status}</span>
        {task.dueDate && <span className="task-card__date">Due {formatDate(task.dueDate)}</span>}
      </div>

          <div className="task-card__actions">
            <button
              className="button button--secondary"
              type="button"
              onClick={() => onStatusChange(task._id, nextStatus)}
              disabled={isActionInProgress}
            >
              {isMoving ? "Moving..." : `Move to ${statusLabels[nextStatus]}`}
            </button>
            <button
              className="button button--danger"
              type="button"
              onClick={() => onDelete(task._id)}
              disabled={isActionInProgress}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </article>
      )}
    </Draggable>
  );
};

export default React.memo(TaskCard);
