// Live Interview Streaming Module
// Handles text streaming, animations, and content parsing

export class LiveStreaming {
    constructor(config = {}) {
        this.config = {
            enableStreaming: true,
            streamingSpeed: 15, // milliseconds between words (lower = faster)
            aiStreamingSpeed: 5, // 2x faster than before
            ...config
        };
    }

    // Update configuration
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    // Stream content with typing effect
    async streamContent(container, content, speed = null) {
        const actualSpeed = speed || this.config.streamingSpeed;
        
        if (!this.config.enableStreaming) {
            // If streaming is disabled, show content immediately
            this.displayInstantText(container, content);
            container.parentElement.classList.add('complete');
            return;
        }

        // Check for code blocks
        if (content.includes('```')) {
            await this.streamComplexContent(container, content, actualSpeed);
        } else {
            await this.streamSimpleText(container, content, actualSpeed);
        }
        
        container.parentElement.classList.add('complete');
    }

    // Stream simple text
    async streamSimpleText(container, text, speed, onProgress = null) {
        const words = text.split(' ');
        
        for (let i = 0; i < words.length; i++) {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word';
            wordSpan.textContent = words[i] + (i < words.length - 1 ? ' ' : '');
            
            container.appendChild(wordSpan);
            
            setTimeout(() => {
                wordSpan.style.opacity = '1';
            }, 10);
            
            await this.delay(speed);
            
            // Callback for scroll updates
            if (onProgress && i % 3 === 0) {
                onProgress();
            }
        }
        
        // Final callback
        if (onProgress) {
            onProgress();
        }
    }

    // Stream complex content with code
    async streamComplexContent(container, content, speed, onProgress = null) {
        const parts = this.parseContent(content);
        
        for (const part of parts) {
            if (part.type === 'text') {
                await this.streamSimpleText(container, part.content, speed, onProgress);
            } else if (part.type === 'code') {
                this.addCodeBlock(container, part.content, part.language);
                await this.delay(200); // Reduced delay for faster display
            }
            if (onProgress) onProgress();
        }
    }

    // Parse content for code blocks
    parseContent(content) {
        const parts = [];
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let lastIndex = 0;
        let match;

        while ((match = codeBlockRegex.exec(content)) !== null) {
            // Add text before code block
            if (match.index > lastIndex) {
                const textPart = content.substring(lastIndex, match.index);
                if (textPart.trim()) {
                    parts.push({ type: 'text', content: textPart.trim() });
                }
            }
            
            // Add code block
            parts.push({
                type: 'code',
                language: match[1] || 'javascript',
                content: match[2].trim()
            });
            
            lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text
        if (lastIndex < content.length) {
            const remainingText = content.substring(lastIndex);
            if (remainingText.trim()) {
                parts.push({ type: 'text', content: remainingText.trim() });
            }
        }
        
        // If no code blocks found, return as simple text
        if (parts.length === 0) {
            parts.push({ type: 'text', content: content });
        }
        
        return parts;
    }

    // Add code block
    addCodeBlock(container, code, language) {
        const codeBlockDiv = document.createElement('div');
        codeBlockDiv.className = 'code-block';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'code-header';
        
        // Create language tag
        const languageTag = document.createElement('span');
        languageTag.className = 'language-tag';
        languageTag.textContent = language;
        
        // Create copy button with proper event handling
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-btn';
        copyButton.textContent = 'Copy';
        copyButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(code);
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy code:', err);
                copyButton.textContent = 'Failed';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            }
        });
        
        headerDiv.appendChild(languageTag);
        headerDiv.appendChild(copyButton);
        
        const preElement = document.createElement('pre');
        const codeElement = document.createElement('code');
        codeElement.className = `language-${language}`;
        codeElement.textContent = code;
        
        preElement.appendChild(codeElement);
        codeBlockDiv.appendChild(headerDiv);
        codeBlockDiv.appendChild(preElement);
        
        container.appendChild(codeBlockDiv);
        
        // Apply syntax highlighting
        if (window.Prism) {
            window.Prism.highlightElement(codeElement);
        }
    }

    // Display text instantly (for interim updates)
    displayInstantText(container, text) {
        const words = text.split(' ');
        
        for (let i = 0; i < words.length; i++) {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word';
            wordSpan.style.opacity = '1'; // Show immediately
            wordSpan.textContent = words[i] + (i < words.length - 1 ? ' ' : '');
            container.appendChild(wordSpan);
        }
    }

    // Delay utility
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Configuration methods
    setStreamingEnabled(enabled) {
        this.config.enableStreaming = enabled;
    }

    setStreamingSpeed(speed) {
        this.config.streamingSpeed = Math.max(10, Math.min(100, speed)); // 10-100ms range
    }

    setAIStreamingSpeed(speed) {
        this.config.aiStreamingSpeed = Math.max(5, Math.min(50, speed)); // 5-50ms range
    }

    getConfig() {
        return { ...this.config };
    }
} 