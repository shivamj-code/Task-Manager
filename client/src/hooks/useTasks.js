import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTaskRequest,
  deleteTaskRequest,
  getTasksRequest,
  updateTaskRequest,
} from "../api/taskApi.js";

export const tasksQueryKey = ["tasks"];

const getTaskQueriesSnapshot = (queryClient) =>
  queryClient.getQueriesData({ queryKey: tasksQueryKey });

const restoreTaskQueries = (queryClient, snapshot = []) => {
  snapshot.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
};

const taskMatchesFilters = (task, filters = {}) => {
  if (filters.status && task.status !== filters.status) return false;
  if (filters.priority && task.priority !== filters.priority) return false;

  if (filters.search) {
    const search = filters.search.toLowerCase();
    const title = task.title?.toLowerCase() || "";
    const description = task.description?.toLowerCase() || "";

    return title.includes(search) || description.includes(search);
  }

  return true;
};

const updateTaskQueries = (queryClient, updater) => {
  getTaskQueriesSnapshot(queryClient).forEach(([queryKey, tasks]) => {
    if (!Array.isArray(tasks)) return;

    const filters = queryKey[1] || {};
    queryClient.setQueryData(queryKey, updater(tasks, filters));
  });
};

export const useTasks = (filters = {}) => {
  return useQuery({
    queryKey: [...tasksQueryKey, filters],
    queryFn: () => getTasksRequest(filters),
    staleTime: 0,
    cacheTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTaskRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTaskRequest,
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey });

      const previousTasks = getTaskQueriesSnapshot(queryClient);

      updateTaskQueries(queryClient, (tasks, filters) =>
        tasks
          .map((task) =>
            task._id === id
              ? {
                  ...task,
                  ...updates,
                }
              : task
          )
          .filter((task) => taskMatchesFilters(task, filters))
      );

      return { previousTasks };
    },
    onError: (_error, _variables, context) => {
      restoreTaskQueries(queryClient, context?.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTaskRequest,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey });

      const previousTasks = getTaskQueriesSnapshot(queryClient);

      updateTaskQueries(queryClient, (tasks) => tasks.filter((task) => task._id !== id));

      return { previousTasks };
    },
    onError: (_error, _variables, context) => {
      restoreTaskQueries(queryClient, context?.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
    },
  });
};
