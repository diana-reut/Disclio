import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import './ChatView.css';

export function ChatView() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [recipient, setRecipient] = useState("");
    const [isRecipientValid, setIsRecipientValid] = useState(false);
    const client = useRef(null);

    const currentUser = document.cookie
        .split('; ')
        .find(row => row.trim().startsWith('username='))
        ?.split('=')[1] || "Guest";

    useEffect(() => {
        client.current = new Client({
            brokerURL: `ws://${window.location.hostname}:8080/ws`,
            reconnectDelay: 5000,
        });

        client.current.onConnect = () => {
            client.current.subscribe('/topic/public', (message) => {
                const newMessage = JSON.parse(message.body);
                // Only add message to screen if it involves the person I'm talking to
                setMessages(prev => [...prev, newMessage]);
            });
        };

        client.current.activate();
        return () => client.current.deactivate();
    }, []);

    const fetchHistory = async (targetUser) => {
        const myName = decodeURIComponent(currentUser);
        const query = `
        query {
            getChatHistory(user1: "${myName}", user2: "${targetUser}") {
                sender
                content
                timestamp
            }
        }`;

        try {
            const response = await fetch(`http://${window.location.hostname}:8080/graphql`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ query })
            });
            const result = await response.json();
            if (result.data?.getChatHistory) {
                setMessages(result.data.getChatHistory);
            }
        } catch (err) { console.error("History fetch failed", err); }
    };

    const verifyUser = async () => {
        if (!recipient.trim()) return;
        const query = `{ userExists(username: "${recipient}") }`;

        try {
            const response = await fetch(`http://${window.location.hostname}:8080/graphql`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ query })
            });
            const result = await response.json();

            if (result.data?.userExists) {
                setIsRecipientValid(true);
                fetchHistory(recipient); // History is loaded as soon as user is found!
            } else {
                setIsRecipientValid(false);
                alert(`User "${recipient}" does not exist!`);
            }
        } catch (err) { alert("Server connection error."); }
    };

    const sendMessage = () => {
        if (input.trim() && client.current?.connected) {
            const chatMessage = {
                sender: decodeURIComponent(currentUser),
                content: input,
                recipient: recipient,
                timestamp: new Date().toISOString()
            };
            client.current.publish({
                destination: '/app/chat.send',
                body: JSON.stringify(chatMessage)
            });
            setInput("");
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <button className="small-btn" onClick={() => navigate(-1)}>← Back</button>
                <h2 className="chat-title">REAL-TIME CHAT</h2>
                <div className="status-indicator">● Live</div>
            </div>

            <div className="chat-recipient-bar">
                <input
                    type="text"
                    placeholder="Chat with username..."
                    value={recipient}
                    onChange={(e) => { setRecipient(e.target.value); setIsRecipientValid(false); }}
                />
                <button className="send-btn" onClick={verifyUser}>
                    {isRecipientValid ? "✓ Verified" : "Verify User"}
                </button>
            </div>

            <div className="chat-window">
                {isRecipientValid ? (
                    messages.map((msg, index) => (
                        <div key={index} className={`msg-bubble ${msg.sender === decodeURIComponent(currentUser) ? 'sent' : 'received'}`}>
                            <span className="msg-sender">{msg.sender}</span>
                            <p className="msg-content">{msg.content}</p>
                        </div>
                    ))
                ) : (
                    <p className="empty-chat">Verify a user to see message history.</p>
                )}
            </div>

            <div className="chat-input-area">
                <input
                    type="text"
                    placeholder={isRecipientValid ? "Type message..." : "Verify user first..."}
                    value={input}
                    disabled={!isRecipientValid}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button className="send-btn" onClick={sendMessage} disabled={!isRecipientValid}>Send</button>
            </div>
        </div>
    );
}