import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Video, MessageSquare, ScreenShare, Plus, ArrowRight, Voicemail } from 'lucide-react';

const avatars = ["👩", "👨", "🧑‍💻", "🧕", "👨‍🚀", "🧙", "🧟", "👤", "😎", "🤖"];

export default function JoinPage() {
  const [activeAction, setActiveAction] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!username.trim() || !roomId.trim()) {
      toast.error("Please enter your name and room ID");
      return;
    }
    navigate(`/room/${roomId.trim()}`, {
      state: { username: username.trim(), avatar: avatar || "👤" },
    });
  };

  const handleCreateRoom = () => {
    if (!username.trim()) {
      toast.error("Please enter your name to create a room");
      return;
    }
    const newRoomId = uuidv4().slice(0, 8);
    navigate(`/room/${newRoomId}`, {
      state: { username: username.trim(), avatar: avatar || "👤" },
    });
  };

  const handleActionClick = (action) => {
    setActiveAction(prevAction => (prevAction === action ? null : action));
  };

  const formVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeInOut" } }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-slate-900 to-black text-gray-200 font-sans overflow-x-hidden relative perspective-1000">
      <MouseFollower />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-0 left-0 w-full p-6 flex items-center"
        >
          <Voicemail className="h-7 w-7 text-blue-400 mr-3" />
          <h1 className="text-2xl font-bold text-white">Node Call</h1>
        </motion.header>

        <main className="w-full max-w-5xl mx-auto flex flex-col items-center pt-24 pb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center my-12 sm:my-16"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
              Connect with anyone, anywhere
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
              Create private video rooms, chat with friends, and share your screen seamlessly
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
            <FeatureCard icon={<Video size={32} />} title="HD Video Calls" description="Crystal clear video quality" delay={0.3} />
            <FeatureCard icon={<MessageSquare size={32} />} title="Real-time Chat" description="Send messages and share files" delay={0.4} />
            <FeatureCard icon={<ScreenShare size={32} />} title="Screen Sharing" description="Present and collaborate" delay={0.5} />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="w-full max-w-md mb-6 flex flex-col gap-4"
          >
            <input
              type="text"
              placeholder="Your Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/10 text-white placeholder-gray-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white/20 transition duration-200"
            />
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Choose Avatar (optional)</label>
              <div className="flex flex-wrap gap-2">
                {avatars.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setAvatar(icon)}
                    className={`text-xl p-2 rounded-xl transition-all ${
                      avatar === icon
                        ? "bg-blue-600 text-white scale-110"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-16">
            <ActionCard icon={<Plus size={40} />} title="Create Room" description="Start a new video call" delay={0.7} onClick={() => handleActionClick('create')} isActive={activeAction === 'create'}>
              <motion.div variants={formVariants} initial="initial" animate="animate" exit="exit">
                <button onClick={handleCreateRoom} className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold tracking-wide text-lg shadow-md hover:shadow-xl transition duration-300">
                  ✨ Create New Room
                </button>
              </motion.div>
            </ActionCard>
            <ActionCard icon={<ArrowRight size={40} />} title="Join Room" description="Enter a room ID to join" delay={0.8} onClick={() => handleActionClick('join')} isActive={activeAction === 'join'}>
              <motion.div variants={formVariants} initial="initial" animate="animate" exit="exit" className="w-full flex flex-col gap-3 mt-4">
                <input
                  type="text"
                  placeholder="Enter Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/10 text-white placeholder-gray-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white/20 transition duration-200"
                />
                <button onClick={handleJoin} className="py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-semibold tracking-wide text-lg shadow-md hover:shadow-xl transition duration-300">
                  🔗 Join Room
                </button>
              </motion.div>
            </ActionCard>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-4xl">
            <StatItem value="10K+" label="Active Users" delay={0.9} />
            <StatItem value="50K+" label="Rooms Created" delay={1.0} />
            <StatItem value="99.9%" label="Uptime" delay={1.1} />
            <StatItem value="24/7" label="Support" delay={1.2} />
          </div>
        </main>
      </div>
    </div>
  );
}

// --- Reusable Animation Components ---

const TiltCard = ({ children, className, ...rest }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const ySpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(ySpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(xSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const { width, height, left, top } = rect;
    const mouseX = e.clientX - left;
    const mouseY = e.clientY - top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ scale: 1.03 }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

const FeatureCard = ({ icon, title, description, delay }) => (
  <TiltCard
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center shadow-lg cursor-pointer"
  >
    <div style={{ transform: "translateZ(40px)" }} className="mb-4 text-blue-400">{icon}</div>
    <h3 style={{ transform: "translateZ(30px)" }} className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p style={{ transform: "translateZ(20px)" }} className="text-sm text-gray-400">{description}</p>
  </TiltCard>
);

const ActionCard = ({ icon, title, description, delay, children, onClick, isActive }) => (
  <TiltCard
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    onClick={onClick}
    layout
    className={`bg-white/5 backdrop-blur-sm p-8 rounded-2xl border ${isActive ? 'border-blue-400' : 'border-white/10'} flex flex-col items-center text-center shadow-lg cursor-pointer hover:border-white/20 transition-all duration-300 group`}
  >
    <motion.div style={{ transform: "translateZ(50px)" }} className={`mb-4 ${isActive ? 'text-blue-400' : 'text-gray-300'} group-hover:text-blue-400 transition-colors duration-300`}>
      {icon}
    </motion.div>
    <motion.h3 style={{ transform: "translateZ(40px)" }} className="text-xl font-bold text-white mb-2">{title}</motion.h3>
    <motion.p style={{ transform: "translateZ(30px)" }} className="text-sm text-gray-400 mb-4">{description}</motion.p>
    <AnimatePresence>
      {isActive && <div className="w-full" onClick={(e) => e.stopPropagation()}>{children}</div>}
    </AnimatePresence>
  </TiltCard>
);

const StatItem = ({ value, label, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="text-center"
  >
    <p className="text-3xl sm:text-4xl font-bold text-white">{value}</p>
    <p className="text-sm text-gray-400">{label}</p>
  </motion.div>
);

const MouseFollower = () => {
  const mouse = { x: useMotionValue(0), y: useMotionValue(0) };
  const smoothMouse = {
    x: useSpring(mouse.x, { damping: 20, stiffness: 200, mass: 0.3 }),
    y: useSpring(mouse.y, { damping: 20, stiffness: 200, mass: 0.3 })
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouse.x.set(e.clientX);
      mouse.y.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <motion.div
      style={{ left: smoothMouse.x, top: smoothMouse.y }}
      className="hidden md:block fixed w-64 h-64 bg-blue-400/25 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"
    />
  );
};
