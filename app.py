import time
import urllib.request
import xml.etree.ElementTree as ET
import re
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Cache configuration
CACHE_DURATION = 300  # 5 minutes
cached_releases = None
last_fetch_time = 0

def fetch_and_parse_releases():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
        
        root = ET.fromstring(xml_data)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        entries = root.findall("atom:entry", ns)
        
        all_items = []
        for entry in entries:
            entry_title = entry.find("atom:title", ns)
            entry_updated = entry.find("atom:updated", ns)
            entry_content = entry.find("atom:content", ns)
            
            date_str = entry_title.text if entry_title is not None else "Unknown Date"
            updated_str = entry_updated.text if entry_updated is not None else ""
            html_content = entry_content.text if entry_content is not None else ""
            
            # Parse individual items in the entry HTML
            # HTML typically contains multiple <h3>Type</h3> sections
            chunks = re.split(r'<h3>', html_content)
            index = 0
            for chunk in chunks:
                chunk = chunk.strip()
                if not chunk:
                    continue
                if '</h3>' in chunk:
                    parts = chunk.split('</h3>', 1)
                    item_type = parts[0].strip()
                    item_html = parts[1].strip()
                else:
                    item_type = "Update"
                    item_html = chunk
                
                # Cleanup trailing whitespace/newlines from HTML
                item_html = re.sub(r'\s*$', '', item_html)
                
                # Extract links
                links = re.findall(r'href="([^"]+)"', item_html)
                
                # Strip HTML tags for plain text representation
                plain_text = re.sub(r'<[^>]+>', '', item_html)
                plain_text = re.sub(r'\s+', ' ', plain_text).strip()
                
                # Format a default tweet
                # We format it nicely and handle length limits (280 chars)
                tweet_intro = f"BigQuery [{item_type}] ({date_str}): "
                # Reserve space for intro and link (standard URL in tweet is 23 characters)
                url_space = 25 if links else 0
                max_text_len = 280 - len(tweet_intro) - url_space - 4  # 4 for buffer and potential newline
                
                if len(plain_text) > max_text_len:
                    truncated_text = plain_text[:max_text_len - 3] + "..."
                else:
                    truncated_text = plain_text
                
                tweet_text = f"{tweet_intro}{truncated_text}"
                if links:
                    tweet_text += f"\n{links[0]}"
                
                item_id = f"{date_str.replace(' ', '_').replace(',', '')}_{index}"
                
                all_items.append({
                    'id': item_id,
                    'date': date_str,
                    'updated': updated_str,
                    'type': item_type,
                    'html': item_html,
                    'text': plain_text,
                    'tweet': tweet_text,
                    'links': links
                })
                index += 1
        return all_items
    except Exception as e:
        print("Error fetching/parsing releases:", e)
        # Return a mock response or log it if connection fails
        return []

def get_releases(force_refresh=False):
    global cached_releases, last_fetch_time
    now = time.time()
    if force_refresh or not cached_releases or (now - last_fetch_time) > CACHE_DURATION:
        fetched = fetch_and_parse_releases()
        if fetched: # Only update cache if fetch was successful
            cached_releases = fetched
            last_fetch_time = now
        elif not cached_releases:
            cached_releases = []
    return cached_releases

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def api_releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    releases = get_releases(force_refresh=force_refresh)
    return jsonify({
        'status': 'success',
        'count': len(releases),
        'last_fetch': int(last_fetch_time),
        'releases': releases
    })

if __name__ == '__main__':
    # Running on localhost:5000 by default
    app.run(debug=True, host='127.0.0.1', port=5000)
