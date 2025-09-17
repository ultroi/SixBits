const { GoogleGenerativeAI } = global.genAI;
const Chat = require('../models/Chat');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    maxOutputTokens: 500, // Reduced for concise responses
    temperature: 0.6, // Slightly reduced for more focused responses
    topK: 40, // Consider top 40 tokens
    topP: 0.9, 
  }
});

// Context for the AI to act as a career counselor
const SYSTEM_CONTEXT = `
You are Zariya, an expert AI career counselor with deep knowledge of various career paths, 
education requirements, job markets, and skill development. Your goal is to help users 
explore career options, make informed decisions, and develop plans to achieve their professional goals.

RESPONSE FORMATTING GUIDELINES:
- Keep responses VERY concise (aim for 100-200 words maximum)
- NEVER write long paragraphs - break everything into short points
- Use clear, structured formatting with markdown
- Use **bold** for emphasis on key points and important terms
- Use *italic* for subtle emphasis or highlighting specific concepts
- Use bullet points (-) for ALL lists and steps
- Use numbered lists (1., 2., 3.) for sequential steps or ordered information
- Use proper headings with ## for sections when needed
- Add line breaks between sections for better readability
- Use proper spacing: single line between paragraphs, double line between major sections
- Structure responses with: brief intro → key points in bullets/numbers → conclusion
- Use code blocks (\`\`\`) for examples or technical terms when appropriate
- Ensure consistent formatting throughout the response

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

// Helper function to validate response formatting
const isWellFormatted = (response) => {
  if (!response || typeof response !== 'string') return false;

  const checks = [
    /\*\*.*?\*\*/.test(response),        // Has bold text
    /^- /.test(response.split('\n').find(line => line.trim().startsWith('-')) || ''), // Proper bullets
    response.includes('?'),               // Has question
    response.split('\n').length > 3       // Has multiple lines
  ];

  return checks.filter(Boolean).length >= 2; // At least 2 formatting elements
};

// Final cleanup function
const applyFinalCleanup = (response, userName) => {
  let cleaned = response
    .replace(/\n{3,}/g, '\n\n')           // Remove excessive line breaks
    .replace(/\s{2,}/g, ' ')              // Remove excessive spaces
    .replace(/^\s+|\s+$/g, '');           // Trim

  // Ensure it starts with user's name if not already
  if (userName && !cleaned.toLowerCase().includes(userName.toLowerCase().substring(0, 3))) {
    cleaned = `**Hi ${userName}!**\n\n${cleaned}`;
  }

  // Ensure it ends with a question
  if (!cleaned.includes('?')) {
    cleaned += '\n\n**Question:** What would you like to explore next?';
  }

  return cleaned;
};

// Enhanced post-processing function for AI responses
// Ensures consistent, well-formatted, and structured responses
const formatAIResponse = (response) => {
  if (!response) return 'I apologize, but I couldn\'t generate a response. Please try again.';
  
  let formatted = response.toString().trim();

  // Step 1: Basic cleanup and normalization
  formatted = formatted
    .replace(/\r\n/g, '\n')           // Normalize line endings
    .replace(/\n{4,}/g, '\n\n\n')    // Limit to max 3 consecutive newlines
    .replace(/[ \t]+/g, ' ')         // Collapse multiple spaces/tabs
    .replace(/\s+$/gm, '')           // Remove trailing whitespace from lines

  // Step 2: Fix markdown formatting issues
  formatted = formatted
    .replace(/\*{4,}/g, '**')                    // Fix excessive asterisks
    .replace(/\*\s*\*\s*/g, '**')               // Fix spaced asterisks
    .replace(/\*\*\s*(.*?)\s*\*\*/g, '**$1**')  // Clean bold formatting
    .replace(/\*([^*\n]+)\*/g, '*$1*')          // Clean italic formatting
    .replace(/(^|\s)\*(?=\s|$)/g, '$1')         // Remove stray asterisks

  // Step 3: Normalize bullet points and lists
  formatted = formatted
    .replace(/^\s*[\*•]\s+/gm, '- ')           // Convert * and • to -
    .replace(/^\s*[-]\s*/gm, '- ')             // Ensure consistent bullet spacing
    .replace(/^(\s*\d+)\.(\S)/gm, '$1. $2')    // Fix numbered list spacing
    .replace(/^(#{1,6})([^\s#])/gm, '$1 $2')   // Fix header spacing

  // Step 4: Remove filler phrases for conciseness
  const fillerPhrases = [
    /\bWell,?\s*/gi,
    /\bSo,?\s*/gi,
    /\bActually,?\s*/gi,
    /\bBasically,?\s*/gi,
    /\bI would say that\b/gi,
    /\bIn my opinion,?\s*/gi,
    /\bAs an? (?:AI|assistant),?\s*/gi,
    /\bYou know,?\s*/gi,
    /\bLet me tell you,?\s*/gi,
    /\bTo be honest,?\s*/gi
  ];
  
  fillerPhrases.forEach(phrase => {
    formatted = formatted.replace(phrase, '');
  });

  // Step 5: Ensure proper capitalization
  formatted = formatted.trim();
  if (formatted && !formatted.charAt(0).match(/[A-Z#\-\*\[\d]/)) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  // Step 6: Structure detection and standardization
  const sections = extractSections(formatted);
  
  // Step 7: Build standardized response structure
  return buildStructuredResponse(sections, formatted);
};

// Helper function to extract sections from the response
const extractSections = (text) => {
  const sections = {};
  
  // Common section patterns
  const patterns = {
    tldr: /(?:^|\n)(?:\*\*)?(?:TL;DR|Summary|Quick Answer)(?:\*\*)?[:\-]?\s*(.+?)(?=\n\n|\n\*\*|$)/is,
    keyPoints: /(?:^|\n)(?:\*\*)?(?:Key [Pp]oints?|Main [Pp]oints?|Important [Pp]oints?)(?:\*\*)?[:\-]?\s*([\s\S]*?)(?=\n\n\*\*|\n\*\*[A-Z]|$)/is,
    nextSteps: /(?:^|\n)(?:\*\*)?(?:Next [Ss]teps?|Action [Pp]lan|What to [Dd]o|Recommendations?)(?:\*\*)?[:\-]?\s*([\s\S]*?)(?=\n\n\*\*|\n\*\*[A-Z]|$)/is,
    resources: /(?:^|\n)(?:\*\*)?(?:Resources?|Links?|References?|Further [Rr]eading)(?:\*\*)?[:\-]?\s*([\s\S]*?)(?=\n\n\*\*|\n\*\*[A-Z]|$)/is,
    question: /(?:^|\n)(?:\*\*)?(?:Question|Clarifying [Qq]uestion|Want to know)(?:\*\*)?[:\-]?\s*(.+?)(?=\n\n|$)/is
  };

  Object.keys(patterns).forEach(key => {
    const match = text.match(patterns[key]);
    if (match && match[1]) {
      sections[key] = match[1].trim();
    }
  });

  return sections;
};

// Helper function to build structured response
const buildStructuredResponse = (sections, originalText) => {
  const parts = [];
  
  // 1. TL;DR or opening statement
  if (sections.tldr) {
    const cleanTldr = sections.tldr
      .split(/\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(' ')
      .replace(/^[-\*\d\.]+\s*/, '');
    
    if (cleanTldr.length > 10) {
      parts.push(`**TL;DR:** ${cleanTldr}`);
      parts.push(''); // Add spacing
    }
  } else {
    // Extract first meaningful sentence as TL;DR
    const sentences = originalText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim().replace(/^[-\*\d\.]+\s*/, '');
      if (firstSentence.length > 10) {
        parts.push(`**TL;DR:** ${firstSentence}.`);
        parts.push(''); // Add spacing
      }
    }
  }

  // 2. Key Points
  if (sections.keyPoints) {
    const keyPoints = extractBulletPoints(sections.keyPoints, 6);
    if (keyPoints.length > 0) {
      parts.push('**Key Points:**');
      keyPoints.forEach(point => {
        parts.push(`- ${point}`);
      });
      parts.push(''); // Add spacing
    }
  } else {
    // Extract bullet points from original text
    const bulletPoints = extractBulletPoints(originalText, 4);
    if (bulletPoints.length > 0) {
      parts.push('**Key Points:**');
      bulletPoints.forEach(point => {
        parts.push(`- ${point}`);
      });
      parts.push(''); // Add spacing
    }
  }

  // 3. Next Steps (if available)
  if (sections.nextSteps) {
    const steps = extractNumberedPoints(sections.nextSteps, 5);
    if (steps.length > 0) {
      parts.push('**Next Steps:**');
      steps.forEach((step, idx) => {
        parts.push(`${idx + 1}. ${step}`);
      });
      parts.push(''); // Add spacing
    }
  }

  // 4. Resources (if available)
  if (sections.resources) {
    const resources = extractBulletPoints(sections.resources, 4);
    if (resources.length > 0) {
      parts.push('**Resources:**');
      resources.forEach(resource => {
        parts.push(`- ${resource}`);
      });
      parts.push(''); // Add spacing
    }
  }

  // 5. Clarifying question (always include)
  if (sections.question) {
    const cleanQuestion = sections.question.trim().replace(/^[-\*\d\.]+\s*/, '');
    if (!cleanQuestion.endsWith('?')) {
      parts.push(`**Question:** ${cleanQuestion}?`);
    } else {
      parts.push(`**Question:** ${cleanQuestion}`);
    }
  } else {
    // Check if original text ends with a question
    const hasQuestion = /\?[^?]*$/.test(originalText);
    if (!hasQuestion) {
      parts.push('**Question:** What specific aspect would you like me to explore further?');
    }
  }

  // Fallback: If no structure was found, create a clean paragraph
  if (parts.length <= 2) {
    const cleanText = originalText
      .split(/\n+/)
      .map(line => line.trim())
      .filter(Boolean)
      .join(' ')
      .split(/\s+/)
      .slice(0, 150)  // Limit to 150 words
      .join(' ');
    
    return `${cleanText}\n\n**Question:** What would you like to know more about?`;
  }

  // Join all parts and clean up
  let result = parts.join('\n');
  
  // Final cleanup
  result = result
    .replace(/\n{3,}/g, '\n\n')      // Max 2 consecutive newlines
    .replace(/^\s+|\s+$/g, '')       // Trim start and end
    .replace(/\n\s*\n\s*$/g, '');    // Remove trailing empty lines

  return result;
};

// Helper function to extract bullet points
const extractBulletPoints = (text, maxPoints = 5) => {
  if (!text) return [];
  
  const points = text
    .split(/\n+/)
    .map(line => line.trim())
    .filter(line => line.length > 10)
    .map(line => line.replace(/^[-\*•\d\.]+\s*/, ''))
    .filter(line => line.length > 5)
    .slice(0, maxPoints);
  
  return points;
};

// Helper function to extract numbered points
const extractNumberedPoints = (text, maxPoints = 5) => {
  if (!text) return [];
  
  const points = text
    .split(/\n+/)
    .map(line => line.trim())
    .filter(line => line.length > 10)
    .map(line => line.replace(/^[\d\.]+\s*/, ''))
    .filter(line => line.length > 5)
    .slice(0, maxPoints);
  
  return points;
};

// Additional function to ensure proper name integration
const ensurePersonalizedGreeting = (formattedResponse, userName) => {
  if (!userName || !formattedResponse) return formattedResponse;
  
  // If response doesn't mention the user's name, add it to the beginning
  if (!formattedResponse.toLowerCase().includes(userName.toLowerCase())) {
    const firstLine = formattedResponse.split('\n')[0];
    if (firstLine.startsWith('**Hi')) {
      return formattedResponse.replace(
        `**Hi ${userName}!`
      );
    } else {
      return `**Hi ${userName}!**\n\n${formattedResponse}`;
    }
  }
  
  return formattedResponse;
};

module.exports = {
  formatAIResponse,
  ensurePersonalizedGreeting,
  isWellFormatted,
  applyFinalCleanup,
  processMessage,
  generatePersonalizedQuiz
};





// Retry/backoff configuration (can be tuned via env)
const MAX_RETRIES = process.env.AI_MAX_RETRIES ? parseInt(process.env.AI_MAX_RETRIES, 10) : 3;
const BASE_DELAY_MS = process.env.AI_BASE_DELAY_MS ? parseInt(process.env.AI_BASE_DELAY_MS, 10) : 500;
const MAX_DELAY_MS = process.env.AI_MAX_DELAY_MS ? parseInt(process.env.AI_MAX_DELAY_MS, 10) : 10000;
const REQUEST_TIMEOUT_MS = process.env.AI_REQUEST_TIMEOUT_MS ? parseInt(process.env.AI_REQUEST_TIMEOUT_MS, 10) : 60000; // default timeout: 60 seconds (can be overridden via env)

// Determine if an error is retryable (503/5xx/429/service unavailable/overloaded)
const isRetryableError = (err) => {
  if (!err) return false;
  const msg = (err.message || '').toString().toLowerCase();
  const code = err.code || err.status || (err.response && err.response.status);

  if (code === 429) return true; // rate limit
  if (code && Number(code) >= 500 && Number(code) < 600) return true; // server errors
  if (/503|service unavailable|overloaded|temporar|quota/i.test(msg)) return true;
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
      if (attempt > 0) console.log(`AI request succeeded after ${attempt} retry(ies)`);
      return result;
    } catch (error) {
      lastError = error;

      // If this error is not retryable, break early
      if (!isRetryableError(error)) {
        console.error(`Non-retryable error encountered: ${error.message || error}`);
        throw error;
      }

      // If we've exhausted attempts, break and throw
      if (attempt === retries) {
        console.error(`Exhausted all ${retries} retry attempts. Last error: ${error.message || error}`);
        break;
      }

      // Calculate delay based on error type
      let waitMs;
      const errMsg = (error.message || '').toLowerCase();

      if (errMsg.includes('quota') || error.code === 429) {
        // For quota errors, use longer delays and respect retry-after if available
        const retryAfter = error.retryDelay || getRetryDelayFromError(error);
        if (retryAfter) {
          waitMs = Math.min(MAX_DELAY_MS, retryAfter * 1000); // Convert to milliseconds
        } else {
          // Use exponential backoff for quota errors with longer base delay
          const quotaBaseDelay = Math.max(BASE_DELAY_MS * 2, 5000); // At least 5 seconds
          const expDelay = Math.min(MAX_DELAY_MS, quotaBaseDelay * Math.pow(2, attempt));
          const jitter = Math.floor(Math.random() * 2000); // up to 2s jitter
          waitMs = expDelay + jitter;
        }
        console.log(`Quota exceeded - retrying in ${waitMs}ms (attempt ${attempt + 1}/${retries})`);
      } else {
        // For other retryable errors, use standard exponential backoff
        const expDelay = Math.min(MAX_DELAY_MS, baseDelay * Math.pow(2, attempt));
        const jitter = Math.floor(Math.random() * 1000); // up to 1s jitter
        waitMs = expDelay + jitter;
        console.log(`Retrying AI request (attempt ${attempt + 1}/${retries}) due to error: ${error.message || error}. Waiting ${waitMs}ms`);
      }

      await sleep(waitMs);
      attempt += 1;
    }
  }

  // Exhausted all retries
  throw lastError || new Error('Unknown error during retry attempts');
};

// Extract retry delay from error response (for Google Gemini API)
const getRetryDelayFromError = (error) => {
  if (!error) return null;

  // Try to extract from error message
  const msg = error.message || '';
  const retryMatch = msg.match(/retryDelay["\s:]*(\d+)/i);
  if (retryMatch) {
    return parseInt(retryMatch[1], 10);
  }

  // Check for retry-after header if available
  if (error.response && error.response.headers) {
    const retryAfter = error.response.headers['retry-after'];
    if (retryAfter) {
      return parseInt(retryAfter, 10);
    }
  }

  return null;
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

    // Create personalized system context with enhanced formatting instructions
    const personalizedContext = `
You are Zariya, an expert AI career counselor with deep knowledge of various career paths,
education requirements, job markets, and skill development. Your goal is to help users
explore career options, make informed decisions, and develop plans to achieve their professional goals.

You are talking to ${userName}. Always address them by their first name in your responses.

CRITICAL RESPONSE FORMATTING REQUIREMENTS:
- ALWAYS structure your response with clear sections using **bold headers**
- Use proper markdown formatting throughout
- Keep responses concise (150-250 words maximum)
- Use bullet points (-) for all lists
- Use numbered lists (1., 2., 3.) for sequential steps
- Add proper line breaks between sections
- End with a clarifying question

MANDATORY RESPONSE STRUCTURE:
1. Start with a brief, personalized greeting using their name
2. Provide key points in bullet format
3. Include next steps if applicable
4. End with a specific question to continue the conversation

FORMATTING EXAMPLES:
**Hi [Name]! TL;DR:** Brief summary of your advice.

**Key Points:**
- First important point with specific details
- Second point with actionable advice
- Third point connecting to their interests

**Next Steps:**
1. Specific action they can take immediately
2. Medium-term goal to work towards
3. Long-term planning suggestion

**Question:** What aspect interests you most?

Some guidelines for your responses:
1. Be supportive, encouraging, and empathetic
2. Provide personalized advice based on the user's interests, skills, and goals
3. Offer specific, actionable suggestions rather than generic advice
4. Share relevant resources and steps for skill development
5. Ask clarifying questions when needed to provide better guidance
6. Be honest about the challenges of different career paths while maintaining a positive outlook
7. ALWAYS use proper markdown formatting for better readability
8. NEVER write long paragraphs - break everything into structured sections

You specialize in:
- Career exploration and planning
- Educational pathway guidance
- Skill development recommendations
- Job market trends and insights
- Interview and resume advice
- Professional development strategies

${user.quizResults && user.quizResults.length > 0 ? `
**USER'S QUIZ RESULTS ANALYSIS:**
Based on ${userName}'s recent quiz results, here are the key insights:

**Quiz Performance Summary:**
- Latest quiz score: ${user.quizResults[user.quizResults.length - 1].score || 'N/A'}
- Suggested career streams: ${user.quizResults[user.quizResults.length - 1].suggestedStreams?.join(', ') || 'Not available'}

**Detailed Question Responses:**
${user.quizResults[user.quizResults.length - 1].detailedAnswers?.map((answer, idx) =>
  `${idx + 1}. **Question ${answer.questionIndex + 1}** (${answer.category}): "${answer.question}"
   - Selected: "${answer.answerText}"`
).join('\n') || 'Detailed answers not available'}

**Key Interests Identified:**
${user.quizResults[user.quizResults.length - 1].interests?.map(interest => `- ${interest}`).join('\n') || 'Not available'}

**Key Strengths Identified:**
${user.quizResults[user.quizResults.length - 1].strengths?.map(strength => `- ${strength}`).join('\n') || 'Not available'}

**Personality Traits Identified:**
${user.quizResults[user.quizResults.length - 1].personalityTraits?.map(trait => `- ${trait}`).join('\n') || 'Not available'}

Use this detailed quiz information to provide highly personalized career guidance and recommendations.` : ''}

${similarMessages.length > 0 ? `
**CONVERSATION CONTEXT:**
Based on similar past conversations:
${similarMessages.map(sim => `User asked: "${sim.userMessage}"
You responded: "${sim.botResponse}"`).join('\n\n')}

Use this context to provide consistent and improved responses.` : ''}
`;

    // Mapping notice for quiz codes
    const mappingNotice = `
IMPORTANT: When referring to quiz result codes, ALWAYS replace internal codes with friendly labels:

**Interest Mapping:**
- Interest_0 -> Technology (programming, software, computers)
- Interest_1 -> Arts & Design (design, visual, creative)
- Interest_2 -> Science (research, laboratory, experimentation)
- Interest_3 -> Business (entrepreneurship, management, commerce)

**Trait Mapping:**
- Trait_0 -> Introvert (reflective, reserved, thoughtful)
- Trait_1 -> Outgoing (social, energetic, communicative)
- Trait_2 -> Analytical (logical, data-driven, detail-oriented)
- Trait_3 -> Empathetic (empathetic, people-oriented, supportive)

NEVER output raw codes like Interest_1 or Trait_1. Always use mapped labels with keywords.
`;

    const finalPersonalizedContext = mappingNotice + '\n' + personalizedContext;

    // Format chat history for Gemini
    const formattedHistory = formatChatHistory(chat.messages);

    // Get AI response
    let response;
    if (chat.messages.length <= 1) {
      // Start new chat with system context
      const chatSession = model.startChat({
        history: [{ role: 'model', parts: [{ text: finalPersonalizedContext }] }],
      });
      response = await retryWithBackoff(() => chatSession.sendMessage(userMessage));
    } else {
      // Continue existing chat
      const chatSession = model.startChat({
        history: [
          { role: 'model', parts: [{ text: finalPersonalizedContext }] },
          ...formattedHistory.slice(0, -1) // Exclude the latest user message
        ],
      });
      response = await retryWithBackoff(() => chatSession.sendMessage(userMessage));
    }

    const botResponse = response.response.text();

    // Apply enhanced formatting
    let formattedResponse = formatAIResponse(botResponse);

    // Ensure personalized greeting with user's name
    formattedResponse = ensurePersonalizedGreeting(formattedResponse, userName);

    // Validate formatting (optional quality check)
    if (!isWellFormatted(formattedResponse)) {
      console.log('Response formatting could be improved, applying additional cleanup...');
      formattedResponse = applyFinalCleanup(formattedResponse, userName);
    }

    // Add formatted bot response to chat history
    chat.messages.push({
      content: formattedResponse,
      sender: 'bot',
      timestamp: new Date()
    });

    // Update last updated timestamp
    chat.lastUpdated = new Date();

    // Save chat history
    await chat.save();

    return formattedResponse;
  } catch (error) {
    // ... (rest of error handling remains the same)
    console.error('AI processing error:', error && (error.stack || error.message || error));

    const errMsg = (error && (error.message || '')).toString().toLowerCase();
    const isQuotaError = errMsg.includes('quota') || errMsg.includes('429') ||
                        (error && (error.code === 429 || error.status === 429));

    if (isQuotaError) {
      const quotaError = new Error('AI usage quota exceeded. The free tier allows 50 requests per day. Please try again tomorrow or consider upgrading your plan.');
      quotaError.status = 429;
      quotaError.original = error;
      throw quotaError;
    }

    const outErr = new Error();

    if (error && error.code === 'ETIMEDOUT') {
      outErr.message = "AI request timed out. Please try again later or simplify your query.";
      outErr.status = 504;
    } else if (errMsg.includes('503') || /service unavailable|overload|overloaded|temporar/i.test(errMsg) || (error && (error.code === 503 || error.status === 503))) {
      outErr.message = "AI service is currently unavailable. Please try again in a few minutes.";
      outErr.status = 503;
    } else {
      outErr.message = "AI service error. Please try again later.";
      outErr.status = 500;
    }

    outErr.original = error;
    throw outErr;
  }
};

// Generate personalized quiz questions based on user profile
exports.generatePersonalizedQuiz = async (userProfile) => {
  try {
    const {
      firstName,
      age,
      gender,
      class: userClass,
      academicInterests,
      location
    } = userProfile;

    const prompt = `
You are an expert career counselor creating a personalized aptitude quiz for ${firstName || 'a student'}.

USER PROFILE:
- Age: ${age || 'Not specified'}
- Gender: ${gender || 'Not specified'}
- Class/Grade: ${userClass || 'Not specified'}
- Academic Interests: ${academicInterests?.join(', ') || 'Not specified'}
- Location: ${location?.city || 'Not specified'}, ${location?.state || 'Not specified'}

Create 10 personalized multiple-choice questions (4 options each) that assess:
1. Academic interests and preferences
2. Personal strengths and skills
3. Career personality traits
4. Subject preferences based on their profile

Each question should have:
- A clear, engaging question
- 4 realistic options
- Indicate which option represents the "correct" or most suitable answer (as index 0-3)
- A category: "interest", "strength", or "personality"

Format your response as valid JSON:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "category": "interest"
    }
  ]
}

Make questions relevant to their age, class level, and interests. Focus on career exploration and academic guidance.
`;

    const response = await retryWithBackoff(() => 
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.7,
        }
      })
    );

    const responseText = response.response.text();
    
    // Clean the response to extract JSON
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\s*/, '').replace(/```\s*$/, '');
    }

    try {
      const quizData = JSON.parse(jsonText);
      return quizData.questions || [];
    } catch (parseError) {
      console.error('Failed to parse quiz JSON:', parseError);
      console.error('Raw response:', responseText);
      throw new Error('Failed to generate valid quiz questions');
    }

  } catch (error) {
    console.error('Quiz generation error:', error && (error.stack || error.message || error));

    // Check if this is a quota/rate limit error
    const errMsg = (error && (error.message || '')).toString().toLowerCase();
    const isQuotaError = errMsg.includes('quota') || errMsg.includes('429') ||
                        (error && (error.code === 429 || error.status === 429));

    if (isQuotaError) {
      const quotaError = new Error('AI usage quota exceeded. The free tier allows 50 requests per day. Please try again tomorrow or consider upgrading your plan.');
      quotaError.status = 429;
      quotaError.original = error;
      throw quotaError;
    }

    throw new Error('Failed to generate personalized quiz');
  }
};
