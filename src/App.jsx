import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import JoinPage from "./pages/Join";
import RoomPage from "./pages/Room";

export default function App() {
  return (
    <>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#333',
          color: '#fff',
        },
      }} />
      <Router>
        <Routes>
          <Route path="/" element={<JoinPage />} />..
          <Route path="/room/:roomId" element={<RoomPage />} />
        </Routes>
      </Router>
    </>
  );
}
