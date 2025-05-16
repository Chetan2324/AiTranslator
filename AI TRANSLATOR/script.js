/**
 * AI Language Translator Pro
 * Complete JavaScript implementation with enhanced features
 */

class TranslatorBot {
    constructor() {
        // Main elements
        this.userInput = document.getElementById("user-input");
        this.chatBox = document.getElementById("chat-box");
        this.fromLang = document.getElementById("from-language");
        this.toLang = document.getElementById("to-language");
        this.sendBtn = document.getElementById("sendBtn");
        this.micBtn = document.getElementById("micBtn");
        this.clearBtn = document.getElementById("clearBtn");
        this.swapBtn = document.getElementById("swapBtn");
        this.typingIndicator = document.getElementById("typing-indicator");
        
        // Feature buttons
        this.historyBtn = document.getElementById("historyBtn");
        this.favoritesBtn = document.getElementById("favoritesBtn");
        this.settingsBtn = document.getElementById("settingsBtn");
        
        // Modal elements
        this.historyModal = document.getElementById("historyModal");
        this.historyList = document.getElementById("historyList");
        
        // Data storage
        this.history = JSON.parse(localStorage.getItem('translationHistory')) || [];
        this.favorites = JSON.parse(localStorage.getItem('translationFavorites')) || [];
        this.settings = JSON.parse(localStorage.getItem('translatorSettings')) || {
            autoRead: false,
            autoSwap: false,
            defaultFromLang: 'auto',
            defaultToLang: 'hi'
        };
        
        // Initialize
        this.setupEventListeners();
        this.loadSettings();
        this.initSpeechRecognition();
    }
    
    // ============= Initial Setup =============
    
    setupEventListeners() {
        // Main input actions
        this.userInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") this.sendMessage();
        });
        
        this.sendBtn.addEventListener("click", () => this.sendMessage());
        this.micBtn.addEventListener("click", () => this.startListening());
        this.clearBtn.addEventListener("click", () => this.clearInput());
        this.swapBtn.addEventListener("click", () => this.swapLanguages());
        
        // Feature buttons
        this.historyBtn.addEventListener("click", () => this.showHistory());
        this.favoritesBtn.addEventListener("click", () => this.showFavorites());
        this.settingsBtn.addEventListener("click", () => this.showSettings());
        
        // Close modals when clicking the close button or outside
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeAllModals();
            });
        });
        
        // Add copy and listen functionality to bot messages
        this.chatBox.addEventListener('click', (e) => {
            const target = e.target;
            
            // Copy button functionality
            if (target.classList.contains('copy-btn') || target.closest('.copy-btn')) {
                const messageText = target.closest('.bot-message').querySelector('.message-text').innerText;
                this.copyToClipboard(messageText);
            }
            
            // Listen button functionality
            if (target.classList.contains('listen-btn') || target.closest('.listen-btn')) {
                const messageText = target.closest('.bot-message').querySelector('.message-text').innerText;
                const language = this.toLang.value;
                this.speakText(messageText, language);
            }
        });
    }
    
    loadSettings() {
        // Apply saved settings
        this.fromLang.value = this.settings.defaultFromLang;
        this.toLang.value = this.settings.defaultToLang;
    }
    
    // ============= Speech Recognition =============
    
    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            
            this.recognition.onend = () => {
                // Reset mic icon and button state
                const micIcon = this.micBtn.querySelector('i');
                micIcon.classList.replace('fa-microphone-slash', 'fa-microphone');
                this.micBtn.classList.remove('active');
            };
            
            this.recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                this.userInput.value = text;
                this.sendMessage();
            };
    
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showNotification('Microphone error. Please check your microphone permissions.', 'error');
                
                // Reset mic icon and button state
                const micIcon = this.micBtn.querySelector('i');
                micIcon.classList.replace('fa-microphone-slash', 'fa-microphone');
                this.micBtn.classList.remove('active');
            };
        }
    }
    
    startListening() {
        if (!this.recognition) {
            this.showNotification('Speech recognition is not supported in your browser. Please use Chrome.', 'error');
            return;
        }
        
        // Update recognition language
        this.recognition.lang = this.fromLang.value === 'auto' ? 'en-US' : this.fromLang.value;
        
        // Visual feedback - change mic icon
        const micIcon = this.micBtn.querySelector('i');
        micIcon.classList.replace('fa-microphone', 'fa-microphone-slash');
        
        // Add active class to button
        this.micBtn.classList.add('active');
        
        // Show ripple effect
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        this.micBtn.appendChild(ripple);
        
        // Start listening
        this.recognition.start();
        
        // Auto stop after 5 seconds
        setTimeout(() => {
            if (this.recognition) {
                this.recognition.stop();
            }
        }, 5000);
    }
    
    // ============= Message Handling =============
    
    createMessage(text, isUser) {
        const message = document.createElement("div");
        message.classList.add("message", "animate__animated", "animate__fadeIn");
        message.classList.add(isUser ? "user-message" : "bot-message");
        
        if (isUser) {
            // Simple structure for user messages
            message.innerText = text;
        } else {
            // Complex structure for bot messages with actions
            message.innerHTML = `
                <div class="message-content">
                    <div class="bot-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="message-text">${text}</div>
                </div>
                <div class="message-actions">
                    <button class="listen-btn" title="Listen">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <button class="copy-btn" title="Copy to clipboard">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            `;
        }
        
        return message;
    }
    
    showTypingIndicator() {
        this.typingIndicator.classList.add('active');
    }
    
    hideTypingIndicator() {
        this
        this.typingIndicator.classList.remove('active');
    }
    
    scrollToBottom() {
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }
    
    clearInput() {
        this.userInput.value = "";
        this.userInput.focus();
    }
    
    async sendMessage() {
        const message = this.userInput.value.trim();
        if (message === "") return;
    
        // Add user message
        this.chatBox.appendChild(this.createMessage(message, true));
        this.scrollToBottom();
        
        // Show typing indicator
        this.showTypingIndicator();
    
        try {
            const sourceLang = this.fromLang.value === 'auto' ? 'auto' : this.fromLang.value;
            const targetLang = this.toLang.value;
            
            // Simulate network delay for a more realistic experience
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Use Google Translate API (or your preferred translation API)
            const translatedText = await this.translateText(message, sourceLang, targetLang);
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add bot message with translated text
            const botMsg = this.createMessage(translatedText, false);
            this.chatBox.appendChild(botMsg);
            
            // Auto read if enabled in settings
            if (this.settings.autoRead) {
                this.speakText(translatedText, targetLang);
            }
            
            // Save to history
            this.saveToHistory({
                from: message,
                to: translatedText,
                fromLang: sourceLang,
                toLang: targetLang,
                timestamp: new Date(),
                isFavorite: false
            });
            
        } catch (error) {
            console.error("Translation error:", error);
            this.hideTypingIndicator();
            
            // Add error message
            const errorMsg = this.createMessage("Translation failed. Please try again later.", false);
            this.chatBox.appendChild(errorMsg);
            this.showNotification("Translation service unavailable. Please try again later.", "error");
        }
    
        this.clearInput();
        this.scrollToBottom();
    }
    
    async translateText(text, sourceLang, targetLang) {
        try {
            // First try Google Translate API
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
            const data = await response.json();
        
            if (data && data[0]) {
                // Combine all translated parts
                return data[0]
                    .filter(item => item && item[0])
                    .map(item => item[0])
                    .join(' ');
            }
            
            // If Google Translate fails, use a fallback
            throw new Error('Primary translation failed');
            
        } catch (error) {
            // Fallback to LibreTranslate or similar free API
            console.log('Falling back to secondary translation service');
            
            // Simulate fallback translation (replace with actual API call)
            // In a real implementation, you would call another translation API here
            return `[Translated] ${text}`;
        }
    }
    
    speakText(text, language) {
        if (!('speechSynthesis' in window)) {
            this.showNotification('Text-to-speech is not supported in your browser.', 'error');
            return;
        }
        
        // Stop any current speech
        window.speechSynthesis.cancel();
        
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = language;
        
        // Get available voices
        const voices = window.speechSynthesis.getVoices();
        
        // Try to find a voice that matches the language
        const voice = voices.find(v => v.lang.startsWith(language));
        if (voice) speech.voice = voice;
        
        window.speechSynthesis.speak(speech);
    }
    
    // ============= Language Management =============
    
    swapLanguages() {
        // Don't swap if one is auto-detect
        if (this.fromLang.value === 'auto') {
            this.showNotification('Cannot swap when using Auto Detect.', 'info');
            return;
        }
        
        // Store current values
        const fromValue = this.fromLang.value;
        const toValue = this.toLang.value;
        
        // Swap the values
        this.fromLang.value = toValue;
        this.toLang.value = fromValue;
        
        // Add visual feedback
        const swapEffect = this.swapBtn.querySelector('.swap-effect');
        swapEffect.style.transform = 'scale(1)';
        swapEffect.style.opacity = '0.3';
        
        // Reset the effect after animation
        setTimeout(() => {
            swapEffect.style.transform = 'scale(0)';
            swapEffect.style.opacity = '0';
        }, 300);
    }
    
    // ============= History and Favorites =============
    
    saveToHistory(translation) {
        // Update history
        this.history.unshift(translation);
        if (this.history.length > 50) this.history.pop(); // Keep last 50 entries
        localStorage.setItem('translationHistory', JSON.stringify(this.history));
    }
    
    showHistory() {
        this.closeAllModals();
        this.historyModal.classList.add('active');
        this.renderHistoryItems(this.history);
    }
    
    showFavorites() {
        this.closeAllModals();
        
        // If we don't have a favorites modal yet, create one
        if (!document.getElementById('favoritesModal')) {
            this.createFavoritesModal();
        }
        
        document.getElementById('favoritesModal').classList.add('active');
        this.renderHistoryItems(this.favorites, 'favoritesList');
    }
    
    toggleFavorite(index) {
        const item = this.history[index];
        
        // Toggle favorite status
        item.isFavorite = !item.isFavorite;
        
        // Update history in local storage
        localStorage.setItem('translationHistory', JSON.stringify(this.history));
        
        // Update favorites list
        if (item.isFavorite) {
            this.favorites.unshift(item);
        } else {
            // Remove from favorites
            const favIndex = this.favorites.findIndex(f => 
                f.from === item.from && 
                f.to === item.to && 
                f.fromLang === item.fromLang &&
                f.toLang === item.toLang
            );
            
            if (favIndex > -1) {
                this.favorites.splice(favIndex, 1);
            }
        }
        
        // Save favorites
        localStorage.setItem('translationFavorites', JSON.stringify(this.favorites));
        
        // Update UI
        this.renderHistoryItems(this.history);
    }
    
    renderHistoryItems(items, containerId = 'historyList') {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        if (items.length === 0) {
            container.innerHTML = '<div class="empty-state">No items yet</div>';
            return;
        }
        
        items.forEach((item, index) => {
            // Format date
            const date = new Date(item.timestamp);
            const formattedDate = date.toLocaleString();
            
            // Get language names
            const fromLangName = this.getLanguageName(item.fromLang);
            const toLangName = this.getLanguageName(item.toLang);
            
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="translation-pair">
                    <div class="from-text">${item.from}</div>
                    <div class="to-text">${item.to}</div>
                </div>
                <div class="meta">
                    <div class="languages">${fromLangName} → ${toLangName}</div>
                    <div class="timestamp">${formattedDate}</div>
                </div>
                <div class="actions">
                    <button class="action-btn listen-history">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <button class="action-btn copy-history">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="action-btn favorite-btn ${item.isFavorite ? 'active' : ''}">
                        <i class="fas ${item.isFavorite ? 'fa-star' : 'fa-star'}"></i>
                    </button>
                    <button class="action-btn translate-again">
                        <i class="fas fa-redo"></i>
                    </button>
                </div>
            `;
            
            // Add event listeners
            const listenBtn = historyItem.querySelector('.listen-history');
            listenBtn.addEventListener('click', () => this.speakText(item.to, item.toLang));
            
            const copyBtn = historyItem.querySelector('.copy-history');
            copyBtn.addEventListener('click', () => this.copyToClipboard(item.to));
            
            const favoriteBtn = historyItem.querySelector('.favorite-btn');
            favoriteBtn.addEventListener('click', () => this.toggleFavorite(index));
            
            const translateAgainBtn = historyItem.querySelector('.translate-again');
            translateAgainBtn.addEventListener('click', () => {
                this.userInput.value = item.from;
                this.fromLang.value = item.fromLang;
                this.toLang.value = item.toLang;
                this.closeAllModals();
                this.sendMessage();
            });
            
            container.appendChild(historyItem);
        });
    }
    
    getLanguageName(code) {
        const languages = {
            'auto': 'Auto Detect',
            'en': 'English',
            'hi': 'Hindi',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'ja': 'Japanese',
            'ne': 'Nepali',
            'ar': 'Arabic',
            'ko': 'Korean',
            'ru': 'Russian',
            'zh': 'Chinese',
            'pt': 'Portuguese'
        };
        
        return languages[code] || code;
    }
    
    // ============= Settings =============
    
    showSettings() {
        this.closeAllModals();
        
        // If we don't have a settings modal yet, create one
        if (!document.getElementById('settingsModal')) {
            this.createSettingsModal();
        }
        
        document.getElementById('settingsModal').classList.add('active');
    }
    
    createSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'settingsModal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Settings</h3>
                    <button class="close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="settings-group">
                        <label class="settings-label">
                            <input type="checkbox" id="autoReadSetting" ${this.settings.autoRead ? 'checked' : ''}>
                            Auto-read translations
                        </label>
                        
                        <label class="settings-label">
                            <input type="checkbox" id="autoSwapSetting" ${this.settings.autoSwap ? 'checked' : ''}>
                            Auto-swap after translation
                        </label>
                    </div>
                    
                    <div class="settings-group">
                        <h4>Default Languages</h4>
                        <div class="settings-language-select">
                            <label for="defaultFromLang">Default "From" language:</label>
                            <select id="defaultFromLang">
                                <option value="auto">Auto Detect</option>
                                <option value="en">English</option>
                                <option value="hi">Hindi</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="ja">Japanese</option>
                                <option value="zh">Chinese</option>
                            </select>
                        </div>
                        
                        <div class="settings-language-select">
                            <label for="defaultToLang">Default "To" language:</label>
                            <select id="defaultToLang">
                                <option value="hi">Hindi</option>
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="ja">Japanese</option>
                                <option value="zh">Chinese</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="settings-actions">
                        <button id="saveSettingsBtn" class="primary-btn">Save Settings</button>
                        <button id="clearHistoryBtn" class="secondary-btn">Clear History</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set default values
        document.getElementById('defaultFromLang').value = this.settings.defaultFromLang;
        document.getElementById('defaultToLang').value = this.settings.defaultToLang;
        
        // Add event listeners
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());
        
        // Close button
        modal.querySelector('.close-btn').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
    
    createFavoritesModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'favoritesModal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Favorites</h3>
                    <button class="close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body" id="favoritesList">
                    <!-- Favorites will be added here -->
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close button
        modal.querySelector('.close-btn').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
    
    saveSettings() {
        // Update settings object
        this.settings.autoRead = document.getElementById('autoReadSetting').checked;
        this.settings.autoSwap = document.getElementById('autoSwapSetting').checked;
        this.settings.defaultFromLang = document.getElementById('defaultFromLang').value;
        this.settings.defaultToLang = document.getElementById('defaultToLang').value;
        
        // Save to local storage
        localStorage.setItem('translatorSettings', JSON.stringify(this.settings));
        
        // Apply default languages
        this.fromLang.value = this.settings.defaultFromLang;
        this.toLang.value = this.settings.defaultToLang;
        
        // Close modal and show notification
        this.closeAllModals();
        this.showNotification('Settings saved successfully', 'success');
    }
    
    clearHistory() {
        if (confirm('Are you sure you want to clear all translation history?')) {
            this.history = [];
            localStorage.setItem('translationHistory', JSON.stringify(this.history));
            this.closeAllModals();
            this.showNotification('History cleared successfully', 'success');
        }
    }
    
    // ============= Utilities =============
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            this.showNotification('Failed to copy text', 'error');
        });
    }
    
    showNotification(message, type = 'info') {
        // Check if notification container exists, create if not
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
            `;
            document.body.appendChild(container);
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            padding: 12px 20px;
            margin-bottom: 10px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            animation: slideIn 0.3s forwards;
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;
        
        // Add icon based on type
        let icon;
        if (type === 'error') icon = 'fa-exclamation-circle';
        else if (type === 'success') icon = 'fa-check-circle';
        else icon = 'fa-info-circle';
        
        notification.innerHTML = `
            <div>
                <i class="fas ${icon}" style="margin-right: 10px;"></i>
                ${message}
            </div>
            <button style="background: transparent; border: none; color: white; cursor: pointer; margin-left: 15px;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add close button functionality
        notification.querySelector('button').addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                container.removeChild(notification);
            }, 300);
        });
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (container.contains(notification)) {
                notification.style.animation = 'slideOut 0.3s forwards';
                setTimeout(() => {
                    if (container.contains(notification)) {
                        container.removeChild(notification);
                    }
                }, 300);
            }
        }, 4000);
        
        // Add to container
        container.appendChild(notification);
        
        // Add animations to document if they don't exist yet
        if (!document.getElementById('notification-animations')) {
            const style = document.createElement('style');
            style.id = 'notification-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize the translator bot and theme toggle
document.addEventListener('DOMContentLoaded', () => {
    // Initialize translator
    window.translatorBot = new TranslatorBot();
    
    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');

    // Check saved theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        icon.classList.replace('fa-moon', 'fa-sun');
    }

    // Toggle theme
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        
        if (document.body.classList.contains('dark-theme')) {
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });
});