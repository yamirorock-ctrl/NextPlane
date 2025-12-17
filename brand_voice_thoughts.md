User is energetic.
Proposed Feature: **Brand Voice Trainer**.
Mechanic:

1. User uploads a file (PDF/TXT) or pastes text (e.g., "My best tweets").
2. We use Gemini to "analyze" this text and extract:
   - Keywords/Slang.
   - Sentence length preference.
   - Emoji usage.
   - Tone descriptors.
3. We save this "Analysis" as a structured "Voice Profile" (JSON) in LocalStorage (or Supabase).
4. When generating captions, we inject this Profile into the system prompt.

Implementation:

- New Component: `VoiceTrainer.jsx`.
- Location: Inside `SettingsView` (it fits "Configuration").
- AI Service Update: Add `analyzeBrandVoice(text)` function to `ai.js`.
