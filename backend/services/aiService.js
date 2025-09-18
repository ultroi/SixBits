const { GoogleGenerativeAI } = global.genAI;
const Chat = require('../models/Chat');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    maxOutputTokens: 300, // Reduced for concise responses
    temperature: 0.7,
    topK: 30,
    topP: 0.8, 
  }
});

// Simplified system context for educational counselor
const SYSTEM_CONTEXT = `
You are Zariya, an AI educational counselor specializing in career guidance.

**RESPONSE FORMAT RULES:**
- Keep responses under 150 words
- Always use bullet points for main information
- Start with a brief greeting using user's name
- Structure: Greeting → Key Points (bullets) → Next Step → Question
- Use **bold** for headers and key terms
- Be encouraging and practical

**Response Structure:**
**Hi [Name]!** Brief welcoming line.

**Key Points:**
- Point 1 with specific advice
- Point 2 with actionable step  
- Point 3 with resource/tip

**Next Step:** One clear action they can take.

**Question:** What would you like to explore next?

Focus on:
- Career exploration and planning
- Educational pathways
- Skill development
- Practical next steps
- Age-appropriate guidance

Keep it simple, actionable, and encouraging.
`;

// Get or create chat history
const getChatHistory = async (userId) => {
  let chat = await Chat.findOne({ user: userId });
  
  if (!chat) {
    chat = new Chat({
      user: userId,
      messages: []
    });
  }
  
  return chat;
};

// Format chat history for Gemini
const formatChatHistory = (messages) => {
  return messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));
};

// Simple response formatter - focuses on bullet points and conciseness
const formatResponse = (response, userName) => {
  if (!response) return '**Hi!** Please ask me about your career interests and I\'ll help guide you.';

  let formatted = response.toString().trim();

  // Basic cleanup
  formatted = formatted
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\*{3,}/g, '**')
    .replace(/^\s*[\*•]\s+/gm, '- ')
    .replace(/^\s*[-]\s*/gm, '- ');

  // Ensure greeting with name
  if (userName && !formatted.toLowerCase().includes(userName.toLowerCase())) {
    formatted = `**Hi ${userName}!** ${formatted}`;
  }

  // Ensure it ends with a question if not present
  if (!formatted.includes('?')) {
    formatted += '\n\n**Question:** What would you like to know more about?';
  }

  // Limit length - keep only first 200 words
  const words = formatted.split(/\s+/);
  if (words.length > 200) {
    formatted = words.slice(0, 200).join(' ') + '...';
  }

  return formatted;
};

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

const isRetryableError = (err) => {
  if (!err) return false;
  const code = err.code || err.status || (err.response && err.response.status);
  return code === 429 || (code >= 500 && code < 600);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async (fn, retries = MAX_RETRIES) => {
  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === retries) {
        break;
      }

      const waitMs = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 1000;
      await sleep(waitMs);
      attempt += 1;
    }
  }

  throw lastError || new Error('Request failed after retries');
};

// Main message processing function
exports.processMessage = async (user, userMessage) => {
  try {
    const userId = user._id;
    const userName = user.firstName;

    // Get chat history
    const chat = await getChatHistory(userId);

    // Add user message
    chat.messages.push({
      content: userMessage,
      sender: 'user',
      timestamp: new Date()
    });

    // Create personalized context
    const personalizedContext = `
${SYSTEM_CONTEXT}

You are helping ${userName}.

${user.quizResults && user.quizResults.length > 0 ? `
**${userName}'s Quiz Results:**
- Latest score: ${user.quizResults[user.quizResults.length - 1].score || 'N/A'}
- Suggested careers: ${user.quizResults[user.quizResults.length - 1].suggestedStreams?.join(', ') || 'Various options'}
- Key interests: ${user.quizResults[user.quizResults.length - 1].interests?.join(', ') || 'Exploring'}

Use this to give personalized advice.` : ''}

Always address ${userName} by name and keep responses focused and actionable.
`;

    // Format chat history
    const formattedHistory = formatChatHistory(chat.messages);

    // Get AI response
    let response;
    if (chat.messages.length <= 1) {
      const chatSession = model.startChat({
        history: [{ role: 'model', parts: [{ text: personalizedContext }] }],
      });
      response = await retryWithBackoff(() => chatSession.sendMessage(userMessage));
    } else {
      const chatSession = model.startChat({
        history: [
          { role: 'model', parts: [{ text: personalizedContext }] },
          ...formattedHistory.slice(0, -1)
        ],
      });
      response = await retryWithBackoff(() => chatSession.sendMessage(userMessage));
    }

    const botResponse = response.response.text();
    const formattedResponse = formatResponse(botResponse, userName);

    // Add bot response to history
    chat.messages.push({
      content: formattedResponse,
      sender: 'bot',
      timestamp: new Date()
    });

    chat.lastUpdated = new Date();
    await chat.save();

    return formattedResponse;

  } catch (error) {
    console.error('AI processing error:', error);

    const errMsg = (error?.message || '').toString().toLowerCase();
    
    if (errMsg.includes('quota') || error?.code === 429) {
      const quotaError = new Error('Daily AI usage limit reached. Please try again tomorrow.');
      quotaError.status = 429;
      throw quotaError;
    }

    if (errMsg.includes('503') || error?.code === 503) {
      const serviceError = new Error('AI service temporarily unavailable. Please try again in a few minutes.');
      serviceError.status = 503;
      throw serviceError;
    }

    const generalError = new Error('AI service error. Please try again.');
    generalError.status = 500;
    throw generalError;
  }
};

// Simplified quiz generation
exports.generatePersonalizedQuiz = async (userProfile) => {
  try {
    const { firstName, age, class: userClass, academicInterests } = userProfile;

    const prompt = `Create 10 career aptitude questions for ${firstName || 'student'}.

Profile: Age ${age}, Class ${userClass}, Interests: ${academicInterests?.join(', ')}

Format as JSON:
{
  "questions": [
    {
      "question": "Clear question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "category": "interest"
    }
  ]
}

Categories: "interest", "strength", "personality"
Keep questions simple and age-appropriate.`;

    const response = await retryWithBackoff(() => 
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 1500,
          temperature: 0.7,
        }
      })
    );

    let jsonText = response.response.text().trim();
    
    // Clean JSON response
    jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
    
    const quizData = JSON.parse(jsonText);
    return quizData.questions || [];

  } catch (error) {
    console.error('Quiz generation error:', error);
    
    if (error?.code === 429) {
      const quotaError = new Error('Daily AI usage limit reached. Please try again tomorrow.');
      quotaError.status = 429;
      throw quotaError;
    }

    throw new Error('Failed to generate quiz questions');
  }
};