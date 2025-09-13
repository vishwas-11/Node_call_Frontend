import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ScreenShare, LogOut, Mic, MicOff, Video, VideoOff, Monitor, MonitorOff } from 'lucide-react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import ChatBox from '../components/ChatBox';
import TypingIndicator from '../components/TypingIndicator';


if (typeof window !== 'undefined' && !window.process) {
    window.process = {
        nextTick: (callback, ...args) => {
            setTimeout(() => callback(...args), 0);
        },
        env: {},
        platform: 'browser',
        version: '',
        versions: { node: '' }
    };
}

const socket = io(import.meta.env.VITE_BACKEND_URL);

export default function RoomPage() {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [avatar, setAvatar] = useState("👤");
    const [remoteUsername, setRemoteUsername] = useState("");
    const [remoteAvatar, setRemoteAvatar] = useState("👤");
    const [remoteUserId, setRemoteUserId] = useState(null); // Add this missing state
    const [isTyping, setIsTyping] = useState(false);
    
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // Enhanced screen sharing state
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [screenSharerInfo, setScreenSharerInfo] = useState(null);

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

    }, [roomId, location.state, navigate]);

    useEffect(() => {
        const setupMediaAndPeer = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = stream;
                }

                // Regular video call handlers
                socket.on("user-joined", ({ userId, username: remoteUser, avatar: remoteAv }) => {
                    setRemoteUsername(remoteUser);
                    setRemoteAvatar(remoteAv);
                    setRemoteUserId(userId); // Set the remote user ID
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
                    setRemoteUserId(callerId); // Set the remote user ID
                    
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
                    setRemoteUserId(null); // Clear remote user ID
                });

                // Chat handlers
                socket.on("typing", () => setIsTyping(true));
                socket.on("stop-typing", () => setIsTyping(false));

                // Enhanced screen sharing handlers
                socket.on('screen-share-started', ({ sharerId, sharerUsername }) => {
                    console.log(`Screen sharing started by ${sharerUsername} (${sharerId})`);
                    
                    setScreenSharerInfo({
                        id: sharerId,
                        username: sharerUsername,
                        isLocal: sharerId === socket.id
                    });

                    if (sharerId === socket.id) {
                        // This is confirmation for local user
                        setIsScreenSharing(true);
                        toast.success('You started sharing your screen');
                    } else {
                        // Someone else is sharing
                        toast.success(`${sharerUsername} started sharing their screen`);
                        // Set up peer connection to receive their screen share
                        setupScreenShareReceiver(sharerId);
                    }
                });

                socket.on('screen-share-stopped', ({ stoppedBy, stoppedByUsername, reason }) => {
                    console.log(`Screen sharing stopped by ${stoppedByUsername}`, reason);
                    
                    // Clean up screen share
                    if (screenShareVideoRef.current) {
                        screenShareVideoRef.current.srcObject = null;
                    }
                    
                    if (screenSharePeerRef.current) {
                        screenSharePeerRef.current.destroy();
                        screenSharePeerRef.current = null;
                    }

                    setScreenSharerInfo(null);
                    
                    if (stoppedBy === socket.id) {
                        setIsScreenSharing(false);
                        toast('You stopped sharing your screen');
                    } else {
                        toast(`${stoppedByUsername} stopped sharing their screen`);
                    }
                });

                socket.on('screen-share-error', ({ error }) => {
                    console.error('Screen sharing error:', error);
                    toast.error(error);
                });

                socket.on('screen-share-started-confirm', ({ success, sharerId }) => {
                    if (success && sharerId === socket.id) {
                        console.log('Screen sharing confirmed by server');
                    }
                });

                // Screen sharing WebRTC signals (for receiving screen share)
                socket.on('screen-share-signal', async ({ from, signal, type }) => {
                    console.log(`Received screen share signal from ${from}, type: ${type}`);
                    
                    if (!screenSharePeerRef.current) {
                        console.error('No screen share peer connection found');
                        return;
                    }

                    try {
                        if (type === 'offer') {
                            await screenSharePeerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
                            const answer = await screenSharePeerRef.current.createAnswer();
                            await screenSharePeerRef.current.setLocalDescription(answer);
                            
                            socket.emit('screen-share-signal-response', {
                                to: from,
                                from: socket.id,
                                signal: answer,
                                type: 'answer'
                            });
                        } else if (type === 'ice-candidate') {
                            await screenSharePeerRef.current.addIceCandidate(new RTCIceCandidate(signal));
                        }
                    } catch (error) {
                        console.error('Error handling screen share signal:', error);
                    }
                });

                socket.on('screen-share-signal-response', async ({ from, signal, type }) => {
                    console.log(`Received screen share response from ${from}, type: ${type}`);
                    
                    if (!screenSharePeerRef.current) {
                        console.error('No screen share peer connection found');
                        return;
                    }

                    try {
                        if (type === 'answer') {
                            await screenSharePeerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
                        } else if (type === 'ice-candidate') {
                            await screenSharePeerRef.current.addIceCandidate(new RTCIceCandidate(signal));
                        }
                    } catch (error) {
                        console.error('Error handling screen share response:', error);
                    }
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
            // Clean up socket listeners
            socket.off("user-joined");
            socket.off("receive-signal");
            socket.off("returned-signal");
            socket.off("user-left");
            socket.off("typing");
            socket.off("stop-typing");
            socket.off("screen-share-started");
            socket.off("screen-share-stopped");
            socket.off("screen-share-error");
            socket.off("screen-share-started-confirm");
            socket.off("screen-share-signal");
            socket.off("screen-share-signal-response");
            
            // Clean up streams and peers
            if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
            if (screenShareStreamRef.current) screenShareStreamRef.current.getTracks().forEach(track => track.stop());
            peerRef.current?.destroy();
            screenSharePeerRef.current?.destroy();
        };
    }, [username, avatar, roomId]);

    // Set up peer connection to receive screen share from another user
    const setupScreenShareReceiver = (sharerId) => {
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        peer.ontrack = (event) => {
            console.log('Received screen share stream');
            const [remoteStream] = event.streams;
            if (screenShareVideoRef.current) {
                screenShareVideoRef.current.srcObject = remoteStream;
            }
        };

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('screen-share-signal-response', {
                    to: sharerId,
                    from: socket.id,
                    signal: event.candidate,
                    type: 'ice-candidate'
                });
            }
        };

        peer.onerror = (error) => {
            console.error('Screen share peer error:', error);
        };

        screenSharePeerRef.current = peer;
    };

    const startScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
                video: {
                    mediaSource: 'screen',
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 },
                    frameRate: { ideal: 30, max: 60 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            
            screenShareStreamRef.current = screenStream;

            // Display locally in the screen share window
            if (screenShareVideoRef.current) {
                screenShareVideoRef.current.srcObject = screenStream;
            }

            // Handle when user stops sharing via browser UI
            screenStream.getVideoTracks()[0].onended = () => {
                stopScreenShare();
            };

            // Emit to server
            socket.emit('start-screen-share');

            // Set up WebRTC peer connection to share screen with other users
            if (remoteUserId) { // Now this variable exists
                console.log(`Setting up screen share peer connection with user: ${remoteUserId}`);
                const peer = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                });

                // Add screen stream to peer connection
                screenStream.getTracks().forEach(track => {
                    peer.addTrack(track, screenStream);
                });

                peer.onicecandidate = (event) => {
                    if (event.candidate) {
                        console.log(`Sending ICE candidate to ${remoteUserId}`);
                        socket.emit('screen-share-signal', {
                            to: remoteUserId,
                            from: socket.id,
                            signal: event.candidate,
                            type: 'ice-candidate'
                        });
                    }
                };

                peer.onerror = (error) => {
                    console.error('Screen share peer connection error:', error);
                };

                // Create and send offer
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                
                console.log(`Sending screen share offer to ${remoteUserId}`);
                socket.emit('screen-share-signal', {
                    to: remoteUserId,
                    from: socket.id,
                    signal: offer,
                    type: 'offer'
                });

                screenSharePeerRef.current = peer;
            } else {
                console.log('No remote user to share screen with yet');
            }

        } catch (err) {
            console.error("Error starting screen share:", err);
            if (err.name === 'NotAllowedError') {
                toast.error("Screen sharing permission denied. Please allow screen sharing and try again.");
            } else if (err.name === 'NotSupportedError') {
                toast.error("Screen sharing is not supported in this browser.");
            } else {
                toast.error("Could not start screen share. Please try again.");
            }
        }
    };

    const stopScreenShare = () => {
        // Stop all tracks in the screen share stream
        if (screenShareStreamRef.current) {
            screenShareStreamRef.current.getTracks().forEach(track => track.stop());
            screenShareStreamRef.current = null;
        }

        // Clear the screen share video
        if (screenShareVideoRef.current) {
            screenShareVideoRef.current.srcObject = null;
        }

        // Close peer connection
        if (screenSharePeerRef.current) {
            screenSharePeerRef.current.close();
            screenSharePeerRef.current = null;
        }

        // Emit to server
        socket.emit('stop-screen-share');
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
        <div className="min-h-screen bg-gray-900 text-white flex flex-col px-4 py-8">
            {/* Room Header */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">
                        Room ID: <span className="font-mono bg-white/10 px-2 py-1 rounded">{roomId}</span>
                    </h2>
                    
                    {/* Controls */}
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={toggleMic} 
                            className={`p-3 rounded-full transition-colors duration-200 ${
                                isMicMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                            }`}
                        >
                            {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>
                        
                        <button 
                            onClick={toggleVideo} 
                            className={`p-3 rounded-full transition-colors duration-200 ${
                                isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                            }`}
                        >
                            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                        </button>
                        
                        <button 
                            onClick={isScreenSharing ? stopScreenShare : startScreenShare} 
                            disabled={!isScreenSharing && !!screenSharerInfo} 
                            className={`px-6 py-3 font-semibold rounded-md shadow-md transition duration-200 flex items-center gap-2 ${
                                isScreenSharing 
                                    ? 'bg-blue-600 hover:bg-blue-700' 
                                    : 'bg-purple-600 hover:bg-purple-700'
                            } ${
                                !isScreenSharing && !!screenSharerInfo 
                                    ? 'cursor-not-allowed bg-gray-500 opacity-50' 
                                    : ''
                            }`}
                        >
                            {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
                            {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                        </button>
                        
                        <button 
                            onClick={handleLeaveRoom} 
                            className="p-3 rounded-full transition-colors duration-200 bg-red-600 hover:bg-red-700"
                        >
                            <LogOut size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Screen Share Section */}
            <AnimatePresence>
                {screenSharerInfo && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">
                                Screen Share - {screenSharerInfo.username}
                                {screenSharerInfo.isLocal && " (Your Screen)"}
                            </h3>
                            {screenSharerInfo.isLocal && (
                                <button
                                    onClick={stopScreenShare}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <MonitorOff size={16} />
                                    Stop Sharing
                                </button>
                            )}
                        </div>
                        
                        <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
                            <video 
                                ref={screenShareVideoRef} 
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-contain"
                            />
                            
                            {/* Loading placeholder */}
                            {!screenSharerInfo.isLocal && (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    <div className="text-center">
                                        <Monitor size={48} className="mx-auto mb-2 animate-pulse" />
                                        <p>Loading screen share...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Video Call Section */}
            <div className="flex flex-col md:flex-row gap-6 mb-6">
                {/* Local Video */}
                <div className="flex-1 bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col items-center">
                    <p className="text-center mb-2 text-xl">{avatar} {username}</p>
                    <div className="relative w-full">
                        <video 
                            ref={myVideoRef} 
                            autoPlay 
                            muted 
                            playsInline 
                            className={`w-full h-auto max-h-[300px] rounded-lg border border-gray-700 object-cover bg-black transition-opacity duration-300 ${
                                isVideoOff ? 'opacity-0' : 'opacity-100'
                            }`} 
                        />
                        {isVideoOff && (
                            <div className="absolute inset-0 bg-black flex items-center justify-center rounded-lg">
                                <VideoOff size={48} className="text-gray-500"/>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Remote Video */}
                <div className="flex-1 bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col items-center">
                    <p className="text-center mb-2 text-xl">{remoteAvatar} {remoteUsername || "Waiting for user..."}</p>
                    <div className="relative w-full">
                        <video 
                            ref={remoteVideoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-auto max-h-[300px] rounded-lg border border-gray-700 object-cover bg-black" 
                        />
                        {!remoteUsername && (
                            <div className="absolute inset-0 bg-gray-700 flex items-center justify-center rounded-lg">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">👤</div>
                                    <div className="text-sm text-gray-400">Waiting for user...</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* No Screen Share State */}
            {!screenSharerInfo && (
                <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400 mb-6">
                    <Monitor size={48} className="mx-auto mb-4" />
                    <p className="text-lg mb-2">No screen sharing active</p>
                    <p className="text-sm">Click the "Share Screen" button to start sharing your screen</p>
                </div>
            )}

            {/* Chat Section */}
            <div className="w-full max-w-5xl mx-auto mt-auto">
                <ChatBox socket={socket} roomId={roomId} username={username} />
                <TypingIndicator isTyping={isTyping} username={remoteUsername} />
            </div>
        </div>
    );
};