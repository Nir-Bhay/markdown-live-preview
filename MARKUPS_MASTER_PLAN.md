# Markups: The AI-First Markdown Evolution (REVISED)
## Technical Master Plan & Architectural Roadmap v2.0

**Project Name:** Markups (Markdown Live Preview)  
**Status:** Active Development / Modernization  
**Core Objective:** Transition from a standard web-based Markdown editor to a local-first, AI-augmented document platform with pragmatic, user-focused enhancements.

**Last Updated:** 2026-02-11  
**Version:** 2.0 (Comprehensive Revision)

---

## 📊 Executive Summary

Markups is evolving from a capable markdown editor into a next-generation document platform. After thorough analysis of the current codebase (v2.0.0), this revised plan addresses:

✅ **What's Working:** Monaco Editor, Marked.js, modular architecture, custom StorageService  
⚠️ **Critical Limitations:** LocalStorage constraints, no document organization, limited mobile UX  
🚀 **Strategic Pivot:** Prioritize IndexedDB migration and pragmatic AI integration over ambitious P2P features

### Current Architecture Strengths
- High-performance Monaco Editor with full VS Code features
- Robust markdown parsing (GFM, alerts, footnotes, KaTeX, Mermaid)
- Already replaced storehouse-js with custom `StorageService`
- Modular `/src` structure ready for scaling
- PWA-ready with service worker support

### Critical Blockers
1. **Storage:** LocalStorage ~5MB limit blocks image-heavy documents
2. **Organization:** No folders, tags, or search across documents  
3. **Mobile UX:** Responsive but not optimized for touch workflows
4. **AI Integration:** No infrastructure for smart features

---

## 🎯 Feasibility Analysis

### ✅ HIGHLY RECOMMENDED (Priority Features)

#### 1. **Dexie.js Migration**  
**Status:** ✅ Essential - Implement Immediately  
**Effort:** 2-3 weeks  
**User Impact:** 🚀 Massive

**Enhanced Schema Design:**
```javascript
db.version(1).stores({
    // Core document storage
    documents: '++id, title, lastModified, *tags, folderId, pinned',
    
    // Separate asset storage for better performance
    assets: '++id, docId, type, size, uploadDate',
    
    // Document organization
    folders: '++id, name, parentId, order, color',
    
    // Encrypted configuration
    config: 'key',
    
    // Version history with actions
    history: '++id, docId, timestamp, action, userId',
    
    // Full-text search index
    search_index: '++id, docId, *terms, lastIndexed'
});

// Compound indexes for faster queries
db.version(2).stores({
    documents: '++id, title, lastModified, *tags, folderId, [folderId+pinned]'
});
```

**Migration Strategy:**
```javascript
// Phase 1: Dual-write (localStorage + IndexedDB)
async function migrateDocument(doc) {
    await db.documents.add({
        ...doc,
        migratedAt: Date.now(),
        source: 'localStorage'
    });
}

// Phase 2: Read from IndexedDB, fallback to localStorage
// Phase 3: Delete localStorage after 30 days

// Migration service
class MigrationService {
    async execute() {
        const localDocs = storageService.getObject('docs', {});
        const migrated = [];
        
        for (const [id, doc] of Object.entries(localDocs)) {
            try {
                await db.documents.add({
                    legacyId: id,
                    title: doc.title || 'Untitled',
                    content: doc.content,
                    lastModified: doc.lastModified || Date.now(),
                    tags: doc.tags || [],
                    folderId: null
                });
                migrated.push(id);
            } catch (error) {
                console.error(`Failed to migrate ${id}:`, error);
            }
        }
        
        // Mark migration complete
        await db.config.put({ key: 'migration_v1', value: {
            completed: true,
            date: Date.now(),
            count: migrated.length
        }});
        
        return migrated;
    }
}
```

**Benefits:**
- Handle 1000+ documents with images
- Store unlimited revision history  
- Enable folder organization
- Fast full-text search
- No more "Storage quota exceeded" errors

---

#### 2. **Command Palette (Non-AI First)**  
**Status:** ✅ Foundation for AI - Build First  
**Effort:** 1-2 weeks  
**User Impact:** 🎯 High (Power Users)

**Implementation:**
```javascript
// Register Markups Command Palette
monaco.editor.addAction({
    id: 'markups.commandPalette',
    label: 'Markups Command Palette',
    keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP
    ],
    contextMenuGroupId: 'navigation',
    run: async (editor) => {
        const commands = [
            // Document Management
            { id: 'new', label: '📄 New Document', action: () => createDocument() },
            { id: 'save', label: '💾 Save Document', action: () => saveDocument() },
            { id: 'search', label: '🔍 Search All Documents', action: () => openSearch() },
            
            // Formatting (No AI needed)
            { id: 'table', label: '📊 Insert Table', action: () => insertTable() },
            { id: 'toc', label: '📑 Insert Table of Contents', action: () => insertTOC() },
            { id: 'date', label: '📅 Insert Date/Time', action: () => insertDate() },
            
            // Export
            { id: 'export-pdf', label: '📕 Export as PDF', action: () => exportPDF() },
            { id: 'export-html', label: '🌐 Export as HTML', action: () => exportHTML() },
            
            // Templates
            { id: 'template', label: '📋 Load Template', action: () => loadTemplate() },
            { id: 'snippet', label: '✂️ Insert Snippet', action: () => insertSnippet() },
            
            // AI Features (Added later)
            { id: 'ai-summarize', label: '✨ AI: Summarize', action: () => aiSummarize(), premium: true },
            { id: 'ai-grammar', label: '✨ AI: Fix Grammar', action: () => aiGrammar() }
        ];
        
        showCommandPalette(commands);
    }
});

// Smart insert functions
function insertTable() {
    const selection = editor.getSelection();
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    
    let table = '|';
    for (let i = 0; i < cols; i++) table += ` Column ${i+1} |`;
    table += '\n|';
    for (let i = 0; i < cols; i++) table += ' --- |';
    
    for (let r = 0; r < rows; r++) {
        table += '\n|';
        for (let c = 0; c < cols; c++) table += '  |';
    }
    
    editor.executeEdits('insert-table', [{
        range: selection,
        text: table
    }]);
}
```

**Commands Priority:**
1. ✅ `/table` - Table wizard
2. ✅ `/toc` - Auto-generate TOC
3. ✅ `/date` - Insert timestamp
4. ✅ `/template` - Template picker
5. ✅ `/export` - Export menu
6. ⚡ `/ai-*` - AI features (Phase 2)

---

#### 3. **Enhanced Mobile UX (CSS-First)**  
**Status:** ✅ Pragmatic Approach  
**Effort:** 1 week  
**User Impact:** 📱 Critical for Mobile Users

**Better Alternative to Bottom Sheets:**

```css
/* Responsive layout with CSS Grid */
.editor-container {
    display: grid;
    grid-template-columns: 250px 1fr 1fr;
    gap: 1rem;
}

/* Mobile: Tabbed interface */
@media (max-width: 768px) {
    .editor-container {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
    }
    
    /* Tab switcher */
    .mobile-tabs {
        display: flex;
        position: sticky;
        top: 0;
        z-index: 100;
        background: var(--bg-primary);
        border-bottom: 1px solid var(--border);
    }
    
    .mobile-tab {
        flex: 1;
        padding: 1rem;
        text-align: center;
        transition: background 0.2s;
    }
    
    .mobile-tab.active {
        background: var(--accent);
        color: white;
    }
    
    /* Hide inactive panels */
    .editor-panel:not(.active),
    .preview-panel:not(.active) {
        display: none;
    }
}

/* Container queries (modern approach) */
@container (max-width: 600px) {
    .toolbar {
        flex-wrap: wrap;
    }
    
    .toolbar-group {
        display: none;
    }
    
    .toolbar-group.essential {
        display: flex;
    }
}
```

**Mobile Optimizations:**
```javascript
// Detect mobile and adjust Monaco
if (window.innerWidth < 768) {
    monaco.editor.create(el, {
        ...options,
        // Mobile-specific options
        fontSize: 14,
        lineNumbers: 'off',
        minimap: { enabled: false },
        scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8
        },
        // Better touch support
        mouseWheelZoom: true,
        fastScrollSensitivity: 3,
        // Prevent layout shifts
        fixedOverflowWidgets: true,
        automaticLayout: true
    });
}
```

**Mobile Toolbar:**
```html
<!-- Collapsible toolbar -->
<div class="mobile-toolbar">
    <button onclick="toggleToolbar()">
        <span class="icon">🛠️</span>
        <span class="label">Tools</span>
    </button>
    
    <div class="toolbar-panel collapsed">
        <div class="toolbar-section">
            <h4>Format</h4>
            <button>Bold</button>
            <button>Italic</button>
            <button>Link</button>
        </div>
        <div class="toolbar-section">
            <h4>Insert</h4>
            <button>Image</button>
            <button>Table</button>
            <button>Code</button>
        </div>
    </div>
</div>
```

---

#### 4. **AI Integration (Hybrid Model)**  
**Status:** ⚠️ Needs Rethinking - Use Freemium Model  
**Effort:** 3-4 weeks  
**User Impact:** ✨ High Value, But UX Critical

**Problems with BYOK-Only Approach:**
- ❌ Non-technical users won't understand API keys
- ❌ Key exposure in client-side code (security theater)
- ❌ Cost abuse (users can extract and misuse keys)
- ❌ Poor onboarding experience

**Better: Hybrid Freemium Model**

```javascript
// Three-tier system
const AI_TIERS = {
    FREE: {
        requests_per_day: 5,
        features: ['summarize', 'grammar'],
        implementation: 'serverless_proxy'
    },
    PRO: {
        requests_per_day: 100,
        features: ['summarize', 'grammar', 'rewrite', 'expand'],
        price: '$5/month',
        implementation: 'serverless_proxy'
    },
    BYOK: {
        requests_per_day: Infinity,
        features: 'all',
        implementation: 'client_side',
        warning: 'Advanced users only - keys stored locally'
    }
};

// Serverless proxy (Vercel/Netlify Function)
// /api/ai-complete.js
export default async function handler(req, res) {
    const { userId, prompt, feature } = req.body;
    
    // Check user tier and rate limits
    const user = await db.users.get(userId);
    if (!canMakeRequest(user, feature)) {
        return res.status(429).json({ 
            error: 'Rate limit exceeded',
            tier: user.tier,
            resetAt: getRateLimitReset(user)
        });
    }
    
    // Call AI API with YOUR key (hidden from client)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500
        })
    });
    
    // Log usage
    await logUsage(userId, feature, response.usage);
    
    return res.json(await response.json());
}
```

**AI Features Priority:**
```javascript
// Phase 1: No-AI alternatives (faster, free)
const smartFeatures = {
    grammar: {
        name: 'Grammar Check',
        icon: '✍️',
        api: 'languagetool.org/api/v2', // Free, no AI
        implementation: 'direct_http'
    },
    format: {
        name: 'Format Document',
        icon: '📐',
        implementation: 'local_js', // Prettier-based
        cost: 'free'
    },
    stats: {
        name: 'Document Statistics',
        icon: '📊',
        implementation: 'local_js',
        cost: 'free'
    }
};

// Phase 2: AI-powered features
const aiFeatures = {
    summarize: {
        name: 'Summarize',
        icon: '✨',
        tier: 'FREE',
        prompt: (text) => `Summarize this markdown document in 3-5 bullet points:\n\n${text}`
    },
    rewrite: {
        name: 'Rewrite (Professional)',
        icon: '✨',
        tier: 'PRO',
        prompt: (text) => `Rewrite this text professionally:\n\n${text}`
    },
    expand: {
        name: 'Expand Ideas',
        icon: '✨',
        tier: 'PRO',
        prompt: (text) => `Expand on these ideas with more detail:\n\n${text}`
    }
};
```

---

### ⚠️ RECONSIDER (Needs Alternative Approach)

#### 5. **P2P Collaboration (y-webrtc)**  
**Status:** ⚠️ Too Complex - Use Managed Service  
**Effort:** 6-8 weeks (high risk)  
**User Impact:** ⚡ High IF It Works

**Problems with y-webrtc:**
1. **NAT Traversal:** 40-50% of users can't connect (corporate firewalls, CGNAT)
2. **Signaling Server:** You must maintain infrastructure
3. **No Persistence:** Document lost when all peers disconnect
4. **Complex Debugging:** WebRTC errors are cryptic
5. **Mobile Issues:** iOS Safari has limited WebRTC support

**Better Alternatives:**

**Option A: Yjs + IndexedDB Only (No Sync)**
```javascript
// Get CRDT benefits WITHOUT networking complexity
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { MonacoBinding } from 'y-monaco';

const ydoc = new Y.Doc();
const provider = new IndexeddbPersistence('markups-doc-123', ydoc);
const ytext = ydoc.getText('content');

// Bind to Monaco
const binding = new MonacoBinding(
    ytext,
    editor.getModel(),
    new Set([editor]),
    provider.awareness
);

// Benefits: Better undo/redo, time-travel, local sync
// No networking complexity
```

**Option B: Managed Collaboration (Liveblocks)**
```javascript
// Easier than y-webrtc, production-ready
import { createClient } from '@liveblocks/client';
import { LiveblocksProvider } from '@liveblocks/yjs';

const client = createClient({
    publicApiKey: 'pk_live_...' // Free tier: 100 MAU
});

const { room, leave } = client.enterRoom('document-123', {
    initialPresence: {}
});

const ydoc = new Y.Doc();
const provider = new LiveblocksProvider(room, ydoc);
const ytext = ydoc.getText('content');

// Benefits:
// - Works behind firewalls (WebSocket over HTTPS)
// - Persistent storage
// - Built-in presence
// - Free tier available
```

**Option C: Supabase Realtime**
```javascript
// Postgres + WebSocket realtime
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://xxx.supabase.co',
    'public-anon-key'
);

// Subscribe to document changes
const channel = supabase.channel('document-123')
    .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'documents'
    }, (payload) => {
        editor.setValue(payload.new.content);
    })
    .subscribe();

// Update document
await supabase
    .from('documents')
    .update({ content: editor.getValue() })
    .eq('id', 123);
```

**Recommendation:**
```javascript
// Phase 1: Yjs + IndexedDB (no sync)
//          - Better undo/redo immediately
//          - Prepare architecture

// Phase 2: Add managed sync (Liveblocks or Supabase)
//          - Only if users request collaboration
//          - Start with paid tier only ($10/month)

// Skip y-webrtc entirely
```

---

#### 6. **Mobile Bottom Sheets**  
**Status:** ⚠️ Overengineered - CSS Is Better  
**Effort:** 2 weeks  
**User Impact:** 📱 Same as CSS approach

**Why CSS is better:**
```css
/* Modern approach: No JS needed */
@media (max-width: 768px) {
    .sidebar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        transform: translateY(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        max-height: 80vh;
        overflow-y: auto;
        background: var(--bg);
        border-radius: 1rem 1rem 0 0;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
    }
    
    .sidebar.open {
        transform: translateY(0);
    }
}

/* Smooth gestures with CSS scroll-snap */
.toolbar-sections {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
}

.toolbar-section {
    scroll-snap-align: start;
    flex: 0 0 100%;
}
```

**Better UX:**
- ✅ Native feel with pure CSS
- ✅ Hardware-accelerated animations
- ✅ Less JS = faster load
- ✅ Works even if JS fails

---

### ❌ SKIP OR DEPRIORITIZE

#### 7. **Image Generation (`/image` command)**  
**Why Skip:**
- ❌ DALL-E costs $0.04-0.08 per image
- ❌ Imagen requires Google Cloud setup
- ❌ Off-brand for markdown editor
- ❌ Better UX: Link to external tools

**Alternative:**
```javascript
// Add quick links instead
const imageGenerators = [
    { name: 'DALL-E', url: 'https://labs.openai.com' },
    { name: 'Midjourney', url: 'https://midjourney.com' },
    { name: 'Stable Diffusion', url: 'https://stablediffusionweb.com' }
];

function insertImagePlaceholder() {
    const alt = prompt('Image description:');
    const markdown = `![${alt}](https://via.placeholder.com/600x400?text=${encodeURIComponent(alt)})\n<!-- TODO: Generate image at: ${imageGenerators.map(g => g.url).join(' or ')} -->`;
    editor.insertText(markdown);
}
```

---

## 🚀 REVISED ROADMAP

### **Phase 1: Foundation (Weeks 1-3) - CRITICAL**

#### Week 1-2: Dexie.js Migration
```javascript
// Tasks:
✅ Design enhanced schema (documents, folders, assets, search_index)
✅ Build migration service (localStorage → IndexedDB)
✅ Implement dual-write mode (backward compatibility)
✅ Create IndexedDB service wrapper
✅ Add storage usage monitoring

// Deliverables:
- Dexie.js fully integrated
- All existing documents migrated
- Folder support ready
- 100% backward compatible
```

#### Week 2-3: Document Organization
```javascript
// Tasks:
✅ Build folder tree UI
✅ Add drag-and-drop document organization
✅ Implement tagging system
✅ Create document search (full-text via search_index)
✅ Add recent documents panel

// Deliverables:
- Sidebar with folder tree
- Tag-based filtering
- Fast document search
- Recent/pinned documents
```

#### Week 3: Mobile UX Improvements
```javascript
// Tasks:
✅ Implement responsive CSS Grid layout
✅ Add mobile tab switcher (Edit/Preview/Settings)
✅ Create collapsible mobile toolbar
✅ Optimize Monaco for touch
✅ Add swipe gestures

// Deliverables:
- Mobile-first responsive design
- Touch-optimized controls
- No bottom sheets (CSS-only)
```

---

### **Phase 2: Power Features (Weeks 4-6)**

#### Week 4-5: Command Palette
```javascript
// Tasks:
✅ Build command palette UI (fuzzy search)
✅ Register non-AI commands (table, TOC, date)
✅ Add template insertion
✅ Implement quick switcher (Ctrl+P)
✅ Create keyboard shortcut customization

// Deliverables:
- Command palette (Ctrl+K)
- 15+ built-in commands
- Customizable shortcuts
- Command history
```

#### Week 5: Advanced Export
```javascript
// Tasks:
✅ Improve PDF export (styled, with images)
✅ Add DOCX export with formatting
✅ Implement batch export (multiple docs)
✅ Create export templates
✅ Add export presets (blog post, resume, report)

// Deliverables:
- High-quality PDF export
- DOCX with images and styles
- Export templates system
```

#### Week 6: Version History
```javascript
// Tasks:
✅ Build version history service (Dexie-based)
✅ Add "Restore previous version" UI
✅ Implement diff viewer (show changes)
✅ Auto-save versions on major edits
✅ Add version annotations

// Deliverables:
- Automatic version snapshots
- Visual diff viewer
- One-click restore
- Version notes
```

---

### **Phase 3: Smart Features (Weeks 7-9)**

#### Week 7: Grammar & Formatting
```javascript
// Tasks:
✅ Integrate LanguageTool API (free grammar)
✅ Build inline grammar checker UI
✅ Add smart formatting (Prettier-based)
✅ Implement auto-fix suggestions
✅ Create writing statistics panel

// Deliverables:
- Real-time grammar checking
- One-click formatting
- Readability scores
- Writing insights
```

#### Week 8-9: AI Integration (Freemium)
```javascript
// Tasks:
✅ Set up serverless proxy (Vercel/Netlify)
✅ Implement rate limiting per user
✅ Build AI command palette entries
✅ Add summarization feature
✅ Create AI rewriting tools (Pro tier)
✅ Build usage tracking dashboard

// Deliverables:
- Free tier: 5 AI requests/day
- Pro tier: 100 requests/day
- AI commands: summarize, rewrite, expand
- Usage analytics
```

#### Week 9: Document Linking
```javascript
// Tasks:
✅ Implement [[wiki-style]] links
✅ Build backlinks panel
✅ Add document graph view
✅ Create link auto-completion
✅ Build "Unlinked mentions" finder

// Deliverables:
- Wiki-style linking
- Visual graph view (D3.js)
- Backlinks sidebar
- Link suggestions
```

---

### **Phase 4: Collaboration (Optional, Weeks 10+)**

**Only implement if:**
1. Users explicitly request real-time collaboration
2. You have budget for managed service (Liveblocks/Supabase)
3. Team collaboration is a paid feature ($10/month)

```javascript
// Tasks:
⚠️ Integrate Liveblocks or Supabase Realtime
⚠️ Add presence indicators (who's online)
⚠️ Implement cursor sharing
⚠️ Build commenting system
⚠️ Add access control (sharing, permissions)

// Deliverables:
- Real-time collaborative editing
- Live cursors and selections
- In-document comments
- Share links with permissions
```

**Why Optional:**
- High complexity vs. value for single-user app
- Most users edit alone
- Better to perfect single-user experience first

---

## 🎨 Additional UX Enhancements

### 1. Quick Switcher (like VS Code)
```javascript
// Ctrl+P to switch documents
function openQuickSwitcher() {
    const recentDocs = await db.documents
        .orderBy('lastModified')
        .reverse()
        .limit(50)
        .toArray();
    
    showFuzzySearch({
        items: recentDocs,
        placeholder: 'Go to document...',
        onSelect: (doc) => openDocument(doc.id),
        preview: (doc) => doc.content.slice(0, 200)
    });
}

// Features:
✅ Fuzzy matching (like "mdpr" matches "Markdown Preview")
✅ Show file path/folder
✅ Preview on hover
✅ Keyboard navigation
✅ Recently opened at top
```

### 2. Smart Paste
```javascript
// Detect and convert pasted content
editor.onDidPaste(async (e) => {
    const clipboardData = e.clipboardData;
    
    // HTML → Markdown
    if (clipboardData.types.includes('text/html')) {
        const html = clipboardData.getData('text/html');
        const markdown = htmlToMarkdown(html);
        editor.insertText(markdown);
        e.preventDefault();
    }
    
    // Images → Upload and insert
    else if (clipboardData.files.length > 0) {
        const file = clipboardData.files[0];
        if (file.type.startsWith('image/')) {
            const dataUrl = await uploadImage(file);
            editor.insertText(`![${file.name}](${dataUrl})`);
            e.preventDefault();
        }
    }
    
    // URLs → Fetch title
    else if (isURL(clipboardData.getData('text'))) {
        const url = clipboardData.getData('text');
        const title = await fetchPageTitle(url);
        editor.insertText(`[${title}](${url})`);
        e.preventDefault();
    }
    
    // Table data → Markdown table
    else if (clipboardData.types.includes('text/csv')) {
        const csv = clipboardData.getData('text/csv');
        const markdown = csvToMarkdownTable(csv);
        editor.insertText(markdown);
        e.preventDefault();
    }
});
```

### 3. Document Encryption
```javascript
// Encrypt sensitive documents
async function encryptDocument(content, passphrase) {
    const enc = new TextEncoder();
    
    // Derive encryption key from passphrase
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    );
    
    // Encrypt API key
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc.encode(content)
    );
    
    return {
        encrypted: Array.from(new Uint8Array(encrypted)),
        salt: Array.from(salt),
        iv: Array.from(iv)
    };
}

// Store in IndexedDB
await db.documents.put({
    id: 123,
    title: 'Confidential.md',
    encrypted: true,
    content: null, // Not stored
    encryptedData: encryptedContent
});
```

### 4. Distraction-Free Mode
```javascript
// Ultra-focused writing mode
function enterZenMode() {
    // Hide everything except editor
    document.body.classList.add('zen-mode');
    
    // Dim everything except current paragraph
    editor.onDidChangeCursorPosition((e) => {
        const line = e.position.lineNumber;
        highlightOnlyParagraph(line);
    });
    
    // Floating word count
    showFloatingStats();
    
    // Escape to exit
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') exitZenMode();
    });
}

// CSS
.zen-mode {
    .sidebar, .toolbar, .statusbar {
        opacity: 0;
        pointer-events: none;
    }
    
    .editor-line:not(.current-paragraph) {
        opacity: 0.3;
        filter: blur(1px);
    }
    
    .floating-stats {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
    }
}
```

### 5. Markdown Cheat Sheet Panel
```html
<!-- Collapsible reference panel -->
<div class="cheatsheet-panel">
    <button onclick="toggleCheatsheet()">
        📖 Markdown Cheatsheet
    </button>
    
    <div class="cheatsheet-content collapsed">
        <section>
            <h3>Headers</h3>
            <code-example># H1</code-example>
            <code-example>## H2</code-example>
            <code-example>### H3</code-example>
        </section>
        
        <section>
            <h3>Emphasis</h3>
            <code-example>**bold**</code-example>
            <code-example>*italic*</code-example>
            <code-example>~~strikethrough~~</code-example>
        </section>
        
        <section>
            <h3>Lists</h3>
            <code-example>- Unordered item
- Another item</code-example>
            <code-example>1. Ordered item
2. Another item</code-example>
        </section>
        
        <section>
            <h3>Links & Images</h3>
            <code-example>[Link text](url)</code-example>
            <code-example>![Alt text](image.png)</code-example>
        </section>
    </div>
</div>

<style>
.cheatsheet-panel {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    max-width: 300px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

code-example {
    display: block;
    background: var(--code-bg);
    padding: 0.5rem;
    margin: 0.5rem 0;
    border-radius: 0.25rem;
    font-family: monospace;
    cursor: pointer;
}

code-example:hover {
    background: var(--accent);
    color: white;
}
</style>
```

---

## 🔒 Security Considerations

### 1. Content Security Policy
```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com https://api.languagetool.org; img-src 'self' data: blob: https:; font-src 'self' data:; worker-src 'self' blob:"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

### 2. API Key Encryption (BYOK Tier Only)
```javascript
// Use SubtleCrypto + User Passphrase
class SecureKeyStore {
    async storeKey(apiKey, passphrase) {
        const enc = new TextEncoder();
        
        // Derive encryption key from passphrase
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            enc.encode(passphrase),
            'PBKDF2',
            false,
            ['deriveKey']
        );
        
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
        
        // Encrypt API key
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            enc.encode(apiKey)
        );
        
        // Store in IndexedDB (not localStorage)
        await db.config.put({
            key: 'ai_api_key',
            encrypted: Array.from(new Uint8Array(encrypted)),
            salt: Array.from(salt),
            iv: Array.from(iv),
            warning: 'BYOK: This is client-side encryption only. Keys can be extracted by determined attackers.'
        });
    }
    
    async retrieveKey(passphrase) {
        const stored = await db.config.get('ai_api_key');
        if (!stored) return null;
        
        // Derive same key from passphrase
        // ... (reverse of storeKey)
        
        return decryptedApiKey;
    }
}

// Show clear warning to users
function showBYOKWarning() {
    showModal({
        title: '⚠️ Bring Your Own Key (Advanced)',
        content: `
            <p><strong>Security Notice:</strong></p>
            <ul>
                <li>✅ Your API key is encrypted before storage</li>
                <li>⚠️ Anyone with access to your device can extract it</li>
                <li>⚠️ This is NOT a replacement for server-side security</li>
                <li>✅ We recommend our Pro tier for better security</li>
            </ul>
            <p>Only proceed if you understand these limitations.</p>
        `,
        actions: [
            { label: 'I Understand', primary: true, onClick: () => proceedWithBYOK() },
            { label: 'Use Pro Tier Instead', onClick: () => showPricingPage() }
        ]
    });
}
```

### 3. Rate Limiting (Serverless)
```javascript
// /api/ai-complete.js
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN
});

const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '24 h'), // 5 requests per day for free tier
    analytics: true
});

export default async function handler(req, res) {
    const userId = req.body.userId;
    
    // Check rate limit
    const { success, limit, remaining, reset } = await ratelimit.limit(userId);
    
    if (!success) {
        return res.status(429).json({
            error: 'Rate limit exceeded',
            limit,
            remaining: 0,
            resetAt: new Date(reset).toISOString(),
            upgrade: 'https://markups.com/pricing'
        });
    }
    
    // Proceed with AI request
    // ...
}
```

---

## 📈 Performance Optimizations

### 1. Code Splitting
```javascript
// vite.config.js
export default {
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Core editor (~500KB)
                    'monaco': ['monaco-editor'],
                    
                    // Export features (~200KB)
                    'export': ['html2pdf.js', 'html2canvas'],
                    
                    // Markdown parsing (~100KB)
                    'markdown': [
                        'marked',
                        'marked-alert',
                        'marked-footnote',
                        'marked-katex-extension'
                    ],
                    
                    // Diagrams (only load when needed)
                    'mermaid': ['mermaid'],
                    
                    // Math rendering (only load when needed)
                    'katex': ['katex'],
                    
                    // Syntax highlighting (~50KB)
                    'prism': ['prismjs']
                }
            }
        },
        
        // Tree shaking
        treeshake: {
            preset: 'recommended',
            moduleSideEffects: false
        }
    },
    
    // Optimize deps
    optimizeDeps: {
        include: ['monaco-editor', 'marked', 'dexie'],
        exclude: ['mermaid', 'katex'] // Load on demand
    }
};
```

### 2. Virtual Scrolling (Document List)
```javascript
// Handle 10,000+ documents smoothly
import { VirtualScroller } from 'vanilla-virtual-list';

const scroller = new VirtualScroller({
    container: document.querySelector('.documents-list'),
    itemHeight: 60, // px
    items: documents, // Array of 10,000 items
    renderItem: (doc, index) => `
        <div class="document-item" data-id="${doc.id}">
            <div class="doc-icon">${getIcon(doc)}</div>
            <div class="doc-info">
                <h4>${doc.title}</h4>
                <p>${formatDate(doc.lastModified)}</p>
            </div>
        </div>
    `,
    overscan: 5 // Render 5 extra items above/below viewport
});

// Only renders ~20 items at a time, regardless of total count
```

### 3. Web Workers for Heavy Tasks
```javascript
// markdown-worker.js
self.addEventListener('message', async (e) => {
    const { type, data } = e.data;
    
    switch (type) {
        case 'parse':
            const html = await marked.parse(data.markdown);
            self.postMessage({ type: 'parsed', html });
            break;
            
        case 'search':
            const results = await searchDocuments(data.query);
            self.postMessage({ type: 'search-results', results });
            break;
            
        case 'export':
            const pdf = await generatePDF(data.html);
            self.postMessage({ type: 'pdf-ready', pdf });
            break;
    }
});

// Main thread
const worker = new Worker('/markdown-worker.js');

worker.postMessage({
    type: 'parse',
    data: { markdown: editor.getValue() }
});

worker.onmessage = (e) => {
    if (e.data.type === 'parsed') {
        preview.innerHTML = e.data.html;
    }
};
```

### 4. Lazy Loading Features
```javascript
// Only load features when needed
const features = {
    mermaid: null,
    katex: null,
    export: null
};

async function loadMermaid() {
    if (!features.mermaid) {
        features.mermaid = await import('mermaid');
        features.mermaid.initialize({ theme: 'default' });
    }
    return features.mermaid;
}

// Detect if document needs Mermaid
if (content.includes('```mermaid')) {
    const mermaid = await loadMermaid();
    mermaid.run();
}
```

### 5. IndexedDB Optimization
```javascript
// Batch operations
await db.transaction('rw', db.documents, async () => {
    await Promise.all(
        documents.map(doc => db.documents.put(doc))
    );
});

// Index for faster queries
db.version(3).stores({
    documents: '++id, title, lastModified, *tags, [folderId+pinned]'
    //                                              ^^^^^^^^^^^^^^^^
    //                                              Compound index for "Show pinned in folder"
});

// Efficient pagination
async function getDocuments(page = 0, limit = 50) {
    return await db.documents
        .orderBy('lastModified')
        .reverse()
        .offset(page * limit)
        .limit(limit)
        .toArray();
}
```

---

## 🎁 Quick Wins (Implement This Week)

### 1. Document Encryption (4 hours)
```javascript
// Add "Lock Document" button
// Uses SubtleCrypto API
// Shows lock icon in sidebar
// Requires passphrase to open
```

### 2. Smart Word Count (2 hours)
```javascript
// Exclude code blocks, frontmatter, HTML
function getAccurateWordCount(markdown) {
    let text = markdown;
    
    // Remove code blocks
    text = text.replace(/```[\s\S]*?```/g, '');
    
    // Remove inline code
    text = text.replace(/`[^`]+`/g, '');
    
    // Remove frontmatter
    text = text.replace(/^---[\s\S]*?---/m, '');
    
    // Remove HTML
    text = text.replace(/<[^>]+>/g, '');
    
    // Count words
    const words = text.trim().split(/\s+/).length;
    
    // Calculate reading time
    const readingTime = Math.ceil(words / 200); // 200 WPM
    
    return { words, readingTime };
}
```

### 3. Markdown Cheat Sheet (3 hours)
```javascript
// Collapsible reference panel
// Copy snippet on click
// Categorized examples
// Search functionality
```

### 4. "Distraction-Free" Mode (4 hours)
```javascript
// Hide all UI except editor
// Dim everything except current paragraph
// Floating word count
// Press Escape to exit
```

### 5. Document Templates UI (6 hours)
```javascript
// Visual template picker
// Categories: Blog, Resume, Report, Notes
// Preview before applying
// Save custom templates
```

---

## 📊 Success Metrics

### Phase 1 (Foundation)
- ✅ 100% of documents migrated to IndexedDB
- ✅ Support for 1000+ documents
- ✅ Mobile usability score > 90
- ✅ Zero storage quota errors

### Phase 2 (Power Features)
- ✅ Command palette usage > 30% of sessions
- ✅ Version restore used > 10 times/week
- ✅ Export quality score > 4.5/5

### Phase 3 (Smart Features)
- ✅ AI feature usage > 100 requests/day (free tier)
- ✅ Grammar checker corrections > 50/day
- ✅ Pro tier conversion > 2%

### Phase 4 (Optional Collaboration)
- ⚠️ Only if: Users request + Budget available
- ⚠️ Metrics: Collaboration sessions > 10/week

---

## 🎯 Conclusion

This revised plan addresses the original vision while being pragmatic about:

1. **Storage:** Dexie.js is non-negotiable (do first)
2. **AI:** Freemium model instead of BYOK-only
3. **Collaboration:** Managed services instead of y-webrtc
4. **Mobile:** CSS-first instead of over-engineered JS
5. **Features:** Focus on daily-use tools before advanced AI

**Next Steps:**
1. ✅ Start Dexie.js migration (Week 1)
2. ✅ Build folder organization (Week 2)
3. ✅ Improve mobile UX (Week 3)
4. ⚡ Then proceed with Command Palette and AI

**Questions to Answer:**
- Do you want collaboration features in v3.0, or defer to v4.0?
- Should we build a free tier for AI, or Pro-only?
- Do you want to monetize ($5/month for Pro)?

---

**Authored by:** GitHub Copilot Engineering Analysis  
**Date:** 2026-02-11  
**Target Version:** 3.0.0-alpha.1  
**Status:** Ready for Implementation