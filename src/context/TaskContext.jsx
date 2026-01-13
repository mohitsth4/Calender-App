import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const TaskContext = createContext();

const API_URL = "https://kapi.almuroojgroup.com/api/tasks";

export const TaskProvider = ({ children }) => {
    const [tasks, setTasks] = useState([]);

    // Fetch all tasks from backend
    const fetchTasks = async () => {
        try {
            const res = await axios.get(API_URL);
            setTasks(res.data);
        } catch (err) {
            console.error("Failed to fetch tasks:", err);
        }
    };

    // Create a new task
    const createTask = async (task) => {
        try {
            const res = await axios.post(API_URL, task);
            setTasks(prev => [...prev, res.data]); // ✅ use functional form
        } catch (err) {
            console.error("Failed to create task:", err);
        }
    };

    // Update an existing task
    const updateTask = async (id, updates) => {
        try {
            const res = await axios.put(`${API_URL}/${id}`, updates);
            setTasks(prev => prev.map(t => (t._id === id ? res.data : t))); // ✅ functional form
        } catch (err) {
            console.error("Failed to update task:", err);
        }
    };

    // Remove a task from state (frontend)
    const deleteTaskFromContext = (id) => {
        setTasks(prev => prev.filter(t => t._id !== id));
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    return (
        <TaskContext.Provider value={{
            tasks,
            createTask,
            updateTask,
            deleteTaskFromContext,
            fetchTasks, // ✅ optional: allow components to refetch tasks
        }}>
            {children}
        </TaskContext.Provider>
    );
};
