import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ScreenShare, LogOut, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import ChatBox from '../components/ChatBox';
import TypingIndicator from '../components/TypingIndicator';

const socket = io(import.meta.env.VITE_BACKEND_URL);

export default function RoomPage() {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [avatar, setAvatar] = useState("👤");
    const [remoteUsername, setRemoteUsername] = useState("");
    const [remoteAvatar, setRemoteAvatar] = useState("👤");
    const [isTyping, setIsTyping] = useState(false);
    
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [screenSharer, setScreenSharer] = useState(null);

    const myVideoRef = useRef();
    const remoteVideoRef = useRef();
    const screenShareVideoRef = useRef();
    
    const peerRef = useRef();
    const screenSharePeerRef = useRef();
    const localStreamRef = useRef();
    const screenShareStreamRef = useRef();

    useEffect(() => {
        const name = location?.state?.username;
        const ava = location?.state?.avatar || "👤";

        if (!name) {
            toast.error("Username is required");
            navigate('/');
            return;
        }

        setUsername(name);
        setAvatar(ava);
        socket.emit("join-room", { roomId, username: name, avatar: ava });

        socket.on('current-sharer', (sharerId) => {
            setScreenSharer(sharerId);
        });

    }, [roomId, location.state, navigate]);

    useEffect(() => {
        const setupMediaAndPeer = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = stream;
                }

                socket.on("user-joined", ({ userId, username: remoteUser, avatar: remoteAv }) => {
                    setRemoteUsername(remoteUser);
                    setRemoteAvatar(remoteAv);
                    toast.success(`${remoteUser} joined`);

                    if (peerRef.current) peerRef.current.destroy();

                    const peer = new Peer({ initiator: true, trickle: false, stream });
                    peer.on("signal", (signal) => {
                        socket.emit("send-signal", { userToSignal: userId, signal, username, avatar });
                    });
                    peer.on("stream", (remoteStream) => {
                        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
                    });
                     peer.on("error", (err) => console.error("Peer Error:", err));
                    peerRef.current = peer;
                });

                socket.on("receive-signal", ({ signal, callerId, callerUsername, callerAvatar }) => {
                    setRemoteUsername(callerUsername);
                    setRemoteAvatar(callerAvatar);
                    
                    if (peerRef.current) peerRef.current.destroy();

                    const peer = new Peer({ initiator: false, trickle: false, stream });
                    peer.on("signal", (signalData) => {
                        socket.emit("return-signal", { signal: signalData, callerId });
                    });
                    peer.on("stream", (remoteStream) => {
                        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
                    });
                     peer.on("error", (err) => console.error("Peer Error:", err));
                    peer.signal(signal);
                    peerRef.current = peer;
                });

                socket.on("returned-signal", ({ signal }) => {
                    peerRef.current?.signal(signal);
                });

                socket.on("user-left", () => {
                    toast("User disconnected");
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                    peerRef.current?.destroy();
                    setRemoteUsername("");
                    setRemoteAvatar("👤");
                });

                socket.on("typing", () => setIsTyping(true));
                socket.on("stop-typing", () => setIsTyping(false));

                socket.on('screen-share-started', (sharerId) => {
                    setScreenSharer(sharerId);
                    toast.success('A user started sharing their screen.');
                });

                socket.on('screen-share-stopped', () => {
                    setScreenSharer(null);
                    if(screenShareVideoRef.current) screenShareVideoRef.current.srcObject = null;
                    if(screenSharePeerRef.current) screenSharePeerRef.current.destroy();
                    toast('Screen share stopped.');
                });

            } catch (err) {
                console.error("Error accessing media devices:", err);
                toast.error("Failed to access camera/mic. Please grant permissions.");
            }
        };

        if (username) {
            setupMediaAndPeer();
        }

        return () => {
            socket.off("user-joined");
            socket.off("receive-signal");
            socket.off("returned-signal");
            socket.off("user-left");
            socket.off("typing");
            socket.off("stop-typing");
            socket.off("screen-share-started");
            socket.off("screen-share-stopped");
            socket.off("current-sharer");
            if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
            if (screenShareStreamRef.current) screenShareStreamRef.current.getTracks().forEach(track => track.stop());
            peerRef.current?.destroy();
            screenSharePeerRef.current?.destroy();
        };
    }, [username, avatar, roomId]);

    const startScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            screenShareStreamRef.current = screenStream;
            setIsScreenSharing(true);
            setScreenSharer(socket.id);
            socket.emit('start-screen-share');

            if (screenShareVideoRef.current) {
                screenShareVideoRef.current.srcObject = screenStream;
            }

            screenStream.getVideoTracks()[0].onended = () => {
                stopScreenShare();
            };
        } catch (err) {
            toast.error("Could not start screen share.");
        }
    };

    const stopScreenShare = () => {
        screenShareStreamRef.current.getTracks().forEach(track => track.stop());
        setIsScreenSharing(false);
        setScreenSharer(null);
        socket.emit('stop-screen-share');
        if (screenShareVideoRef.current) {
            screenShareVideoRef.current.srcObject = null;
        }
    };
    
    const toggleMic = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMicMuted(prev => !prev);
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(prev => !prev);
        }
    };
    
    const handleLeaveRoom = () => {
        if (isScreenSharing) {
            stopScreenShare();
        }
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4 py-8">
            <AnimatePresence>
                {screenSharer && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="w-full max-w-6xl mb-6 bg-black rounded-lg shadow-2xl"
                    >
                        <video ref={screenShareVideoRef} autoPlay playsInline className="w-full h-auto rounded-lg" />
                    </motion.div>
                )}
            </AnimatePresence>

            <h2 className="text-xl mb-4 font-semibold">Room ID: <span className="font-mono bg-white/10 px-2 py-1 rounded">{roomId}</span></h2>
            <div className="flex flex-col md:flex-row gap-6 mb-6 w-full max-w-6xl">
                <div className="flex-1 bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col items-center">
                    <p className="text-center mb-2 text-xl">{avatar} {username}</p>
                    <div className="relative w-full">
                        <video ref={myVideoRef} autoPlay muted playsInline className={`w-full h-auto max-h-[300px] rounded-lg border border-gray-700 object-cover bg-black transition-opacity duration-300 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`} />
                        {isVideoOff && <div className="absolute inset-0 bg-black flex items-center justify-center rounded-lg"><VideoOff size={48} className="text-gray-500"/></div>}
                    </div>
                </div>
                <div className="flex-1 bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col items-center">
                    <p className="text-center mb-2 text-xl">{remoteAvatar} {remoteUsername || "Waiting for user..."}</p>
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-auto max-h-[300px] rounded-lg border border-gray-700 object-cover bg-black" />
                </div>
            </div>
             <div className="flex items-center gap-4 mb-6">
                <button onClick={toggleMic} className={`p-3 rounded-full transition-colors duration-200 ${isMicMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}>
                    {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                 <button onClick={toggleVideo} className={`p-3 rounded-full transition-colors duration-200 ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}>
                    {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                </button>
                <button onClick={isScreenSharing ? stopScreenShare : startScreenShare} disabled={!isScreenSharing && !!screenSharer} className={`px-6 py-3 font-semibold rounded-md shadow-md transition duration-200 flex items-center gap-2 ${isScreenSharing ? 'bg-orange-600 hover:bg-orange-700' : 'bg-purple-600 hover:bg-purple-700'} ${!isScreenSharing && !!screenSharer ? 'cursor-not-allowed bg-gray-500' : ''}`}>
                    <ScreenShare size={20} /> {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                </button>
                 <button onClick={handleLeaveRoom} className="p-3 rounded-full transition-colors duration-200 bg-red-600 hover:bg-red-700">
                    <LogOut size={24} />
                </button>
            </div>
            <div className="w-full max-w-5xl mt-6">
                <ChatBox socket={socket} roomId={roomId} username={username} />
                <TypingIndicator username={remoteUsername} />
            </div>
        </div>
    );
};



