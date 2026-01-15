
import React, { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'https://esm.sh/react-router-dom';
import { Canvas, useFrame, useThree } from 'https://esm.sh/@react-three/fiber';
import { 
    OrbitControls, Stars, Float, Text, MeshDistortMaterial, 
    Environment, ContactShadows, PresentationControls, MeshTransmissionMaterial 
} from 'https://esm.sh/@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion';
import { useContent } from '../contexts/ContentContext';
import * as geminiService from '../services/geminiService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { BeakerIcon, SparklesIcon, ArrowRightIcon, AcademicCapIcon, RocketLaunchIcon } from '../components/icons';

const DigitalLabPage: React.FC = () => {
    const { extractedText, subject } = useContent();
    const [experiment, setExperiment] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initializeLab = async () => {
        if (!extractedText) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await geminiService.generateSimulationExperiment(extractedText);
            setExperiment(data);
        } catch (err) {
            setError("Neural link to simulation failed. Ensure you have Science content loaded.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (extractedText && (subject === 'Science (General)' || subject === 'Physics' || subject === 'Chemistry' || subject === 'Biology')) {
            initializeLab();
        }
    }, [extractedText]);

    if (!extractedText) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-6">
                <Card variant="dark" className="max-w-xl text-center !p-12 border-slate-800">
                    <div className="w-20 h-20 bg-violet-600/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-violet-500/30 shadow-[0_0_30px_rgba(124,58,237,0.2)]">
                        <BeakerIcon className="w-10 h-10 text-violet-400" />
                    </div>
                    <h2 className="text-4xl font-black mb-4">Awaiting Signal</h2>
                    <p className="text-slate-400 mb-10 leading-relaxed text-lg">Digital Lab requires an active Science data-stream. Please initialize a new session with your Science notes.</p>
                    <Link to="/new-session">
                        <Button size="lg" className="w-full h-16 !text-xl shadow-[0_0_40px_rgba(124,58,237,0.3)]">INITIALIZE DATA STREAM</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6">
                <Spinner className="w-16 h-16" colorClass="bg-cyan-500" />
                <p className="text-2xl font-black tracking-tighter uppercase animate-pulse">Designing Reality Simulation...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-slate-950 text-white relative">
            <div className="fixed inset-0 z-0 opacity-40">
                <Canvas camera={{ position: [0, 5, 10], fov: 45 }}>
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                </Canvas>
            </div>

            <div className="relative z-10 p-6 md:p-12 lg:p-20">
                {experiment ? (
                    <SimulationActive experiment={experiment} />
                ) : (
                    <div className="max-w-3xl mx-auto text-center">
                         <h2 className="text-red-400 font-bold mb-4">{error || "Simulation Error"}</h2>
                         <Button onClick={initializeLab} variant="secondary">Retry Calibration</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

const SimulationActive = ({ experiment }: { experiment: any }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [actionLog, setActionLog] = useState<string[]>(["Reality Core Synced.", `Active: ${experiment.title}`]);
    const [progress, setProgress] = useState(0);

    const performAction = () => {
        if (activeStep < experiment.steps.length - 1) {
            setActionLog(prev => [...prev, `> ${experiment.steps[activeStep].resultDescription}`].slice(-5));
            setActiveStep(s => s + 1);
            setProgress(((activeStep + 1) / experiment.steps.length) * 100);
        } else {
            setActionLog(prev => [...prev, "> Simulation Sequence Complete."].slice(-5));
            setProgress(100);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <p className="text-cyan-400 font-mono-tech text-xs tracking-[0.4em] uppercase mb-2">Simulated Science Module</p>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">{experiment.title}</h1>
                </motion.div>
                <Card variant="glass" className="!p-4 bg-slate-950/40 border-white/5 flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Neural Stability</p>
                        <p className="text-sm font-black text-green-400 uppercase tracking-widest">STABLE v4.0</p>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[75vh]">
                <div className="lg:col-span-8 glass-card rounded-[2.5rem] overflow-hidden relative border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
                    <SimulationVisuals experiment={experiment} activeStep={activeStep} />
                    
                    <div className="absolute top-8 left-8 space-y-2 pointer-events-none">
                         <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl">
                            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Objective</p>
                            <p className="text-xs text-slate-300 max-w-xs">{experiment.objective}</p>
                         </div>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                    <Card variant="dark" className="flex-grow !p-8 border-white/5 bg-slate-900/40 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Simulation Control</h3>
                        
                        <div className="space-y-10">
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={activeStep}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black">
                                        {activeStep + 1}
                                    </div>
                                    <p className="text-xl font-bold leading-tight text-white">{experiment.steps[activeStep].instruction}</p>
                                </motion.div>
                            </AnimatePresence>

                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Real-time Telemetry</p>
                                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono-tech text-[10px] text-cyan-500 leading-relaxed">
                                    {actionLog.map((log, i) => <div key={i} className={i === actionLog.length - 1 ? "text-white font-bold" : ""}>{log}</div>)}
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-8 left-8 right-8 space-y-4">
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)] transition-all duration-700" style={{ width: `${progress}%` }}></div>
                            </div>
                            <button 
                                onClick={performAction} 
                                className="w-full h-16 bg-cyan-500 text-slate-950 rounded-2xl text-lg font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(6,182,212,0.3)]"
                            >
                                {experiment.steps[activeStep].actionLabel.toUpperCase()}
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const SimulationVisuals = ({ experiment, activeStep }: any) => {
    return (
        <Canvas camera={{ position: [0, 4, 8], fov: 40 }} shadows>
            <ambientLight intensity={1} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={3} castShadow />
            <Suspense fallback={null}>
                <Environment preset="city" />
                <PresentationControls global rotation={[0.13, 0.1, 0]} polar={[-0.4, 0.2]} azimuth={[-0.4, 0.2]}>
                     <StageContent experiment={experiment} activeStep={activeStep} />
                </PresentationControls>
                <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={15} blur={1.5} far={4.5} />
            </Suspense>
            <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 4} />
        </Canvas>
    );
};

const StageContent = ({ experiment, activeStep }: any) => {
    const beakerRef = useRef<THREE.Group>(null);
    const lightRef = useRef<THREE.PointLight>(null);

    useFrame((state) => {
        if (beakerRef.current) {
            beakerRef.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.05;
        }
    });

    // Determine current visual state based on step
    const liquidColor = activeStep > 0 ? experiment.secondaryColor || "#ff00ff" : experiment.liquidColor || "#00ffff";

    if (experiment.visualTheme === 'chemistry') {
        return (
            <group ref={beakerRef}>
                {/* Advanced Glass Beaker */}
                <mesh position={[0, 0, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[1.5, 1.4, 3, 64]} />
                    <MeshTransmissionMaterial 
                        backside
                        thickness={0.5}
                        roughness={0}
                        transmission={1}
                        ior={1.5}
                        chromaticAberration={0.06}
                        anisotropy={0.1}
                        distortion={0}
                        color="#ffffff"
                    />
                </mesh>
                {/* Volumetric Liquid */}
                <mesh position={[0, -0.6, 0]}>
                    <cylinderGeometry args={[1.45, 1.35, 1.7, 64]} />
                    <meshStandardMaterial 
                        color={liquidColor} 
                        transparent 
                        opacity={0.7} 
                        emissive={liquidColor} 
                        emissiveIntensity={0.5}
                        roughness={0}
                        metalness={0.2}
                    />
                </mesh>
                {/* Surface Polish */}
                <mesh position={[0, 0.25, 0]}>
                    <circleGeometry args={[1.45, 64]} rotation={[-Math.PI / 2, 0, 0]} />
                    <meshStandardMaterial color={liquidColor} transparent opacity={0.9} />
                </mesh>
                <pointLight ref={lightRef} position={[0, 0, 0]} intensity={2} color={liquidColor} distance={5} />
            </group>
        );
    }

    if (experiment.visualTheme === 'physics') {
        return (
            <group>
                <Float speed={5} rotationIntensity={2}>
                    <mesh castShadow>
                        <octahedronGeometry args={[1.5]} />
                        <MeshDistortMaterial color="#00d2ff" speed={2} distort={0.4} />
                    </mesh>
                </Float>
                <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[10, 10]} />
                    <meshStandardMaterial color="#0a0a0a" />
                </mesh>
            </group>
        );
    }

    return (
        <group>
            <mesh>
                <sphereGeometry args={[2, 64, 64]} />
                <MeshDistortMaterial color="#7c3aed" speed={5} distort={0.5} />
            </mesh>
        </group>
    );
};

export default DigitalLabPage;
