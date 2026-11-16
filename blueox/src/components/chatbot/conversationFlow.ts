import { PathConfig, ChatChoice } from './types';

// Blue OX Character Profile
export const CHARACTER = {
  name: "Blue OX",
  role: "Your European Job Assistant",
  profilePic: "/pfp.png",
  greeting: "Hey there! I'm Blue OX, your buddy for finding awesome opportunities in Europe!",
  status: "Online - Ready to help!"
};

export const INITIAL_CHOICES: ChatChoice[] = [
  {
    id: 'student_university',
    label: "I'm a student looking for a school",
    value: 'student_university',
    description: 'Find universities and programs in Europe'
  },
  {
    id: 'worker_job',
    label: "I'm a worker looking for a job",
    value: 'worker_job',
    description: 'Find employment opportunities in Europe'
  },
  {
    id: 'student_job',
    label: "I'm a student looking for a job",
    value: 'student_job',
    description: 'Find work while you study'
  },
  {
    id: 'company',
    label: "I'm a company looking to hire",
    value: 'company',
    description: 'Connect with talented professionals from around the world'
  }
];

export const WELCOME_MESSAGE = `Hey! I'm Blue OX.

I've helped over 200 people just like you find schools and jobs across Europe - from the Netherlands to Poland, Czech Republic, Hungary, and beyond.

Here's what I do: I find you the right opportunity, walk you through the paperwork, and get you there. And if you're looking for work, we guarantee you a job in 90 days - or we work for free.

So tell me, what brings you here today?`;

// Single source of truth for the business WhatsApp link — Contact.tsx and Jobs.tsx
// import this instead of redefining their own copy. Override via VITE_WHATSAPP_LINK
// to change the number without touching code.
export const WHATSAPP_LINK = import.meta.env.VITE_WHATSAPP_LINK || "https://wa.me/message/F6QOLB6IS3VHF1";

// Company flow - redirect to WhatsApp
export const COMPANY_REDIRECT_MESSAGE = `Great! We specialize in connecting companies with skilled Blue Collar workers across Europe.

Our expertise includes placing Electricians, Welders, Carpenters, Truck Drivers, Construction Workers, Warehouse Staff, and more.

For the best experience, let's chat directly. Our team can walk you through everything.

Reach out to us here: ${WHATSAPP_LINK}

Looking forward to hearing from you!`;

export const PATH_CONFIGS: Record<string, PathConfig> = {
  student_university: {
    id: 'student_university',
    name: 'Student University Path',
    steps: [
      {
        id: 'education_level',
        question: "Awesome! You're looking to study in Europe! This is gonna be so exciting!\n\nLet me ask you a few quick questions so I can point you in the right direction.\n\nFirst up - what's your current education level?",
        inputType: 'select',
        field: 'educationLevel',
        inputOptions: ["Bachelor's Degree", "Master's Degree"]
      },
      {
        id: 'target_countries',
        question: "Perfect! Now, which European countries are you interested in?\n\nPick as many as you like - keeping your options open is always smart!",
        inputType: 'multiselect',
        field: 'targetCountries',
        inputOptions: ['Netherlands', 'Poland', 'Czech Republic', 'Hungary', 'France', 'Spain', 'Italy', 'Greece', 'Slovakia', 'Romania', 'Serbia', 'Bulgaria', 'Lithuania', 'Croatia', 'Other']
      },
      {
        id: 'field_of_study',
        question: "What fields are you interested in studying?\n\nYou can choose multiple - I know it's hard to pick just one! Don't worry, I'll walk you through everything step by step!",
        inputType: 'multiselect',
        field: 'fieldOfStudy',
        inputOptions: ['Engineering', 'Business & Economics', 'Computer Science', 'Medicine & Health', 'Arts & Humanities', 'Natural Sciences', 'Law', 'Other']
      },
      {
        id: 'budget',
        question: "Let's talk money - what's your approximate annual budget for tuition and living expenses?\n\nBe honest, it helps me find the right fit for you. Together we'll make it happen!",
        inputType: 'select',
        field: 'budget',
        inputOptions: ['Under 5,000 EUR', '5,000 - 10,000 EUR', '10,000 - 15,000 EUR', '15,000 - 20,000 EUR', 'Over 20,000 EUR']
      },
      {
        id: 'start_date',
        question: "When are you hoping to start your studies? We're gonna make your European dreams come true!",
        inputType: 'select',
        field: 'startDate',
        inputOptions: ['Spring 2025', 'Fall 2025', 'Spring 2026', 'Fall 2026', 'Not sure yet']
      }
    ],
    formFields: [
      { field: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Your full name', required: true },
      { field: 'email', label: 'Email Address', type: 'email', placeholder: 'your.email@example.com', required: true },
      { field: 'whatsapp', label: 'WhatsApp Number', type: 'tel', placeholder: '+234 XXX XXX XXXX', required: true },
      { field: 'nationality', label: 'Nationality', type: 'text', placeholder: 'Your nationality', required: true },
      { field: 'cv', label: 'Europass CV', type: 'file', required: true, helpText: 'Create one at europass.europa.eu/en/create-europass-cv', helpLink: 'https://europass.europa.eu/en/create-europass-cv' },
      { field: 'passport', label: 'Passport (clearly scanned)', type: 'file', required: true }
    ]
  },
  
  worker_job: {
    id: 'worker_job',
    name: 'Worker Job Path',
    steps: [
      {
        id: 'target_countries',
        question: "Looking for work in Europe? You've come to the right place!\n\nWhich countries are you interested in working in?",
        inputType: 'multiselect',
        field: 'targetCountries',
        inputOptions: ['Netherlands', 'Poland', 'Czech Republic', 'Hungary', 'Belgium', 'Greece', 'Slovakia', 'Romania', 'Serbia', 'Bulgaria', 'Lithuania', 'Croatia', 'Any']
      },
      {
        id: 'skills',
        question: "What are your main skills?\n\nSelect all that apply.",
        inputType: 'multiselect',
        field: 'skills',
        inputOptions: ['Electricians', 'Scaffolders', 'Mig Welding', 'Mug Welding', 'Carpentry', 'Truck Drivers', 'Forklift Drivers', 'Construction Helpers', 'Plumbers', 'HVAC Techs', 'Caregivers', 'Warehouse Workers', 'Ship Building', 'Any']
      },
      {
        id: 'experience_years',
        question: "How many years of experience do you have? You can do it!",
        inputType: 'select',
        field: 'experienceYears',
        inputOptions: ['Less than 1 year', '1-2 years', '3-5 years', '5-10 years', 'More than 10 years']
      },
      {
        id: 'salary_expectation',
        question: "What monthly salary are you looking for? (in EUR)\n\nDon't undersell yourself - you're worth it!",
        inputType: 'select',
        field: 'salaryExpectation',
        inputOptions: ['1,000 - 1,500 EUR', '1,500 - 2,000 EUR', '2,000 - 2,500 EUR', '2,500 - 3,000 EUR', 'Over 3,000 EUR', 'Negotiable']
      },
      {
        id: 'availability',
        question: "When can you start a new position? We're gonna find something perfect for you!",
        inputType: 'select',
        field: 'availability',
        inputOptions: ['Immediately', 'Within 1 month', 'Within 3 months', 'Within 6 months', 'Flexible']
      }
    ],
    showJobMatching: true,
    formFields: [
      { field: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Your full name', required: true },
      { field: 'email', label: 'Email Address', type: 'email', placeholder: 'your.email@example.com', required: true },
      { field: 'whatsapp', label: 'WhatsApp Number', type: 'tel', placeholder: '+234 XXX XXX XXXX', required: true },
      { field: 'cv', label: 'Europass CV', type: 'file', required: true, helpText: 'Create one at europass.europa.eu/en/create-europass-cv', helpLink: 'https://europass.europa.eu/en/create-europass-cv' },
      { field: 'passport', label: 'Passport (clearly scanned)', type: 'file', required: true }
    ]
  },

  student_job: {
    id: 'student_job',
    name: 'Student Job Path',
    steps: [
      {
        id: 'education_level',
        question: "Nice! A student looking for work - I love the hustle! You've got this!\n\nWhat's your current education level?",
        inputType: 'select',
        field: 'educationLevel',
        inputOptions: ["Bachelor's Degree", "Master's Degree"]
      },
      {
        id: 'target_countries',
        question: "Which European country are you interested in?",
        inputType: 'multiselect',
        field: 'targetCountries',
        inputOptions: ['Netherlands', 'Poland', 'Czech Republic', 'Hungary', 'France', 'Spain', 'Italy', 'Greece', 'Slovakia', 'Romania', 'Serbia', 'Bulgaria', 'Lithuania', 'Croatia', 'Other']
      },
      {
        id: 'start_date',
        question: "When would you like to start working? Together we'll make it happen!",
        inputType: 'select',
        field: 'startDate',
        inputOptions: ['Immediately', 'Within 1 month', 'Within 3 months', 'Within 6 months', 'Flexible']
      }
    ],
    showJobMatching: true,
    formFields: [
      { field: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Your full name', required: true },
      { field: 'email', label: 'Email Address', type: 'email', placeholder: 'your.email@example.com', required: true },
      { field: 'whatsapp', label: 'WhatsApp Number', type: 'tel', placeholder: '+234 XXX XXX XXXX', required: true },
      { field: 'nationality', label: 'Nationality', type: 'text', placeholder: 'Your nationality', required: true },
      { field: 'cv', label: 'Europass CV', type: 'file', required: true, helpText: 'Create one at europass.europa.eu/en/create-europass-cv', helpLink: 'https://europass.europa.eu/en/create-europass-cv' },
      { field: 'passport', label: 'Passport (clearly scanned)', type: 'file', required: true }
    ]
  },
  
  company: {
    id: 'company',
    name: 'Company Path',
    steps: [],
    redirectToWhatsApp: true
  }
};

export const getPreFormMessage = (path: string, jobSelected?: string): string => {
  const messages: Record<string, string> = {
    student_university: `This is looking great! I've got a good picture of what you're looking for.

Now I just need a few details from you so our team can start finding the perfect schools. Fill out this quick form and we'll take it from there! You can do it!`,
    
    worker_job: jobSelected 
      ? `Excellent choice! "${jobSelected}" looks like a great fit for you! Oh yeah!

Let me get your details so we can move forward with your application.`
      : `Based on what you've told me, I think we can find you something great!

Fill out this form and upload your documents - then we'll get the ball rolling! I believe in you!`,
    
    student_job: jobSelected
      ? `Nice pick! "${jobSelected}" could be perfect for you! This is gonna be awesome!

Just need your details and documents to get your application started.`
      : `I've got some good options in mind for you!

Let's get your details down so we can connect you with the right opportunities. You've got this!`
  };
  
  return messages[path] || "Let's get your details! You can do it!";
};

export const getCompletionMessage = (path: string, data: Record<string, unknown>): string => {
  const name = ((data.fullName || 'there') as string).split(' ')[0];
  
  return `You're all set, ${name}! This is so exciting!

Your application has been submitted and our team is already on it. We'll reach out to you on WhatsApp within 24-48 hours.

In the meantime, keep an eye on your messages. If you have any questions, don't hesitate to reach out! I believe in you - we're gonna make your European dreams come true!

Follow up your progress on WhatsApp: ${WHATSAPP_LINK}`;
};