# BassCircle — Circle of Fifths, Clé de Fa & Bass Harmony Trainer (PWA)

Offline-first Progressive Web App built for iPhone using **FSRS-5** spaced repetition, an interactive **Circle of Fifths** answer wheel (with progressive **Blind Wheel** mode), engraved **Clé de Fa (`𝄢`, Bass Clef)** sight-reading, **Ear → Circle** training, bidirectional **4-string bass fretboard** (`Mi–La–Ré–Sol` / `E–A–D–G`), Web Audio finger-bass synth, and on-device `IndexedDB` storage.

## Deploy to GitHub Pages (`leonardhussenot/basscircle`) & Install on Your iPhone

1. **Create an empty repository named `basscircle` on GitHub:**
   - Open https://github.com/new and create **`leonardhussenot/basscircle`** (leave README/.gitignore unchecked).

2. **Push this project to [`leonardhussenot/basscircle`](https://github.com/leonardhussenot/basscircle):**
   ```bash
   cd /Users/leonardhussenot/.gemini/antigravity/scratch/basscircle
   git push -u origin main
   ```
   *(The git repository is already initialized on `main` with `origin` pointing to `https://github.com/leonardhussenot/basscircle.git`. If you use SSH keys with GitHub, run `git remote set-url origin git@github.com:leonardhussenot/basscircle.git` before pushing.)*

3. **Enable GitHub Pages:**
   - Open https://github.com/leonardhussenot/basscircle/settings/pages
   - Under **Build and deployment → Source**, choose **Deploy from a branch**.
   - Select branch **`main`** and folder **`/ (root)`**, then click **Save**.
   - Wait ~30–60 seconds for the site to go live.

4. **Install on your iPhone:**
   - Open **https://leonardhussenot.github.io/basscircle/** in **Safari** on your iPhone.
   - Tap the **Share** button (bottom bar) → **Add to Home Screen** → **Add**.

## Local Preview

```bash
cd /Users/leonardhussenot/.gemini/antigravity/scratch/basscircle
python3 -m http.server 8080
```
Then open http://localhost:8080.
