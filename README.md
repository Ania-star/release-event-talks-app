# BigQuery Release Notes Dashboard & Tweet Composer

A modern, developer-centric dashboard that fetches, parses, and formats Google Cloud's BigQuery release notes. It features a responsive layout, independent column scrolling, real-time keyword search, category filtering, a light/dark theme toggle, and an interactive **Tweet Composer and Live Preview** panel to draft and share updates directly to Twitter/X.

## 🚀 Key Features

*   **Smart Entry Chunking**: Parses and splits date-aggregated feed entries into individual, category-labeled updates (`Feature`, `Announcement`, `Issue`, `Fix`, `Deprecated`, `Update`).
*   **Tweet Composer & Live Mockup**: Replicates a pixel-perfect Twitter/X card preview. Includes pre-formatted drafts with tags, dates, descriptions, and direct reference links.
*   **Search & Dynamic Filters**: Instantly query titles, descriptions, and categories with live DOM filtering.
*   **Light & Dark Themes**: Sleek light/dark color palette toggle with user preference persisted in `localStorage`.
*   **Export to CSV**: Easily download the currently filtered view of release notes into a structured CSV file (`Date, Category, Links, Content`).
*   **Card-Level Clipboard Copies**: Quick-copy individual updates to your clipboard directly from the note cards without interrupting your active tweet draft.
*   **Robust Connection Recovery**: Displays clear connection error panels inside the feed if Google Cloud's RSS is offline or blocked, featuring an inline **"Retry Connection"** action.
*   **External Link Indicators**: All links inside cards automatically append a small indicator icon (`fa-up-right-from-square`) using CSS pseudo-elements to signal new tab navigation.
*   **Optimized Performance**: Built-in backend in-memory cache (5-minute TTL) with a manual override refresh (featuring visual spin animations).
*   **Zero-OAuth Web Intent**: Seamlessly triggers Twitter's Web Intent to post tweets without needing complex API keys or scopes.

---

## 🛠️ Tech Stack

*   **Backend**: Python, Flask (standard library XML parser, in-memory caching)
*   **Frontend**: Plain HTML5, CSS3 (variables, animations, custom scrollbars), Vanilla JavaScript (ES6+ state manager)
*   **Icons**: FontAwesome v6

---

## 📂 Project Structure

```text
bq-releases-notes/
├── templates/
│   └── index.html      # Main dashboard page layout
├── static/
│   ├── css/
│   │   └── style.css   # Theme variables (dark/light), layout spacing & overrides
│   └── js/
│       └── main.js     # State controller, filters, theme handlers & export routines
├── app.py              # Flask server, feed fetcher, XML parser, and REST API
├── requirements.txt    # Python package dependencies
└── README.md           # Documentation
```

---

## ⚙️ Getting Started & Installation

### Prerequisites
*   Python 3.8 or higher installed on your machine.
*   Git (optional, for version control).

### 1. Clone or Download the Project
```bash
git clone https://github.com/Ania-star/release-event-talks-app.git
cd release-event-talks-app
```

### 2. Set Up a Virtual Environment
**On macOS/Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**On Windows (PowerShell):**
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Application
```bash
python app.py
```

Open your browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 📡 API Endpoints

### `GET /api/releases`
Fetches the parsed list of release note updates.
*   **Query Parameters**:
    *   `refresh` (bool, optional): If `true`, bypasses the cache and forces a fresh scrape from Google Cloud. Default is `false`.
*   **Response Statuses**:
    *   `200 OK`: Successful fetch. Returns cached or fresh releases.
    *   `503 Service Unavailable`: Connection error. Returned when the cache is empty and the Google Cloud RSS feed cannot be scraped.
*   **Response Format (200 OK)**:
    ```json
    {
      "status": "success",
      "count": 30,
      "last_fetch": 1718600000,
      "releases": [
        {
          "id": "June_15_2026_0",
          "date": "June 15, 2026",
          "type": "Feature",
          "html": "<p>Use Gemini Cloud Assist to analyze...</p>",
          "text": "Use Gemini Cloud Assist to analyze your SQL queries...",
          "tweet": "BigQuery [Feature] (June 15, 2026): Use Gemini Cloud Assist...",
          "links": ["https://docs.cloud.google.com/..."]
        }
      ]
    }
    ```
