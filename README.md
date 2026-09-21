# Birthday Gift Website

This is a full-screen, scene-by-scene birthday story. It has no framework and no install step.

## Start it locally

The reliable way on Windows is:

```powershell
cd "C:\Users\ajv22\OneDrive\Documents\New project\birthday-gift"
python -m http.server 5500
```

Then open `http://localhost:5500` in your browser. To stop it later, press `Ctrl + C` in that terminal.

You can also double-click `index.html` for a quick look, but using the tiny local server is better for testing audio and video behavior.

## Personalize everything in one place

Open [js/config.js](js/config.js). That file contains clearly marked sections for:

- Password
- Background music, voice note, and all three edits
- Photos and photo captions
- Love letter, date, and sign-off
- Final birthday message
- Volume and video behavior

## Where to add your assets

| What to add | Folder | Default filename |
| --- | --- | --- |
| Background music | `assets/audio/` | `background.mp3` |
| Voice note | `assets/audio/` | `voice-note.mp3` |
| Photos | `assets/images/` | `photo-1.jpg` through `photo-5.jpg` |
| Edit 1 | `assets/edits/` | `edit-1.mp4` |
| Edit 2 | `assets/edits/` | `edit-2.mp4` |
| Edit 3 | `assets/edits/` | `edit-3.mp4` |

If you rename a file, update its matching path in `js/config.js`. The photo scene will adapt if you add or remove photo paths. Until you add a real image, it intentionally shows a graceful placeholder instead of a broken image.

## Project map

```text
birthday-gift/
├── index.html             # Every scene, in story order
├── css/
│   ├── style.css           # Main visual styles + responsive layout
│   └── animations.css      # Gentle motion only
├── js/
│   ├── config.js           # Your personal content and media paths
│   └── app.js              # Scene transitions and media behavior
└── assets/
    ├── audio/
    ├── edits/
    ├── images/
```

## Story flow

1. Text-ribbon heart — tap it to begin and unlock the music
2. Secret garden password scene
3. Moonlit lily garden
4. Memory photos
5. Envelope and handwritten-style love letter
6. Voice note
7. Edit 1
8. Edit 2
9. Edit 3
10. Birthday ending

The password comparison ignores capitalization, so `Birthday` and `birthday` both work with the default setting.
