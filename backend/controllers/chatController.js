const Chat = require('../models/Chat');
const aiService = require('../services/aiService');

// Process chat message and get AI response
exports.processMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    // Process the message using AI service
    const aiResponse = await aiService.processMessage(user, message);
    
    // Return the AI response
    res.status(200).json({ message: aiResponse });
  } catch (error) {
    console.error('Chat processing error:', error);
    res.status(500).json({ message: 'Failed to process your message' });
  }
};

// Get chat history for a user
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find chat history for the user
    let chat = await Chat.findOne({ user: userId });
    
    if (!chat) {
      return res.status(200).json({ messages: [] });
    }
    
    res.status(200).json({ messages: chat.messages });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ message: 'Failed to retrieve chat history' });
  }
};
