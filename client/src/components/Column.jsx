import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard.jsx";

const Column = ({
  id,
  title,
  tasks,
  onDelete,
  onStatusChange,
  isActionInProgress,
  updatingTaskId,
  deletingTaskId,
  showEmptyState = true,
}) => {
  return (
    <section className="task-column">
      <div className="task-column__header">
        <h2>{title}</h2>
        <span>{tasks.length}</span>
      </div>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            className={[
              "task-column__list",
              snapshot.isDraggingOver ? "task-column__list--dragging-over" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.length > 0 ? (
              tasks.map((task, index) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  index={index}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                  isActionInProgress={isActionInProgress}
                  updatingTaskId={updatingTaskId}
                  deletingTaskId={deletingTaskId}
                />
              ))
            ) : showEmptyState ? (
              <p className="empty-state">No tasks here yet.</p>
            ) : null}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </section>
  );
};

export default React.memo(Column);
