const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../models/Chat');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    maxOutputTokens: 800, // Reduced from 1042 to help prevent timeouts
    temperature: 0.7, // Control randomness
    topK: 40, // Consider top 40 tokens
    topP: 0.95, // Nucleus sampling
  }
});

// Context for the AI to act as a career counselor
const SYSTEM_CONTEXT = `
You are Zariya, an expert AI career counselor with deep knowledge of various career paths, 
education requirements, job markets, and skill development. Your goal is to help users 
explore career options, make informed decisions, and develop plans to achieve their professional goals.

Some guidelines for your responses:
1. Be supportive, encouraging, and empathetic
2. Provide personalized advice based on the user's interests, skills, and goals
3. Offer specific, actionable suggestions rather than generic advice
4. Share relevant resources and steps for skill development
5. Ask clarifying questions when needed to provide better guidance
6. Be honest about the challenges of different career paths while maintaining a positive outlook

You specialize in:
- Career exploration and planning
- Educational pathway guidance
- Skill development recommendations
- Job market trends and insights
- Interview and resume advice
- Professional development strategies
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

// Find similar past messages based on word overlap
const findSimilarMessages = (currentMessage, allMessages) => {
  const currentWords = currentMessage.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const similar = [];
  
  allMessages.forEach((msg, index) => {
    if (msg.sender === 'user' && msg.content !== currentMessage) {
      const msgWords = msg.content.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      const intersection = currentWords.filter(word => msgWords.includes(word));
      const similarity = intersection.length / Math.max(currentWords.length, msgWords.length);
      
      if (similarity > 0.3) { // Threshold for similarity
        similar.push({
          userMessage: msg.content,
          botResponse: allMessages[index + 1] ? allMessages[index + 1].content : '',
          similarity: similarity
        });
      }
    }
  });
  
  // Sort by similarity and return top 3
  return similar.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
};

// Format chat history for Gemini
const formatChatHistory = (messages) => {
  return messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));
};





// Retry/backoff configuration (can be tuned via env)
const MAX_RETRIES = process.env.AI_MAX_RETRIES ? parseInt(process.env.AI_MAX_RETRIES, 10) : 3;
const BASE_DELAY_MS = process.env.AI_BASE_DELAY_MS ? parseInt(process.env.AI_BASE_DELAY_MS, 10) : 500;
const MAX_DELAY_MS = process.env.AI_MAX_DELAY_MS ? parseInt(process.env.AI_MAX_DELAY_MS, 10) : 10000;
const REQUEST_TIMEOUT_MS = process.env.AI_REQUEST_TIMEOUT_MS ? parseInt(process.env.AI_REQUEST_TIMEOUT_MS, 10) : 60000; // default timeout: 60 seconds (can be overridden via env)

// Determine if an error is retryable (503/5xx/429/service unavailable/overloaded)
const isRetryableError = (err) => {
  if (!err) return false;
  const msg = (err.message || '').toString();
  const code = err.code || err.status || (err.response && err.response.status);

  if (code === 429) return true; // rate limit
  if (code && Number(code) >= 500 && Number(code) < 600) return true; // server errors
  if (/503|service unavailable|overloaded|temporar/i.test(msg)) return true;
  return false;
};

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Call a function with a timeout. If it times out we reject with a specific error.
const callWithTimeout = (fnPromise, timeoutMs) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const e = new Error(`Request timed out after ${timeoutMs}ms`);
      e.code = 'ETIMEDOUT';
      reject(e);
    }, timeoutMs);

    fnPromise()
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

// Retry function with exponential backoff and jitter
const retryWithBackoff = async (fn, retries = MAX_RETRIES, baseDelay = BASE_DELAY_MS) => {
  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    try {
      // Wrap the actual call with a timeout guard
      const result = await callWithTimeout(fn, REQUEST_TIMEOUT_MS);
      if (attempt > 0) console.log(`Succeeded after ${attempt} retry(ies)`);
      return result;
    } catch (error) {
      lastError = error;

      // If this error is not retryable, break early
      if (!isRetryableError(error)) {
        // Non-retryable failure
        throw error;
      }

      // If we've exhausted attempts, break and throw
      if (attempt === retries) break;

      const expDelay = Math.min(MAX_DELAY_MS, baseDelay * Math.pow(2, attempt));
      const jitter = Math.floor(Math.random() * 1000); // up to 1s jitter
      const waitMs = expDelay + jitter;

      console.log(`Retrying AI request (attempt ${attempt + 1}/${retries}) due to retryable error: ${error.message || error}. Waiting ${waitMs}ms before next attempt.`);
      await sleep(waitMs);
      attempt += 1;
    }
  }

  // Exhausted all retries
  throw lastError || new Error('Unknown error during retry attempts');
};

// Process user message and get AI response
exports.processMessage = async (user, userMessage) => {
  try {
    const userId = user._id;
    const userName = user.firstName;
    
    // Get chat history
    const chat = await getChatHistory(userId);
    
    // Add user message to history
    chat.messages.push({
      content: userMessage,
      sender: 'user',
      timestamp: new Date()
    });
    
    // Find similar past messages
    const similarMessages = findSimilarMessages(userMessage, chat.messages.slice(0, -1));
    
    // Create personalized system context
    const personalizedContext = `
You are Zariya, an expert AI career counselor with deep knowledge of various career paths, 
education requirements, job markets, and skill development. Your goal is to help users 
explore career options, make informed decisions, and develop plans to achieve their professional goals.

You are talking to ${userName}. Always address them by their first name in your responses.

Some guidelines for your responses:
1. Be supportive, encouraging, and empathetic
2. Provide personalized advice based on the user's interests, skills, and goals
3. Offer specific, actionable suggestions rather than generic advice
4. Share relevant resources and steps for skill development
5. Ask clarifying questions when needed to provide better guidance
6. Be honest about the challenges of different career paths while maintaining a positive outlook
7. Use proper formatting with markdown for lists, bold text, etc. to make responses more readable

You specialize in:
- Career exploration and planning
- Educational pathway guidance
- Skill development recommendations
- Job market trends and insights
- Interview and resume advice
- Professional development strategies

${similarMessages.length > 0 ? `Based on similar past conversations:\n${similarMessages.map(sim => `User asked: "${sim.userMessage}"\nYou responded: "${sim.botResponse}"`).join('\n\n')}\n\nUse this context to provide consistent and improved responses.` : ''}
`;
    
    // Format chat history for Gemini
    const formattedHistory = formatChatHistory(chat.messages);
    
    // Check if this is a new chat or continuing conversation
    let response;
    if (chat.messages.length <= 1) {
      // Start new chat with system context
      const chatSession = model.startChat({
        history: [{ role: 'model', parts: [{ text: personalizedContext }] }],
      });
      response = await retryWithBackoff(() => chatSession.sendMessage(userMessage));
    } else {
      // Continue existing chat
      const chatSession = model.startChat({
        history: [
          { role: 'model', parts: [{ text: personalizedContext }] },
          ...formattedHistory.slice(0, -1) // Exclude the latest user message
        ],
      });
      response = await retryWithBackoff(() => chatSession.sendMessage(userMessage));
    }
    
    const botResponse = response.response.text();
    
    // Add bot response to chat history
    chat.messages.push({
      content: botResponse,
      sender: 'bot',
      timestamp: new Date()
    });
    
    // Update last updated timestamp
    chat.lastUpdated = new Date();
    
    // Save chat history
    await chat.save();
    
    return botResponse;
  } catch (error) {
    // Centralized error logging
    console.error('AI processing error:', error && (error.stack || error.message || error));

    // Prepare an error to throw with an appropriate HTTP status
    const errMsg = (error && (error.message || '')).toString().toLowerCase();

    const outErr = new Error();

    if (error && error.code === 'ETIMEDOUT') {
      outErr.message = "AI request timed out. Please try again later or simplify your query.";
      outErr.status = 504; // Gateway Timeout
    } else if (errMsg.includes('quota')) {
      outErr.message = "AI usage quota reached. Please try again later.";
      outErr.status = 429; // Too Many Requests
    } else if (errMsg.includes('503') || /service unavailable|overload|overloaded|temporar/i.test(errMsg) || (error && (error.code === 503 || error.status === 503))) {
      outErr.message = "AI service is currently unavailable. Please try again in a few minutes.";
      outErr.status = 503; // Service Unavailable
    } else {
      outErr.message = "AI service error. Please try again later.";
      outErr.status = 500;
    }

    // Attach original error for debugging (not sent to clients)
    outErr.original = error;
    throw outErr;
  }
};
