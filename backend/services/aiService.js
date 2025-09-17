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
    topP: 0.9, // Slightly reduced for more focused sampling
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

// Post-process AI response for better formatting and conciseness.
// Produces a predictable, short structure to improve readability and downstream rendering:
// TL;DR -> Key Points (bullets) -> Next Steps (numbered) -> Resources (optional) -> Clarifying question
// This keeps the voice concise and makes it easier for the frontend to present replies.
const formatAIResponse = (response) => {
  let formatted = response ? response.toString().trim() : '';

  // Basic normalization
  formatted = formatted.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');

  // Remove stray markdown artefacts
  formatted = formatted.replace(/(^|\s)\*(?=\s|$)/g, '$1');
  formatted = formatted.replace(/\*\s+\*/g, '**');
  formatted = formatted.replace(/\*{3,}/g, '**');
  formatted = formatted.replace(/\*\*\s*(.*?)\s*\*\*/g, '**$1**');

  // Normalize bullets and lists
  formatted = formatted.replace(/^\s*\*\s+/gm, '- ');
  formatted = formatted.replace(/^\s*-\s*/gm, '- ');
  formatted = formatted.replace(/^(#{1,6})([^\s#])/gm, '$1 $2');
  formatted = formatted.replace(/^(\s*\d+)\.(\S)/gm, '$1. $2');

  // Remove common filler phrases to keep responses precise
  const fillerPhrases = [
    /\bWell,?\s*(to be honest|let me think|you know)\b/gi,
    /\bI would say that\b/gi,
    /\bIn my opinion\b/gi,
    /\bBasically\b/gi,
    /\bActually\b/gi,
    /\bSo,?\b/gi,
    /\bAnyway,?\b/gi,
    /\bAs an? (AI|assistant)\b/gi,
    /\bSure\b/gi
  ];
  fillerPhrases.forEach(phrase => { formatted = formatted.replace(phrase, ''); });

  // Collapse excessive whitespace
  formatted = formatted.replace(/[ \t]{2,}/g, ' ');

  // Ensure the first visible character is uppercase or a markdown token
  const trimmed = formatted.trim();
  if (trimmed && !trimmed.charAt(0).match(/[A-Z#\-\*\[]/)) {
    formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  } else {
    formatted = trimmed;
  }

  // If the model already returned a structured reply, try to extract canonical sections.
  // We'll search for common headings and normalize them.
  const sectionPatterns = [
    { key: 'tldr', regex: /^(?:tl;dr|summary|TL;DR)[:\-]?\s*(.+)/im },
    { key: 'keyPoints', regex: /(?:key points|highlights|what to know)[:\-]?\s*([\s\S]*?)(?:\n{1,2}(?:next steps|actions|what to do)|$)/im },
    { key: 'nextSteps', regex: /(?:next steps|actions|what to do)[:\-]?\s*([\s\S]*?)(?:\n{1,2}(?:resources|links|references)|$)/im },
    { key: 'resources', regex: /(?:resources|links|references)[:\-]?\s*([\s\S]*?)$/im }
  ];

  const sections = {};
  sectionPatterns.forEach(p => {
    const m = formatted.match(p.regex);
    if (m && m[1]) {
      sections[p.key] = m[1].trim();
    }
  });

  // Build a consistent, concise structure from either parsed sections or fallback parsing.
  const buildBulletList = (text) => {
    if (!text) return null;
    // Split into lines and keep the most relevant 6 bullets
    const lines = text.split(/\n+/).map(l => l.replace(/^\s*[-\*\d\.\)]+\s*/, '').trim()).filter(Boolean);
    return lines.slice(0, 6);
  };

  const buildNumberedList = (text) => {
    if (!text) return null;
    const lines = text.split(/\n+/).map(l => l.replace(/^\s*[-\*\d\.\)]+\s*/, '').trim()).filter(Boolean);
    return lines.slice(0, 5);
  };

  const tldr = sections.tldr || (formatted.split(/\n\n/)[0] || '');
  const keyPoints = sections.keyPoints ? buildBulletList(sections.keyPoints) : buildBulletList(formatted);
  const nextSteps = sections.nextSteps ? buildNumberedList(sections.nextSteps) : null;
  const resources = sections.resources ? buildBulletList(sections.resources) : null;

  // Compose final concise markdown output
  const parts = [];

  if (tldr) {
    const oneLine = tldr.split(/\n/).map(s => s.trim()).filter(Boolean).slice(0, 2).join(' ');
    parts.push(`**TL;DR:** ${oneLine}`);
  }

  if (keyPoints && keyPoints.length) {
    parts.push('\n**Key points:**');
    keyPoints.forEach(bp => parts.push(`- ${bp}`));
  }

  if (nextSteps && nextSteps.length) {
    parts.push('\n**Next steps:**');
    nextSteps.forEach((step, idx) => parts.push(`${idx + 1}. ${step}`));
  }

  if (resources && resources.length) {
    parts.push('\n**Resources:**');
    resources.forEach(r => parts.push(`- ${r}`));
  }

  // If nothing parsed, fall back to a short cleaned paragraph (limit ~150 words)
  if (parts.length === 0) {
    const words = formatted.split(/\s+/).filter(Boolean);
    const limited = words.length > 200 ? words.slice(0, 180).join(' ') + '...' : formatted;
    // Force one-paragraph answer
    const short = limited.split(/\n+/).map(l => l.trim()).filter(Boolean).slice(0, 6).join(' ');
    parts.push(short);
  }

  // Add a clarifying question prompt at the end if the model didn't include one
  const lastPart = parts[parts.length - 1] || '';
  if (!/\?\s*$/.test(lastPart)) {
    parts.push('\n**Clarifying question:** Is there anything specific you want me to focus on?');
  }

  let result = parts.join('\n');

  // Final cleanup: remove duplicated blank lines and trim
  result = result.replace(/\n{3,}/g, '\n\n').replace(/^\s+|\s+$/g, '');

  return result;
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
    
    // Create personalized system context
    const personalizedContext = `
You are Zariya, an expert AI career counselor with deep knowledge of various career paths, 
education requirements, job markets, and skill development. Your goal is to help users 
explore career options, make informed decisions, and develop plans to achieve their professional goals.

You are talking to ${userName}. Always address them by their first name in your responses.

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
7. Use proper formatting with markdown for lists, bold text, italic text, etc. to make responses more readable

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
  `${idx + 1}. **Question ${answer.questionIndex + 1}** (${answer.category}): "${answer.question}"\n   - Selected: "${answer.answerText}"`
).join('\n') || 'Detailed answers not available'}

**Key Interests Identified:**
${user.quizResults[user.quizResults.length - 1].interests?.map(interest => `- ${interest}`).join('\n') || 'Not available'}

**Key Strengths Identified:**
${user.quizResults[user.quizResults.length - 1].strengths?.map(strength => `- ${strength}`).join('\n') || 'Not available'}

**Personality Traits Identified:**
${user.quizResults[user.quizResults.length - 1].personalityTraits?.map(trait => `- ${trait}`).join('\n') || 'Not available'}

Use this detailed quiz information to provide highly personalized career guidance and recommendations.` : ''}

${similarMessages.length > 0 ? `Based on similar past conversations:\n${similarMessages.map(sim => `User asked: "${sim.userMessage}"\nYou responded: "${sim.botResponse}"`).join('\n\n')}\n\nUse this context to provide consistent and improved responses.` : ''}
`;
    
  // Mapping notice: ensure model replaces internal codes like Interest_1 / Trait_1
  // with friendly labels and includes short keywords in responses.
  const mappingNotice = `
When referring to quiz result codes, ALWAYS replace internal codes with friendly labels and include short keywords.

- Map quiz codes to labels and keywords:
  - Interest_0 -> Technology (keywords: programming, software, computers)
  - Interest_1 -> Arts & Design (keywords: design, visual, creative)
  - Interest_2 -> Science (keywords: research, laboratory, experimentation)
  - Interest_3 -> Business (keywords: entrepreneurship, management, commerce)

  - Trait_0 -> Introvert (keywords: reflective, reserved, thoughtful)
  - Trait_1 -> Outgoing (keywords: social, energetic, communicative)
  - Trait_2 -> Analytical (keywords: logical, data-driven, detail-oriented)
  - Trait_3 -> Empathetic (keywords: empathetic, people-oriented, supportive)

Guidelines:
- Never output raw codes like \`Interest_1\` or \`Trait_1\` to the user; always use the mapped label.
- When suggesting streams, skills, or next steps, include 2-3 short keywords from the list in parentheses or after the recommendation.
- Keep the keyword list short and relevant; use them to make suggestions concrete (e.g., "Consider Arts & Design — focus: design, visual, creative").
`;

  const finalPersonalizedContext = mappingNotice + '\n' + personalizedContext;

  // Format chat history for Gemini
    const formattedHistory = formatChatHistory(chat.messages);
    
    // Check if this is a new chat or continuing conversation
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
    
    // Format the response for better readability and conciseness
    const formattedResponse = formatAIResponse(botResponse);
    
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
    // Centralized error logging
    console.error('AI processing error:', error && (error.stack || error.message || error));

    // Check if this is a quota/rate limit error that should be retried
    const errMsg = (error && (error.message || '')).toString().toLowerCase();
    const isQuotaError = errMsg.includes('quota') || errMsg.includes('429') || 
                        (error && (error.code === 429 || error.status === 429));

    if (isQuotaError) {
      // For quota errors, provide a user-friendly message
      const quotaError = new Error('AI usage quota exceeded. The free tier allows 50 requests per day. Please try again tomorrow or consider upgrading your plan.');
      quotaError.status = 429;
      quotaError.original = error;
      throw quotaError;
    }

    // For other errors, provide appropriate messages
    const outErr = new Error();

    if (error && error.code === 'ETIMEDOUT') {
      outErr.message = "AI request timed out. Please try again later or simplify your query.";
      outErr.status = 504; // Gateway Timeout
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
