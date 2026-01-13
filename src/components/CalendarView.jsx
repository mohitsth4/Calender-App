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

/* ===================== EditableField ===================== */
const EditableField = ({ label, value, type = "text", options = [], onChange }) => {
    const [editing, setEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value || "");

    const handleSave = () => {
        setEditing(false);
        onChange(tempValue);
    };

    const formatUrlLabel = (url) => {
        try {
            const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
            return parsed.hostname.replace("www.", "");
        } catch {
            return url;
        }
    };

    const isUrl = typeof value === "string" && value.includes(".");

    return (
        <div style={{ marginBottom: "14px" }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>
                {label}
            </label>

            {editing ? (
                type === "select" ? (
                    <select
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={handleSave}
                        autoFocus
                        style={inputStyle}
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
                        style={inputStyle}
                    />
                ) : (
                    <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        autoFocus
                        style={inputStyle}
                    />
                )
            ) : (
                <div
                    onDoubleClick={() => setEditing(true)}
                    style={displayBoxStyle}
                >
                    {value ? (
                        isUrl ? (
                            <a
                                href={value.startsWith("http") ? value : `https://${value}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={linkStyle}
                            >
                                {formatUrlLabel(value)}
                            </a>
                        ) : (
                            value
                        )
                    ) : (
                        <span style={{ color: "#999" }}>Double-click to add</span>
                    )}
                </div>
            )}
        </div>
    );
};

/* ===================== Styles ===================== */
const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
};

const displayBoxStyle = {
    minHeight: "38px",
    padding: "8px 10px",
    borderRadius: "6px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #e0e0e0",
    cursor: "pointer",
};

const linkStyle = {
    color: "#0d6efd",
    fontWeight: 500,
    textDecoration: "underline",
};

/* ===================== Status Colors ===================== */
const statusColors = {
    "Not Ready": "orange",
    "Waiting for Approval": "blue",
    "Correction": "red",
    "Approved": "green",
};

/* ===================== CalendarView ===================== */
const CalendarView = () => {
    const { tasks, createTask, updateTask, deleteTaskFromContext } = useContext(TaskContext);
    const [selectedTask, setSelectedTask] = useState(null);

    const handleChange = (field, value) => {
        setSelectedTask((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        updateTask(selectedTask._id, selectedTask);
        setSelectedTask(null);
        toast.success("Task updated successfully!");
    };

    const handleDelete = async () => {
        if (!selectedTask?._id) return;

        if (!window.confirm("Are you sure you want to delete this task?")) return;

        try {
            await axios.delete(`${API_URL}/api/tasks/${selectedTask._id}`);
            deleteTaskFromContext(selectedTask._id);
            setSelectedTask(null);
            toast.success("Task deleted successfully!");
        } catch {
            toast.error("Failed to delete task!");
        }
    };

    return (
        <div>
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                selectable
                events={tasks.map((task) => ({
                    id: task._id,
                    title: task.title,
                    start: task.start,
                    end: task.end,
                    backgroundColor: statusColors[task.status] || "gray",
                    borderColor: statusColors[task.status] || "gray",
                    textColor: "#fff",
                }))}
                dateClick={(info) => {
                    const title = prompt("Write the task title");
                    if (title) {
                        createTask({
                            title,
                            start: info.dateStr,
                            status: "Not Ready",
                        });
                        toast.success("Task created!");
                    }
                }}
                eventClick={(info) => {
                    const task = tasks.find((t) => t._id === info.event.id);
                    setSelectedTask(task);
                }}
            />

            <Modal isOpen={!!selectedTask} onRequestClose={() => setSelectedTask(null)} style={modalStyle}>
                {selectedTask && (
                    <div>
                        <h2 style={{ marginBottom: "20px" }}>{selectedTask.title}</h2>

                        <div style={gridStyle}>
                            <EditableField label="Title" value={selectedTask.title} onChange={(v) => handleChange("title", v)} />
                            <EditableField label="Platform" value={selectedTask.platform} type="select" options={["Instagram", "Facebook", "LinkedIn"]} onChange={(v) => handleChange("platform", v)} />
                            <EditableField label="Image URL" value={selectedTask.postUrl} onChange={(v) => handleChange("postUrl", v)} />
                            <EditableField label="Post URL" value={selectedTask.url} onChange={(v) => handleChange("url", v)} />
                            <EditableField label="Video URL" value={selectedTask.videourl} onChange={(v) => handleChange("videourl", v)} />
                            <EditableField label="Status" value={selectedTask.status} type="select" options={Object.keys(statusColors)} onChange={(v) => handleChange("status", v)} />
                        </div>

                        <div style={{ marginTop: "15px", width: "780px", }}>
                            <label style={{ fontWeight: 600 }}>Comments</label>
                            <textarea
                                value={selectedTask.Comments || ""}
                                onChange={(e) => handleChange("Comments", e.target.value)}
                                rows={4}
                                style={{ ...inputStyle, resize: "vertical" }}
                            />
                        </div>

                        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button onClick={handleSave} style={btnSave}>Save</button>
                            <button onClick={() => setSelectedTask(null)} style={btnCancel}>Cancel</button>
                            <button onClick={handleDelete} style={btnDelete}>Delete</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

/* ===================== Extra Styles ===================== */
const modalStyle = {
    overlay: {
        backgroundColor: "rgba(0,0,0,0.4)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        position: "relative",
        inset: "unset",
        width: "800px",
        maxHeight: "90vh",
        overflowY: "auto",
        borderRadius: "10px",
        padding: "25px",
    },
};

const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px 20px",
};

const btnSave = { background: "#28a745", color: "#fff", padding: "10px 18px", border: "none", borderRadius: "6px" };
const btnCancel = { background: "#6c757d", color: "#fff", padding: "10px 18px", border: "none", borderRadius: "6px" };
const btnDelete = { background: "#dc3545", color: "#fff", padding: "10px 18px", border: "none", borderRadius: "6px" };

export default CalendarView;
