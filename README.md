# Sarthi-Ai
AI study helper for students
import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, MessageCircle, Brain, FileText, Send, Loader2, Sparkles, GraduationCap, ChevronRight, RefreshCcw, CheckCircle, XCircle, ChevronLeft } from 'lucide-react';

/* SARTHI AI STUDY HELPER
  Target Audience: Indian Students (School to College)
  Key Features: Summarizer, Doubt Solver (Hinglish support), Quiz Generator
*/

const SarthiApp = () => {
  // --- State Management ---
  const [apiKey, setApiKey] = useState("");
  const [currentView, setCurrentView] = useState('input'); // input, summary, chat, quiz
  const [studentLevel, setStudentLevel] = useState('Class 9-10');
  const [notesContent, setNotesContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Feature Data
  const [summary, setSummary] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'model', text: "Namaste! I am Sarthi, your AI study buddy. Upload your notes or paste text, and I'll help you revise, solve doubts, and take quizzes. Kya start karein?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const chatEndRef = useRef(null);

  // --- Constants ---
  const LEVELS = ['Class 5-8', 'Class 9-10', 'Class 11-12 (Science)', 'Class 11-12 (Commerce/Arts)', 'College/Competitive'];
  
  const SAMPLE_TEXT = `Photosynthesis is the process by which green plants, algae, and some bacteria convert light energy into chemical energy. This energy is stored in the bonds of glucose molecules. The process mainly takes place in the chloroplasts of plant cells, using the green pigment chlorophyll.

Key Requirements:
1. Sunlight: The source of energy.
2. Water (H2O): Absorbed by roots from the soil.
3. Carbon Dioxide (CO2): Absorbed from the air through stomata.

The Equation:
6CO2 + 6H2O + Light Energy → C6H12O6 (Glucose) + 6O2 (Oxygen)

Importance:
- Produces oxygen, which is essential for life on Earth.
- It is the primary source of food for almost all living organisms.`;

  // --- Helper Functions ---

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, currentView]);

  // --- API Interaction ---

  const generateContent = async (prompt, type = 'text') => {
    setIsLoading(true);
    try {
      // In a real app, use the actual API key. Here we use the environment key.
      const API_KEY = apiKey || ""; 
      
      const systemPrompt = `
        You are Sarthi, a friendly and patient AI tutor for Indian students.
        Target Student Level: ${studentLevel}.
        
        Guidelines:
        1. Tone: Encouraging, like a good teacher or "bhaiya/didi".
        2. Language: Primarily English, but use simple "Hinglish" (Hindi+English mix) for explanations if it makes things clearer (e.g., "Samajh aaya?", "Basically...").
        3. Context: Use examples relevant to India where possible.
        4. Focus: Help them understand concepts, not just memorize.
        
        Current Context (The student's notes): 
        "${notesContent.substring(0, 5000)}"
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          }),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      let textResponse = data.candidates[0].content.parts[0].text;
      
      if (type === 'json') {
        // Clean markdown backticks if present
        textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(textResponse);
      }
      
      return textResponse;

    } catch (error) {
      console.error("API Error:", error);
      return "Arre yaar! Something went wrong. Please check your connection or API key.";
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers ---

  const handleSummarize = async () => {
    if (!notesContent.trim()) return;
    setCurrentView('summary');
    const result = await generateContent("Please provide a concise summary of these notes. Use bullet points for key concepts. Highlight important formulas or dates if any. Make it perfect for last-minute revision.");
    setSummary(result);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');

    const aiMsgText = await generateContent(`Student asks: "${chatInput}". Answer briefly and clearly. If it's a doubt, explain simply.`);
    setChatHistory(prev => [...prev, userMsg, { role: 'model', text: aiMsgText }]);
  };

  const handleGenerateQuiz = async () => {
    if (!notesContent.trim()) return;
    setCurrentView('quiz');
    setQuizSubmitted(false);
    setQuizScore(0);
    setCurrentQuizIndex(0);
    setQuizQuestions([]);

    const prompt = `Generate 5 multiple choice questions (MCQs) based on the notes provided. 
    Return ONLY a JSON array with this structure: 
    [{"question": "Question text", "options": ["A", "B", "C", "D"], "answer": 0}] 
    (where answer is the index 0-3 of the correct option).`;

    try {
      const questions = await generateContent(prompt, 'json');
      if (Array.isArray(questions)) {
        setQuizQuestions(questions);
      } else {
        throw new Error("Invalid format");
      }
    } catch (e) {
      setQuizQuestions([]); // Handle error state in UI
    }
  };

  const handleQuizAnswer = (optionIndex) => {
    if (quizSubmitted) return;
    setSelectedOption(optionIndex);
  };

  const submitQuizAnswer = () => {
    setQuizSubmitted(true);
    if (selectedOption === quizQuestions[currentQuizIndex].answer) {
      setQuizScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    setQuizSubmitted(false);
    setSelectedOption(null);
    setCurrentQuizIndex(prev => prev + 1);
  };

  // --- Render Components ---

  const renderHeader = () => (
    <header className="bg-indigo-600 text-white p-4 shadow-lg sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <GraduationCap size={28} />
          <h1 className="text-xl font-bold">Sarthi AI</h1>
        </div>
        <div className="flex items-center space-x-4 text-sm">
           <select 
            value={studentLevel} 
            onChange={(e) => setStudentLevel(e.target.value)}
            className="bg-indigo-700 text-white border border-indigo-500 rounded px-2 py-1 outline-none text-xs sm:text-sm"
          >
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>
    </header>
  );

  const renderNav = () => (
    <nav className="bg-white border-b border-gray-200 sticky top-16 z-40 overflow-x-auto">
      <div className="max-w-4xl mx-auto flex justify-around p-2">
        <button 
          onClick={() => setCurrentView('input')} 
          className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${currentView === 'input' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <FileText size={18} />
          <span>Notes</span>
        </button>
        <button 
          onClick={() => { if(notesContent) handleSummarize(); else setCurrentView('summary'); }} 
          className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${currentView === 'summary' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
          disabled={!notesContent}
        >
          <BookOpen size={18} />
          <span>Summary</span>
        </button>
        <button 
          onClick={() => setCurrentView('chat')} 
          className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${currentView === 'chat' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <MessageCircle size={18} />
          <span>Doubts</span>
        </button>
        <button 
          onClick={handleGenerateQuiz} 
          className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${currentView === 'quiz' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
          disabled={!notesContent}
        >
          <Brain size={18} />
          <span>Quiz</span>
        </button>
      </div>
    </nav>
  );

  // VIEW: INPUT
  const renderInputView = () => (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Sparkles className="text-yellow-500 mr-2" size={20} />
            Study Material
          </h2>
          <button 
            onClick={() => setNotesContent(SAMPLE_TEXT)}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Try Sample (Science)
          </button>
        </div>
        
        <textarea 
          value={notesContent}
          onChange={(e) => setNotesContent(e.target.value)}
          placeholder="Paste your chapter notes, essay, or article here... (Ex: Copy text from Wikipedia or your PDF)"
          className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-gray-700"
        ></textarea>
        
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleSummarize}
            disabled={!notesContent.trim() || isLoading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium shadow-md transition-all flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <BookOpen className="mr-2" size={20} />}
            Summarize Notes
          </button>
          
          <button 
            onClick={handleGenerateQuiz}
            disabled={!notesContent.trim() || isLoading}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg font-medium shadow-md transition-all flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Brain className="mr-2" size={20} />}
            Take a Quiz
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">AI generated content can be inaccurate. Always verify with your textbooks.</p>
      </div>
    </div>
  );

  // VIEW: SUMMARY
  const renderSummaryView = () => (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[50vh]">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Quick Revision Summary</h2>
          <button onClick={() => setCurrentView('input')} className="text-gray-500 hover:text-gray-800">
            <XCircle />
          </button>
        </div>
        
        {isLoading ? (
           <div className="flex flex-col items-center justify-center h-64 space-y-4">
             <Loader2 className="animate-spin text-indigo-600" size={48} />
             <p className="text-gray-500 animate-pulse">Reading your notes...</p>
           </div>
        ) : summary ? (
          <div className="prose prose-indigo max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-lg">
              {summary}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-20">
            <p>No summary generated yet.</p>
            <button onClick={() => setCurrentView('input')} className="text-indigo-600 font-medium mt-2">Go back to add notes</button>
          </div>
        )}
      </div>
    </div>
  );

  // VIEW: CHAT
  const renderChatView = () => (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
              }`}
            >
              <p className="text-sm sm:text-base whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-none px-5 py-3 shadow-sm flex items-center">
              <span className="flex space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-2 py-1 border border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
            placeholder="Ask a doubt (e.g., 'Explain this in simple Hindi')"
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-gray-700 placeholder-gray-500 outline-none"
          />
          <button 
            onClick={handleChatSend}
            disabled={!chatInput.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full transition-colors disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  // VIEW: QUIZ
  const renderQuizView = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
          <p className="text-gray-600 font-medium text-lg">Generating questions from your notes...</p>
          <p className="text-gray-400 text-sm">Reviewing concepts...</p>
        </div>
      );
    }

    if (!quizQuestions.length) {
      return (
        <div className="p-8 text-center">
          <div className="inline-block p-4 bg-orange-100 rounded-full mb-4">
            <XCircle className="text-orange-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Quiz Generation Failed</h3>
          <p className="text-gray-600 mb-6">We couldn't generate questions from the provided text. Please try adding more detailed notes.</p>
          <button onClick={() => setCurrentView('input')} className="text-indigo-600 font-medium">Return to Notes</button>
        </div>
      );
    }

    // End of Quiz
    if (currentQuizIndex >= quizQuestions.length) {
      const percentage = (quizScore / quizQuestions.length) * 100;
      return (
        <div className="max-w-2xl mx-auto p-6 mt-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="mb-6">
              {percentage >= 80 ? (
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="text-green-600" size={40} />
                </div>
              ) : (
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCcw className="text-orange-600" size={40} />
                </div>
              )}
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Completed!</h2>
              <p className="text-gray-500">You scored</p>
              <div className="text-5xl font-black text-indigo-600 my-4">
                {quizScore}/{quizQuestions.length}
              </div>
              <p className="text-gray-600 mb-8">
                {percentage >= 80 ? "Shabaash! Excellent understanding." : "Keep practicing! Review the summary and try again."}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => {
                   setCurrentQuizIndex(0);
                   setQuizScore(0);
                   setQuizSubmitted(false);
                }}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Retake Quiz
              </button>
              <button 
                onClick={() => setCurrentView('summary')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Review Summary
              </button>
            </div>
          </div>
        </div>
      );
    }

    const currentQ = quizQuestions[currentQuizIndex];

    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Question {currentQuizIndex + 1} of {quizQuestions.length}</span>
            <span>Score: {quizScore}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6 sm:p-8">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-6 leading-relaxed">
              {currentQ.question}
            </h3>

            <div className="space-y-3">
              {currentQ.options.map((option, idx) => {
                let btnClass = "w-full text-left p-4 rounded-lg border-2 transition-all ";
                
                if (quizSubmitted) {
                  if (idx === currentQ.answer) {
                    btnClass += "border-green-500 bg-green-50 text-g
