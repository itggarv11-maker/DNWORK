
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'https://esm.sh/react-router-dom';
import Button from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { 
    AILabAssistantIcon, BookOpenIcon, BrainCircuitIcon, CalendarIcon, ChatBubbleLeftRightIcon,
    ConceptAnalogyIcon, ExamPredictorIcon, GavelIcon, HistoricalChatIcon, LearningPathIcon,
    LightBulbIcon, QuestIcon, RocketLaunchIcon, SparklesIcon, UploadIcon,
    AcademicCapIcon, ArrowRightIcon, CheckBadgeIcon
} from '../components/icons';
import Spinner from '../components/common/Spinner';

const HomePage: React.FC = () => {
    const heroRef = useRef<HTMLElement>(null);
    const navigate = useNavigate();
    const { currentUser, loading, loginWithGoogle } = useAuth();
    const [authLoading, setAuthLoading] = useState(false);

    useEffect(() => {
        if (!loading && currentUser) {
            navigate('/app', { replace: true });
        }
    }, [currentUser, loading, navigate]);

    const handleGoogleLogin = async () => {
        setAuthLoading(true);
        try {
            await loginWithGoogle();
            navigate('/app');
        } catch (error) {
            console.error(error);
        } finally {
            setAuthLoading(false);
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!heroRef.current) return;
            const { clientX, clientY, currentTarget } = e;
            const { clientWidth, clientHeight, offsetLeft, offsetTop } = currentTarget as HTMLElement;

            const x = clientX - offsetLeft;
            const y = clientY - offsetTop;
            const rotateX = -((y - clientHeight / 2) / (clientHeight / 2)) * 3;
            const rotateY = ((x - clientWidth / 2) / (clientWidth / 2)) * 3;
            
            heroRef.current!.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`;
        };

        const handleMouseLeave = () => {
             if (heroRef.current) {
                heroRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            }
        };

        const target = heroRef.current;
        if(target) {
            target.addEventListener('mousemove', handleMouseMove);
            target.addEventListener('mouseleave', handleMouseLeave);
        }
        
        return () => {
             if (target) {
                target.removeEventListener('mousemove', handleMouseMove);
                target.removeEventListener('mouseleave', handleMouseLeave);
            }
        }
    }, []);

  return (
    <div className="space-y-16 md:space-y-24 overflow-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="relative text-center pt-8 pb-20 hero-3d-tilt transition-transform duration-200">
        <div className="globe-container">
            <div className="globe"></div>
        </div>

        <div className="relative z-10" style={{ transformStyle: 'preserve-3d' }}>
            <div className="relative inline-block" style={{ transform: 'translateZ(50px)' }}>
                <h1 className="relative text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight p-4" style={{ textShadow: '0px 4px 15px rgba(0,0,0,0.1)' }}>
                    Your Personal AI <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500">Study Companion</span>
                </h1>
            </div>

            <div className="relative mt-6" style={{ transform: 'translateZ(20px)' }}>
                <p className="text-xl md:text-2xl text-slate-700 font-medium max-w-3xl mx-auto">
                    From complex concepts to exam prep, StuBro AI turns your study material into interactive quizzes, summaries, mind maps, and more.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/signup">
                        <Button size="lg" variant="primary" className="text-lg shadow-xl !font-bold w-64 h-16">
                            Start Free Journey
                        </Button>
                    </Link>
                    
                    <button 
                        onClick={handleGoogleLogin}
                        disabled={authLoading}
                        className="w-64 h-16 bg-white border border-slate-300 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-lg group"
                    >
                        {authLoading ? <Spinner colorClass="bg-violet-600" /> : (
                            <>
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"/>
                                </svg>
                                <span className="text-base font-bold text-slate-700">Continue with Google</span>
                            </>
                        )}
                    </button>
                </div>
                <p className="text-sm text-slate-500 mt-6">Invite Key Required for Signup &bull; High Performance Guaranteed</p>
            </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800">A Smarter Way to Learn</h2>
          <p className="mt-4 text-lg text-slate-600">All the tools you need, supercharged with AI.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-slate-800">
          <FeatureCard 
            icon={<LightBulbIcon className="h-8 w-8" />}
            title="Advanced Quizzes"
            description="Generate mixed-type quizzes and get detailed feedback on written or spoken answers."
          />
           <FeatureCard 
            icon={<BrainCircuitIcon className="h-8 w-8" />}
            title="Interactive Mind Maps"
            description="Visualize complex topics with AI-generated mind maps to connect ideas easily."
          />
           <FeatureCard 
            icon={<RocketLaunchIcon className="h-8 w-8" />}
            title="AI Career Guidance"
            description="Discover personalized career paths, exam roadmaps, and college suggestions."
          />
           <FeatureCard 
            icon={<ChatBubbleLeftRightIcon className="h-8 w-8" />}
            title="Talk to Teacher"
            description="Practice for exams with an AI that listens and replies in a live voice conversation."
          />
          <FeatureCard 
            icon={<BookOpenIcon className="h-8 w-8" />}
            title="Question Paper Tool"
            description="Create custom exam papers from your notes and get them graded instantly by AI."
          />
          <FeatureCard 
            icon={<HistoricalChatIcon className="h-8 w-8" />}
            title="Chat with History"
            description="Converse with historical figures like Einstein to understand their perspectives."
          />
          <FeatureCard 
            icon={<QuestIcon className="h-8 w-8" />}
            title="Chapter Conquest"
            description="Play a 2D adventure game based on your chapter to make learning fun and interactive."
          />
          <FeatureCard 
            icon={<LearningPathIcon className="h-8 w-8" />}
            title="Personalized Learning Path"
            description="Take a diagnostic quiz and get a custom study plan that focuses on your weak areas."
          />
        </div>
      </section>
      
       {/* How It Works Section */}
       <section className="px-4">
         <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800">3 Simple Steps to Success</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
            <HowItWorksStep
                icon={<UploadIcon className="h-12 w-12 text-violet-600" />}
                step="1"
                title="Provide Content"
                description="Start a new session by pasting text, uploading a file, using a YouTube link, or searching for any chapter."
            />
            <HowItWorksStep
                icon={<AcademicCapIcon className="h-12 w-12 text-pink-600" />}
                step="2"
                title="Choose Your Tool"
                description="Select from a huge library of AI tools from your personal dashboard, categorized for easy access."
            />
             <HowItWorksStep
                icon={<SparklesIcon className="h-12 w-12 text-amber-600" />}
                step="3"
                title="Learn Instantly"
                description="Receive your tailor-made study materials in seconds, ready to help you master any topic."
            />
        </div>
       </section>

      {/* Final CTA */}
      <section className="relative bg-gradient-to-r from-violet-600 to-pink-500 rounded-2xl p-12 text-center text-white overflow-hidden mx-4">
         <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full"></div>
         <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full"></div>
         <div className="relative z-10">
            <h2 className="text-4xl font-bold">Ready to Ace Your Exams?</h2>
            <p className="mt-4 text-lg max-w-xl mx-auto text-violet-100">Join thousands of students who are learning smarter with their personal AI tutor.</p>
            <Link to="/signup" className="mt-8 inline-block">
                <Button size="lg" className="!bg-white !text-violet-700 !font-bold hover:!bg-gray-100">
                    Sign Up Now - It's Free!
                </Button>
            </Link>
         </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="bg-white/40 backdrop-blur-lg p-8 rounded-2xl border border-white/30 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 h-full group">
        <div className="mx-auto bg-white/60 text-violet-600 rounded-full h-16 w-16 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-white">
          {icon}
        </div>
        <h3 className="mt-4 text-xl font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-slate-700">
          {description}
        </p>
    </div>
);

const HowItWorksStep = ({ icon, step, title, description }: { icon: React.ReactNode, step: string, title: string, description: string }) => (
    <div className="bg-white/40 backdrop-blur-lg p-8 rounded-2xl border border-white/30 shadow-lg">
        <div className="relative mx-auto bg-white rounded-full h-24 w-24 flex items-center justify-center mb-4 border-2 border-slate-200">
            {icon}
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-slate-800 text-white font-bold text-lg rounded-full flex items-center justify-center border-4 border-white">
                {step}
            </div>
        </div>
        <h3 className="text-2xl font-semibold text-slate-800 mt-1">{title}</h3>
        <p className="text-slate-600 mt-2">{description}</p>
    </div>
);

export default HomePage;
