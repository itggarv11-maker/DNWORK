import React, { useEffect, useRef } from 'react';
import { Link } from 'https://esm.sh/react-router-dom';
import Button from '../components/common/Button';
import { 
    AILabAssistantIcon, BookOpenIcon, BrainCircuitIcon, CalendarIcon, ChatBubbleLeftRightIcon,
    ConceptAnalogyIcon, ExamPredictorIcon, GavelIcon, HistoricalChatIcon, LearningPathIcon,
    LightBulbIcon, QuestIcon, RocketLaunchIcon, SparklesIcon, UploadIcon,
    AcademicCapIcon
} from '../components/icons';

const HomePage: React.FC = () => {
    const heroRef = useRef<HTMLElement>(null);

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
      <section ref={heroRef} className="relative text-center pt-8 pb-20 hero-3d-tilt">
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
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Link to="/signup">
                    <Button size="lg" variant="primary" className="text-lg shadow-xl !font-bold w-64">
                        Get Started for Free
                    </Button>
                    </Link>
                </div>
                <p className="text-sm text-slate-500 mt-4">100 free tokens on signup. No credit card required.</p>
            </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10">
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
        <div className="text-center mt-12">
            <p className="font-bold text-violet-700">And 10+ more revolutionary tools waiting for you inside!</p>
        </div>
      </section>
      
       {/* How It Works Section */}
       <section>
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
       
      {/* Testimonials Section */}
      <section>
         <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800">Loved by Students Across India</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-slate-700">
            <TestimonialCard
                quote="The new dashboard is amazing! I can find exactly the tool I need in seconds. The AI Lab Assistant helped me ace my chemistry practicals."
                author="Anjali S., Class 10"
                avatar="👩‍🔬"
            />
            <TestimonialCard
                quote="I was stuck on a complex physics concept, so I used the Concept Analogy Generator. It explained it like a story. It's like having a tutor 24/7."
                author="Rohan M., Class 12"
                avatar="👨‍🚀"
            />
             <TestimonialCard
                quote="The 'What If?' History Explorer is so much fun! It makes me think about history in a completely new way. Highly recommended for all students."
                author="Priya K., Class 9"
                avatar="👩‍🏫"
            />
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="relative bg-gradient-to-r from-violet-600 to-pink-500 rounded-2xl p-12 text-center text-white overflow-hidden">
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

const TestimonialCard = ({ quote, author, avatar }: { quote: string, author: string, avatar: string }) => (
     <div className="bg-white/40 backdrop-blur-lg p-8 rounded-2xl border border-white/30 shadow-lg h-full flex flex-col">
        <p className="italic text-lg flex-grow">"{quote}"</p>
        <div className="flex items-center gap-4 mt-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-2xl">{avatar}</div>
            <div className="font-semibold text-slate-800">{author}</div>
        </div>
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