
import React, { useRef } from 'react';
import { Link } from 'https://esm.sh/react-router-dom';
import { motion, useScroll, useTransform, useMotionValue } from 'https://esm.sh/framer-motion';
import Button from '../components/common/Button';
import { 
    LightBulbIcon, BrainCircuitIcon, RocketLaunchIcon, 
    ChatBubbleLeftRightIcon, BookOpenIcon, HistoricalChatIcon, 
    QuestIcon, LearningPathIcon, CheckBadgeIcon, SparklesIcon,
    ArrowRightIcon, GavelIcon, BeakerIcon
} from '../components/icons';

const HomePage: React.FC = () => {
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 z-0">
         <div className="absolute inset-0 bg-grid-slate [mask-image:linear-gradient(0deg,transparent,black)] pointer-events-none" />
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
         <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-32 lg:pt-40 lg:pb-48 px-4">
        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-left relative z-20"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-700 backdrop-blur-sm text-sm text-violet-300 mb-6">
                    <SparklesIcon className="w-4 h-4 text-orange-400" />
                    <span className="font-semibold">The Future of Education is Here</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6">
                    Master Any Subject <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 animate-text-gradient">
                        In Seconds.
                    </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-xl leading-relaxed">
                    StuBro AI isn't just a tool; it's your <span className="text-slate-200 font-semibold">unfair advantage</span>. Turn boring notes into interactive games, vivid mind maps, and intense debates.
                </p>
                <div className="flex flex-wrap gap-4">
                    <Link to="/signup">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all flex items-center gap-2"
                        >
                            Start Learning Free <ArrowRightIcon className="w-5 h-5" />
                        </motion.button>
                    </Link>
                    <a href="#features">
                        <motion.button 
                             whileHover={{ scale: 1.05 }}
                             whileTap={{ scale: 0.95 }}
                             className="px-8 py-4 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-200 font-bold text-lg hover:bg-slate-800 transition-all backdrop-blur-md"
                        >
                            Explore Tools
                        </motion.button>
                    </a>
                </div>
                
                <div className="mt-10 flex items-center gap-4 text-sm text-slate-500">
                     <div className="flex -space-x-3">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center overflow-hidden">
                                <span className="text-xs">🎓</span>
                            </div>
                        ))}
                     </div>
                     <p>Trusted by <span className="text-slate-200 font-bold">10,000+</span> Students</p>
                </div>
            </motion.div>

            {/* 3D Atom Visualization & Floating Cards */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="relative flex justify-center items-center h-[500px] md:h-[600px] w-full perspective-1000"
            >
                {/* The Atom Core */}
                <div className="atom-container transform scale-75 md:scale-100">
                    <div className="atom-core"></div>
                    <div className="electron-ring ring-1"><div className="electron"></div></div>
                    <div className="electron-ring ring-2"><div className="electron"></div></div>
                    <div className="electron-ring ring-3"><div className="electron"></div></div>
                </div>
                
                {/* --- Floating Glass Cards (HUD Elements) --- */}

                {/* 1. Physics Quiz (Top Right) */}
                <motion.div 
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-10 right-0 md:-right-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-700/50 backdrop-blur-xl shadow-2xl w-[180px]"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400"><CheckBadgeIcon className="w-5 h-5" /></div>
                        <span className="font-bold text-sm text-slate-200">Physics Quiz</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-green-500 w-[92%] h-full shadow-[0_0_10px_#22c55e]" />
                    </div>
                    <p className="text-right text-xs text-green-400 mt-1 font-mono">92% Score</p>
                </motion.div>

                {/* 2. Einstein (Bottom Left) */}
                <motion.div 
                    animate={{ y: [0, 20, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-20 left-0 md:-left-8 p-4 rounded-2xl bg-slate-900/60 border border-slate-700/50 backdrop-blur-xl shadow-2xl w-[200px]"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">E</div>
                        <div>
                            <p className="text-sm font-bold text-slate-200">Albert Einstein</p>
                            <p className="text-xs text-slate-400 italic">"Imagination is..."</p>
                        </div>
                    </div>
                </motion.div>

                {/* 3. Chemistry Lab (Top Left) */}
                <motion.div 
                    animate={{ y: [0, -20, 0], x: [0, 5, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute top-0 left-4 md:-left-4 p-3 rounded-2xl bg-slate-900/60 border border-slate-700/50 backdrop-blur-xl shadow-2xl w-[160px]"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400"><BeakerIcon className="w-5 h-5" /></div>
                        <div>
                            <span className="font-bold text-xs text-slate-200 block">Lab Status</span>
                            <span className="text-[10px] text-blue-400 font-mono animate-pulse">Running...</span>
                        </div>
                    </div>
                </motion.div>

                {/* 4. Live Debate (Middle Right) */}
                <motion.div 
                    animate={{ x: [0, -10, 0] }}
                    transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-1/2 right-[-20px] md:-right-12 transform -translate-y-1/2 p-3 rounded-2xl bg-slate-900/60 border border-slate-700/50 backdrop-blur-xl shadow-2xl w-[170px]"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400"><GavelIcon className="w-5 h-5" /></div>
                        <div>
                            <span className="font-bold text-xs text-slate-200 block">Live Debate</span>
                            <span className="text-[10px] text-slate-400">Opponent: <span className="text-red-400 font-bold">Critico AI</span></span>
                        </div>
                    </div>
                </motion.div>

                {/* 5. Study Streak (Bottom Right) */}
                <motion.div 
                    animate={{ y: [0, 15, 0] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    className="absolute bottom-10 right-4 md:right-0 p-3 rounded-2xl bg-slate-900/60 border border-slate-700/50 backdrop-blur-xl shadow-2xl w-[150px]"
                >
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Streak</span>
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                            <SparklesIcon className="w-3 h-3" /> 12 Days
                        </span>
                    </div>
                    <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full ${i < 4 ? 'bg-amber-500 shadow-[0_0_5px_#f59e0b]' : 'bg-slate-700'}`}></div>
                        ))}
                    </div>
                </motion.div>

                {/* 6. Math Integration (Middle Left - NEW) */}
                <motion.div 
                    animate={{ x: [0, 10, 0], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    className="absolute top-1/3 -left-4 md:-left-12 p-3 rounded-xl bg-slate-900/60 border border-violet-500/30 backdrop-blur-md shadow-xl w-[150px] hidden md:block"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-violet-500/20 flex items-center justify-center text-violet-400 font-serif italic font-bold text-xl">∫</div>
                        <div>
                            <span className="font-bold text-xs text-slate-200 block">Calculus</span>
                            <span className="text-[10px] text-violet-400 font-mono">Solving...</span>
                        </div>
                    </div>
                </motion.div>

                {/* 7. DNA Analysis (Bottom Center - NEW) */}
                <motion.div 
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                    className="absolute bottom-[-10px] left-1/3 transform -translate-x-1/2 p-2 rounded-full bg-slate-900/60 border border-emerald-500/30 backdrop-blur-md shadow-xl flex items-center gap-3 pr-4 hidden md:flex"
                >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">🧬</div>
                    <span className="text-xs font-bold text-slate-200">Genetics: 98%</span>
                </motion.div>

                {/* 8. History Artifact (Top Right Center - NEW) */}
                <motion.div 
                    animate={{ rotate: [0, 5, 0, -5, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-16 right-1/3 p-3 rounded-lg bg-slate-900/60 border border-amber-500/30 backdrop-blur-md shadow-xl hidden md:block"
                >
                    <div className="text-center">
                        <span className="text-xs text-amber-500 font-mono font-bold block">1947</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Independence</span>
                    </div>
                </motion.div>

            </motion.div>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="features" className="relative z-10 py-24 px-4 bg-slate-950">
         <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-bold mb-4"><span className="text-violet-400">God-Level</span> Tools</h2>
                <p className="text-slate-400 text-lg">Everything you need to dominate your exams in one dashboard.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                {/* Large Card */}
                <BentoCard 
                    colSpan="md:col-span-2"
                    title="Live Debate Arena"
                    description="Challenge an AI opponent to sharpen your critical thinking. Defend your stance on history, ethics, or science."
                    icon={<GavelIcon className="w-8 h-8 text-white" />}
                    gradient="from-violet-600 to-indigo-600"
                />
                
                {/* Tall Card */}
                <BentoCard 
                    colSpan="md:row-span-2"
                    title="Personalized Learning Path"
                    description="An AI diagnostic engine that finds your weak spots and builds a custom curriculum just for you."
                    icon={<LearningPathIcon className="w-8 h-8 text-white" />}
                    gradient="from-emerald-500 to-teal-600"
                    className="flex flex-col justify-end"
                />
                
                {/* Standard Card */}
                <BentoCard 
                    title="Chapter Conquest"
                    description="Gamify your notes. Turn boring chapters into a 2D RPG adventure."
                    icon={<QuestIcon className="w-8 h-8 text-white" />}
                    gradient="from-orange-500 to-amber-500"
                />
                
                 {/* Standard Card */}
                <BentoCard 
                    title="Visual Explanation"
                    description="Convert text into narrated videos with AI-generated imagery."
                    icon={<RocketLaunchIcon className="w-8 h-8 text-white" />}
                    gradient="from-pink-500 to-rose-500"
                />

                {/* Wide Card */}
                <BentoCard 
                    colSpan="md:col-span-2"
                    title="Historical Chat"
                    description="Don't just read history. Talk to it. Converse with Einstein, Gandhi, or Shakespeare."
                    icon={<HistoricalChatIcon className="w-8 h-8 text-white" />}
                    gradient="from-cyan-500 to-blue-600"
                />
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                 <MiniCard icon={<LightBulbIcon/>} title="Quizzes" />
                 <MiniCard icon={<BrainCircuitIcon/>} title="Mind Maps" />
                 <MiniCard icon={<ChatBubbleLeftRightIcon/>} title="Live Doubts" />
                 <MiniCard icon={<BookOpenIcon/>} title="Papers" />
            </div>
         </div>
      </section>
      
      {/* How It Works - Parallax */}
      <section className="relative py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-violet-950/20 to-slate-950" />
          <div className="container mx-auto px-4 relative z-10">
               <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">How It Works</h2>
               <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
                   <Step number="01" title="Upload" text="Paste notes, upload PDF, or link a YouTube video." />
                   <div className="hidden md:block w-24 h-1 bg-slate-800 rounded-full" />
                   <Step number="02" title="Analyze" text="Our AI breaks it down into concepts and mental models." />
                   <div className="hidden md:block w-24 h-1 bg-slate-800 rounded-full" />
                   <Step number="03" title="Master" text="Use tools like Quizzes, Games, and Debates to learn." />
               </div>
          </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4">
           <div className="container mx-auto max-w-5xl">
               <div className="relative rounded-3xl overflow-hidden p-12 md:p-20 text-center bg-gradient-to-br from-violet-900 via-slate-900 to-slate-900 border border-violet-500/30 shadow-2xl shadow-violet-900/20">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                    
                    <h2 className="relative z-10 text-4xl md:text-6xl font-black text-white mb-6">
                        Ready to become a <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">Academic Weapon?</span>
                    </h2>
                    <p className="relative z-10 text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
                        Join thousands of students who have stopped studying hard and started studying smart. 
                    </p>
                    <Link to="/signup" className="relative z-10 inline-block">
                        <Button size="lg" className="!text-xl !px-10 !py-5 !bg-white !text-violet-900 hover:!bg-slate-200 !border-0 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                            Get Started Now
                        </Button>
                    </Link>
               </div>
           </div>
      </section>

    </div>
  );
};

// Components

const BentoCard = ({ title, description, icon, gradient, colSpan = "", className = "" }: any) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left);
        y.set(e.clientY - rect.top);
    };

    return (
        <motion.div 
            onMouseMove={handleMouseMove}
            whileHover={{ y: -5 }}
            className={`group relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 ${colSpan} ${className}`}
        >
            {/* Spotlight Effect */}
            <motion.div 
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`radial-gradient(650px circle at ${x}px ${y}px, rgba(255,255,255,0.1), transparent 40%)`,
                }}
            />
            
            <div className="relative h-full p-8 flex flex-col z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${gradient} shadow-lg`}>
                    {icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-100 mb-2">{title}</h3>
                <p className="text-slate-400 leading-relaxed">{description}</p>
            </div>

            {/* Decorative Gradient Blur */}
            <div className={`absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-[80px] group-hover:opacity-20 transition duration-500`} />
        </motion.div>
    );
};

const MiniCard = ({ icon, title }: any) => (
    <motion.div whileHover={{ scale: 1.05 }} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
        <div className="text-violet-400 w-8 h-8">{icon}</div>
        <span className="font-bold text-lg text-slate-300">{title}</span>
    </motion.div>
);

const Step = ({ number, title, text }: any) => (
    <div className="text-center max-w-xs">
        <div className="text-6xl font-black text-slate-800 mb-4">{number}</div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400">{text}</p>
    </div>
);

// Helper for template literals in motion style
function useMotionTemplate(strings: TemplateStringsArray, ...values: any[]) {
    return useTransform(values[0], (value: any) => {
        let result = strings[0];
        for (let i = 0; i < values.length; i++) {
            result += values[i].get() + strings[i + 1];
        }
        return result;
    });
}

export default HomePage;
