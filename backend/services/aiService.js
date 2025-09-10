const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const Chat = require('../models/Chat');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Initialize DeepSeek API as fallback
const deepseek = new OpenAI({
  apiKey: 'sk-593a99a3ddc84fed8773ec9e601b2ad1',
  baseURL: 'https://api.deepseek.com',
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

// Retry function with exponential backoff for 503 errors
const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error.message.includes('503')) {
      console.log(`Retrying due to 503 error. Retries left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    } else {
      throw error;
    }
  }
};

// Fallback to DeepSeek API
const callDeepSeek = async (messages) => {
  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: messages,
      max_tokens: 1000,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw error;
  }
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
    let botResponse;
    try {
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
      botResponse = response.response.text();
    } catch (error) {
      if (error.message.includes('503')) {
        console.log('Gemini overloaded, falling back to DeepSeek');
        // Fallback to DeepSeek
        const deepseekMessages = [
          { role: 'system', content: personalizedContext },
          ...formattedHistory.slice(0, -1).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.parts[0].text
          })),
          { role: 'user', content: userMessage }
        ];
        botResponse = await callDeepSeek(deepseekMessages);
      } else {
        throw error;
      }
    }
    
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
    console.error('AI processing error:', error);
    throw error;
  }
};
