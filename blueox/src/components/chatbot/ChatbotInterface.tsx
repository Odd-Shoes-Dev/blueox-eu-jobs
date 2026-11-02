import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Send, ArrowRight, Check, RotateCcw, ExternalLink, Upload, X, Menu, Briefcase } from 'lucide-react';
import { UserPath, ConversationMessage, ChatChoice, CollectedData, Job } from './types';
import { 
  WELCOME_MESSAGE, 
  INITIAL_CHOICES, 
  PATH_CONFIGS, 
  CHARACTER,
  WHATSAPP_LINK,
  COMPANY_REDIRECT_MESSAGE,
  getPreFormMessage,
  getCompletionMessage 
} from './conversationFlow';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import * as jobsService from '../../services/jobsService';
import * as applicationsService from '../../services/applicationsService';
import * as storageService from '../../services/storageService';

const generateId = () => Math.random().toString(36).substring(2, 15);

// Skill mapping for job matching
const SKILL_KEYWORDS: Record<string, string[]> = {
  'Electricians': ['electrician', 'electrical', 'wiring', 'electric'],
  'Scaffolders': ['scaffolder', 'scaffold', 'scaffolding'],
  'Mig Welding': ['mig', 'welding', 'welder', 'weld'],
  'Mug Welding': ['mug', 'welding', 'welder', 'weld'],
  'Carpentry': ['carpenter', 'carpentry', 'woodwork', 'wood'],
  'Truck Drivers': ['truck', 'driver', 'driving', 'lorry', 'hgv', 'cdl'],
  'Forklift Drivers': ['forklift', 'fork lift', 'warehouse', 'operator'],
  'Construction Helpers': ['construction', 'helper', 'laborer', 'building'],
  'Plumbers': ['plumber', 'plumbing', 'pipe', 'pipes'],
  'HVAC Techs': ['hvac', 'heating', 'cooling', 'air conditioning', 'ventilation'],
  'Caregivers': ['caregiver', 'care', 'elderly', 'healthcare', 'nursing'],
  'Warehouse Workers': ['warehouse', 'storage', 'logistics', 'packing'],
  'Ship Building': ['ship', 'shipyard', 'marine', 'vessel', 'boat'],
  'Any': ['any', 'general', 'all'],
};

const ChatbotInterface: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userPath, setUserPath] = useState<UserPath | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [collectedData, setCollectedData] = useState<CollectedData>({});
  const [isComplete, setIsComplete] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [matchedJobs, setMatchedJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobSelection, setShowJobSelection] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHero, setShowHero] = useState(true);

  // Reset conversation
  const resetConversation = () => {
    setMessages([]);
    setUserPath(null);
    setCurrentStepIndex(-1);
    setCollectedData({});
    setIsComplete(false);
    setInputValue('');
    setSelectedOptions([]);
    setShowForm(false);
    setFormData({});
    setUploadedFiles({});
    setMatchedJobs([]);
    setSelectedJob(null);
    setShowJobSelection(false);
    setShowHero(true);
    localStorage.removeItem('blueox_conversation_data');
  };

  // Start the chat from hero
  const startChat = () => {
    setShowHero(false);
    setTimeout(() => {
      addBotMessage(WELCOME_MESSAGE, INITIAL_CHOICES);
    }, 300);
  };

  // Scroll to bottom only when user sends a message (not on bot responses)
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Only scroll when user explicitly interacts, not on every message
  const lastMessageRef = useRef<string | null>(null);
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'user' && lastMessage.id !== lastMessageRef.current) {
      lastMessageRef.current = lastMessage.id;
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Chat is started by clicking Message button in hero section

  const addBotMessage = (content: string, choices?: ChatChoice[], inputType?: string, inputOptions?: string[], placeholder?: string, field?: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        content,
        timestamp: new Date(),
        choices,
        inputType: inputType as ConversationMessage['inputType'],
        inputOptions,
        inputPlaceholder: placeholder,
        field
      }]);
      setIsTyping(false);
      inputRef.current?.focus();
    }, 600 + Math.random() * 300);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date()
    }]);
  };

  // Fetch live jobs from Supabase and match based on user preferences
  // Less strict matching: if a country is selected, show ALL jobs from that country
  const fetchAndMatchJobs = async (data: CollectedData): Promise<Job[]> => {
    const userSkills = (data.skills as string[]) || [];
    const userCountries = (data.targetCountries as string[]) || [];

    try {
      // Fetch active jobs
      const jobsData = await jobsService.listActiveJobs();

      if (jobsData.length === 0) {
        return [];
      }

      // Filter jobs by country only - show ALL jobs from selected countries
      const matchedJobs = jobsData.filter(job => {
        // If no countries selected or "Any" selected, show all jobs
        if (userCountries.length === 0 || userCountries.includes('Any') || userCountries.includes('Other')) {
          return true;
        }
        // Otherwise, only filter by country match
        return userCountries.includes(job.country);
      });

      // Sort by skill relevance (jobs matching skills rank higher, but all are shown)
      const scoredJobs = matchedJobs.map(job => {
        const jobText = `${job.title} ${job.description} ${job.requirements || ''}`.toLowerCase();
        let score = 0;

        // Add score for skill matches (for sorting, not filtering)
        userSkills.forEach(skill => {
          if (skill === 'Any') return;
          const keywords = SKILL_KEYWORDS[skill] || [skill.toLowerCase()];
          keywords.forEach(keyword => {
            if (jobText.includes(keyword)) score += 2;
          });
        });

        // Boost exact country match
        if (userCountries.includes(job.country)) score += 1;

        return { ...job, score };
      });

      // Sort by score (skill-matched jobs appear first)
      scoredJobs.sort((a, b) => b.score - a.score);

      // Convert to Job type format - show more jobs (up to 10)
      return scoredJobs.slice(0, 10).map(job => ({
        id: job.id,
        title: job.title,
        company: job.company || 'Blue Ox Partner',
        location: job.country,
        salary: job.salary_range,
        type: job.job_type,
        skills: [],
        description: job.description
      }));
    } catch (err) {
      console.error('Error in job matching:', err);
      return [];
    }
  };

  const handlePathSelect = (choice: ChatChoice) => {
    addUserMessage(choice.label);
    const path = choice.value as UserPath;
    
    // Company path - redirect to WhatsApp
    if (path === 'company') {
      setTimeout(() => {
        addBotMessage(COMPANY_REDIRECT_MESSAGE);
        setIsComplete(true);
      }, 100);
      return;
    }
    
    setUserPath(path);
    setCollectedData({ userPath: path });
    setCurrentStepIndex(0);
    
    const config = PATH_CONFIGS[path];
    if (config && config.steps.length > 0) {
      const step = config.steps[0];
      setTimeout(() => {
        addBotMessage(
          step.question,
          step.inputType === 'choices' ? step.choices : undefined,
          step.inputType,
          step.inputOptions,
          step.placeholder,
          step.field
        );
      }, 100);
    }
  };

  const processUserInput = async (value: string | string[]) => {
    if (!userPath) return;
    
    const config = PATH_CONFIGS[userPath];
    const currentStep = config.steps[currentStepIndex];
    
    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    addUserMessage(displayValue);
    
    const newData = { ...collectedData, [currentStep.field]: value };
    setCollectedData(newData);
    
    const nextIndex = currentStepIndex + 1;
    
    if (nextIndex >= config.steps.length) {
      // Check if we need job matching
      if (config.showJobMatching) {
        setIsTyping(true);
        const jobs = await fetchAndMatchJobs(newData);
        setIsTyping(false);
        setMatchedJobs(jobs);
        setTimeout(() => {
          if (jobs.length > 0) {
            addBotMessage("Great news! I found some jobs that match what you're looking for. Take a look and pick the one that catches your eye:");
            setShowJobSelection(true);
          } else {
            addBotMessage("I don't have exact matches right now, but don't worry - fill out your details and our team will find something perfect for you!");
            setShowForm(true);
          }
        }, 100);
      } else {
        // Show form directly
        setTimeout(() => {
          addBotMessage(getPreFormMessage(userPath));
          setShowForm(true);
        }, 100);
      }
      saveConversationData(newData);
    } else {
      setCurrentStepIndex(nextIndex);
      const nextStep = config.steps[nextIndex];
      setTimeout(() => {
        addBotMessage(
          nextStep.question,
          nextStep.inputType === 'choices' ? nextStep.choices : undefined,
          nextStep.inputType,
          nextStep.inputOptions,
          nextStep.placeholder,
          nextStep.field
        );
      }, 100);
    }
    
    setInputValue('');
    setSelectedOptions([]);
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    addUserMessage(`Selected: ${job.title} at ${job.company}`);
    setShowJobSelection(false);
    setTimeout(() => {
      addBotMessage(getPreFormMessage(userPath!, job.title));
      setShowForm(true);
    }, 100);
  };

  const saveConversationData = async (data: CollectedData) => {
    try {
      localStorage.setItem('blueox_conversation_data', JSON.stringify({
        ...data,
        savedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error saving conversation data:', error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPath || isSubmitting) return;

    setIsSubmitting(true);
    setIsTyping(true);

    const config = PATH_CONFIGS[userPath];
    const allData: Record<string, unknown> = {
      ...collectedData,
      ...formData,
      selectedJob: selectedJob?.id,
      uploadedDocuments: {} as Record<string, string>
    };

    // Save to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        // Upload files first and track their paths
        const uploadedDocumentPaths: Record<string, string> = {};
        for (const [fieldName, file] of Object.entries(uploadedFiles)) {
          const fileName = `${Date.now()}-${fieldName}-${file.name}`;
          const filePath = `applications/${fileName}`;
          const { error } = await storageService.uploadDocument('admin', filePath, file);
          if (error) {
            console.error('Upload error:', error);
          } else {
            uploadedDocumentPaths[fieldName] = filePath;
          }
        }

        // Update allData with actual file paths
        allData.uploadedDocuments = uploadedDocumentPaths;

        // Save application
        const { data: insertedApp, error: insertError } = await applicationsService.createApplication({
          user_path: userPath,
          data: allData,
          status: 'pending',
          created_at: new Date().toISOString()
        });

        if (insertError) {
          console.error('Application insert error:', insertError);
        } else {
          console.log('Application saved successfully:', insertedApp);
        }
      } catch (err) {
        console.error('Error saving to Supabase:', err);
      }
    }

    setShowForm(false);
    setIsTyping(false);
    setIsComplete(true);
    setIsSubmitting(false);
    addBotMessage(getCompletionMessage(userPath, allData));
  };

  const handleFileChange = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      processUserInput(inputValue.trim());
    }
  };

  const handleSelectOption = (option: string) => {
    processUserInput(option);
  };

  const handleMultiSelectToggle = (option: string) => {
    setSelectedOptions(prev => 
      prev.includes(option) 
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  const handleMultiSelectSubmit = () => {
    if (selectedOptions.length > 0) {
      processUserInput(selectedOptions);
    }
  };

  const currentMessage = messages[messages.length - 1];
  const showTextInput = currentMessage?.inputType === 'text' || currentMessage?.inputType === 'number';
  const showSelectInput = currentMessage?.inputType === 'select';
  const showMultiSelectInput = currentMessage?.inputType === 'multiselect';
  const showInitialChoices = currentMessage?.choices && !userPath;

  // Calculate progress
  const config = userPath ? PATH_CONFIGS[userPath] : null;
  const totalSteps = config?.steps.length || 0;
  const formSteps = config?.formFields?.length ? 1 : 0;
  const jobStep = config?.showJobMatching ? 1 : 0;
  const totalProgress = totalSteps + formSteps + jobStep;
  
  let currentProgress = currentStepIndex + 1;
  if (showJobSelection) currentProgress = totalSteps + 1;
  if (showForm) currentProgress = totalSteps + jobStep + 1;
  if (isComplete) currentProgress = totalProgress;
  
  const progress = totalProgress > 0 ? (currentProgress / totalProgress) * 100 : 0;

  // Typing animation state
  const [typingText, setTypingText] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const fullText = "I'm Blue OX";

  useEffect(() => {
    if (showHero) {
      let index = 0;
      setTypingText('');
      setTypingDone(false);
      const timer = setInterval(() => {
        if (index < fullText.length) {
          setTypingText(fullText.slice(0, index + 1));
          index++;
        } else {
          clearInterval(timer);
          setTypingDone(true);
        }
      }, 100);
      return () => clearInterval(timer);
    }
  }, [showHero]);

  // Hero Section Component
  if (showHero) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy via-navy-dark to-navy flex flex-col">
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-navy-dark/95 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo and Guarantee */}
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <img src="/assets/logo1.png" alt="Blue OX" className="h-8 flex-shrink-0" />
                {/* Short version for mobile */}
                <span className="sm:hidden text-xs font-medium text-white/80">
                  Guaranteed Job in Europe
                </span>
                {/* Full version for larger screens */}
                <span className="hidden sm:block text-xs font-medium text-white/80 leading-tight max-w-[200px]">
                  Guaranteed Job in Europe in 90 Days Or We Work for Free
                </span>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6 flex-shrink-0">
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-coral font-space text-sm transition-colors">Contact us</a>
                <Link to="/jobs" className="text-gray-300 hover:text-coral font-space text-sm transition-colors flex items-center">
                  <Briefcase className="w-4 h-4 mr-1" /> Jobs Open
                </Link>
              </nav>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white p-2 ml-2 flex-shrink-0"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Mobile Navigation Dropdown */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-white/10">
                <div className="flex flex-col space-y-3">
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-coral font-space text-sm"
                  >
                    Contact us
                  </a>
                  <Link
                    to="/jobs"
                    className="text-gray-300 hover:text-coral font-space text-sm flex items-center"
                  >
                    <Briefcase className="w-4 h-4 mr-1" /> Jobs Open
                  </Link>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Hero Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-20">
          {/* Hero Text with Typing Animation */}
          <h1 className="font-orbitron text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-center mb-2">
            <span className="text-white">{typingText.slice(0, 4)}</span>
            <span className="text-coral">{typingText.slice(4)}</span>
            {!typingDone && <span className="animate-pulse text-coral">|</span>}
          </h1>

          {/* Subtitle - appears after typing */}
          <p className={`font-space text-base sm:text-lg md:text-xl text-gray-300 text-center mb-6 max-w-md transition-opacity duration-500 ${typingDone ? 'opacity-100' : 'opacity-0'}`}>
            I help you find work or study in Europe
          </p>

          {/* Profile Picture */}
          <div className="bg-white rounded-3xl p-2 shadow-2xl mb-6">
            <img
              src={CHARACTER.profilePic}
              alt={CHARACTER.name}
              className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl object-cover"
            />
          </div>

          {/* CTA Text */}
          <p className={`font-space text-sm text-gray-400 mb-3 transition-opacity duration-500 ${typingDone ? 'opacity-100' : 'opacity-0'}`}>
            Click below to get started
          </p>

          {/* Message Button */}
          <button
            onClick={startChat}
            className="bg-coral hover:bg-coral-dark text-white font-space font-semibold text-lg px-12 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-dark to-navy flex flex-col">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-navy-dark/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo with Guarantee */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <img
                src="/assets/logo1.png"
                alt="Blue OX"
                className="h-8 sm:h-10 w-auto"
              />
              {/* Short version for mobile */}
              <span className="sm:hidden text-xs font-medium text-white/80">
                Guaranteed Job in Europe
              </span>
              {/* Full version for larger screens */}
              <span className="hidden sm:block text-xs font-medium text-white/80 max-w-[180px] leading-tight">
                Guaranteed Job in Europe in 90 Days Or We Work for Free
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-coral font-space text-sm transition-colors"
              >
                Talk to Previous Clients
              </a>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-coral font-space text-sm transition-colors"
              >
                Contact us
              </a>
              <Link 
                to="/jobs"
                className="text-gray-300 hover:text-coral font-space text-sm transition-colors flex items-center"
              >
                <Briefcase className="w-4 h-4 mr-1" />
                Jobs Open
              </Link>
              <a 
                href={WHATSAPP_LINK} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-coral hover:bg-coral-dark text-white font-space text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Sign in
              </a>
            </nav>

            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/10">
              <div className="flex flex-col space-y-3">
                <a 
                  href={WHATSAPP_LINK} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-coral font-space text-sm"
                >
                  Talk to Previous Clients
                </a>
                <a 
                  href={WHATSAPP_LINK} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-coral font-space text-sm"
                >
                  Contact us
                </a>
                <Link 
                  to="/jobs"
                  className="text-gray-300 hover:text-coral font-space text-sm"
                >
                  Jobs Open
                </Link>
                <a 
                  href={WHATSAPP_LINK} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-coral font-space text-sm"
                >
                  Sign in
                </a>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Progress Bar - Fixed below header */}
      {userPath && !isComplete && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-navy-dark/90 backdrop-blur-sm px-4 py-3 border-b border-white/10">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-400 font-space whitespace-nowrap">Progress</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-coral transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <span className="text-xs text-coral font-space whitespace-nowrap">{Math.round(Math.min(progress, 100))}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div id="chat-area" className={`flex-1 overflow-y-auto px-4 py-6 ${userPath && !isComplete ? 'pt-32' : 'pt-24'}`}>
        <div className="max-w-3xl mx-auto">

          {/* Messages */}
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {message.role === 'assistant' ? (
                    <img 
                      src={CHARACTER.profilePic}
                      alt={CHARACTER.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-coral/50"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-coral/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-coral text-xs font-bold">You</span>
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user' 
                      ? 'bg-coral text-white' 
                      : 'bg-white/10 text-white'
                  }`}>
                    <p className="font-space text-sm whitespace-pre-line">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Initial Path Selection */}
            {showInitialChoices && currentMessage?.choices && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {currentMessage.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handlePathSelect(choice)}
                    className="bg-white/5 hover:bg-white/10 border border-white/20 hover:border-coral rounded-xl p-4 text-left transition-all group"
                  >
                    <p className="font-space font-medium text-white group-hover:text-coral transition-colors">
                      {choice.label}
                    </p>
                    {choice.description && (
                      <p className="text-xs text-gray-400 mt-1">{choice.description}</p>
                    )}
                    <ArrowRight className="w-4 h-4 text-coral mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}

            {/* Job Selection */}
            {showJobSelection && matchedJobs.length > 0 && (
              <div className="space-y-3 mt-4">
                {matchedJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleJobSelect(job)}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/20 hover:border-coral rounded-xl p-4 text-left transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-space font-semibold text-white group-hover:text-coral transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-400">{job.company} - {job.location}</p>
                        <p className="text-xs text-gray-500 mt-1">{job.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-coral font-space text-sm">{job.salary}</span>
                        <p className="text-xs text-gray-500">{job.type}</p>
                      </div>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowJobSelection(false);
                    addBotMessage("No worries! Let's get your details anyway - we might have something perfect coming up soon.");
                    setShowForm(true);
                  }}
                  className="text-gray-400 hover:text-white font-space text-sm underline"
                >
                  None of these fit - show me the form anyway
                </button>
              </div>
            )}

            {/* Application Form */}
            {showForm && userPath && PATH_CONFIGS[userPath]?.formFields && (
              <div className="bg-white/5 border border-white/20 rounded-xl p-6 mt-4">
                <h3 className="font-orbitron text-lg font-bold text-white mb-4">Your Details</h3>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {PATH_CONFIGS[userPath].formFields!.map((field) => (
                    <div key={field.field}>
                      <label className="block text-sm font-space text-gray-300 mb-1">
                        {field.label} {field.required && <span className="text-coral">*</span>}
                      </label>
                      {field.type === 'file' ? (
                        <div>
                          <div 
                            onClick={() => {
                              const input = document.getElementById(`file-${field.field}`) as HTMLInputElement;
                              input?.click();
                            }}
                            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                              uploadedFiles[field.field] 
                                ? 'border-coral bg-coral/10' 
                                : 'border-white/20 hover:border-coral/50'
                            }`}
                          >
                            <input
                              id={`file-${field.field}`}
                              type="file"
                              className="hidden"
                              onChange={(e) => handleFileChange(field.field, e)}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            {uploadedFiles[field.field] ? (
                              <div className="flex items-center justify-center space-x-2 text-coral">
                                <Check className="w-5 h-5" />
                                <span className="font-space text-sm">{uploadedFiles[field.field].name}</span>
                              </div>
                            ) : (
                              <div className="text-gray-400">
                                <Upload className="w-6 h-6 mx-auto mb-1" />
                                <span className="font-space text-sm">Click to upload</span>
                              </div>
                            )}
                          </div>
                          {field.helpText && (
                            <p className="text-xs text-gray-500 mt-1">
                              {field.helpText}{' '}
                              {field.helpLink && (
                                <a 
                                  href={field.helpLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-coral hover:underline inline-flex items-center"
                                >
                                  Create here <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              )}
                            </p>
                          )}
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.field] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.field]: e.target.value }))}
                          placeholder={field.placeholder}
                          required={field.required}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 font-space focus:outline-none focus:border-coral transition-colors"
                        />
                      )}
                    </div>
                  ))}
                  {/* EU Consent Notice */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 mt-4">
                    <p className="text-xs text-gray-400 font-space">
                      By uploading documents and submitting this form, you consent to Blue OX using your uploads and personal data for processing your application in accordance with EU data protection regulations.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-coral hover:bg-coral-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-space font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start space-x-3">
                <img 
                  src={CHARACTER.profilePic}
                  alt={CHARACTER.name}
                  className="w-8 h-8 rounded-full object-cover border border-coral/50"
                />
                <div className="bg-white/10 rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Completion Actions */}
            {isComplete && !showForm && (
              <div className="mt-6 space-y-4">
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-green-600 hover:bg-green-700 text-white font-space font-semibold py-3 rounded-lg transition-colors text-center"
                >
                  Follow up on WhatsApp
                </a>
                <button
                  onClick={resetConversation}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-space py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Start New Conversation</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      {!isComplete && !showInitialChoices && !showForm && !showJobSelection && userPath && (
        <div className="bg-navy-dark/50 backdrop-blur-sm border-t border-white/10 px-4 py-4">
          <div className="max-w-3xl mx-auto">
            {/* Select Options */}
            {showSelectInput && currentMessage?.inputOptions && (
              <div className="flex flex-wrap gap-2 mb-3">
                {currentMessage.inputOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectOption(option)}
                    className="bg-white/10 hover:bg-coral text-white font-space text-sm px-4 py-2 rounded-full transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* Multi-Select Options */}
            {showMultiSelectInput && currentMessage?.inputOptions && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {currentMessage.inputOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleMultiSelectToggle(option)}
                      className={`font-space text-sm px-4 py-2 rounded-full transition-all flex items-center space-x-2 ${
                        selectedOptions.includes(option)
                          ? 'bg-coral text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {selectedOptions.includes(option) && <Check className="w-3 h-3" />}
                      <span>{option}</span>
                    </button>
                  ))}
                </div>
                {selectedOptions.length > 0 && (
                  <button
                    onClick={handleMultiSelectSubmit}
                    className="bg-coral hover:bg-coral-dark text-white font-space font-medium px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <span>Continue with {selectedOptions.length} selected</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Text Input */}
            {showTextInput && (
              <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                <input
                  ref={inputRef}
                  type={currentMessage?.inputType === 'number' ? 'number' : 'text'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={currentMessage?.inputPlaceholder || 'Type your answer...'}
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 font-space focus:outline-none focus:border-coral transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="bg-coral hover:bg-coral-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotInterface;
