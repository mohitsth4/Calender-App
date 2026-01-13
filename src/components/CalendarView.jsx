import React, { useContext, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { TaskContext } from "../context/TaskContext";
import Modal from "react-modal";
import DatePicker from "react-datepicker";
import axios from "axios";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

const API_URL = "https://kapi.almuroojgroup.com";

Modal.setAppElement("#root");

// EditableField component
const EditableField = ({ label, value, type = "text", options, onChange, style }) => {
    const [editing, setEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    const handleSave = () => {
        setEditing(false);
        onChange(tempValue);
    };

    return (
        <div style={{ marginBottom: "10px" }}>
            <strong>{label}:</strong>{" "}
            {editing ? (
                <>
                    {type === "select" ? (
                        <select
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={handleSave}
                            autoFocus
                        >
                            {options.map((opt) => (
                                <option key={opt}>{opt}</option>
                            ))}
                        </select>
                    ) : type === "date" ? (
                        <DatePicker
                            selected={tempValue ? new Date(tempValue) : null}
                            onChange={(date) => setTempValue(date)}
                            onBlur={handleSave}
                            autoFocus
                            dateFormat="yyyy-MM-dd"
                        />
                    ) : type === "textarea" ? (
                        <textarea
                            value={tempValue || ""}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={handleSave}
                            autoFocus
                            rows={3}
                            style={{ width: "100%" }}
                        />
                    ) : (
                        <input
                            type="text"
                            value={tempValue || ""}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={(e) => e.key === "Enter" && handleSave()}
                            autoFocus
                        />
                    )}
                </>
            ) : (
                <span
                    style={{ marginLeft: "5px", cursor: "pointer" }}
                    onDoubleClick={() => setEditing(true)}
                >
                    {value ? (type === "date" ? new Date(value).toLocaleDateString() : value) : "Empty"}
                </span>
            )}
        </div>
    );
};

// Mapping status to colors
const statusColors = {
    "Not Ready": "orange",
    "Waiting for Approval": "blue",
    "Correction": "red",
    "Approved": "green",
};

const CalendarView = () => {
    const { tasks, createTask, updateTask, deleteTaskFromContext } = useContext(TaskContext);
    const [selectedTask, setSelectedTask] = useState(null);

    const handleChange = (field, value) => {
        setSelectedTask({ ...selectedTask, [field]: value });
    };

    const handleSave = () => {
        updateTask(selectedTask._id, selectedTask);
        setSelectedTask(null);
        toast.success("Task updated successfully!");
    };

    const handleDelete = async () => {
        if (!selectedTask?._id) return;

        const confirmDelete = window.confirm("Are you sure you want to delete this task?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`${API_URL}/api/tasks/${selectedTask._id}`);
            deleteTaskFromContext(selectedTask._id);
            setSelectedTask(null);
            toast.success("Task deleted successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete task!");
        }
    };

    return (
        <div>
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                selectable
                editable
                events={tasks.map((task) => ({
                    id: task._id,
                    title: task.title,
                    start: task.start,
                    end: task.end,
                    backgroundColor: statusColors[task.status] || "gray", // set color based on status
                    borderColor: statusColors[task.status] || "gray",
                    textColor: "#fff",
                }))}
                dateClick={(info) => {
                    const clickedDate = new Date(info.dateStr);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (clickedDate < today) {
                        toast.error("You cannot create a task for a past date!");
                        return;
                    }

                    const title = prompt("Write the task title");
                    if (title) {
                        createTask({
                            title,
                            start: info.dateStr,
                            status: "Not Ready",
                            contentType: "Story Hook",
                        });
                        toast.success("Task created successfully!");
                    }
                }}
                eventClick={(info) => {
                    const task = tasks.find((t) => t._id === info.event.id);
                    setSelectedTask(task);
                }}
            />

            <Modal
                isOpen={!!selectedTask}
                onRequestClose={() => setSelectedTask(null)}
                style={{
                    overlay: { backgroundColor: "rgba(0,0,0,0.3)", zIndex: 2000 },
                    content: {
                        top: "50%",
                        left: "50%",
                        right: "auto",
                        bottom: "auto",
                        marginRight: "-50%",
                        transform: "translate(-50%, -50%)",
                        width: "800px",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        zIndex: 2001,
                    },
                }}
            >
                {selectedTask && (
                    <div style={{ padding: "20px" }}>
                        <h2 style={{ marginBottom: "20px", fontSize: "1.5rem" }}>
                            {selectedTask.title || "New Task"}
                        </h2>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "15px 20px",
                            }}
                        >
                            <EditableField
                                label="Title"
                                value={selectedTask.title}
                                onChange={(val) => handleChange("title", val)}
                            />
                            <EditableField
                                label="Content Type"
                                value={selectedTask.contentType}
                                onChange={(val) => handleChange("contentType", val)}
                            />
                            <EditableField
                                label="Publish Date"
                                value={selectedTask.publishDate}
                                type="date"
                                onChange={(val) => handleChange("publishDate", val)}
                            />
                            <EditableField
                                label="Platform"
                                value={selectedTask.platform}
                                onChange={(val) => handleChange("platform", val)}
                            />
                            <EditableField
                                label="Post URL"
                                value={selectedTask.postUrl}
                                onChange={(val) => handleChange("postUrl", val)}
                            />
                            <EditableField
                                label="Post Caption"
                                value={selectedTask.caption}
                                onChange={(val) => handleChange("caption", val)}
                            />
                            <EditableField
                                label="Image URL"
                                value={selectedTask.url}
                                onChange={(val) => handleChange("url", val)}
                            />
                            <EditableField
                                label="Campaign"
                                value={selectedTask.campaign}
                                onChange={(val) => handleChange("campaign", val)}
                            />
                            <EditableField
                                label="Status"
                                value={selectedTask.status}
                                type="select"
                                options={[
                                    "Not Ready",
                                    "Waiting for Approval",
                                    "Correction",
                                    "Approved",
                                ]}
                                onChange={(val) => handleChange("status", val)}
                            />
                        </div>

                        {/* Comments as full-width textarea */}
                        {/* <EditableField label="Comments" value={selectedTask.Comments} onChange={(val) => handleChange("Comments", val)} /> */}


                        {/* Comments as full-width textarea */}
                        <div style={{ marginTop: "15px" }}>
                            <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                                Comments
                            </label>
                            <textarea
                                value={selectedTask.Comments || ""}
                                onChange={(e) => handleChange("Comments", e.target.value)}
                                rows={4}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "6px",
                                    border: "1px solid #ccc",
                                    resize: "vertical",
                                    fontSize: "14px",
                                }}
                                placeholder="Add any comments here..."
                            />
                        </div>

                        {/* Action Buttons */}
                        <div
                            style={{
                                marginTop: "25px",
                                display: "flex",
                                gap: "10px",
                                justifyContent: "flex-end",
                            }}
                        >
                            <button
                                onClick={handleSave}
                                style={{
                                    padding: "10px 20px",
                                    backgroundColor: "#28a745",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                }}
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setSelectedTask(null)}
                                style={{
                                    padding: "10px 20px",
                                    backgroundColor: "#6c757d",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                style={{
                                    padding: "10px 20px",
                                    backgroundColor: "#dc3545",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}

            </Modal>
        </div>
    );
};

export default CalendarView;
