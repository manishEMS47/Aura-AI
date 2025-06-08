// Markdown Processor for Live Interview
// Handles comprehensive markdown parsing while preserving code blocks

export class MarkdownProcessor {
    constructor(config = {}) {
        this.config = {
            preserveCodeBlocks: true,
            enableNestedLists: true,
            customBullets: true,
            professionalStyling: true,
            maxNestingLevel: 4,
            ...config
        };
        
        // Regex patterns for markdown elements
        this.patterns = {
            // Code blocks (highest priority - must be preserved)
            codeBlock: /```(\w+)?\n([\s\S]*?)```/g,
            
            // Headers
            header: /^(#{1,6})\s+(.+)$/gm,
            
            // Lists
            bulletList: /^(\s*)([-*+])\s+(.+)$/gm,
            numberedList: /^(\s*)(\d+\.)\s+(.+)$/gm,
            
            // Inline formatting
            bold: /\*\*(.*?)\*\*/g,
            italic: /\*(.*?)\*/g,
            strikethrough: /~~(.*?)~~/g,
            inlineCode: /`([^`]+)`/g,
            
            // Line breaks and paragraphs
            doubleLineBreak: /\n\s*\n/g,
            singleLineBreak: /\n/g
        };
        
        // Counter for unique IDs
        this.elementCounter = 0;
    }

    /**
     * Main parsing method - processes raw text into structured content
     * @param {string} text - Raw text content
     * @returns {Array} - Array of content segments for streaming
     */
    parseContent(text) {
        if (!text || typeof text !== 'string') {
            return [{ type: 'text', content: '', html: '' }];
        }

        // Step 1: Extract and protect code blocks
        const { textWithPlaceholders, codeBlocks } = this.extractCodeBlocks(text);
        
        // Step 2: Parse block elements (headers, lists, paragraphs)
        const blockParsed = this.parseBlockElements(textWithPlaceholders);
        
        // Step 3: Parse inline elements within each block
        const inlineParsed = this.parseInlineElements(blockParsed);
        
        // Step 4: Restore code blocks
        const finalContent = this.restoreCodeBlocks(inlineParsed, codeBlocks);
        
        return finalContent;
    }

    /**
     * Extract code blocks and replace with placeholders
     */
    extractCodeBlocks(text) {
        const codeBlocks = [];
        let match;
        
        // Reset regex to avoid issues with global flag
        this.patterns.codeBlock.lastIndex = 0;
        
        const textWithPlaceholders = text.replace(this.patterns.codeBlock, (match, language, code) => {
            const id = `__CODE_BLOCK_${codeBlocks.length}__`;
            codeBlocks.push({
                id,
                type: 'code',
                language: language || 'javascript',
                content: code.trim(),
                originalMatch: match
            });
            return `\n${id}\n`;
        });
        
        return { textWithPlaceholders, codeBlocks };
    }

    /**
     * Parse block-level elements (headers, lists, paragraphs)
     */
    parseBlockElements(text) {
        const lines = text.split('\n');
        const blocks = [];
        let currentBlock = null;
        let currentList = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Skip empty lines between blocks
            if (!trimmedLine) {
                if (currentBlock && currentBlock.type === 'paragraph') {
                    blocks.push(currentBlock);
                    currentBlock = null;
                }
                if (currentList) {
                    blocks.push(currentList);
                    currentList = null;
                }
                continue;
            }
            
            // Check for headers
            const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
            if (headerMatch) {
                // End current block/list
                if (currentBlock) {
                    blocks.push(currentBlock);
                    currentBlock = null;
                }
                if (currentList) {
                    blocks.push(currentList);
                    currentList = null;
                }
                
                blocks.push({
                    type: 'header',
                    level: headerMatch[1].length,
                    content: headerMatch[2].trim(),
                    id: `header-${this.elementCounter++}`
                });
                continue;
            }
            
            // Check for bullet lists
            const bulletMatch = line.match(/^(\s*)([-*+])\s+(.+)$/);
            if (bulletMatch) {
                const indent = bulletMatch[1].length;
                const content = bulletMatch[3];
                
                if (currentBlock) {
                    blocks.push(currentBlock);
                    currentBlock = null;
                }
                
                if (!currentList || currentList.listType !== 'bullet') {
                    if (currentList) blocks.push(currentList);
                    currentList = {
                        type: 'list',
                        listType: 'bullet',
                        items: [],
                        id: `list-${this.elementCounter++}`
                    };
                }
                
                currentList.items.push({
                    content: content,
                    indent: Math.floor(indent / 2), // Convert spaces to indent level
                    id: `item-${this.elementCounter++}`
                });
                continue;
            }
            
            // Check for numbered lists
            const numberedMatch = line.match(/^(\s*)(\d+\.)\s+(.+)$/);
            if (numberedMatch) {
                const indent = numberedMatch[1].length;
                const content = numberedMatch[3];
                
                if (currentBlock) {
                    blocks.push(currentBlock);
                    currentBlock = null;
                }
                
                if (!currentList || currentList.listType !== 'numbered') {
                    if (currentList) blocks.push(currentList);
                    currentList = {
                        type: 'list',
                        listType: 'numbered',
                        items: [],
                        id: `list-${this.elementCounter++}`
                    };
                }
                
                currentList.items.push({
                    content: content,
                    indent: Math.floor(indent / 2),
                    id: `item-${this.elementCounter++}`
                });
                continue;
            }
            
            // Regular text - add to current paragraph or create new one
            if (currentList) {
                blocks.push(currentList);
                currentList = null;
            }
            
            if (!currentBlock || currentBlock.type !== 'paragraph') {
                currentBlock = {
                    type: 'paragraph',
                    content: trimmedLine,
                    id: `paragraph-${this.elementCounter++}`
                };
            } else {
                currentBlock.content += ' ' + trimmedLine;
            }
        }
        
        // Add remaining blocks
        if (currentBlock) blocks.push(currentBlock);
        if (currentList) blocks.push(currentList);
        
        return blocks;
    }

    /**
     * Parse inline elements (bold, italic, code, etc.)
     */
    parseInlineElements(blocks) {
        return blocks.map(block => {
            if (block.type === 'list') {
                // Process each list item
                block.items = block.items.map(item => ({
                    ...item,
                    content: this.processInlineFormatting(item.content)
                }));
            } else if (block.content) {
                block.content = this.processInlineFormatting(block.content);
            }
            return block;
        });
    }

    /**
     * Process inline formatting for a text string
     */
    processInlineFormatting(text) {
        if (!text) return text;
        
        // Process in order of precedence
        // 1. Inline code (highest priority - don't format inside)
        const codeSegments = [];
        let processedText = text.replace(this.patterns.inlineCode, (match, code) => {
            const id = `__INLINE_CODE_${codeSegments.length}__`;
            codeSegments.push({
                id,
                content: code,
                html: `<code class="inline-code">${this.escapeHtml(code)}</code>`
            });
            return id;
        });
        
        // 2. Bold text
        processedText = processedText.replace(this.patterns.bold, (match, content) => {
            return `<strong class="markdown-bold">${content}</strong>`;
        });
        
        // 3. Italic text (but not if inside bold)
        processedText = processedText.replace(this.patterns.italic, (match, content) => {
            // Avoid double processing if this is inside bold tags
            if (processedText.includes(`<strong class="markdown-bold">${content}</strong>`)) {
                return match;
            }
            return `<em class="markdown-italic">${content}</em>`;
        });
        
        // 4. Strikethrough
        processedText = processedText.replace(this.patterns.strikethrough, (match, content) => {
            return `<del class="markdown-strikethrough">${content}</del>`;
        });
        
        // 5. Restore inline code
        codeSegments.forEach(segment => {
            processedText = processedText.replace(segment.id, segment.html);
        });
        
        return processedText;
    }

    /**
     * Restore code blocks in final content
     */
    restoreCodeBlocks(blocks, codeBlocks) {
        const codeBlockMap = {};
        codeBlocks.forEach(block => {
            codeBlockMap[block.id] = block;
        });
        
        const finalBlocks = [];
        
        blocks.forEach(block => {
            if (block.type === 'paragraph' && block.content.includes('__CODE_BLOCK_')) {
                // Split paragraph by code block placeholders
                const parts = block.content.split(/(__CODE_BLOCK_\d+__)/);
                
                parts.forEach(part => {
                    if (part.match(/^__CODE_BLOCK_\d+__$/)) {
                        const codeBlock = codeBlockMap[part];
                        if (codeBlock) {
                            finalBlocks.push(codeBlock);
                        }
                    } else if (part.trim()) {
                        finalBlocks.push({
                            type: 'paragraph',
                            content: part.trim(),
                            id: `paragraph-${this.elementCounter++}`
                        });
                    }
                });
            } else {
                finalBlocks.push(block);
            }
        });
        
        return finalBlocks;
    }

    /**
     * Generate HTML for a content block
     */
    generateHTML(block) {
        switch (block.type) {
            case 'header':
                return this.generateHeaderHTML(block);
            case 'list':
                return this.generateListHTML(block);
            case 'paragraph':
                return this.generateParagraphHTML(block);
            case 'code':
                return this.generateCodeHTML(block);
            default:
                return `<div class="unknown-block">${this.escapeHtml(block.content || '')}</div>`;
        }
    }

    generateHeaderHTML(block) {
        const level = Math.min(Math.max(block.level, 1), 6);
        const className = `markdown-header markdown-h${level}`;
        return `<h${level} class="${className}" id="${block.id}">${block.content}</h${level}>`;
    }

    generateListHTML(block) {
        const tag = block.listType === 'numbered' ? 'ol' : 'ul';
        const className = `markdown-list markdown-${block.listType}-list`;
        
        let html = `<${tag} class="${className}">`;
        
        block.items.forEach(item => {
            const indentClass = item.indent > 0 ? ` indent-${Math.min(item.indent, this.config.maxNestingLevel)}` : '';
            html += `<li class="markdown-list-item${indentClass}">${item.content}</li>`;
        });
        
        html += `</${tag}>`;
        return html;
    }

    generateParagraphHTML(block) {
        if (!block.content || !block.content.trim()) {
            return '';
        }
        return `<p class="markdown-paragraph">${block.content}</p>`;
    }

    generateCodeHTML(block) {
        // This will be handled by the existing code block system
        return null; // Signal to use existing code block rendering
    }

    /**
     * Utility method to escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}