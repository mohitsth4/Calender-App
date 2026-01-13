import { TaskProvider } from "./context/TaskContext";
import CalendarPage from "./pages/CalendarPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <TaskProvider>
      <CalendarPage />

      <ToastContainer
        position="top-right"       // position of toast
        autoClose={3000}           // auto hide after 3 seconds
        hideProgressBar={false}    // show progress bar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </TaskProvider>
  );
}

export default App;
