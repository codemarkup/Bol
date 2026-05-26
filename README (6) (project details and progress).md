# 📱 Project: Bol — WhatsApp Competitor

> **HOW TO USE THIS FILE (For Claude):**
> This is the single source of truth for this project. Read this entire file before doing anything. It contains the full product plan, design decisions, tech stack, and a progress log of everything completed so far. Continue from where the progress log ends. Never ask the user to re-explain what the project is. Never ask the user to explain anything that is already written here.

---

## 🧠 Project Overview

We are building a **cross-platform messaging app** called **Bol** to compete with WhatsApp. The team is two people:
- **Partner A — Web Developer** → Building the web version using **Next.js**
- **Partner B — App Developer** → Building the **mobile app** (iOS + Android)

Both apps connect directly to Supabase. No separate hosted backend server needed.

**App name:** Bol — means "speak" in Urdu. Short, punchy, Pakistani, globally pronounceable.
**Tagline:** *"Just say it."* / *"Messaging finally evolved."*
**Core strategy:** Don't beat WhatsApp at everything. Beat them at the specific things that make users angry daily — and add an AI layer WhatsApp is too slow to ship.
**Target market:** Start in Pakistan first (130M WhatsApp users), then South Asia, then global.
**Positioning statement:** *"The messaging app that respects your intelligence — and your privacy."*

---

## 😤 WhatsApp Problems We Are Solving

1. **Multi-device is broken** — WhatsApp requires your phone to stay on for web. Bol: all devices equal, no primary phone required.
2. **Only 6 reactions** — We allow any emoji as a reaction.
3. **No message scheduling** — We have native scheduled messages.
4. **No threads in groups** — Group chats become chaos. We have full message threads.
5. **No voice message transcription** — We auto-transcribe all voice messages with AI.
6. **Read receipts are global** — Can't turn off for just one person. We have per-contact control.
7. **Edit history is hidden** — We show full edit history transparently.
8. **No inline translation** — We have per-message and per-contact AI translation.
9. **Search is terrible** — Smart search with filters (date, media type, sender, links, docs).
10. **No anonymous groups** — We let users join groups without revealing their phone number.

---

## ✨ Full Feature Plan

### Core Messaging (Better than WhatsApp)
| Feature | Details | Cost |
|---|---|---|
| True multi-device sync | All devices equal — no primary phone needed. Web, desktop, tablet, phone work independently. | Free — Supabase Auth handles sessions per device |
| Scheduled messages | Schedule any message to send later. Native UI, not a workaround. | Free — Supabase pg_cron |
| Edit + history | Edit messages with full edit history visible to both parties. Transparent. | Free — message_edits table in Supabase |
| Pin + bookmark messages | Pin multiple messages per chat. Personal bookmarks (only you see). Saved messages with folders/tags. | Free — Supabase |
| Full emoji + custom reactions | Any emoji as reaction. Custom stickers as reactions. See who reacted. Animation on reaction. | Free — Supabase reactions table |
| Smart search | Search across all chats. Filter by date, media type, sender, links, documents. | Free — Supabase full-text search (tsvector) |
| Granular disappearing messages | Per-message timer, not just per-chat. Secret threads within regular chats. | Free — expires_at column + pg_cron |
| Per-contact read receipt control | Control per contact, not global. Stealth mode per chat. | Free — boolean field per contact relationship |

### AI-Powered Features (Our Competitive Edge)
| Feature | Details | Cost |
|---|---|---|
| AI reply suggestions | Context-aware smart replies. Learns your writing style. Toggle on/off per chat. | Free — Gemini API free tier |
| Chat catch-up summary | Tap "Catch me up" on any chat/group — AI gives bullet-point summary with action items. | Free — Gemini API free tier |
| Voice message transcription | All voice messages auto-transcribed. Search inside voice content. Urdu + English. | Free — Groq Whisper API free tier |
| Inline translation | Tap any message to translate. Set preferred language per contact. Groups auto-translate per member. | Free — LibreTranslate open source |
| Tone checker | Before sending, AI flags if message might seem harsh. Suggests gentler alternative. Opt-in only. | Free — Gemini API free tier |
| Smart media organizer | AI auto-categorizes shared photos/videos. Search by content ("photos from Lahore trip"). | Free — Cloudinary AI tagging free tier |

### Privacy & Security
| Feature | Details | Cost |
|---|---|---|
| Anonymous groups | Join groups without revealing phone number. Use a pseudonym. | Free — alias stored in group membership table |
| App lock + decoy mode | Biometric lock per chat. Decoy PIN shows fake chat history. Real chats stay hidden. | Free — two separate chat databases per user |
| Per-contact read receipt control | Control per contact, not global. | Free — Supabase |
| Granular disappearing messages | Per-message timer. | Free — Supabase pg_cron |
| E2E Encryption | All messages encrypted end-to-end. | Free — libsodium |

### Groups & Communities
| Feature | Details | Cost |
|---|---|---|
| Polls, events & tasks | Native polls, group event planning with RSVP, shared task lists, meeting time picker. | Free — Supabase |
| Rich group roles | Multiple admin tiers, moderator role, read-only members, per-role permissions. | Free — Supabase RLS |
| Message threads | Reply to any message and start a thread. parent_message_id in messages table. | Free — Supabase |
| Shared spaces / channels | Interactive boards, shared notes, collaborative docs, pinned resources per group. | Free — Supabase Realtime |
| Group invite links | Anyone with link joins the group. Viral growth tool. | Free — Supabase |

### Contact Discovery (No Phone Number Required)
| Feature | Details | Cost |
|---|---|---|
| Google contacts matching | At signup, match Google contact emails with registered Bol users. Show "X friends already on Bol." | Free — Google People API |
| Shareable profile link | Every user gets bol.chat/username — share anywhere, tap to start chat. | Free |
| QR code profile | Personal QR code for in-person discovery. Scan to connect instantly. | Free — qrcode library |
| Group invite links | Share bol.chat/join/groupname — tap to join. Spreads virally through WhatsApp groups. | Free |
| Optional phone number | Stored (not verified via SMS). Used only for matching contacts who also added same number. | Free — no OTP cost |
| Username search | Search @username directly inside app. | Free — Supabase query |

---

## 🔐 Auth System (FINAL — LOCKED)

### Method: Google OAuth + Email Magic Link (No SMS OTP)

**Why not SMS OTP:** Firebase Phone Auth confirmed NOT free — billed per SMS (~$0.03/SMS in Pakistan). Permanently removed from plan.
**Why not phone-only:** No need to copy WhatsApp's model. Not requiring a phone is actually a privacy feature we market.
**Reference:** Discord has 500M users with zero phone verification — it is not a blocker.

### Auth Flow:
```
Landing Page → "Get Early Access" or "Sign In"
         ↓
/signin page — split layout:
Left: dark cinematic brand column
Right: white auth form
         ↓
THREE TAB OPTIONS:
Tab 1: Sign In (Google OAuth + Email Magic Link)
Tab 2: QR Code (scan with Bol app — for returning users)
Tab 3: Create Account (Google + Email + username + optional phone)
         ↓
Profile Setup: username (@handle), display name, photo (optional)
         ↓
Contact Discovery: Google contacts email match → "X friends on Bol"
         ↓
Main App /chat
```

### Fake Account Prevention (Free):
| Method | How |
|---|---|
| Rate limiting | Max 3 accounts per IP per day — Vercel handles free |
| Google OAuth trust | Google already verified their identity |
| Disposable email blocking | Block known disposable domains — free list on GitHub |
| Device fingerprinting | One device = limited accounts — free libraries |
| Report + ban system | Users report fakes, manual review early on |
| Profile completeness | Incomplete profiles get limited features |

### Implementation: Supabase Auth
- Google OAuth — built-in, free
- Email Magic Link — built-in, free, Supabase sends the email
- Session management, JWT tokens, Row level security — all free
- **Total auth cost: $0 forever**

---

## 🎨 UI/UX Design System (FINAL — LOCKED)

### Design Philosophy
- **Light theme** — White background, clean, premium, lots of white space
- **Micro-animations** — Framer Motion on web, Reanimated on mobile
- **Custom chat themes** — Per-chat wallpapers, bubble colors, font size
- **Inspiration:** iMessage meets Notion. Nothing like WhatsApp.

### Color Palette (FINAL — LOCKED)
| Role | Hex |
|---|---|
| Primary accent / brand | `#0D9488` (Teal) |
| Page outer background | `#B2C8C4` (Soft teal-gray) |
| App container | White, `border-radius: 20px`, `margin: 16px`, `height: calc(100vh - 32px)` |
| Icon sidebar background | `#0a0a0a` (Near black — matches signin left column) |
| Chat list + main area | `#FFFFFF` |
| Soft section backgrounds | `#F6F8F7` and `#EEF4F3` |
| Sent message bubbles | `#0F0F14` (dark, white text) |
| Received message bubbles | `#FFFFFF` border `#ECECEC` |
| Online status | `#22C55E` (Green) |
| Active icon: left pill | `#0D9488` teal, 3px wide, 28px tall, rounded-full |
| Primary text | `#0F0F14` |
| Secondary text | `#6B7280` |
| Borders / dividers | `#ECECEC` |
| AI Summary card | `#F6F8F7` bg, `3px solid #0D9488` left border |
| Group avatars | `#8B5CF6` purple |

### Typography
- **All text:** Inter font (variable, free, highly readable)

### App Icon (LOCKED)
- Shape: Rounded square, iOS style, radius 22%
- Background: Teal `#0D9488`
- Symbol: White chat bubble (clean, tail bottom-left) + bold white lightning bolt inside
- Meaning: Fast, instant, electric messaging
- Style: Flat, no gradients

### Web Layout — 3 Pane (LOCKED)
```
┌────────────────────────────────────────────────────────────┐
│  Outer page background: #B2C8C4                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 68px sidebar │ 300px middle panel │ flex main area   │  │
│  │ (#0a0a0a)    │ (white)            │ (white)          │  │
│  │              │                    │                  │  │
│  │  💬 ← active │ Page content       │ Detail view      │  │
│  │  📞          │                    │                  │  │
│  │  👥          │                    │                  │  │
│  │  ✦ AI        │                    │                  │  │
│  │  🕐 Scheduled│                    │                  │  │
│  │              │                    │                  │  │
│  │  ⚙️          │                    │                  │  │
│  │  [S] avatar  │                    │                  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
App container: border-radius 20px, margin 16px, height calc(100vh - 32px), overflow hidden
Box shadow: 0 25px 50px rgba(0,0,0,0.12)
```

### Icon Sidebar — Final Order (LOCKED)
1. `MessageSquare` — Chats (active by default)
2. `Phone` — Calls
3. `Users` — Contacts
4. `Sparkles` — AI Features ← UNIQUE to Bol (teal even in default state)
5. `Clock` — Scheduled Messages ← UNIQUE to Bol
6. `Settings` — Settings
7. `S` avatar circle — Profile (very bottom)

Active state: white icon + `3px #0D9488` left edge pill + subtle teal radial glow.
Tooltip on hover: dark bg, white text, appears right of sidebar, Framer Motion fade.
Routes determined by `usePathname()`.

---

## 🛠 Tech Stack (FINAL — LOCKED)

### Web App (Next.js — Partner A)
| Category | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Animations | Framer Motion |
| Real-time | Supabase Realtime |
| State | Zustand |
| Server state | TanStack Query |
| Media CDN | Cloudinary |
| Voice recording | MediaRecorder API (native browser) |

### Mobile App (React Native — Partner B)
| Category | Tech |
|---|---|
| Framework | React Native + Expo |
| Language | TypeScript |
| Navigation | Expo Router |
| Animations | React Native Reanimated |
| State | Zustand (shared with web) |
| Real-time | Supabase Realtime |

### Backend — Supabase (Zero hosted server needed)
| Category | Tech | Cost |
|---|---|---|
| Database | PostgreSQL via Supabase | Free (500MB) |
| Real-time messaging | Supabase Realtime | Free |
| Auth | Supabase Auth (Google + Magic Link) | Free |
| File storage | Supabase Storage | Free (1GB) |
| Scheduled messages | Supabase pg_cron | Free |
| API | Next.js serverless on Vercel | Free |
| Encryption | libsodium | Free |

### AI & Services
| Service | Purpose | Cost |
|---|---|---|
| Gemini API | Summaries, reply suggestions, tone checker | Free (60 req/min) |
| Groq API (Whisper) | Voice transcription | Free tier |
| LibreTranslate | Inline translation | Free open source |
| Agora | Voice/video calls | Free (10,000 min/month) |
| Firebase FCM | Push notifications Android | Free forever |
| Apple APNs | Push notifications iOS | Free forever |
| Google People API | Contact matching at signup | Free |
| Cloudinary | Media storage + AI tagging | Free (25GB/month) |

### Infrastructure
| Service | Purpose | Cost |
|---|---|---|
| Vercel | Web app + serverless functions | Free |
| Supabase | Everything backend | Free |
| Cloudinary | Media CDN | Free |
| Domain | getbol.app or bol.chat | ~$10/year (only cost) |

### Database Storage Plan
- Supabase free: 500MB for text data only (all media on Cloudinary)
- At launch: Apply to **AWS Activate** program → get $300 Supabase credits → 12 months of Pro (8GB) free
- After credits: Revenue from premium tier covers $25/month Pro cost

### App Stores
- Google Play Store — friend's existing account ✅
- Apple App Store — friend's existing account ✅

**Total monthly cost: $0. Only expense: ~$10/year domain.**

---

## 💰 Cost Summary

| Feature Group | Tool | Cost |
|---|---|---|
| All core messaging | Supabase | $0 |
| Scheduled + disappearing | Supabase pg_cron | $0 |
| Voice transcription | Groq Whisper | $0 |
| Translation | LibreTranslate | $0 |
| AI summary, replies, tone | Gemini API | $0 |
| Voice/video calls | Agora | $0 |
| Media + AI tagging | Cloudinary | $0 |
| Auth | Supabase Auth | $0 |
| Contact matching | Google People API | $0 |
| Web hosting + serverless | Vercel | $0 |
| Push notifications | Firebase + APNs | $0 |
| **Total** | | **$0/month** |

---

## 🗺 Development Roadmap

### Phase 1 — MVP (Month 1–2)
- [ ] Next.js project init + Tailwind + shadcn setup
- [ ] Supabase project setup (schema, auth, realtime, storage)
- [ ] Landing page coded from approved design
- [ ] Auth pages (Google + magic link + QR login) at /signin
- [ ] Profile setup + username picker
- [ ] Google contacts matching at signup
- [ ] 1:1 real-time messaging (Supabase Realtime)
- [ ] Typing indicators, read receipts, online status
- [ ] Image and file sharing (Cloudinary)
- [ ] Voice message recording + playback
- [ ] QR code profile + shareable profile link
- [ ] Group invite links
- [ ] Push notifications (Firebase FCM + APNs)
- [ ] Mobile app basic setup (Expo + Supabase)

### Phase 2 — Differentiators (Month 3–4)
- [ ] Group chats with roles
- [ ] Message threads
- [ ] Any emoji reactions with animations
- [ ] Message pinning + bookmarks
- [ ] True multi-device
- [ ] Scheduled messages (pg_cron)
- [ ] Voice transcription (Groq Whisper)
- [ ] AI reply suggestions (Gemini)
- [ ] Smart search with filters
- [ ] Custom chat themes + wallpapers
- [ ] Per-contact read receipt control
- [ ] Edit message + history

### Phase 3 — AI + Privacy (Month 5–6)
- [ ] Chat catch-up AI summary
- [ ] Inline translation (LibreTranslate)
- [ ] Tone checker before send
- [ ] Anonymous group joining
- [ ] Decoy mode + per-chat biometric lock
- [ ] Per-message disappearing timer
- [ ] Group polls, events, RSVP
- [ ] Smart media organizer
- [ ] Channels / broadcast feature
- [ ] Shared spaces per group

### Phase 4 — Monetization (Month 7+)
- [ ] Business accounts + verified badges
- [ ] Premium tier ($2-3/month)
- [ ] Business API
- [ ] Communities (super-groups)
- [ ] In-chat payments
- [ ] Desktop app (Electron wrapper)
- [ ] Voice/video calls via Agora

---

## 📊 Competitive Advantage

| Feature | WhatsApp | Bol |
|---|---|---|
| Multi-device (no primary phone) | ✗ | ✓ |
| Message scheduling | ✗ | ✓ |
| Any emoji reactions | ✗ Only 6 | ✓ |
| Message threads in groups | ✗ | ✓ |
| Voice transcription | ✗ | ✓ AI |
| Chat catch-up summary | ✗ | ✓ AI |
| Per-contact read receipts | ✗ Global | ✓ |
| Edit history transparent | ✗ | ✓ |
| Inline translation | ✗ | ✓ AI |
| Anonymous groups | ✗ | ✓ |
| Smart media search | ✗ | ✓ AI |
| App decoy mode | ✗ | ✓ |
| Group polls + RSVP | ✗ Basic | ✓ |
| Custom themes per chat | ✗ Basic | ✓ |
| Shared workspace per group | ✗ | ✓ |
| No phone number required | ✗ Required | ✓ Privacy feature |
| Google contacts matching | ✗ | ✓ |
| Shareable profile links | ✗ | ✓ |
| Dedicated AI Hub page | ✗ | ✓ |
| Dedicated Scheduled page | ✗ | ✓ |
| Custom right-click context menu | ✗ | ✓ |
| Group info side panel | ✗ | ✓ |
| New chat modal with group creation | ✗ | ✓ |
| E2E encryption | ✓ | ✓ |

---

## 📁 Project Structure (Web — Next.js)

```
/app
  /page.tsx                     → Landing page (LIVE)
  /signin/page.tsx              → Auth page — Sign In / QR / Create Account (LIVE)
  /(main)
    /layout.tsx                 → Shared layout: rounded container + sidebar + context menu
    /template.tsx               → AnimatePresence page transitions
    /chat/page.tsx              → Main chat page (COMPLETE)
    /calls/page.tsx             → Calls page (COMPLETE)
    /contacts/page.tsx          → Contacts page (COMPLETE)
    /ai/page.tsx                → AI Features hub (COMPLETE — unique to Bol)
    /scheduled/page.tsx         → Scheduled messages (COMPLETE — unique to Bol)
    /settings/page.tsx          → Settings page (COMPLETE)
    /profile/page.tsx           → Profile page (COMPLETE)

/components
  /chat
    /Sidebar.tsx                → 68px dark icon sidebar (shared across all pages)
    /ChatList.tsx               → 300px middle chat list
    /ChatListItem.tsx           → Individual chat row
    /MainChat.tsx               → Right chat area (1:1 and group variant)
    /ChatHeader.tsx             → Top bar with close button
    /MessageBubble.tsx          → Text, image, voice, AI card variants + group sender colors
    /VoiceNoteBubble.tsx        → Voice note with waveform + transcript
    /AICard.tsx                 → AI summary card
    /InputBar.tsx               → Bottom input with mic/send toggle
    /TypingIndicator.tsx        → Animated dots
    /AICatchUpBanner.tsx        → Top unread banner
    /ContextMenu.tsx            → Custom right-click menu (blocks browser default)
    /EmptyState.tsx             → No chat selected state
    /GroupInfoPanel.tsx         → Right panel for group info, members, settings
    /NewChatModal.tsx           → New chat / new group modal with tabs
  /ui                           → shadcn components
  /auth
    /GoogleButton.tsx
    /MagicLinkForm.tsx
    /QRCodeLogin.tsx

/lib
  /supabase.ts                  → Supabase client (NOT connected yet — frontend only)
  /store.ts                     → Zustand store
  /crypto.ts                    → libsodium encryption helpers

/hooks
  /useMessages.ts               → Realtime messages (NOT connected yet)
  /usePresence.ts               → Online status (NOT connected yet)
  /useAuth.ts                   → Auth state (NOT connected yet)
  /useContacts.ts               → Contact discovery (NOT connected yet)
```

---

## 🌐 Live URLs

| Page | URL | Status |
|---|---|---|
| Landing page | https://bol-alpha.vercel.app/ | ✅ LIVE |
| Sign In / Auth | https://bol-alpha.vercel.app/signin | ✅ LIVE |
| Chat page | https://bol-alpha.vercel.app/chat | ✅ COMPLETE |
| Calls page | https://bol-alpha.vercel.app/calls | ✅ COMPLETE |
| Contacts page | https://bol-alpha.vercel.app/contacts | ✅ COMPLETE |
| AI Features | https://bol-alpha.vercel.app/ai | ✅ COMPLETE |
| Scheduled | https://bol-alpha.vercel.app/scheduled | ✅ COMPLETE |
| Settings | https://bol-alpha.vercel.app/settings | ✅ COMPLETE |
| Profile | https://bol-alpha.vercel.app/profile | ✅ COMPLETE |

---

## 🎨 Pages Build Status

| Page | Status | Notes |
|---|---|---|
| Landing page | ✅ Complete & Live | Cinematic animations, Apple-level polish, light theme |
| Sign In / Auth | ✅ Complete & Live | Split layout, 3 tabs, Google + Magic Link + QR |
| Chat page (1:1) | ✅ Complete | AI banner, voice note, AI card, reactions, context menu, empty state, close chat |
| Chat page (Group) | ✅ Complete | Sender colors, thread pill, group info panel, member list, group settings |
| Calls page | ✅ Complete | Call log, incoming/outgoing/missed, call detail panel |
| Contacts page | ✅ Complete | Alphabetical list, contact profile, shared media, danger zone |
| AI Features hub | ✅ Complete | Feature toggles, usage stats, summary history, how-it-works steps |
| Scheduled Messages | ✅ Complete | Scheduled list, detail view, countdown, edit/reschedule/send now/cancel |
| Settings page | ✅ Complete | Grouped settings, privacy toggles, Bol-exclusive features (decoy mode, anonymous groups) |
| Profile page | ✅ Complete | Edit profile, username availability, bio, phone, email, danger zone, Bol link |
| New Chat Modal | ✅ Complete | Search contacts, new group with member selection, anonymous joining toggle |
| Mobile responsive | 🔲 Not started | Planned after database integration |

---

## ✅ Progress Log

### Session 1 — Project Planning (Complete)
Defined full product vision, competitive positioning, 10 WhatsApp pain points, complete feature set, full tech stack, UI direction. Created README.md as project brain.

### Session 2 — App Name (Complete)
Name decided: **Bol** — means "speak" in Urdu. Tagline: "Just say it." Chosen after extensive brainstorming.

### Session 3 — Landing Page Figma (Complete)
Full Bol landing page designed in Figma. Light theme, split sections, teal accent. 9 sections. Figma: https://www.figma.com/design/3szBUvIeNspxaB0S9drfa0

### Session 4 — Auth Pages Planned (Complete)
Three auth screens planned. Decided to build directly in Next.js instead of Figma.

### Session 5 — Infrastructure & Cost (Complete)
Confirmed $0 budget approach. Firebase Phone Auth rejected — NOT free. Final auth: Google OAuth + Email Magic Link only.

### Session 6 — Main Chat UI Design (Complete)
Full main chat UI designed on V0.dev and approved. Design system locked: #B2C8C4 outer frame, rounded white container, #0a0a0a sidebar, dark sent bubbles, white received bubbles.

### Session 7 — App Icon (Complete)
Final icon locked: white chat bubble + lightning bolt on teal #0D9488 rounded square.

### Session 8 — Brand Color (Complete)
Final decision: Teal #0D9488 as primary brand color across everything.

### Session 9 — Design Phase Decision (Complete)
Stop designing, start building. Design system fully locked.

### Session 10 — V0.dev Context System (Complete)
V0.dev context prompt created for design consistency across multiple Gmail accounts.

### Session 11 — All Pages Mapped (Complete)
Full page list defined. Sidebar icons finalized: MessageSquare, Phone, Users, Sparkles, Clock, Settings, Profile.

### Session 12 — Feature Review (Complete)
All 19 planned features documented with free implementation approach. Total: $0/month.

### Session 13 — Auth System Final Lock (Complete)
Auth locked: Google OAuth + Email Magic Link + QR Code. SMS permanently removed.

### Session 14 — Contact Discovery (Complete)
Six-part contact discovery plan. Launch strategy: one university in Lahore first.

### Session 15 — Landing Page Built & Live (Complete)
Landing page live at https://bol-alpha.vercel.app/ — cinematic, Apple-level, fullscreen hero, troll section, AI showcase, privacy section.

### Session 16 — Sign In Page Built & Live (Complete)
Auth page live at https://bol-alpha.vercel.app/signin — dark left column, white right form, 3 tabs, Framer Motion throughout.

### Session 17 — Chat Page Complete (Complete)
Chat page built. Features: AI catch-up banner, AI summary card, voice note waveform + transcript, emoji reactions, custom right-click context menu (blocks browser default, Bol-unique options), empty state, close chat button. Sidebar icons finalized.

### Session 18 — All Sidebar Pages Complete (Complete)
All 6 sidebar pages built: Calls, Contacts, AI Hub, Scheduled Messages, Settings, Profile. Shared layout architecture created with route group `(main)` — sidebar never unmounts, AnimatePresence page transitions, shared rounded container. Each page uses same design language.

### Session 19 — Final Frontend Features Complete (Complete)
Three remaining frontend features built:
1. **Profile page** — edit profile, username availability check, bio, phone (optional), read-only email, Bol link card, danger zone (logout + delete account).
2. **Group chat UI** — sender name + unique colors above bubbles, thread preview pill, group info right panel (slides in from right, shrinks chat area), member list with roles, group settings with Bol-exclusive toggles (anonymous joining, encrypted).
3. **New Chat / New Group modal** — opens from compose icon, two tabs with layoutId animation, contact search, group creation with member selection chips, anonymous joining toggle, encrypted group toggle, disabled submit until valid.

### Session 20 — Database Storage Planning (Complete)
Supabase 500MB free tier sufficient for launch (all media on Cloudinary, text only in DB). AWS Activate program identified — gives $300 Supabase credits = 12 months Pro (8GB) free. Apply at launch. Neon.tech investigated and rejected — same 0.5GB limit, adds complexity with no benefit. Supabase handles everything in one place.

---

## 🚀 Current Status

**FRONTEND: 100% COMPLETE**

All pages built and working:
- ✅ Landing page
- ✅ Sign In / Auth
- ✅ Chat (1:1 + Group)
- ✅ Calls
- ✅ Contacts
- ✅ AI Features Hub
- ✅ Scheduled Messages
- ✅ Settings
- ✅ Profile
- ✅ New Chat / New Group Modal
- ✅ Custom right-click context menu
- ✅ Group info panel
- ✅ Empty states on all pages
- 🔲 Mobile responsive (after database phase)

**NEXT PHASE: Database Integration**

Order of work:
1. Apply to AWS Activate → get $300 Supabase credits
2. Create Supabase project
3. Set up database schema (users, profiles, chats, messages, contacts, reactions, scheduled_messages tables)
4. Connect Supabase Auth — Google OAuth + Email Magic Link
5. Connect Supabase Realtime — live messaging
6. Connect Cloudinary — media uploads
7. Wire up auth to /signin page
8. Wire up real messages to chat UI
9. Wire up real contacts to contacts page
10. Test first real message between two devices
11. Mobile responsive pass
12. Beta launch at one university in Lahore

**NOTE: No database or backend work has started yet. Entire codebase is frontend-only with mock data.**
