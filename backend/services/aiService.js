const { GoogleGenerativeAI } = global.genAI;
const Chat = require('../models/Chat');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    maxOutputTokens: 600, // Increased for detailed key points with explanations
    temperature: 0.7,
    topK: 30,
    topP: 0.8, 
  }
});

// Simplified system context for educational counselor
const SYSTEM_CONTEXT = `
You are Zariya, an AI educational counselor specializing in career guidance.

**RESPONSE GUIDELINES:**
- Start with a friendly greeting using the user's name
- Provide key points in bullet form, but explain each point briefly
- Give context and reasoning for each key point
- Offer practical advice with explanations
- End with an engaging question to continue the conversation
- Keep responses conversational and user-friendly
- Use **bold** for emphasis on key terms or important points
- Be encouraging and supportive

**Response Structure:**
**Hi [Name]!** Brief welcoming line.

**Key Points:**
- **Point 1:** Brief explanation of why this matters and what it means
- **Point 2:** More details on actionable steps with context
- **Point 3:** Additional tips or resources with reasoning

**Next Steps:** Suggest what they can do next with encouragement.

**Question:** What would you like to explore further?

Focus on:
- Career exploration and planning
- Educational pathways
- Skill development
- Practical next steps
- Age-appropriate guidance

Make responses informative yet approachable, like a helpful mentor.
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

// Response formatter - encourages key points with explanations
const formatResponse = (response, userName) => {
  if (!response) return `**Hi ${userName || 'there'}!** I'm here to help with your career and educational questions. What would you like to talk about?`;

  let formatted = response.toString().trim();

  // Basic cleanup
  formatted = formatted
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\*{3,}/g, '**')
    .replace(/^\s*[\*•]\s+/gm, '- ')
    .replace(/^\s*[-]\s*/gm, '- ');

  // Ensure greeting with name if not present
  if (userName && !formatted.toLowerCase().includes(`hi ${userName.toLowerCase()}`) && !formatted.toLowerCase().includes(userName.toLowerCase())) {
    formatted = `**Hi ${userName}!** ${formatted}`;
  }

  // Ensure it ends with a question if not present
  if (!formatted.includes('?')) {
    formatted += '\n\n**What would you like to explore next?**';
  }

  // Limit length - allow up to 400 words for detailed explanations
  const words = formatted.split(/\s+/);
  if (words.length > 400) {
    formatted = words.slice(0, 400).join(' ') + '...';
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

// Suggest courses based on quiz results
exports.suggestCourses = async (quizResults, academicInterests = []) => {
  try {
    const { interests, strengths, personality } = quizResults;

    // Find top categories
    const topInterest = Object.entries(interests).sort(([, a], [, b]) => b - a)[0];
    const topStrength = Object.entries(strengths).sort(([, a], [, b]) => b - a)[0];
    const topPersonality = Object.entries(personality).sort(([, a], [, b]) => b - a)[0];

    const prompt = `Based on this student's aptitude quiz results and academic interests, suggest 3 top courses and 2 alternative courses they should consider.

Quiz Results:
- Top Interest: ${topInterest ? topInterest[0] : 'Not specified'}
- Top Strength: ${topStrength ? topStrength[0] : 'Not specified'}  
- Top Personality: ${topPersonality ? topPersonality[0] : 'Not specified'}

Academic Interests: ${academicInterests.length > 0 ? academicInterests.join(', ') : 'Not specified'}

Format as JSON:
{
  "topCourses": [
    {
      "name": "Course Name",
      "reason": "Brief reason why this course matches their profile and academic interests",
      "careerProspects": "Brief career outlook"
    }
  ],
  "alternativeCourses": [
    {
      "name": "Alternative Course Name", 
      "reason": "Brief reason for consideration based on their profile",
      "careerProspects": "Brief career outlook"
    }
  ]
}

Focus on Indian education system, undergraduate courses, and practical career paths. Consider both quiz results and academic interests when making recommendations. Keep reasons concise.`;

    const response = await retryWithBackoff(() => 
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        }
      })
    );

    let jsonText = response.response.text().trim();
    
    // Clean JSON response
    jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
    
    const suggestions = JSON.parse(jsonText);
    return suggestions;

  } catch (error) {
    console.error('Course suggestion error:', error);
    
    if (error?.code === 429) {
      const quotaError = new Error('Daily AI usage limit reached. Please try again tomorrow.');
      quotaError.status = 429;
      throw quotaError;
    }

    throw new Error('Failed to generate course suggestions');
  }
};