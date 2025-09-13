# Node-Call Frontend

This is the frontend for the Node-Call video chat application, built with React and Vite. It provides a modern, animated user interface for joining video rooms, engaging in live video/audio calls, screen sharing, and real-time chat.

---

## Live Demo 🚀

You can test the live application here:

**[Click Here for live demo!](https://node-call-sigma.vercel.app)**


---

## Features

-   **Modern UI:** A sleek, dark-themed interface with 3D card animations powered by Framer Motion.
-   **Room Creation & Joining:** Users can create new private rooms or join existing ones with a Room ID.
-   **Avatar Selection:** A fun selection of avatars for user personalization.
-   **Real-time Video/Audio:** High-quality, peer-to-peer video and audio calls using WebRTC (`simple-peer`).
-   **Media Controls:** In-call controls to mute/unmute the microphone and turn the camera on/off.
-   **Screen Sharing:** Robust screen sharing functionality that displays the shared screen in a dedicated view.
-   **Live Chat:** A fully functional chat box for sending and receiving messages in real-time.
-   **Typing Indicator:** Shows when the other user is typing a message.
-   **Responsive Design:** The layout is designed to work smoothly on both desktop and mobile devices.

---

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v14 or later recommended)
-   [npm](https://www.npmjs.com/)
-   A running instance of the [Node-Call Backend Server](<https://github.com/vishwas-11/Node-Call-v.1.2>).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <your-frontend-folder>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    -   Create a new file in the root of your project named `.env`.
    -   Add the following line to it, pointing to your local backend server:
        ```
        VITE_BACKEND_URL=http://localhost:3000
        ```

### Running the Development Server

-   Start the Vite development server:
    ```bash
    npm run dev
    ```
-   Open your browser and navigate to `http://localhost:5173`.

---

## Project Structure

The project is structured into pages and components for clarity and maintainability.

/src├── /components│   ├── ChatBox.jsx│   └── TypingIndicator.jsx├── /pages│   ├── Join.jsx      # The landing page for creating/joining rooms│   └── Room.jsx      # The main video call and chat interface└── App.jsx           # Main application component with routing
-   **`App.jsx`**: The root of the application. It sets up `react-router-dom` to handle navigation between the `Join` and `Room` pages.
-   **`pages/Join.jsx`**: Contains the UI and logic for the landing page, including the animated cards, input fields for username and Room ID, and avatar selection.
-   **`pages/Room.jsx`**: The core of the application. It manages the WebRTC peer connections, handles all Socket.IO events for signaling and chat, and renders the video feeds and media controls.
-   **`components/`**: Contains reusable components like the `ChatBox` and `TypingIndicator` that are used within the `Room` page.

---

## Deployment

This application is configured for easy deployment to services like Vercel or Netlify.

### Environment Variables

Before deploying, you must set the `VITE_BACKEND_URL` environment variable in your deployment provider's settings.

-   **Variable Name:** `VITE_BACKEND_URL`
-   **Value:** The public URL of your deployed backend server (e.g., `https://your-backend-name.onrender.com`).

This ensures that your deployed frontend can communicate with your live backend server.

### Main Dependencies

-   **`react`**: For building the user interface.
-   **`react-router-dom`**: For handling client-side routing.
-   **`socket.io-client`**: For real-time communication with the backend server.
-   **`simple-peer`**: A wrapper for WebRTC to simplify peer-to-peer connections.
-   **`framer-motion`**: For creating smooth, declarative animations.
-   **`lucide-react`**: For clean and modern icons.
-   **`react-hot-toast`**: For user-friendly notifications.
-   **`vite`**: As the build tool and development server.
