import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  Bell,
  LoaderCircle,
  Mail,
  Mic,
  Plus,
  Search,
  Send,
  Volume2,
  X,
} from "lucide-react";

import {
  askAIAssistant,
  generateAISpeech,
  getNotificationsSummary,
} from "../api";


const INDIAN_LANGUAGES = [
  { code: "mr-IN", name: "मराठी" },
  { code: "hi-IN", name: "हिंदी" },
  { code: "en-IN", name: "English" },
  { code: "gu-IN", name: "ગુજરાતી" },
  { code: "bn-IN", name: "বাংলা" },
  { code: "pa-IN", name: "ਪੰਜਾਬੀ" },
  { code: "ta-IN", name: "தமிழ்" },
  { code: "te-IN", name: "తెలుగు" },
  { code: "kn-IN", name: "ಕನ್ನಡ" },
  { code: "ml-IN", name: "മലയാളം" },
  { code: "or-IN", name: "ଓଡ଼ିଆ" },
  { code: "as-IN", name: "অসমীয়া" },
  { code: "ur-IN", name: "اردو" },
  { code: "ne-NP", name: "नेपाली" },
  { code: "kok-IN", name: "कोंकणी" },
  { code: "mai-IN", name: "मैथिली" },
  { code: "ks-IN", name: "कॉशुर" },
  { code: "sd-IN", name: "سنڌي" },
  { code: "sa-IN", name: "संस्कृतम्" },
  { code: "doi-IN", name: "डोगरी" },
  { code: "mni-IN", name: "মৈতৈলোন্" },
  { code: "sat-IN", name: "ᱥᱟᱱᱛᱟᱲᱤ" },
  { code: "brx-IN", name: "बड़ो" },
];


const AI_VOICES = [
  {
    name: "Charon",
    label: "Charon — Professional",
  },
  {
    name: "Kore",
    label: "Kore — Firm",
  },
  {
    name: "Achernar",
    label: "Achernar — Soft",
  },
  {
    name: "Schedar",
    label: "Schedar — Balanced",
  },
  {
    name: "Gacrux",
    label: "Gacrux — Mature",
  },
  {
    name: "Sulafat",
    label: "Sulafat — Warm",
  },
  {
    name: "Iapetus",
    label: "Iapetus — Clear",
  },
  {
    name: "Sadaltager",
    label: "Sadaltager — Knowledgeable",
  },
];


const SEARCH_ROUTES = [
  {
    path: "/vehicles",
    words: [
      "vehicle",
      "vehicles",
      "गाडी",
      "गाड्या",
      "वाहन",
    ],
  },
  {
    path: "/drivers",
    words: [
      "driver",
      "drivers",
      "ड्रायव्हर",
      "चालक",
    ],
  },
  {
    path: "/orders",
    words: [
      "order",
      "orders",
      "ऑर्डर",
    ],
  },
  {
    path: "/trips",
    words: [
      "trip",
      "trips",
      "ट्रिप",
      "फेरी",
    ],
  },
  {
    path: "/tracking",
    words: [
      "tracking",
      "gps",
      "location",
      "लोकेशन",
    ],
  },
  {
    path: "/fuel",
    words: [
      "fuel",
      "diesel",
      "petrol",
      "cng",
      "इंधन",
      "डिझेल",
    ],
  },
  {
    path: "/maintenance",
    words: [
      "maintenance",
      "service",
      "मेंटेनन्स",
      "सर्विस",
    ],
  },
  {
    path: "/customers",
    words: [
      "customer",
      "customers",
      "ग्राहक",
    ],
  },
  {
    path: "/income",
    words: [
      "income",
      "revenue",
      "उत्पन्न",
      "महसूल",
    ],
  },
  {
    path: "/expenses",
    words: [
      "expense",
      "expenses",
      "खर्च",
    ],
  },
  {
    path: "/reports",
    words: [
      "report",
      "reports",
      "रिपोर्ट",
      "अहवाल",
    ],
  },
  {
    path: "/documents",
    words: [
      "document",
      "documents",
      "कागदपत्र",
    ],
  },
  {
    path: "/notifications",
    words: [
      "notification",
      "notifications",
      "alert",
      "सूचना",
      "अलर्ट",
    ],
  },
];


const createVoiceSummary = (text) => {
  const plainText = text
    .replace(/[*#_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const sentences =
    plainText.match(
      /[^.!?।]+[.!?।]+/g
    ) || [];

  let summary = sentences
    .slice(0, 3)
    .join(" ")
    .trim();

  if (!summary) {
    summary = plainText;
  }

  if (summary.length <= 500) {
    return summary;
  }

  return `${
    summary
      .slice(0, 500)
      .replace(/\s+\S*$/, "")
  }...`;
};


export default function Topbar() {
  const navigate = useNavigate();

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  const [searchText, setSearchText] =
    useState("");

  const [voiceOpen, setVoiceOpen] =
    useState(false);

  const [language, setLanguage] =
    useState("mr-IN");

  const [voiceName, setVoiceName] =
    useState("Charon");

  const [question, setQuestion] =
    useState("");

  const [answer, setAnswer] =
    useState("");

  const [listening, setListening] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [voiceLoading, setVoiceLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [unreadCount, setUnreadCount] =
    useState(0);


  useEffect(() => {
    let mounted = true;

    const loadNotificationCount =
      async () => {
        try {
          const summary =
            await getNotificationsSummary();

          if (mounted) {
            setUnreadCount(
              Number(
                summary
                  ?.unread_notifications
              ) || 0
            );
          }
        } catch {
          if (mounted) {
            setUnreadCount(0);
          }
        }
      };

    loadNotificationCount();

    const timer = window.setInterval(
      loadNotificationCount,
      60000
    );

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);


  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();

      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(
          audioUrlRef.current
        );
      }
    };
  }, []);


  const selectedLanguageName = () =>
    INDIAN_LANGUAGES.find(
      (item) => item.code === language
    )?.name || "मराठी";


  const stopGeneratedVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(
        audioUrlRef.current
      );

      audioUrlRef.current = null;
    }
  };


  const playGeneratedVoice = async (
    text
  ) => {
    if (!text) {
      return;
    }

    setVoiceLoading(true);
    stopGeneratedVoice();

    try {
      const audioBlob =
        await generateAISpeech(
          text,
          voiceName
        );

      const audioUrl =
        URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);

      audioRef.current = audio;
      audioUrlRef.current = audioUrl;

      audio.onended = () => {
        stopGeneratedVoice();
      };

      audio.onerror = () => {
        setError(
          "AI आवाज play झाला नाही."
        );

        stopGeneratedVoice();
      };

      await audio.play();
    } finally {
      setVoiceLoading(false);
    }
  };


  const submitQuestion = async (
    text
  ) => {
    const cleanText = text.trim();

    if (!cleanText || loading) {
      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");
    stopGeneratedVoice();

    try {
      const requestedLanguage =
        selectedLanguageName();

      const apiMessage = `
User question:
${cleanText}

Answer the actual question completely in
${requestedLanguage} language.
Do not only confirm the language.
      `.trim();

      const response =
        await askAIAssistant(apiMessage);

      const responseText =
        response?.answer ||
        "उत्तर उपलब्ध नाही.";

      setAnswer(responseText);

      const voiceSummary =
        createVoiceSummary(
          responseText
        );

      try {
        await playGeneratedVoice(
          voiceSummary
        );
      } catch (voiceError) {
        setError(
          voiceError?.response?.data
            ?.detail ||
          "उत्तर मिळाले, पण AI आवाज तयार झाला नाही."
        );
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data
          ?.detail ||
        requestError?.message ||
        "AI Assistant कडून उत्तर मिळाले नाही."
      );
    } finally {
      setLoading(false);
    }
  };


  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Voice recognition साठी Chrome किंवा Edge browser वापरा."
      );

      setVoiceOpen(true);
      return;
    }

    stopGeneratedVoice();
    recognitionRef.current?.abort();

    const recognition =
      new SpeechRecognition();

    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setError("");
      setAnswer("");
    };

    recognition.onresult = async (
      event
    ) => {
      const spokenText =
        event.results?.[0]?.[0]
          ?.transcript?.trim();

      setListening(false);

      if (spokenText) {
        setQuestion(spokenText);

        await submitQuestion(
          spokenText
        );
      }
    };

    recognition.onerror = (
      event
    ) => {
      setListening(false);

      if (
        event.error === "not-allowed"
      ) {
        setError(
          "Browser मध्ये microphone permission Allow करा."
        );
      } else if (
        event.error === "no-speech"
      ) {
        setError(
          "आवाज ऐकू आला नाही. पुन्हा प्रयत्न करा."
        );
      } else {
        setError(
          `Voice recognition error: ${event.error}`
        );
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current =
      recognition;

    setVoiceOpen(true);
    recognition.start();
  };


  const closeVoiceAssistant = () => {
    recognitionRef.current?.abort();
    stopGeneratedVoice();

    setListening(false);
    setVoiceOpen(false);
  };


  const handleQuestionSubmit = (
    event
  ) => {
    event.preventDefault();

    submitQuestion(question);
  };


  const handleSearch = (event) => {
    if (event.key !== "Enter") {
      return;
    }

    const value =
      searchText.trim().toLowerCase();

    if (!value) {
      return;
    }

    const matchedRoute =
      SEARCH_ROUTES.find((item) =>
        item.words.some((word) =>
          value.includes(
            word.toLowerCase()
          )
        )
      );

    if (matchedRoute) {
      navigate(matchedRoute.path);
      setSearchText("");
      return;
    }

    const aiQuestion =
      searchText.trim();

    setQuestion(aiQuestion);
    setVoiceOpen(true);
    submitQuestion(aiQuestion);
    setSearchText("");
  };


  return (
    <>
      <header className="topbar">
        <div className="search-box">
          <Search size={16} />

          <input
            value={searchText}
            placeholder="Search or ask AI"
            onChange={(event) =>
              setSearchText(
                event.target.value
              )
            }
            onKeyDown={handleSearch}
          />
        </div>

        <button
          type="button"
          className={`mic-btn ${
            listening
              ? "is-listening"
              : ""
          }`}
          title="AI Assistant Voice Command"
          onClick={startListening}
        >
          <Mic size={17} />
        </button>

        <div className="topbar-spacer" />

        <button
          type="button"
          className="btn-primary"
          onClick={() =>
            navigate("/orders")
          }
        >
          <Plus size={15} />
          New Order
        </button>

        <button
          type="button"
          className="icon-btn"
          title="Notifications"
          onClick={() =>
            navigate("/notifications")
          }
        >
          <Bell size={16} />

          {unreadCount > 0 && (
            <span className="badge-dot">
              {unreadCount > 99
                ? "99+"
                : unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className="icon-btn"
          title="AI Assistant"
          onClick={() =>
            navigate("/ai-assistant")
          }
        >
          <Mail size={16} />
        </button>

        <button
          type="button"
          className="user-chip voice-user-button"
          onClick={() =>
            navigate("/settings")
          }
        >
          <div className="user-avatar">
            PU
          </div>

          <div>
            <div className="name">
              Professional Users
            </div>

            <div className="plan">
              Premium Active
            </div>
          </div>
        </button>
      </header>

      {voiceOpen && (
        <div
          className="voice-ai-overlay"
          onMouseDown={
            closeVoiceAssistant
          }
        >
          <section
            className="voice-ai-panel"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="voice-ai-header">
              <div>
                <span className="voice-ai-label">
                  THALE TRANSPORT
                </span>

                <h2>
                  Voice AI Assistant
                </h2>
              </div>

              <button
                type="button"
                className="voice-ai-close"
                onClick={
                  closeVoiceAssistant
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="voice-ai-select-grid">
              <label className="voice-ai-language">
                प्रश्न आणि उत्तराची भाषा

                <select
                  value={language}
                  onChange={(event) =>
                    setLanguage(
                      event.target.value
                    )
                  }
                >
                  {INDIAN_LANGUAGES.map(
                    (item) => (
                      <option
                        key={item.code}
                        value={item.code}
                      >
                        {item.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="voice-ai-language">
                AI आवाज

                <select
                  value={voiceName}
                  onChange={(event) => {
                    stopGeneratedVoice();

                    setVoiceName(
                      event.target.value
                    );
                  }}
                >
                  {AI_VOICES.map(
                    (voice) => (
                      <option
                        key={voice.name}
                        value={voice.name}
                      >
                        {voice.label}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>

            <div
              className={`voice-ai-microphone ${
                listening
                  ? "is-listening"
                  : ""
              }`}
            >
              <button
                type="button"
                onClick={startListening}
                disabled={
                  loading ||
                  voiceLoading
                }
              >
                {listening ? (
                  <LoaderCircle
                    size={36}
                    className="voice-ai-spin"
                  />
                ) : (
                  <Mic size={36} />
                )}
              </button>

              <p>
                {listening
                  ? "बोला, मी ऐकत आहे..."
                  : loading
                    ? "AI उत्तर तयार करत आहे..."
                    : voiceLoading
                      ? "आवाज तयार होत आहे..."
                      : "प्रश्न बोलण्यासाठी Mic दाबा"}
              </p>
            </div>

            <form
              className="voice-ai-form"
              onSubmit={
                handleQuestionSubmit
              }
            >
              <input
                value={question}
                placeholder="तुमचा प्रश्न लिहा किंवा बोला..."
                onChange={(event) =>
                  setQuestion(
                    event.target.value
                  )
                }
              />

              <button
                type="submit"
                disabled={
                  loading ||
                  voiceLoading ||
                  !question.trim()
                }
              >
                {loading ? (
                  <LoaderCircle
                    size={19}
                    className="voice-ai-spin"
                  />
                ) : (
                  <Send size={19} />
                )}
              </button>
            </form>

            {error && (
              <div className="voice-ai-error">
                {error}
              </div>
            )}

            {answer && (
              <div className="voice-ai-answer">
                <div className="voice-ai-answer-title">
                  <Volume2 size={18} />
                  AI उत्तर
                </div>

                <p>{answer}</p>

                <button
                  type="button"
                  disabled={voiceLoading}
                  onClick={() =>
                    playGeneratedVoice(
                      answer
                    )
                  }
                >
                  {voiceLoading ? (
                    <LoaderCircle
                      size={17}
                      className="voice-ai-spin"
                    />
                  ) : (
                    <Volume2 size={17} />
                  )}

                  पूर्ण उत्तर ऐका
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      <style>{`
        .voice-user-button {
          border: 0;
          background: transparent;
          font: inherit;
          cursor: pointer;
          text-align: left;
        }

        .mic-btn.is-listening {
          background: #ef4444;
          color: #ffffff;
          animation: voicePulse 1.2s infinite;
        }

        .voice-ai-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(3, 15, 29, 0.7);
          backdrop-filter: blur(6px);
        }

        .voice-ai-panel {
          width: min(680px, 100%);
          max-height: 88vh;
          overflow-y: auto;
          border: 1px solid #dbe4ee;
          border-radius: 24px;
          padding: 26px;
          background: #ffffff;
          box-shadow:
            0 28px 80px
            rgba(0, 25, 50, 0.3);
        }

        .voice-ai-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }

        .voice-ai-header h2 {
          margin: 4px 0 0;
          color: #071c33;
          font-size: 25px;
        }

        .voice-ai-label {
          color: #09a98f;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .voice-ai-close {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          border: 0;
          border-radius: 12px;
          background: #f0f4f8;
          color: #19334e;
          cursor: pointer;
        }

        .voice-ai-select-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .voice-ai-language {
          display: grid;
          gap: 8px;
          color: #52677d;
          font-size: 14px;
          font-weight: 700;
        }

        .voice-ai-language select {
          width: 100%;
          height: 48px;
          border: 1px solid #d7e1eb;
          border-radius: 12px;
          padding: 0 14px;
          background: #f8fafc;
          color: #10263d;
          font-size: 15px;
          outline: none;
        }

        .voice-ai-microphone {
          display: grid;
          justify-items: center;
          gap: 10px;
          padding: 26px 10px 18px;
        }

        .voice-ai-microphone button {
          display: grid;
          place-items: center;
          width: 82px;
          height: 82px;
          border: 0;
          border-radius: 50%;
          background: #082039;
          color: #1dcfb2;
          cursor: pointer;
          box-shadow:
            0 12px 30px
            rgba(8, 32, 57, 0.25);
        }

        .voice-ai-microphone button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .voice-ai-microphone.is-listening button {
          background: #ef4444;
          color: #ffffff;
          animation: voicePulse 1.2s infinite;
        }

        .voice-ai-microphone p {
          margin: 0;
          color: #65788d;
        }

        .voice-ai-form {
          display: flex;
          gap: 10px;
        }

        .voice-ai-form input {
          flex: 1;
          min-width: 0;
          height: 50px;
          border: 1px solid #d7e1eb;
          border-radius: 13px;
          padding: 0 15px;
          font-size: 15px;
          outline: none;
        }

        .voice-ai-form input:focus,
        .voice-ai-language select:focus {
          border-color: #13b89e;
          box-shadow:
            0 0 0 3px
            rgba(19, 184, 158, 0.12);
        }

        .voice-ai-form button {
          display: grid;
          place-items: center;
          width: 50px;
          height: 50px;
          border: 0;
          border-radius: 13px;
          background: #0a2139;
          color: #ffffff;
          cursor: pointer;
        }

        .voice-ai-form button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .voice-ai-error {
          margin-top: 15px;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 12px 14px;
          background: #fff1f2;
          color: #b42318;
        }

        .voice-ai-answer {
          margin-top: 18px;
          border: 1px solid #cfeae4;
          border-radius: 16px;
          padding: 18px;
          background: #f0fbf8;
        }

        .voice-ai-answer-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #087d6c;
          font-weight: 800;
        }

        .voice-ai-answer p {
          margin: 12px 0;
          color: #1f3449;
          line-height: 1.65;
          white-space: pre-wrap;
        }

        .voice-ai-answer button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 0;
          border-radius: 10px;
          padding: 10px 13px;
          background: #0b806e;
          color: #ffffff;
          cursor: pointer;
        }

        .voice-ai-answer button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .voice-ai-spin {
          animation:
            voiceSpin 0.9s
            linear infinite;
        }

        @keyframes voiceSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes voicePulse {
          0%,
          100% {
            box-shadow:
              0 0 0 0
              rgba(239, 68, 68, 0.4);
          }

          50% {
            box-shadow:
              0 0 0 12px
              rgba(239, 68, 68, 0);
          }
        }

        @media (max-width: 720px) {
          .voice-ai-overlay {
            padding: 10px;
          }

          .voice-ai-panel {
            padding: 19px;
            border-radius: 18px;
          }

          .voice-ai-select-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}