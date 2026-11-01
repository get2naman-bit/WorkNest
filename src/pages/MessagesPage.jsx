import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  MessageSquare,
  Search,
  CheckCheck,
  Briefcase,
  Paperclip,
  Phone,
  MoreVertical,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/ui/Button.jsx';

export default function MessagesPage() {
  const { conversations, currentUser, sendMessage, markConversationRead } = useApp();
  const [searchParams] = useSearchParams();

  const myConversations = conversations.filter(
    (c) => currentUser && (c.participant1Id === currentUser.id || c.participant2Id === currentUser.id)
  );

  const unreadFor = (conv) =>
    conv?.unreadBy?.[currentUser?.id] ?? conv?.unreadCount ?? 0;

  const [activeConvId, setActiveConvId] = useState(
    () => searchParams.get('conversation') || null
  );

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  const activeConv = myConversations.find((c) => c.id === activeConvId) || null;

  // Keep the selected thread valid as conversations load asynchronously.
  useEffect(() => {
    if (myConversations.length === 0) {
      if (activeConvId) setActiveConvId(null);
      return;
    }
    if (!myConversations.some((c) => c.id === activeConvId)) {
      const requested = searchParams.get('conversation');
      const requestedConv = myConversations.find((c) => c.id === requested);
      setActiveConvId(requestedConv?.id || myConversations[0].id);
    }
  }, [myConversations, activeConvId, searchParams]);

  // Opening a thread clears its unread badge for the current user.
  useEffect(() => {
    if (activeConv && unreadFor(activeConv) > 0) {
      markConversationRead(activeConv.id, currentUser?.id);
    }
  }, [activeConv?.id, activeConv?.unreadBy, currentUser?.id, markConversationRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    const partnerId =
      activeConv.participant1Id === currentUser?.id
        ? activeConv.participant2Id
        : activeConv.participant1Id;

    sendMessage({
      conversationId: activeConv.id,
      recipientId: partnerId,
      jobId: activeConv.jobId,
      jobTitle: activeConv.jobTitle,
      text: inputText.trim(),
    });

    setInputText('');
  };

  const filteredConversations = myConversations.filter((c) => {
    const partnerName =
      c.participant1Id === currentUser?.id ? c.participant2Name : c.participant1Name;
    return (
      partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div className="card messages-shell">
        {/* Left Pane: Conversations List */}
        <div
          style={{
            borderRight: '1px solid var(--line)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: '#fafbfc',
          }}
        >
          <div style={{ padding: '16px', borderBottom: '1px solid var(--line)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '12px' }}>
              Messages
            </h2>
            <div style={{ position: 'relative' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '32px', fontSize: '13px' }}
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="messages-shell__list">
            {filteredConversations.length === 0 && (
              <p style={{ padding: '20px 16px', fontSize: '13px', color: 'var(--muted)' }}>
                {myConversations.length === 0
                  ? 'No conversations yet. Message an employer or worker to start one.'
                  : 'No conversations match your search.'}
              </p>
            )}
            {filteredConversations.map((conv) => {
              const partnerName =
                conv.participant1Id === currentUser?.id
                  ? conv.participant2Name
                  : conv.participant1Name;
              const isSelected = activeConv?.id === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--line)',
                    background: isSelected ? '#ffffff' : 'transparent',
                    borderLeft: isSelected ? '4px solid var(--blue)' : '4px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <strong
                      style={{
                        fontSize: '14px',
                        color: isSelected ? 'var(--blue)' : 'var(--navy)',
                      }}
                    >
                      {partnerName}
                    </strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {unreadFor(conv) > 0 && (
                        <span
                          style={{
                            background: 'var(--blue)',
                            color: '#fff',
                            borderRadius: '999px',
                            fontSize: '10px',
                            fontWeight: 700,
                            minWidth: '18px',
                            height: '18px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 5px',
                          }}
                        >
                          {unreadFor(conv)}
                        </span>
                      )}
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {conv.lastMessageTime}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--blue)',
                      fontWeight: 600,
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    Regarding: {conv.jobTitle}
                  </div>

                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.4,
                    }}
                  >
                    {conv.lastMessage}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Active Thread */}
        {activeConv ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Thread Header with Job Context Banner */}
            <div
              style={{
                padding: '14px 24px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
              }}
            >
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)' }}>
                  {activeConv.participant1Id === currentUser?.id
                    ? activeConv.participant2Name
                    : activeConv.participant1Name}
                </h3>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--blue)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Briefcase size={12} /> {activeConv.jobTitle}
                </span>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: '#f8fafc',
              }}
            >
              {activeConv.messages.map((msg) => {
                const isMine = msg.senderId === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMine ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: '14px',
                        background: isMine ? 'var(--blue)' : '#ffffff',
                        color: isMine ? '#ffffff' : 'var(--ink)',
                        boxShadow: '0 1px 3px rgba(10, 17, 32, 0.05)',
                        border: isMine ? 'none' : '1px solid var(--line)',
                        fontSize: '14px',
                        lineHeight: 1.5,
                      }}
                    >
                      {msg.text}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--muted)',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {msg.time} {isMine && <CheckCheck size={12} color="var(--blue)" />}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSend}
              style={{
                padding: '16px 20px',
                background: '#ffffff',
                borderTop: '1px solid var(--line)',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                className="form-input"
                placeholder="Type your message here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button type="submit" variant="dark" size="md">
                Send <Send size={14} />
              </Button>
            </form>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: 'var(--muted)',
            }}
          >
            <MessageSquare size={48} color="var(--line)" />
            <p style={{ marginTop: '12px' }}>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
