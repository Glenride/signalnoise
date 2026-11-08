This Product Requirements Document (PRD) outlines the specifications for **SignalDeck**, a content engine designed to streamline the workflow for high-frequency, faceless news creators.

### **Product Name:** SignalDeck

**Version:** 1.0 (MVP)
**Status:** Draft
**Target User:** "Signal Noise" Creator (OSINT Analysts, Faceless News Channels)

---

### **1. Executive Summary**

**SignalDeck** is a web-based application that automates the lifecycle of a news video. It aggregates RSS feeds, uses AI to curate and script stories, and provides a specialized **"Studio Mode"** interface. This interface presents the script alongside live, pre-loaded browser tabs of the raw sources, optimizing the screen real estate for seamless OBS (Open Broadcaster Software) capture.

### **2. Problem Statement**

Current workflows for "analyst-style" news creators are fragmented:

* **Discovery:** Manually checking 50+ bookmarks or RSS readers.
* **Scripting:** Copy-pasting text into a separate doc and losing track of which source supports which point.
* **Recording:** Fumbling between browser tabs and a script window while recording, leading to "dead air" and editing fatigue.

### **3. Core User Flow**

1. **Ingest:** System pulls headlines from configured RSS feeds.
2. **Select:** User selects 3–5 related articles to build a "Story."
3. **Generate:** AI writes a script (Intro, Body, Outro) and inserts "Source Anchors" (visual cues to switch tabs).
4. **Present:** User enters "Studio Mode." The app organizes the raw source URLs into a clickable playlist alongside the scrolling script.

---

### **4. Functional Requirements**

#### **4.1. The Feed Engine (Ingestion)**

* **RSS Aggregator:** Python `feedparser` backend to fetch from a user-defined list of URLs.
* **Deduplication:** Logic to group similar stories (e.g., if BBC and CNN cover the same event, group them).
* **"Signal" Score:** AI analysis of headlines to flag "Viral" or "High Impact" keywords (e.g., "Fraud," "Crash," "Leak").

#### **4.2. The War Room (Curation & Scripting)**

* **Selection Basket:** A drag-and-drop area where users drag interesting headlines.
* **AI Scriptwriter (LLM Integration):**
* **Input:** The text content of the selected articles.
* **Prompt Configuration:** "Analyst Style" (Fact-based, urgent) or "Hype Style" (Viral, question-heavy).
* **Source Mapping:** The AI must insert `[TAB 1]`, `[TAB 2]` markers in the script corresponding to the specific article being discussed.



#### **4.3. Studio Mode (The OBS Interface)**

* **Split-Screen Layout:**
* **Left Panel (25%):** The Teleprompter. Displays the script with large, readable text.
* **Right Panel (75%):** The "Active Source" View. An embedded browser (iframe) or a clean link list that opens the raw URL in a new window captured by OBS.


* **"Next Source" Hotkey:** A global hotkey (e.g., Spacebar) that advances the script *and* automatically switches the Right Panel to the next URL in the sequence.

---

### **5. Technical Specifications**

#### **Tech Stack**

* **Frontend:** Next.js (React) – for a responsive, reactive dashboard.
* **Backend:** Python (FastAPI) – handles RSS parsing and AI requests.
* **Database:** PostgreSQL or SQLite – stores Feed configurations, Saved Stories, and Scripts.
* **AI Model:** OpenAI GPT-4o or Gemini 1.5 Pro (via API) – for summarization and tone matching.

#### **Data Model (The "Story" Object)**

```json
{
  "story_id": "1024",
  "title": "Utah GOP Fraud Scandal",
  "created_at": "2026-02-10",
  "segments": [
    {
      "order": 1,
      "type": "hook",
      "script_text": "The Utah GOP just got caught...",
      "source_url": "https://ksl.com/article/..."
    },
    {
      "order": 2,
      "type": "body",
      "script_text": "Look at this map of District 4...",
      "source_url": "https://ballotpedia.org/..."
    }
  ]
}

```

---

### **6. UI/UX Wireframes**

#### **View A: The Dashboard (Ideation)**

* **Sidebar:** List of Feeds (Tech, Politics, Finance).
* **Main Feed:** Trello-like cards of headlines.
* **Action:** Drag a card to the "Script Builder" column on the right.
* **Button:** "Generate Script" (Triggers LLM).

#### **View B: Studio Mode (Production)**

* **Background:** Dark Grey (`#121212`) to reduce eye strain.
* **Teleprompter (Left):**
* High contrast text (`#FFFFFF`).
* Current segment highlighted in Neon Blue.
* "Autoscroll" toggle.


* **Source Viewer (Right):**
* Renders the actual webpage of the source.
* **Key Feature:** A "Clean Mode" button that strips ads/sidebars from the source URL using a "Reader View" parser (like `readability.js`) for a cleaner OBS capture.



---

### **7. Roadmap**

* **Phase 1 (MVP):** Manual RSS input, basic GPT-4 script generation, static list of links for OBS.
* **Phase 2:** "Studio Mode" with hotkey tab switching and embedded browser view.
* **Phase 3:** "Auto-Highlight." The AI pre-selects and highlights the key quote in the source article so the user doesn't have to find it manually during the recording.

### **8. Success Metrics**

* **Time-to-Script:** Reduce time from finding news to having a finished script from 60 mins to 5 mins.
* **Production Speed:** User can record a "One-Take" video without stopping to find a tab.