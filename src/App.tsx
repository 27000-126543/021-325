import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import FormPage from "@/pages/FormPage";
import PreviewPage from "@/pages/PreviewPage";
import EditPage from "@/pages/EditPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/edit" element={<EditPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
