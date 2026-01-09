
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import { 
    QuizQuestion, Subject, ClassLevel, WrittenFeedback, QuestionPaper, 
    Flashcard, QuizDifficulty, MindMapNode, SmartSummary, LearningPath, CareerInfo, StudyPlan, GradedPaper
} from "../types";
import { auth as firebaseAuth } from "./firebase";

// Always use process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

const STUBRO_PERSONALITY_PROMPT = `You are StuBro AI, an elite educational neural engine for students.
**STRICT LANGUAGE RULE:** YOUR OUTPUT MUST BE 100% IN ENGLISH. NEVER USE CHINESE OR HINDI CHARACTERS.
**SCIENTIFIC RENDERING RULE:** 
1. Use LaTeX for ALL Algebra/Math. Example: $x^2 + y_2 = z$. Use $...$ for inline and $$...$$ for blocks.
2. Use mhchem syntax for ALL Chemistry. Example: $\ce{H2O}$, $\ce{CO2}$, $\ce{2H2 + O2 -> 2H2O}$.
3. Always ensure superscripts (^) and subscripts (_) are wrapped in LaTeX delimiters.
Explain complex things simply. Ground answers in provided context.`;

const checkAndDeductTokens = (cost: number) => {
    const user = firebaseAuth?.currentUser;
    if (!user) return;
    const tokenKey = `userTokens_${user.uid}`;
    const currentTokens = parseInt(localStorage.getItem(tokenKey) || '0', 10);
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    if (urlParams.get('dev') === 'true' || currentTokens > 9999) return;
    if (currentTokens < cost) throw new Error("Tokens Exhausted.");
    const newTokens = currentTokens - cost;
    localStorage.setItem(tokenKey, newTokens.toString());
    window.dispatchEvent(new CustomEvent('tokenChange', { detail: { newTokens } }));
};

const withTimeout = <T>(promise: Promise<T>, ms: number, context: string): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => reject(new Error(`${context} timeout.`)), ms);
      promise.then((res) => { clearTimeout(timeoutId); resolve(res); }, (err) => { clearTimeout(timeoutId); reject(err); });
    });
};

// --- SHARED SCHEMAS ---

const questionPaperSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        totalMarks: { type: Type.NUMBER },
        instructions: { type: Type.STRING },
        questions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    questionType: { type: Type.STRING, enum: ['mcq', 'short_answer', 'long_answer'] },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answer: { type: Type.STRING },
                    marks: { type: Type.NUMBER },
                },
                required: ['question', 'questionType', 'answer', 'marks']
            }
        }
    },
    required: ['title', 'totalMarks', 'instructions', 'questions']
};

export const generateQuiz = async (subject: Subject, classLevel: ClassLevel, sourceText: string, numQuestions: number, difficulty: QuizDifficulty, questionType: string): Promise<QuizQuestion[]> => {
    const prompt = `STRICTLY ENGLISH. Use LaTeX for math ($x^2$) and mhchem for chemistry ($\ce{H2O}$). Generate a ${difficulty} quiz (${numQuestions} ${questionType}) based on this text:\n${sourceText}`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ["mcq", "written"] },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correctAnswer: { type: Type.STRING },
                                explanation: { type: Type.STRING }
                            },
                            required: ["question", "type", "explanation"]
                        }
                    }
                },
                required: ["questions"]
            }
        },
    }), 120000, 'Quiz');
    const parsed = JSON.parse(response.text);
    return parsed.questions || [];
};

export const generateFlashcards = async (sourceText: string): Promise<Flashcard[]> => {
    const prompt = `STRICTLY ENGLISH. Use LaTeX for all symbols/formulas. Generate flippable flashcards from: \n${sourceText}`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { term: { type: Type.STRING }, definition: { type: Type.STRING }, tip: { type: Type.STRING } },
                    required: ["term", "definition"]
                }
            }
        },
    }), 60000, 'Flashcards');
    return JSON.parse(response.text);
};

export const generateSmartSummary = async (subject: Subject, classLevel: ClassLevel, sourceText: string): Promise<SmartSummary> => {
    const prompt = `STRICTLY ENGLISH. Summarize this ${subject} material for ${classLevel}. Use LaTeX/mhchem for all formulas. Text:\n${sourceText}`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    coreConcepts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { term: { type: Type.STRING }, definition: { type: Type.STRING } }, required: ["term", "definition"] } },
                    visualAnalogy: { type: Type.OBJECT, properties: { analogy: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["analogy", "explanation"] },
                    examSpotlight: { type: Type.ARRAY, items: { type: Type.STRING } },
                    stuBroTip: { type: Type.STRING }
                },
                required: ["title", "coreConcepts", "visualAnalogy", "examSpotlight", "stuBroTip"]
            }
        },
    }), 60000, 'Summary');
    return JSON.parse(response.text);
};

export const generateMindMapFromText = async (sourceText: string, classLevel: ClassLevel): Promise<MindMapNode> => {
    const prompt = `STRICTLY ENGLISH. Build hierarchical mind map. Use LaTeX for math. Text: ${sourceText}`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    term: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { term: { type: Type.STRING }, explanation: { type: Type.STRING }, children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { term: { type: Type.STRING }, explanation: { type: Type.STRING } } } } } } }
                },
                required: ["term", "explanation"]
            },
        },
    }), 120000, 'MindMap');
    return JSON.parse(response.text);
};

export const createChatSession = (subject: Subject, classLevel: ClassLevel, extractedText: string, studentContext: string = ""): Chat => {
    const systemInstruction = `${STUBRO_PERSONALITY_PROMPT}\n${studentContext}\nResponse strictly in English. Context:\n${extractedText.substring(0, 10000)}`;
    return ai.chats.create({ model: "gemini-3-flash-preview", config: { systemInstruction } });
};

export const sendMessageStream = async (chat: Chat, message: string) => {
    checkAndDeductTokens(1);
    return chat.sendMessageStream({ message });
};

export const evaluateWrittenAnswer = async (sourceText: string, question: string, answer: string): Promise<WrittenFeedback> => {
    const prompt = `STRICTLY ENGLISH. Evaluate answer. Context: ${sourceText}. Question: ${question}. Answer: ${answer}`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { whatIsCorrect: { type: Type.STRING }, whatIsMissing: { type: Type.STRING }, whatIsIncorrect: { type: Type.STRING }, marksAwarded: { type: Type.NUMBER }, totalMarks: { type: Type.NUMBER } },
                required: ["whatIsCorrect", "whatIsMissing", "whatIsIncorrect", "marksAwarded", "totalMarks"]
            }
        }
    }), 60000, 'Evaluation');
    return JSON.parse(response.text);
};

export const fetchChapterContent = async (classLevel: ClassLevel, subject: Subject, chapterInfo: string, chapterDetails: string): Promise<string> => {
    const prompt = `STRICTLY ENGLISH. Detailed academic content for Class ${classLevel}, ${subject}: ${chapterInfo}. Use LaTeX for all symbols.`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { tools: [{googleSearch: {}}] }
    }), 120000, "Deep Search");
    return response.text;
};

export const fetchYouTubeTranscript = async (url: string): Promise<string> => {
    const prompt = `STRICTLY ENGLISH. Fetch transcript for: ${url}.`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { tools: [{googleSearch: {}}] }
    }), 60000, "YT Extraction");
    return response.text;
};

export const generateSimulationExperiment = async (sourceText: string): Promise<any> => {
    const prompt = `STRICTLY ENGLISH. Design simulation. Use LaTeX for math. Text: ${sourceText}`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    objective: { type: Type.STRING },
                    visualTheme: { type: Type.STRING, enum: ['chemistry', 'physics', 'biology'] },
                    liquidColor: { type: Type.STRING },
                    secondaryColor: { type: Type.STRING },
                    steps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { instruction: { type: Type.STRING }, actionLabel: { type: Type.STRING }, resultDescription: { type: Type.STRING } }, required: ['instruction', 'actionLabel', 'resultDescription'] } }
                },
                required: ['title', 'objective', 'visualTheme', 'steps', 'liquidColor']
            }
        }
    }), 60000, "Simulation");
    return JSON.parse(response.text);
};

export const generateDebateTopics = async (sourceText: string): Promise<string[]> => {
    const prompt = `STRICTLY ENGLISH. 3-4 debate topics from text. Return JSON array. TEXT: ${sourceText}`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
    }), 60000, 'Debate Topics');
    return JSON.parse(response.text);
};

export const startDebateSession = (topic: string): Chat => {
    const systemInstruction = `Critico AI. Debate strictly in ENGLISH about: ${topic}. Use logic.`;
    return ai.chats.create({ model: "gemini-3-flash-preview", config: { systemInstruction } });
};

export const sendDebateArgument = async (chat: Chat, argument: string): Promise<string> => {
    const res = await chat.sendMessage({ message: argument });
    return res.text;
};

export const getDebateResponseToAudio = async (chat: Chat, audioPart: any): Promise<{ transcription: string; rebuttal: string; }> => {
    const prompt = `STRICTLY ENGLISH. Rebut user spoken argument. Return JSON.`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{text: prompt}, audioPart] },
        config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { transcription: { type: Type.STRING }, rebuttal: { type: Type.STRING } }, required: ['transcription', 'rebuttal'] } }
    }), 120000, 'Audio Debate');
    return JSON.parse(response.text);
};

export const evaluateDebate = async (history: any[]): Promise<any> => {
    const transcript = history.map(t => `${t.speaker}: ${t.text}`).join('\n');
    const prompt = `STRICTLY ENGLISH. Evaluate debate performance. Return JSON. TRANSCRIPT:\n${transcript}`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { overallScore: { type: Type.NUMBER }, argumentStrength: { type: Type.NUMBER }, rebuttalEffectiveness: { type: Type.NUMBER }, clarity: { type: Type.NUMBER }, strongestArgument: { type: Type.STRING }, improvementSuggestion: { type: Type.STRING }, concludingRemarks: { type: Type.STRING } }, required: ["overallScore", "argumentStrength", "rebuttalEffectiveness", "clarity", "strongestArgument", "improvementSuggestion", "concludingRemarks"] }
        }
    }), 120000, 'Debate Evaluation');
    return JSON.parse(response.text);
};

export const generateGameLevel = async (sourceText: string): Promise<any> => {
    const prompt = `STRICTLY ENGLISH. 15x20 adventure level. Use LaTeX for clues. Text: ${sourceText}`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING }, theme: { type: Type.STRING }, goal: { type: Type.STRING }, player_start: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }, required: ['x', 'y'] },
                    grid: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['floor', 'wall', 'interaction', 'exit'] } }, required: ['type'] } } },
                    interactions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.NUMBER }, position: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }, required: ['x', 'y'] }, prompt: { type: Type.STRING }, correct_answer: { type: Type.STRING }, success_message: { type: Type.STRING }, failure_message: { type: Type.STRING } }, required: ['id', 'position', 'prompt', 'correct_answer', 'success_message', 'failure_message'] } }
                },
                required: ['title', 'theme', 'goal', 'player_start', 'grid', 'interactions']
            },
        },
    }), 180000, 'Game Level');
    return JSON.parse(response.text);
};

// --- FIX: Added missing functions required by pages ---

/**
 * Analyzes student performance for a specific activity.
 */
export const analyzeStudentPerformance = async (activityType: string, data: any): Promise<any> => {
    const prompt = `STRICTLY ENGLISH. Analyze student performance for activity "${activityType}". Data: ${JSON.stringify(data).substring(0, 5000)}. Return JSON with strengthsIdentified, weaknessesIdentified, and aiFeedback.`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    strengthsIdentified: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weaknessesIdentified: { type: Type.ARRAY, items: { type: Type.STRING } },
                    aiFeedback: { type: Type.STRING }
                },
                required: ['strengthsIdentified', 'weaknessesIdentified', 'aiFeedback']
            }
        }
    }), 60000, 'Performance Analysis');
    return JSON.parse(response.text);
};

/**
 * Generates a full question paper based on study material.
 */
export const generateQuestionPaper = async (sourceText: string, numQuestions: number, questionTypes: string, difficulty: string, totalMarks: number, subject: Subject | null): Promise<QuestionPaper> => {
    const prompt = `STRICTLY ENGLISH. Create a question paper for ${subject || 'General Studies'}. 
    Questions: ${numQuestions}, Types: ${questionTypes}, Difficulty: ${difficulty}, Total Marks: ${totalMarks}.
    Provide model answers for each. Text:\n${sourceText}`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: questionPaperSchema
        }
    }), 180000, 'Question Paper');
    return JSON.parse(response.text);
};

/**
 * Grades a student's answer sheet based on provided images and the original paper.
 */
export const gradeAnswerSheet = async (paperText: string, imageParts: any[]): Promise<GradedPaper> => {
    const prompt = `STRICTLY ENGLISH. You are an examiner. Grade the attached answer sheet images based on this question paper and model answers:\n${paperText}. Return JSON.`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: { parts: [{ text: prompt }, ...imageParts] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    totalMarksAwarded: { type: Type.NUMBER },
                    overallFeedback: { type: Type.STRING },
                    gradedQuestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                questionNumber: { type: Type.NUMBER },
                                marksAwarded: { type: Type.NUMBER },
                                studentAnswerTranscription: { type: Type.STRING },
                                feedback: {
                                    type: Type.OBJECT,
                                    properties: {
                                        whatWasCorrect: { type: Type.STRING },
                                        whatWasIncorrect: { type: Type.STRING },
                                        suggestionForImprovement: { type: Type.STRING },
                                    },
                                    required: ['whatWasCorrect', 'whatWasIncorrect', 'suggestionForImprovement']
                                }
                            },
                            required: ['questionNumber', 'marksAwarded', 'studentAnswerTranscription', 'feedback']
                        }
                    }
                },
                required: ['totalMarksAwarded', 'overallFeedback', 'gradedQuestions']
            }
        }
    }), 300000, 'Grading');
    return JSON.parse(response.text);
};

/**
 * Generates personalized career guidance for a student.
 */
export const generateCareerGuidance = async (interests: string, strengths: string, ambitions: string, financial: string, other: string): Promise<CareerInfo> => {
    const prompt = `STRICTLY ENGLISH. Expert career counseling for Indian students. 
    Interests: ${interests}, Strengths: ${strengths}, Ambitions: ${ambitions}, Financial: ${financial}, Other: ${other}. 
    Provide diverse career paths with descriptions, subjects, top colleges, and roadmaps.`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    introduction: { type: Type.STRING },
                    careerPaths: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                careerName: { type: Type.STRING },
                                description: { type: Type.STRING },
                                subjectsToFocus: { type: Type.ARRAY, items: { type: Type.STRING } },
                                roadmap: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: { stage: { type: Type.STRING }, focus: { type: Type.STRING }, examsToPrepare: { type: Type.ARRAY, items: { type: Type.STRING } } },
                                        required: ['stage', 'focus']
                                    }
                                },
                                topColleges: { type: Type.ARRAY, items: { type: Type.STRING } },
                                potentialGrowth: { type: Type.STRING },
                            },
                            required: ['careerName', 'description', 'subjectsToFocus', 'roadmap', 'potentialGrowth']
                        }
                    }
                },
                required: ['introduction', 'careerPaths']
            }
        }
    }), 120000, 'Career Guidance');
    return JSON.parse(response.text);
};

/**
 * Generates a detailed study plan for a specific goal.
 */
export const generateStudyPlan = async (goal: string): Promise<StudyPlan> => {
    const prompt = `STRICTLY ENGLISH. Create a day-by-day study plan for goal: "${goal}". Return JSON.`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    plan: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: { day: { type: Type.NUMBER }, topic: { type: Type.STRING }, goal: { type: Type.STRING }, timeSlot: { type: Type.STRING } },
                            required: ['day', 'topic', 'goal']
                        }
                    }
                },
                required: ['title', 'plan']
            }
        }
    }), 60000, 'Study Plan');
    return JSON.parse(response.text);
};

/**
 * Generates insightful viva questions for a topic and class level.
 */
export const generateVivaQuestions = async (topic: string, classLevel: ClassLevel, numQuestions: number): Promise<string[]> => {
    const prompt = `STRICTLY ENGLISH. Generate ${numQuestions} insightful viva questions for ${classLevel} on topic: ${topic}. Return JSON array of strings.`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    }), 60000, 'Viva Questions');
    return JSON.parse(response.text);
};

/**
 * Evaluates an audio viva answer.
 */
export const evaluateVivaAudioAnswer = async (question: string, audioPart: any): Promise<any> => {
    const prompt = `STRICTLY ENGLISH. Transcribe and evaluate the spoken answer for: "${question}". Return JSON with transcription, feedback, and marksAwarded (out of 10).`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: prompt }, audioPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { transcription: { type: Type.STRING }, feedback: { type: Type.STRING }, marksAwarded: { type: Type.NUMBER } },
                required: ["transcription", "feedback", "marksAwarded"]
            }
        }
    }), 120000, 'Audio Viva Evaluation');
    return JSON.parse(response.text);
};

/**
 * Evaluates a text viva answer.
 */
export const evaluateVivaTextAnswer = async (question: string, answer: string): Promise<any> => {
    const prompt = `STRICTLY ENGLISH. Evaluate the answer for: "${question}". Answer provided: "${answer}". Return JSON with transcription (echo the answer), feedback, and marksAwarded (out of 10).`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { transcription: { type: Type.STRING }, feedback: { type: Type.STRING }, marksAwarded: { type: Type.NUMBER } },
                required: ["transcription", "feedback", "marksAwarded"]
            }
        }
    }), 60000, 'Text Viva Evaluation');
    return JSON.parse(response.text);
};

/**
 * Creates a live voice conversation session for clearing doubts.
 */
export const createLiveDoubtsSession = (topic: string, classLevel: ClassLevel): Chat => {
    const systemInstruction = `${STUBRO_PERSONALITY_PROMPT}\n\nYou are a live tutor for ${classLevel}. Discuss: "${topic}". Be conversational and clear. Strictly ENGLISH.`;
    return ai.chats.create({ model: "gemini-3-flash-preview", config: { systemInstruction } });
};

/**
 * Transcribes and responds to user audio input in a live session.
 */
export const sendAudioForTranscriptionAndResponse = async (chat: Chat, audioPart: any): Promise<any> => {
    const prompt = `STRICTLY ENGLISH. Transcribe user doubt and provide a helpful response. Return JSON.`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: prompt }, audioPart] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: { transcription: { type: Type.STRING }, response: { type: Type.STRING } },
                required: ['transcription', 'response']
            }
        }
    }), 120000, "Audio Processing");
    return JSON.parse(response.text);
};

/**
 * Breaks down source text into distinct topics for visual explanations.
 */
export const breakdownTextIntoTopics = async (sourceText: string): Promise<{ title: string; content: string }[]> => {
    const prompt = `STRICTLY ENGLISH. Break the following text into logical topics with titles and content. Return JSON array. Text:\n${sourceText}`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { title: { type: Type.STRING }, content: { type: Type.STRING } },
                    required: ["title", "content"]
                }
            }
        }
    }), 120000, 'Topic Breakdown');
    return JSON.parse(response.text);
};

/**
 * Generates scenes (narration + image data) for a specific topic.
 */
export const generateScenesForTopic = async (topicContent: string, language: string, classLevel: ClassLevel): Promise<any[]> => {
    const prompt = `STRICTLY ENGLISH. Generate 2-4 scenes for a visual explanation. Each scene needs narration and an image prompt. Content: ${topicContent}`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { narration: { type: Type.STRING }, image_prompt: { type: Type.STRING } },
                    required: ["narration", "image_prompt"]
                }
            }
        }
    }), 120000, 'Scene Blueprints');
    const blueprints = JSON.parse(response.text);
    const scenes = [];
    for (const bp of blueprints) {
        const imgRes = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: bp.image_prompt }] }
        });
        const part = imgRes.candidates?.[0]?.content?.parts.find(p => !!p.inlineData);
        if (part?.inlineData) {
            scenes.push({ narration: bp.narration, imageBytes: part.inlineData.data });
        }
    }
    return scenes;
};

/**
 * Generates a full chapter summary video with multiple scenes.
 */
export const generateFullChapterSummaryVideo = async (sourceText: string, language: string, classLevel: ClassLevel): Promise<any[]> => {
    const prompt = `STRICTLY ENGLISH. Generate 5-7 scenes for a full chapter summary video. Each scene needs narration and an image prompt. Text: ${sourceText}`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { narration: { type: Type.STRING }, image_prompt: { type: Type.STRING } },
                    required: ["narration", "image_prompt"]
                }
            }
        }
    }), 180000, 'Summary Video Blueprints');
    const blueprints = JSON.parse(response.text);
    const scenes = [];
    for (const bp of blueprints) {
        const imgRes = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: bp.image_prompt }] }
        });
        const part = imgRes.candidates?.[0]?.content?.parts.find(p => !!p.inlineData);
        if (part?.inlineData) {
            scenes.push({ narration: bp.narration, imageBytes: part.inlineData.data });
        }
    }
    return scenes;
};

/**
 * Generates a personalized learning path based on diagnostic quiz results.
 */
export const generateLearningPath = async (topic: string, subject: Subject, classLevel: ClassLevel, quizResults: QuizQuestion[]): Promise<LearningPath> => {
    const prompt = `STRICTLY ENGLISH. Generate a personalized learning path for topic "${topic}" (${subject}, ${classLevel}) based on these quiz results: ${JSON.stringify(quizResults)}. Return JSON.`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    mainTopic: { type: Type.STRING },
                    weakAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
                    learningSteps: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: { step: { type: Type.NUMBER }, topic: { type: Type.STRING }, goal: { type: Type.STRING }, resources: { type: Type.ARRAY, items: { type: Type.STRING } } },
                            required: ['step', 'topic', 'goal', 'resources']
                        }
                    }
                },
                required: ['mainTopic', 'weakAreas', 'learningSteps']
            }
        },
    }), 180000, 'Learning Path');
    return JSON.parse(response.text);
};

/**
 * Predicts probable exam questions based on material.
 */
export const predictExamPaper = async (sourceText: string, difficulty: string, totalMarks: number, subject: Subject | null): Promise<QuestionPaper> => {
    const prompt = `STRICTLY ENGLISH. Predict potential exam questions for ${subject || 'General studies'} based on this text. Marks: ${totalMarks}, Difficulty: ${difficulty}. Return JSON for a full paper. Text:\n${sourceText}`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: questionPaperSchema
        }
    }), 180000, 'Exam Prediction');
    return JSON.parse(response.text);
};

/**
 * Finds 3-5 real-world applications for an academic concept.
 */
export const findRealWorldApplications = async (concept: string): Promise<any[]> => {
    const prompt = `STRICTLY ENGLISH. Provide 3-5 real-world applications for: ${concept}. Return JSON array with industry and description.`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { industry: { type: Type.STRING }, description: { type: Type.STRING } },
                    required: ['industry', 'description']
                }
            }
        }
    }), 60000, 'Real World Apps');
    return JSON.parse(response.text);
};

/**
 * Generates simple analogies for a concept.
 */
export const generateAnalogies = async (concept: string): Promise<any[]> => {
    const prompt = `STRICTLY ENGLISH. Provide 2-3 simple analogies for: ${concept}. Return JSON array with analogy and explanation.`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { analogy: { type: Type.STRING }, explanation: { type: Type.STRING } },
                    required: ['analogy', 'explanation']
                }
            }
        }
    }), 60000, 'Analogies');
    return JSON.parse(response.text);
};

/**
 * Designs a lab experiment for a subject and topic.
 */
export const generateLabExperiment = async (subject: Subject, topic: string, safetyLevel: string): Promise<any> => {
    const prompt = `STRICTLY ENGLISH. Design a lab experiment for ${subject} on: ${topic}. Safety: ${safetyLevel}. Return JSON.`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    experimentTitle: { type: Type.STRING }, objective: { type: Type.STRING }, hypothesis: { type: Type.STRING },
                    materials: { type: Type.ARRAY, items: { type: Type.STRING } },
                    procedure: { type: Type.ARRAY, items: { type: Type.STRING } },
                    safetyPrecautions: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['experimentTitle', 'objective', 'hypothesis', 'materials', 'procedure', 'safetyPrecautions']
            }
        }
    }), 120000, 'Lab Assistant');
    return JSON.parse(response.text);
};

/**
 * Creates a chat session for a historical figure.
 */
export const createHistoricalChatSession = (figure: string): Chat => {
    const systemInstruction = `You are ${figure}. Respond strictly in character and in ENGLISH. Use LaTeX for any scientific concepts.`;
    return ai.chats.create({ model: "gemini-3-flash-preview", config: { systemInstruction } });
};

/**
 * Analyzes a literary text for themes, devices, and characters.
 */
export const analyzeLiteraryText = async (text: string): Promise<any> => {
    const prompt = `STRICTLY ENGLISH. Analyze the literary text provided. Return JSON. Text:\n${text}`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING }, author: { type: Type.STRING }, themes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    literaryDevices: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { device: { type: Type.STRING }, example: { type: Type.STRING } }, required: ['device', 'example'] } },
                    characterAnalysis: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { character: { type: Type.STRING }, analysis: { type: Type.STRING } }, required: ['character', 'analysis'] } },
                    overallSummary: { type: Type.STRING }
                },
                required: ['title', 'themes', 'literaryDevices', 'characterAnalysis', 'overallSummary']
            }
        }
    }), 120000, 'Literary Analysis');
    return JSON.parse(response.text);
};

/**
 * Creates a chat session for discussing ethical dilemmas.
 */
export const createDilemmaChatSession = (topic: string): Chat => {
    const systemInstruction = `Ethics moderator. Present challenging dilemmas on ${topic} and facilitate critical thinking. Strictly ENGLISH.`;
    return ai.chats.create({ model: "gemini-3-flash-preview", config: { systemInstruction } });
};

/**
 * Explores a "What If" scenario in history.
 */
export const exploreWhatIfHistory = async (scenario: string): Promise<string> => {
    const prompt = `STRICTLY ENGLISH. Explore historical "What If": ${scenario}. Use historical principles.`;
    const response: GenerateContentResponse = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    }), 120000, 'What If History');
    return response.text;
};
