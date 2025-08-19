import React, { useEffect, useRef, useState } from "react";
import { Send } from 'lucide-react';

export default function ChatBox({ socket, roomId, username }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleMessage = (data) => {
      const timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      setMessages((prev) => [
        ...prev,
        {
          username: data.username,
          message: data.message,
          timestamp,
        },
      ]);
    };

    socket.on("receive-message", handleMessage);

    return () => {
      socket.off("receive-message", handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (message.trim() === "") return;

    socket.emit("send-message", {
      roomId,
      username,
      message,
    });

    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="w-full bg-gray-800 p-4 rounded-lg shadow mt-4">
      <div className="h-64 overflow-y-auto space-y-2 mb-4 pr-2">
        {messages.map((msg, index) => {
          const isSelf = msg.username === username;
          return (
            <div
              key={index}
              className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs break-words px-4 py-2 rounded-lg ${
                  isSelf ? "bg-teal-500 text-white" : "bg-gray-600 text-white"
                }`}
              >
                <div className="font-semibold text-sm mb-1">
                  {isSelf ? "You" : msg.username}
                </div>
                <div className="text-md">{msg.message}</div>
                <div className="text-xs text-gray-200 text-right mt-1">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center bg-gray-700 rounded-lg px-3">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 py-2 px-2 bg-transparent text-white outline-none"
        />
        <button onClick={handleSend} className="text-teal-400 p-2 hover:text-teal-300 transition-colors">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};
