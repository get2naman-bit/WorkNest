import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  MessageSquare,
  Search,
  CheckCheck,
  Briefcase,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/ui/Button.jsx';
import { subscribeToMessages } from '../services/supabaseService.js';
import { mapMessage } from '../lib/mappers.js';

export default function MessagesPage() {
  const { conversations, currentUser, sendMessage, markConversationRead } = useApp();
  const [searchParams] = useSearchParams();

  const myConversations = conversations.filter(
    (c) =>
      !currentUser ||
      c.participant1Id === currentUser.id ||
      c.participant2Id === currentUser.id ||
      c.participant1Id === 'w1' ||
      c.participant2Id === 'e1'
  );

  const unreadFor = (conv) =>
    conv?.unreadBy?.[currentUser?.id] ?? conv?.unreadCount ?? 0;

  const [activeConvId, setActiveConvId] = useState(
    () => searchParams.get('conversation') || null
  );

  const [inputText, setInputText] = useState('');
  const [sendError, setSendError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [realtimeMessages, setRealtimeMessages] = useState({});
  const messagesScrollRef = useRef(null);
  const stickToBottomRef = useRef(true);

  const activeConv = myConversations.find((c) => c.id === activeConvId) || null;

  // Subscribe to persisted messages so the other participant sees new messages
  // without refreshing the page.
  useEffect(() => {
    if (!activeConv?.id || !/^[0-9a-f-]{36}$/i.test(activeConv.id)) return undefined;
    return subscribeToMessages(activeConv.id, (row) => {
      const message = mapMessage(row);
      setRealtimeMessages((current) => ({
        ...current,
        [activeConv.id]: [...(current[activeConv.id] || []).filter((item) => item.id !== message.id), message],
      }));
    });
  }, [activeConv?.id]);

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

  const threadMessages = activeConv
    ? [...(activeConv.messages || []), ...(realtimeMessages[activeConv.id] || [])]
        .filter((msg, index, all) => all.findIndex((candidate) => candidate.id === msg.id) === index)
    : [];

  // Start at the newest message when switching conversations. Keep the view
  // there for new messages only while the reader is already near the bottom.
  useEffect(() => {
    stickToBottomRef.current = true;
    const container = messagesScrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [activeConv?.id]);

  useEffect(() => {
    const container = messagesScrollRef.current;
    if (container && stickToBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [activeConv?.id, threadMessages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv || isSending) return;

    const partnerId =
      activeConv.participant1Id === currentUser?.id
        ? activeConv.participant2Id
        : activeConv.participant1Id;

    const text = inputText.trim();
    setIsSending(true);
    setSendError('');
    try {
      const result = await sendMessage({
        conversationId: activeConv.id,
        recipientId: partnerId,
        jobId: activeConv.jobId,
        jobTitle: activeConv.jobTitle,
        text,
      });
      if (result?.success === false) {
        setSendError(result.error || 'Could not send your message. Please try again.');
        return;
      }
      setInputText('');
    } catch (error) {
      setSendError(error.message || 'Could not send your message. Please try again.');
    } finally {
      setIsSending(false);
    }
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
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
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
              ref={messagesScrollRef}
              onScroll={(event) => {
                const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
                stickToBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
              }}
              style={{
                flex: 1,
                overflowY: 'auto',
                minHeight: 0,
                overscrollBehavior: 'contain',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: '#f8fafc',
              }}
            >
              {threadMessages.map((msg) => {
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
                        background: isMine ? '#1a6fe0' : '#ffffff',
                        color: isMine ? '#ffffff' : 'var(--ink)',
                        boxShadow: '0 1px 3px rgba(10, 17, 32, 0.05)',
                        border: isMine ? 'none' : '1px solid #e2e8f0',
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
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (sendError) setSendError('');
                }}
                style={{ flex: 1 }}
              />
              <Button type="submit" variant="dark" size="md" disabled={isSending || !inputText.trim()}>
                {isSending ? 'Sending…' : <>Send <Send size={14} /></>}
              </Button>
            </form>
            {sendError && (
              <p role="alert" style={{ padding: '0 20px 12px', color: '#b91c1c', fontSize: '13px' }}>
                {sendError}
              </p>
            )}
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
