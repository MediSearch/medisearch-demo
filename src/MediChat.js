import { useState, useEffect } from 'react';
import useMediSearchClient from 'medisearch_client';
import { v4 as uuidv4 } from 'uuid';

import './MediChat.css';

function MediChat() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [conversationId, setConversationId] = useState('');
  const apiKey = "8cf09c53-2c2b-407b-89af-e7437fb67772";

  useEffect(() => {
    setConversationId(uuidv4());
  }, []);

  // Helper function to update the last message in a conversation
  const updateLastMessage = (prevConversation, newMessage) => {
    const newLastMessage = {
      ...prevConversation[prevConversation.length - 1],
      message: newMessage,
    };

    return [...prevConversation.slice(0, -1), newLastMessage];
  };

  // Helper function to add a new message to a conversation
  const addNewMessage = (prevConversation, newMessage, sender = 'MediSearch') => {
    return [...prevConversation, { sender, message: newMessage }];
  };

  const eventHandlers = {
    // Handle response from the service
    llm_response: (payload) => {
      const lastMessage = conversation[conversation.length - 1];

      if (lastMessage.sender === 'MediSearch') {
        setConversation(prev => updateLastMessage(prev, payload.text));
      } else {
        setConversation(prev => addNewMessage(prev, payload.text));
      }
    },

    // Handle articles payload
    articles: (payload) => {
      if (payload.articles.length) {
        const citations = payload.articles.map(
          (article, index) => `[${index + 1}] ${article.authors} et al., ${article.title}`
        ).join('\n');

        const citationMessage = `\nReferences:\n\n${citations}`;

        setConversation(prev => {
          const updatedLastMessage = `${prev[prev.length - 1].message}\n\n${citationMessage}`;
          return updateLastMessage(prev, updatedLastMessage);
        });
      }
    },

    // Handle error
    error: (payload) => {
      console.error("Error occurred:", payload);
    }
  };

  const { sendUserMessage } = useMediSearchClient(apiKey, eventHandlers);

  const handleSend = () => {
    const conversationSoFar = [...conversation,
    { sender: 'You', message: message }];
    setConversation(conversationSoFar);
    sendUserMessage(conversationSoFar.map((item, _) => {
      return item.message;
    }), conversationId, 'English');
    setMessage('');
  };

  return (
    <div className="App" >
      <div className="chatBox">
        {conversation.map((item, index) => (
          <div key={index}>
            <strong
              style={{
                color: item.sender === 'MediSearch' ? 'blue' : 'black',
              }} e
            >{item.sender}: </strong> <div className="newline-text">{item.message}</div>
          </div>
        ))}
      </div>
      <div className="inputArea">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div >
  );
}

export default MediChat;
