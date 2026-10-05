import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const loadMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages`);

      if (!response.ok) {
        throw new Error("Failed to load messages");
      }

      const data = await response.json();

      setMessages(data);
      setConnected(true);
    } catch (error) {
      console.error(error);
      setConnected(false);
    }
  };

  useEffect(() => {
    loadMessages();

    const interval = setInterval(loadMessages, 5000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (event) => {
    event.preventDefault();

    if (!username.trim() || !message.trim()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          username: username.trim(),
          message: message.trim()
        })
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const newMessage = await response.json();

      setMessages((current) => [
        ...current,
        newMessage
      ]);

      setMessage("");
      setConnected(true);
    } catch (error) {
      console.error(error);
      alert("Could not send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">

      <header className="header">

        <div>
          <h1>DevOps Chat</h1>

          <p>
            Kubernetes + Docker + Argo CD
          </p>
        </div>

        <div
          className={
            connected
              ? "status connected"
              : "status disconnected"
          }
        >
          <span></span>

          {connected ? "Connected" : "Disconnected"}
        </div>

      </header>


      <main className="chat-container">

        <div className="messages">

          {messages.length === 0 ? (
            <div className="empty">

              <div className="empty-icon">
                💬
              </div>

              <h2>No messages yet</h2>

              <p>
                Start the conversation!
              </p>

            </div>
          ) : (
            messages.map((item) => (
              <div
                className="message"
                key={item.id}
              >

                <div className="avatar">
                  {item.username
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="message-content">

                  <div className="message-header">

                    <strong>
                      {item.username}
                    </strong>

                    <span>
                      {new Date(
                        item.created_at
                      ).toLocaleTimeString()}
                    </span>

                  </div>

                  <div className="bubble">
                    {item.message}
                  </div>

                </div>

              </div>
            ))
          )}

        </div>


        <form
          className="message-form"
          onSubmit={sendMessage}
        >

          <input
            type="text"
            placeholder="Your name"
            value={username}
            onChange={(event) =>
              setUsername(event.target.value)
            }
          />

          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send"}
          </button>

        </form>

      </main>


      <footer>
        <span>
          🚀 GitOps Chat Application
        </span>

        <span>
          Managed by Argo CD
        </span>
      </footer>

    </div>
  );
}

export default App;
