# Markups: The AI-First Markdown Evolution
## Technical Master Plan & Architectural Roadmap

**Project Name:** Markups (Markdown Live Preview)  
**Status:** Active Development / Modernization  
**Core Objective:** Transition from a standard web-based Markdown editor to a local-first, AI-augmented document platform.

---

## 1. Executive Summary

Markups is evolving. The current architecture leverages high-performance libraries (Monaco Editor, Vite, marked) but is constrained by the limitations of `LocalStorage` and a static feature set. This roadmap outlines the transition to **Markups AI-First**, emphasizing user privacy, P2P collaboration without centralized servers, and a robust local storage engine capable of handling large media and extensive document history.

---

## 2. Technical Stack Evolution

### Current Stack
- **Bundler:** Vite
- **Core Editor:** Monaco Editor
- **Markdown Engine:** marked.js
- **Diagrams/Math:** Mermaid.js, KaTeX
- **Syntax Highlighting:** Prism.js
- **Storage:** `storehouse-js` (LocalStorage abstraction)

### Proposed Stack Additions
- **Storage Layer:** Dexie.js (IndexedDB Wrapper)
- **CRDT / Sync:** Yjs + y-webrtc + y-indexeddb
- **AI Integration:** Google Gemini SDK / OpenAI SDK (Client-side execution)
- **UI Architecture:** Mobile-first Bottom Sheets, Command Palette (via Monaco)

---

## 3. Core Pillar: AI-First Integration

### 3.1 Local-First Privacy Model
AI implementation will strictly adhere to a **"BYOK" (Bring Your Own Key)** model. 
- **Storage:** Keys for Gemini and OpenAI will be encrypted and stored in IndexedDB (never on any server).
- **Execution:** LLM calls will originate directly from the client browser to the respective API providers.

### 3.2 AI Smart Completion & Command Palette
- **Monaco Provider:** Implementation of `monaco.languages.registerCompletionItemProvider` to offer context-aware suggestions.
- **Trigger Character:** `/` (The Command Palette).
  - `/summarize`: AI summary of current document.
  - `/fix-grammar`: Real-time linter-integrated corrections.
  - `/image`: Generate prompt for DALL-E/Imagen based on context.
  - `/format`: Intelligent markdown restructuring.

---

## 4. Advanced Data Layer: Dexie.js Migration

`LocalStorage` is capped at ~5MB, which is insufficient for an "AI-First" editor that might handle image-heavy documents or long-term history.

### 4.1 Schema Definition (IndexedDB)
```javascript
db.version(1).stores({
    documents: '++id, title, content, lastModified, tags',
    assets: '++id, docId, type, blob, size',
    config: 'key, value', // Stores encrypted API keys
    history: '++id, docId, timestamp'
});
```

### 4.2 Migration Strategy
A transparent migration service will move existing `LocalStorage` entries into IndexedDB upon the first boot of version 3.0, followed by a cleanup of the legacy namespace.

---

## 5. P2P Collaboration (Serverless Sync)

Using **Yjs**, we enable real-time collaboration without a centralized database.

### 5.1 Protocol: WebRTC
- **Signaling:** Use public WebRTC signaling servers (e.g., `y-webrtc`) to establish P2P connections.
- **Conflict Resolution:** CRDT (Conflict-free Replicated Data Type) ensures that even with high latency or offline work, document state converges perfectly.
- **Privacy:** Document data flows between peers, encrypted by the WebRTC channel.

---

## 6. Mobile Responsive Optimization

### 6.1 Bottom Sheet Navigation
On viewports < 768px, the sidebar and toolbar will transition to a **Bottom Sheet UI** (using CSS `transform` and `touch-action` for native-like feel).
- **Tabbed View:** Toggle between `Edit`, `Preview`, and `AI Chat` via a persistent bottom navigation bar.

### 6.2 Monaco Mobile Adaptations
Monaco Editor will be configured with `fixedOverflowWidgets: true` and `automaticLayout: true` to prevent layout shifts on virtual keyboard toggles.

---

## 7. Development Roadmap

| Phase | Milestone | Focus |
| :--- | :--- | :--- |
| **Phase 1** | **The Foundation** | Migrate to Dexie.js & Implement Local Key Management |
| **Phase 2** | **AI Core** | Integrate `/` Command Palette and Smart Completions |
| **Phase 3** | **Collaboration** | WebRTC-based P2P document sharing (Yjs) |
| **Phase 4** | **Mobile UX** | Bottom Sheet UI and responsive tabbed navigation |

---

## 8. Security Considerations

1. **Content Security Policy (CSP):** Must be updated to allow direct connections to AI API endpoints (Google/OpenAI).
2. **Key Encryption:** Use the `SubtleCrypto` API to encrypt API keys before storing them in IndexedDB, keyed by a user-provided passphrase or a machine-local seed.
3. **Data Sovereignty:** No document content should ever touch a backend controlled by the Markups project.

---

**Authored by:** Markups Engineering Sub-Agent  
**Date:** 2026-02-11  
**Target Version:** 3.0.0-alpha.1
