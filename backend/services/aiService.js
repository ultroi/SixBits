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

const QUIZAPI_KEY = process.env.QUIZAPI_KEY || 'qa_sk_5949c78c47e3c36f02459e213695aaaf1136c3a3';
const QUIZAPI_BASE = 'https://quizapi.io/api/v1';

const fetchQuizApi = async (path, params = {}) => {
  const url = new URL(`${QUIZAPI_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${QUIZAPI_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`QuizAPI error ${response.status}: ${body}`);
  }

  return response.json();
};

const normalizeQuizApiTopic = (value) => {
  if (!value || typeof value !== 'string') return null;
  return value
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/[^a-zA-Z0-9]/g, ''))
    .join(' ');
};

const generateQuizApiQuestions = async (userProfile) => {
  const topics = [
    userProfile.stream,
    userProfile.currentStatus,
    ...(Array.isArray(userProfile.academicInterests) ? userProfile.academicInterests : []),
    ...(Array.isArray(userProfile.careerAspirations) ? userProfile.careerAspirations : []),
  ].filter(Boolean);

  const topic = normalizeQuizApiTopic(topics[0] || 'General Knowledge');
  let quizzes = [];

  try {
    quizzes = await fetchQuizApi('/quizzes', { limit: 10, topic });
  } catch (err) {
    console.warn('QuizAPI quiz list fetch failed for topic', topic, err.message);
  }

  if (!Array.isArray(quizzes) || quizzes.length === 0) {
    quizzes = await fetchQuizApi('/quizzes', { limit: 10 });
  }

  if (!Array.isArray(quizzes) || quizzes.length === 0) {
    return [];
  }

  const quizId = quizzes[0]?.id || quizzes[0]?.quiz_id || null;
  if (!quizId) return [];

  const questions = await fetchQuizApi('/questions', { quiz_id: quizId, include_answers: true });
  if (!Array.isArray(questions) || questions.length === 0) return [];

  return questions.map((q) => {
    const answerKeys = ['answer_a', 'answer_b', 'answer_c', 'answer_d'];
    const options = answerKeys
      .map((key) => q.answers?.[key])
      .filter((value) => typeof value === 'string' && value.trim().length > 0);

    const correctAnswers = q.correct_answers || {};
    const correctAnswer = answerKeys.findIndex((key) => correctAnswers[`${key}_correct`] === 'true');

    return {
      question: q.question || 'Question text unavailable',
      options: options.length === 4 ? options : [...options, 'Option 3', 'Option 4'].slice(0, 4),
      category: 'logical',
      difficulty: (q.difficulty || 'medium').toLowerCase(),
      weight: 3,
      correctAnswer: correctAnswer >= 0 ? correctAnswer : 0,
    };
  });
};

const createFallbackQuizQuestions = (profile, count = 12) => {
  const subject = profile.stream || 'General Studies';
  const interest = Array.isArray(profile.academicInterests) && profile.academicInterests.length > 0
    ? profile.academicInterests[0]
    : 'learning';

  const questionTemplates = {
    logical: [
      `When you solve a difficult ${subject} problem, what helps you most?`,
      `Which approach do you prefer when reasoning through a challenge?`,
      `If a topic requires careful analysis, you usually choose to:`,
    ],
    numerical: [
      `When comparing numbers, you prefer to:`,
      `If a problem includes values and estimates, you like to:`,
      `You feel most confident working with:`,
    ],
    career_preference: [
      `Which of these career activities appeals to you most?`,
      `If you think about a future job, you want to:`,
      `What type of work would make you excited?`,
    ],
    decision_making: [
      `When making a choice, you usually:`,
      `If you need to pick one path, you are more likely to:`,
      `In a team decision, you prefer to:`,
    ],
    work_style: [
      `At work or study, you are most productive when you:`,
      `Your ideal project environment is:`,
      `You prefer tasks that let you:`,
    ],
  };

  const optionSets = {
    logical: [
      [`Look for patterns`, `Try a step-by-step solution`, `Test different possibilities`, `Use diagrams to understand`],
      [`Simplify the question first`, `Break it into smaller parts`, `Search for similar examples`, `Check each result carefully`],
    ],
    numerical: [
      [`Estimate values quickly`, `Work with exact calculations`, `Use numbers to compare outcomes`, `Check results against real data`],
      [`Convert quantities into charts`, `Use formulas and rules`, `Think in percentages and ratios`, `Validate with real examples`],
    ],
    career_preference: [
      [`Build something useful`, `Help people grow`, `Lead a team`, `Design systems`],
      [`Solve problems with logic`, `Create new ideas`, `Support others`, `Manage projects`],
    ],
    decision_making: [
      [`Choose the safest option`, `Look for the fastest result`, `Ask for another opinion`, `Follow your intuition`],
      [`Weigh pros and cons`, `Try a creative solution`, `Stick with what worked before`, `Choose the most practical path`],
    ],
    work_style: [
      [`Work independently`, `Collaborate with a team`, `Follow a clear plan`, `Adapt to new tasks`],
      [`Focus on one thing at a time`, `Switch between tasks`, `Lead and organize others`, `Experiment while working`],
    ],
  };

  const categories = ['logical', 'numerical', 'career_preference', 'decision_making', 'work_style'];

  return Array.from({ length: count }, (_, index) => {
    const category = categories[index % categories.length];
    const variation = index % optionSets[category].length;
    const options = optionSets[category][variation];
    const templateList = questionTemplates[category];
    const question = templateList[index % templateList.length];
    const difficulty = index < 4 ? 'easy' : index < 9 ? 'medium' : 'hard';

    return {
      question,
      options,
      category,
      difficulty,
      weight: 3,
      correctAnswer: 0,
    };
  });
};

const careerMatchCache = new Map();

const getCareerMatchCacheKey = (profile = {}) => {
  const latestQuiz = Array.isArray(profile.quizResults) && profile.quizResults.length > 0
    ? profile.quizResults[profile.quizResults.length - 1]
    : null;

  const safeProfile = {
    firstName: profile.firstName || '',
    class: profile.class || '',
    stream: profile.stream || '',
    location: {
      city: profile?.location?.city || '',
      state: profile?.location?.state || '',
    },
    academicInterests: Array.isArray(profile.academicInterests) ? [...profile.academicInterests].sort() : [],
    latestQuiz: latestQuiz ? {
      score: latestQuiz.score || null,
      interests: Array.isArray(latestQuiz.interests) ? [...latestQuiz.interests].sort() : [],
      strengths: Array.isArray(latestQuiz.strengths) ? [...latestQuiz.strengths].sort() : [],
      suggestedStreams: Array.isArray(latestQuiz.suggestedStreams) ? [...latestQuiz.suggestedStreams].sort() : [],
    } : null,
  };

  return JSON.stringify(safeProfile);
};

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
  let questionCount = 18;

  try {
    const apiQuestions = await generateQuizApiQuestions(userProfile);
    if (Array.isArray(apiQuestions) && apiQuestions.length > 0) {
      return apiQuestions;
    }

    const canUseGemini = Boolean(process.env.GEMINI_API_KEY);
    const {
      firstName,
      age,
      class: userClass,
      currentStatus,
      stream,
      location,
      academicInterests,
      activities,
      careerAspirations,
      workStylePreference,
      learningStyle,
      careerPriorities,
      careerGoal,
      preferredLanguage,
    } = userProfile;

    const profileFields = [
      currentStatus,
      userClass,
      stream,
      location?.city || location?.state,
      Array.isArray(academicInterests) && academicInterests.length > 0,
      Array.isArray(activities) && activities.length > 0,
      Array.isArray(careerAspirations) && careerAspirations.length > 0,
      workStylePreference,
      learningStyle,
      Array.isArray(careerPriorities) && careerPriorities.length > 0,
      careerGoal,
      preferredLanguage,
    ];

    const filledProfileFields = profileFields.filter(Boolean).length;
    if (filledProfileFields >= 10) {
      questionCount = 14;
    } else if (filledProfileFields >= 7) {
      questionCount = 18;
    } else {
      questionCount = 22;
    }

    if (!canUseGemini) {
      console.warn('No Gemini API key configured; returning fallback quiz questions.');
      return createFallbackQuizQuestions(userProfile, questionCount);
    }

    const profileSummary = `
- Current Status: ${currentStatus || 'Not specified'}
- Qualification: ${userClass || 'Not specified'}
- Stream: ${stream || 'Not specified'}
- Location: ${location?.city || location?.state || 'Not specified'}
- Academic Interests: ${Array.isArray(academicInterests) && academicInterests.length > 0 ? academicInterests.join(', ') : 'Not specified'}
- Activities: ${Array.isArray(activities) && activities.length > 0 ? activities.join(', ') : 'Not specified'}
- Career Aspirations: ${Array.isArray(careerAspirations) && careerAspirations.length > 0 ? careerAspirations.join(', ') : 'Not specified'}
- Learning Style: ${learningStyle || 'Not specified'}
- Career Priorities: ${Array.isArray(careerPriorities) && careerPriorities.length > 0 ? careerPriorities.join(', ') : 'Not specified'}
- Career Goal: ${careerGoal || 'Not specified'}
- Preferred Language: ${preferredLanguage || 'english'}
`;

    const prompt = `Generate a personalized career aptitude assessment quiz for ZARIYA, an AI-powered education and career guidance platform.

Use the student's profile below as context and instruction to make questions relevant, concise, and suitable for Indian education/career guidance.

Student Profile:
${profileSummary}

Instructions:
- If the student profile appears highly specific and clear, generate between 12 and 15 questions.
- If profile has moderate clarity, generate between 16 and 20 questions.
- If profile is broad or uncertain, generate between 21 and 25 questions.
- Maintain the following distribution: 30% logical/analytical, 20% numerical/reasoning, 20% career preference validation, 20% decision-making scenarios, 10% work-style alignment.
- Keep each question matched to the student's qualification level and profile context.
- Make questions concise, easy to understand, and avoid generic trivia.
- Each question must have exactly 4 answer options.
- Include a category, difficulty, and weight value for every question.
- Use the following category keys: logical, numerical, career_preference, decision_making, work_style.
- Use difficulty values: easy, medium, hard.
- Use weight values between 1 and 5.
- Include a hidden 'correctAnswer' index for internal scoring.
- Return only valid JSON with this structure:
{
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "category": "logical",
      "difficulty": "medium",
      "weight": 3,
      "correctAnswer": 0
    }
  ]
}

Generate exactly ${questionCount} questions. Use Indian English and keep the tone professional and student-friendly.`;

    const response = await retryWithBackoff(() => 
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 2200,
          temperature: 0.7,
        }
      })
    );

    let jsonText = response.response.text().trim();
    try {
      const quizData = parseAIJson(jsonText);
      return (quizData && quizData.questions) ? quizData.questions : [];
    } catch (err) {
      console.error('Failed to parse quiz JSON from AI response. Raw response:\n', jsonText);
      throw err;
    }

  } catch (error) {
    console.error('Quiz generation error:', error);

    if (error?.code === 429) {
      console.warn('Gemini rate limited or quota exceeded; returning fallback quiz questions.');
    }

    const fallback = createFallbackQuizQuestions(userProfile, questionCount);
    if (fallback && fallback.length > 0) {
      return fallback;
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
    try {
      const suggestions = parseAIJson(jsonText);
      return suggestions || {};
    } catch (err) {
      console.error('Failed to parse course suggestions JSON from AI response. Raw response:\n', jsonText);
      throw err;
    }

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

// Robust JSON extraction & parsing for AI responses
const extractJsonSegment = (text) => {
  if (!text || typeof text !== 'string') return null;

  // Remove common fences and leading/trailing whitespace
  let t = text.trim();
  t = t.replace(/```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Find first JSON object or array by matching brackets while skipping string literals
  const openChars = ['{', '['];
  const closeFor = { '{': '}', '[': ']' };

  for (let startIdx = 0; startIdx < t.length; startIdx++) {
    const ch = t[startIdx];
    if (!openChars.includes(ch)) continue;

    let stack = [ch];
    let inString = false;
    let stringChar = null;
    let escape = false;

    for (let i = startIdx + 1; i < t.length; i++) {
      const c = t[i];

      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }

      if (inString) {
        if (c === stringChar) {
          inString = false;
          stringChar = null;
        }
        continue;
      }

      if (c === '"' || c === "'") {
        inString = true;
        stringChar = c;
        continue;
      }

      if (openChars.includes(c)) {
        stack.push(c);
        continue;
      }

      if (c === closeFor[stack[stack.length - 1]]) {
        stack.pop();
        if (stack.length === 0) {
          // return the substring that represents the JSON
          return t.slice(startIdx, i + 1).trim();
        }
      }
    }
  }

  return null;
};

const sanitizeJsonLike = (raw) => {
  if (!raw || typeof raw !== 'string') return raw;

  let s = raw;
  // Remove JS-style comments
  s = s.replace(/\/\/.*$/gm, '');
  s = s.replace(/\/\*[\s\S]*?\*\//gm, '');
  // Replace trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, '$1');
  // Normalize smart quotes
  s = s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  // Attempt to convert single-quoted keys/values to double quotes where it is likely JSON
  // This is a best-effort fallback and may not be perfect for every case.
  s = s.replace(/'(\\?[^'\\]*)'/g, '"$1"');

  return s;
};

const parseAIJson = (text) => {
  if (!text || typeof text !== 'string') return null;

  // Try to extract the first JSON-like segment
  let segment = extractJsonSegment(text);
  if (!segment) {
    // If we couldn't find a balanced segment, try to use the whole cleaned text
    segment = text.trim();
  }

  // Attempt progressive parsing strategies
  const attempts = [];

  // 1) Direct parse
  attempts.push(segment);
  // 2) Remove fences if any (already done in extract, but double-ensure)
  attempts.push(segment.replace(/(^```json\s*|```$)/g, '').trim());
  // 3) Sanitized (remove comments, trailing commas, smart quotes)
  attempts.push(sanitizeJsonLike(segment));

  for (const candidate of attempts) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch (err) {
      // continue to next attempt
    }
  }

  // Last resort: try to find a JSON-looking substring and parse that
  const fallbackMatch = segment.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (fallbackMatch) {
    try {
      return JSON.parse(sanitizeJsonLike(fallbackMatch[0]));
    } catch (err) {
      // give up
    }
  }

  // If all attempts fail, throw a helpful error
  const e = new Error('Unable to parse JSON from AI response');
  e.raw = text;
  throw e;
};

// Get career matches using Groq API (optimized single-call path with cache)
exports.getCareerMatchesGroq = async (profile = {}) => {
  const cacheKey = getCareerMatchCacheKey(profile);
  const cached = careerMatchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.matches;
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const colors = ['from-blue-500 to-blue-600', 'from-green-500 to-green-600', 'from-purple-500 to-purple-600', 'from-orange-500 to-orange-600', 'from-pink-500 to-pink-600'];

  const fallbackMatches = () => {
    const stream = (profile.stream || '').toLowerCase();
    const interests = Array.isArray(profile.academicInterests) ? profile.academicInterests.map((item) => String(item).toLowerCase()) : [];
    const science = stream === 'science' || interests.some((item) => ['science', 'engineering', 'medical', 'it'].some((keyword) => item.includes(keyword)));
    const commerce = stream === 'commerce' || interests.some((item) => ['commerce', 'business', 'finance', 'accounting'].some((keyword) => item.includes(keyword)));
    const arts = stream === 'arts' || interests.some((item) => ['arts', 'design', 'media', 'communication'].some((keyword) => item.includes(keyword)));

    let titles = ['Computer Science', 'Data Science', 'Software Development'];
    if (commerce) titles = ['Business Analytics', 'Finance & Accounting', 'Product Management'];
    else if (arts) titles = ['UI/UX Design', 'Content Strategy', 'Digital Marketing'];
    else if (science) titles = ['Computer Science', 'Data Science', 'Cyber Security'];

    return titles.slice(0, 3).map((title, index) => ({
      title,
      percent: 78 - (index * 6),
      color: colors[index % colors.length],
      source: 'fallback',
    }));
  };

  if (!groqApiKey) {
    const matches = fallbackMatches();
    careerMatchCache.set(cacheKey, { matches, expiresAt: Date.now() + 10 * 60 * 1000 });
    return matches;
  }

  const compactProfile = {
    firstName: profile.firstName || 'student',
    class: profile.class || '',
    stream: profile.stream || '',
    location: profile.location ? {
      city: profile.location.city || '',
      state: profile.location.state || '',
    } : undefined,
    academicInterests: Array.isArray(profile.academicInterests) ? profile.academicInterests.slice(0, 6) : [],
    latestQuiz: Array.isArray(profile.quizResults) && profile.quizResults.length > 0 ? (() => {
      const latestQuiz = profile.quizResults[profile.quizResults.length - 1];
      return {
        score: latestQuiz.score || null,
        interests: Array.isArray(latestQuiz.interests) ? latestQuiz.interests.slice(0, 6) : [],
        strengths: Array.isArray(latestQuiz.strengths) ? latestQuiz.strengths.slice(0, 6) : [],
        suggestedStreams: Array.isArray(latestQuiz.suggestedStreams) ? latestQuiz.suggestedStreams.slice(0, 6) : [],
      };
    })() : null,
  };

  const prompt = `Return ONLY JSON.
Suggest the top 3 career matches for this student based on profile and quiz data.
Student profile:
${JSON.stringify(compactProfile)}

JSON format:
{"matches":[{"title":"Career","confidence":92,"reason":"short reason"}]}

Rules:
- Use concise titles
- confidence must be 0-100
- reason must be under 12 words
- return exactly 3 matches`;

  try {
    const response = await retryWithBackoff(async () => {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: groqModel,
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 220,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You are an Indian career guidance assistant that returns strict JSON only.' },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        const error = new Error(`Groq API error: ${res.status}`);
        error.status = res.status;
        error.raw = text;
        throw error;
      }

      return res.json();
    });

    const content = response?.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(content);
    const matches = Array.isArray(parsed?.matches) ? parsed.matches.slice(0, 3) : [];

    const normalizedMatches = matches.map((match, index) => ({
      title: match.title || match.name || 'Career',
      percent: Math.max(1, Math.min(100, Math.round(match.confidence || match.percent || 0))),
      color: colors[index % colors.length],
      reason: match.reason || '',
      source: 'groq',
    }));

    const finalMatches = normalizedMatches.length > 0 ? normalizedMatches : fallbackMatches();
    careerMatchCache.set(cacheKey, { matches: finalMatches, expiresAt: Date.now() + 10 * 60 * 1000 });
    return finalMatches;
  } catch (err) {
    console.error('Groq career matches failed:', err && err.message);
    const matches = fallbackMatches();
    careerMatchCache.set(cacheKey, { matches, expiresAt: Date.now() + 5 * 60 * 1000 });
    return matches;
  }
};