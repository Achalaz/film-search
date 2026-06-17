/* ============================================================
   FilmFinder – chatbot.js
   CineAI: AI Movie Assistant (Powered by Pollinations AI – Free)
   ============================================================ */

(function CineAI() {

    /* ─── Config ──────────────────────────────────────────── */
    // Using Pollinations AI — completely free, no API key required
    const API_URL = 'https://text.pollinations.ai/openai';
    const MODEL = 'openai'; // Pollinations free GPT-compatible model
    const MAX_HISTORY = 12; // keep last N messages in context

    const SYSTEM_PROMPT = `You are CineAI, an expert AI movie assistant integrated into FilmFinder — a sleek cinematic movie search app.
Your personality: Enthusiastic, knowledgeable, concise, and witty about all things cinema.
You help users with:
- Movie recommendations (by genre, mood, director, era, similar films, etc.)
- Film trivia, awards, box office facts
- Director / actor filmographies
- Plot explanations and deeper analysis
- "What to watch tonight" type suggestions
- Film history and behind-the-scenes facts

Rules:
- Keep responses focused and concise (2–5 sentences for simple queries, up to 10 sentences for recommendations).
- Use emojis sparingly to add personality 🎬
- When listing movies, bold the title using markdown **Title (Year)**
- If asked something unrelated to movies/entertainment, politely redirect: "I'm your dedicated cinema guide — ask me anything about films! 🎥"
- Never reveal your underlying AI model or API key.`;

    /* ─── State ───────────────────────────────────────────── */
    let isOpen = false;
    let isLoading = false;
    let conversationHistory = [];

    /* ─── DOM References ──────────────────────────────────── */
    const fab         = document.getElementById('chatbot-fab');
    const window_     = document.getElementById('chatbot-window');
    const messages    = document.getElementById('chatbot-messages');
    const input       = document.getElementById('chatbot-input');
    const sendBtn     = document.getElementById('chatbot-send-btn');
    const closeBtn    = document.getElementById('chatbot-close-btn');
    const clearBtn    = document.getElementById('chatbot-clear-btn');
    const notifDot    = document.getElementById('chatbot-notif-dot');
    const suggestions = document.getElementById('chatbot-suggestions');

    if (!fab) return; // guard: only run on pages with the widget

    /* ─── Open / Close ────────────────────────────────────── */
    fab.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', closeChat);

    function toggleChat() {
        if (isOpen) {
            closeChat();
        } else {
            openChat();
        }
    }

    function openChat() {
        isOpen = true;
        window_.classList.remove('d-none');
        window_.classList.remove('closing');
        // Hide notification dot
        notifDot.classList.add('hidden');
        // Change FAB icon to X
        const fabIcon = document.getElementById('fab-icon');
        if (fabIcon) {
            fabIcon.className = 'bi bi-x-lg';
        }
        // Show welcome if first open
        if (conversationHistory.length === 0) {
            showWelcome();
        }
        // Focus input
        setTimeout(() => input && input.focus(), 350);
    }

    function closeChat() {
        isOpen = false;
        window_.classList.add('closing');
        setTimeout(() => {
            window_.classList.add('d-none');
            window_.classList.remove('closing');
        }, 220);
        // Restore FAB icon
        const fabIcon = document.getElementById('fab-icon');
        if (fabIcon) {
            fabIcon.className = 'bi bi-robot';
        }
    }

    /* ─── Clear Chat ──────────────────────────────────────── */
    clearBtn.addEventListener('click', () => {
        conversationHistory = [];
        messages.innerHTML = '';
        suggestions.classList.remove('hidden');
        showWelcome();
    });

    /* ─── Welcome Message ─────────────────────────────────── */
    function showWelcome() {
        const welcomeText = `👋 Hey! I'm **CineAI**, your personal movie expert.\n\nAsk me for recommendations, trivia, plot help, or just *"what should I watch tonight?"* 🎬`;
        appendMessage('bot', welcomeText);
    }

    /* ─── Suggestion Pills ────────────────────────────────── */
    document.querySelectorAll('.chat-suggestion-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const prompt = pill.dataset.prompt;
            if (prompt) {
                suggestions.classList.add('hidden');
                sendMessage(prompt);
            }
        });
    });

    /* ─── Input Handlers ──────────────────────────────────── */
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
    sendBtn.addEventListener('click', handleSend);

    // Auto-resize textarea
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    function handleSend() {
        const text = input.value.trim();
        if (!text || isLoading) return;
        input.value = '';
        input.style.height = 'auto';
        suggestions.classList.add('hidden');
        sendMessage(text);
    }

    /* ─── Send a Message ──────────────────────────────────── */
    async function sendMessage(userText) {
        // Append user bubble
        appendMessage('user', userText);

        // Add to history
        conversationHistory.push({ role: 'user', content: userText });
        if (conversationHistory.length > MAX_HISTORY) {
            conversationHistory = conversationHistory.slice(-MAX_HISTORY);
        }

        // Show typing indicator
        const typingEl = showTyping();
        isLoading = true;
        sendBtn.disabled = true;

        try {
            const reply = await callDeepSeek(conversationHistory);
            removeTyping(typingEl);
            appendMessage('bot', reply);
            conversationHistory.push({ role: 'assistant', content: reply });
        } catch (err) {
            removeTyping(typingEl);
            const errMsg = getErrorMessage(err);
            appendMessage('bot', errMsg);
        } finally {
            isLoading = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }

    /* ─── Pollinations AI API Call (Free – No Key Required) ── */
    async function callDeepSeek(history) {
        const payload = {
            model: MODEL,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...history
            ],
            max_tokens: 600,
            temperature: 0.75,
            stream: false,
            seed: Math.floor(Math.random() * 99999)
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const msg = errData?.error?.message || `API error ${response.status}`;
            throw new Error(msg);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'Hmm, I couldn\'t generate a response. Try again!';
    }

    /* ─── Append Message Bubble ───────────────────────────── */
    function appendMessage(role, text) {
        const msgEl = document.createElement('div');
        msgEl.className = `chat-msg ${role}`;

        const avatarEl = document.createElement('div');
        avatarEl.className = 'chat-msg-avatar';
        avatarEl.innerHTML = role === 'bot'
            ? '<i class="bi bi-robot"></i>'
            : '<i class="bi bi-person-fill"></i>';

        const bubbleEl = document.createElement('div');
        bubbleEl.className = 'chat-bubble';
        bubbleEl.innerHTML = formatText(text);

        msgEl.appendChild(avatarEl);
        msgEl.appendChild(bubbleEl);
        messages.appendChild(msgEl);

        // Smooth scroll to bottom
        requestAnimationFrame(() => {
            messages.scrollTop = messages.scrollHeight;
        });
    }

    /* ─── Typing Indicator ────────────────────────────────── */
    function showTyping() {
        const msgEl = document.createElement('div');
        msgEl.className = 'chat-msg bot typing-msg';

        const avatarEl = document.createElement('div');
        avatarEl.className = 'chat-msg-avatar';
        avatarEl.innerHTML = '<i class="bi bi-robot"></i>';

        const bubbleEl = document.createElement('div');
        bubbleEl.className = 'chat-bubble';
        bubbleEl.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>`;

        msgEl.appendChild(avatarEl);
        msgEl.appendChild(bubbleEl);
        messages.appendChild(msgEl);

        requestAnimationFrame(() => {
            messages.scrollTop = messages.scrollHeight;
        });

        return msgEl;
    }

    function removeTyping(el) {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }

    /* ─── Text Formatter ──────────────────────────────────── */
    // Converts simple markdown (bold, italic, newlines) to HTML safely
    function formatText(raw) {
        if (!raw) return '';
        let text = escapeHtml(raw);
        // Bold: **text** → <strong>text</strong>
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Italic: *text* → <em>text</em>
        text = text.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
        // Newlines → <br>
        text = text.replace(/\n/g, '<br>');
        // Numbered list items: keep visual structure
        text = text.replace(/(\d+)\.\s+/g, '<br>$1. ');
        // Bullet list items
        text = text.replace(/^-\s+/gm, '<br>• ');
        return text;
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* ─── Error Messages ──────────────────────────────────── */
    function getErrorMessage(err) {
        const msg = err.message || '';
        if (msg.includes('429') || msg.includes('rate limit')) {
            return '⏳ Too many requests — please wait a moment and try again.';
        }
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network') || msg.includes('Load failed')) {
            return '📡 Network error — please check your internet connection and try again.';
        }
        if (msg.includes('500') || msg.includes('503') || msg.includes('server')) {
            return '🛠️ The AI server is temporarily busy. Please try again in a moment.';
        }
        return `⚠️ Something went wrong. Please try again in a few seconds.`;
    }

    /* ─── Notification dot on load (invite to open) ──────── */
    setTimeout(() => {
        if (!isOpen) {
            notifDot.classList.remove('hidden');
        }
    }, 2500);

})();
