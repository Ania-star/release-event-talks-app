# BigQuery Release Notes Dashboard & Tweet Composer

A modern, developer-centric dashboard that fetches, parses, and formats Google Cloud's BigQuery release notes. It features a responsive grid layout, real-time keyword search, category filtering, and an interactive **Tweet Composer and Live Preview** panel to draft and share updates directly to Twitter/X.

## 🚀 Key Features

*   **Smart Entry Chunking**: Parses and splits date-aggregated feed entries into individual, category-labeled updates (`Feature`, `Announcement`, `Issue`, `Fix`, `Deprecated`, `Update`).
*   **Tweet Composer & Live Mockup**: Replicates a pixel-perfect Twitter/X card preview. Includes pre-formatted drafts with tags, dates, descriptions, and direct reference links.
*   **Search & Dynamic Filters**: Instantly query titles, descriptions, and categories with live DOM filtering.
*   **Optimized Performance**: Built-in backend in-memory cache (5-minute TTL) with a manual override refresh (featuring visual spin animations).
*   **Zero-OAuth Web Intent**: Seamlessly triggers Twitter's Web Intent to post tweets without needing complex API keys or scopes.
*   **Vanilla Frontend**: Lightweight, responsive user interface utilizing custom CSS variables, slate-dark themes, and micro-animations.

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
│   │   └── style.css   # Dark space theme, custom styling & transitions
│   └── js/
│       └── main.js     # State controller, filters, live preview & actions
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
*   **Response Format**:
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
