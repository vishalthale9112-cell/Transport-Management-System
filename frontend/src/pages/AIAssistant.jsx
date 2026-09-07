import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Bot,
  Database,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";

import { askAIAssistant } from "../api";
import "./AIAssistant.css";

const initialMessage = {
  id: "welcome-message",
  role: "assistant",
  content:
    "Hello! I am your THALE TRANSPORT AI Assistant. Ask me about vehicles, drivers, trips, maintenance or document alerts.",
  time: new Date(),
};

const formatTime = (date) =>
  new Date(date).toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );

function AIAssistant() {
  const [messages, setMessages] = useState([
    initialMessage,
  ]);

  const [suggestions, setSuggestions] =
    useState([
      "How many vehicles do we have?",
      "Show total drivers",
      "How many trips are recorded?",
      "Show maintenance summary",
      "Show document alerts",
    ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] =
    useState(false);

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      setError("");
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
      setError(
        "Voice input could not be started."
      );
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript;

      setInput(transcript);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const sendMessage = async (
    selectedMessage = ""
  ) => {
    const messageText = (
      selectedMessage || input
    ).trim();

    if (!messageText || loading) {
      return;
    }

    const userMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: messageText,
      time: new Date(),
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
    ]);

    setInput("");
    setError("");
    setLoading(true);

    try {
      const response =
        await askAIAssistant(messageText);

      const assistantMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content:
          response.answer ||
          "I could not generate an answer.",
        intent:
          response.intent || "unknown",
        time: new Date(),
      };

      setMessages((currentMessages) => [
        ...currentMessages,
        assistantMessage,
      ]);

      setSuggestions(
        response.suggestions || []
      );
    } catch (requestError) {
      console.error(requestError);

      setError(
        "AI Assistant is unavailable. Please check the backend server."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      setError(
        "Voice input is not supported in this browser."
      );
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
      return;
    }

    recognitionRef.current.start();
  };

  const clearConversation = () => {
    setMessages([
      {
        ...initialMessage,
        time: new Date(),
      },
    ]);

    setError("");
  };

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <div>
          <div className="ai-page-label">
            <Sparkles size={15} />
            THALE TRANSPORT
          </div>

          <h1>AI Assistant</h1>

          <p>
            Get instant answers from your
            transport management data.
          </p>
        </div>

        <div className="ai-status-card">
          <span className="ai-status-dot" />

          <div>
            <strong>Assistant Online</strong>
            <small>
              Connected to TMS database
            </small>
          </div>
        </div>
      </div>

      <div className="ai-layout">
        <section className="ai-chat-card">
          <div className="ai-chat-header">
            <div className="ai-chat-identity">
              <div className="ai-bot-avatar">
                <Bot size={24} />
              </div>

              <div>
                <h2>Transport Assistant</h2>
                <span>
                  Database-powered assistant
                </span>
              </div>
            </div>

            <button
              className="ai-clear-button"
              type="button"
              onClick={clearConversation}
              title="Clear conversation"
            >
              <Trash2 size={17} />
              Clear
            </button>
          </div>

          <div className="ai-message-area">
            {messages.map((message) => (
              <div
                className={`ai-message-row ${message.role}`}
                key={message.id}
              >
                <div className="ai-message-avatar">
                  {message.role ===
                  "assistant" ? (
                    <Bot size={18} />
                  ) : (
                    <User size={18} />
                  )}
                </div>

                <div>
                  <div className="ai-message-bubble">
                    {message.content}
                  </div>

                  <div className="ai-message-time">
                    {formatTime(message.time)}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-message-row assistant">
                <div className="ai-message-avatar">
                  <Bot size={18} />
                </div>

                <div className="ai-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {error && (
            <div className="ai-error">
              {error}
            </div>
          )}

          <form
            className="ai-input-area"
            onSubmit={handleSubmit}
          >
            <button
              className={`ai-voice-button ${
                listening ? "listening" : ""
              }`}
              type="button"
              onClick={toggleVoiceInput}
              title="Voice input"
            >
              {listening ? (
                <MicOff size={20} />
              ) : (
                <Mic size={20} />
              )}
            </button>

            <input
              type="text"
              placeholder="Ask about your transport business..."
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              disabled={loading}
            />

            <button
              className="ai-send-button"
              type="submit"
              disabled={
                loading || !input.trim()
              }
            >
              <Send size={19} />
            </button>
          </form>
        </section>

        <aside className="ai-side-panel">
          <div className="ai-info-card">
            <div className="ai-info-icon">
              <Database size={22} />
            </div>

            <div>
              <h3>Live Business Data</h3>
              <p>
                Answers are generated from your
                current TMS database records.
              </p>
            </div>
          </div>

          <div className="ai-suggestions-card">
            <div className="ai-suggestions-title">
              <Sparkles size={18} />
              <h3>Quick Questions</h3>
            </div>

            <div className="ai-suggestion-list">
              {suggestions.map(
                (suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() =>
                      sendMessage(suggestion)
                    }
                    disabled={loading}
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="ai-capabilities-card">
            <h3>Assistant Capabilities</h3>

            <ul>
              <li>Vehicle information</li>
              <li>Driver summary</li>
              <li>Trip records</li>
              <li>Maintenance overview</li>
              <li>Document alerts</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default AIAssistant;