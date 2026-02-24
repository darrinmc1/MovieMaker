# Editor App - Next Steps & Recommendations

## 🎯 Current Status
- **Improvements 1-2: COMPLETE** ✅ (Sidebar nav + review tabs)
- **Code committed to git** ✅
- **Improvements 3-8: QUEUED**

---

## 🚀 Quick Wins (Do These First - 1-2 Hours Each)

### Priority 1: Fix Suggestion Approval UX ⭐⭐⭐
**Time: ~1 hour | Impact: HIGH**

Right now the suggestion approval is confusing. Let's simplify it.

**Change:**
```tsx
// Before: 3 buttons (APPROVE, REJECT, SKIP) + hidden "REVISE" mode
<button>APPROVE</button>
<button>REJECT</button>
<button>SKIP</button>

// After: 2 clear buttons
<button>✓ APPROVE</button>
<button>✗ REJECT</button>
// Optional: Small "Request Changes" link if they want to edit
```

**What to change:**
- In `app/act/[id]/page.tsx`, simplify the suggestion approval buttons
- Remove the `'revise'` state from `suggestion.status`
- Add a small textarea that appears on hover (for notes)
- Show badge above each suggestion showing current status

### Priority 2: Add Save/Auto-Save ⭐⭐⭐
**Time: ~1 hour | Impact: CRITICAL**

Currently if you refresh the page, all your review work is lost!

**What to do:**
- Save draft review to `localStorage` every 10 seconds
- Show "Auto-saved" indicator in bottom right
- On page load, check localStorage and ask: "Resume previous review?" 
- Add "Discard Draft" button

**Code snippet:**
```tsx
// Add to act/[id]/page.tsx
useEffect(() => {
  const timer = setInterval(() => {
    localStorage.setItem(`draft_${id}`, JSON.stringify({
      reviews, summary, approvedCuts, step
    }))
  }, 10000)
  return () => clearInterval(timer)
}, [reviews, summary, approvedCuts, step, id])
```

### Priority 3: Add Progress Meter ⭐⭐
**Time: ~30 min | Impact: MEDIUM**

Show at top of review: "3 of 8 suggestions reviewed"

**What to add:**
```tsx
const approvedCount = reviews[0]?.suggestions.filter(s => s.status === 'approved').length || 0
const totalCount = reviews[0]?.suggestions.length || 0
<div className="text-xs text-zinc-400">
  {approvedCount} / {totalCount} suggestions reviewed
</div>
```

---

## 🛠️ Medium-Lift Improvements (2-4 Hours Each)

### #3: Wire Up Gemini API ⭐⭐⭐
**Time: 2-3 hours | Impact: CRITICAL**

Right now `/api/review` is a stub. Let's make it actually call Gemini.

**Files to update:**
1. `app/api/review/route.ts` - Call Gemini API with act text
2. `lib/prompts.ts` - Refine the prompt structure
3. `.env.local` - Add `GOOGLE_API_KEY`

**Prompt structure:**
```
You are a ${persona} (developmental_editor|line_editor|beta_reader)
reviewing a chapter from a fantasy novel.

CHAPTER TEXT:
[insert act.text here]

CHARACTER CONTEXT:
[insert relevant characters]

BOOK OUTLINE:
[insert book outline]

TASK: Analyze and provide:
1. Intent Alignment - Did the chapter achieve its narrative purpose?
2. Editorial Findings - 3-5 key issues to address
3. Proposed Revisions - 2-3 specific text suggestions
4. Continuity Check - Any character/timeline issues?
5. Reader Promises - What expectations are set?

Format as JSON with this structure:
{
  "intentAlignment": { "achieved": bool, "feedback": string },
  "findings": [string, ...],
  "suggestions": [{original, replacement, reason, suggestionId}],
  "continuityErrors": [{message, characterId}],
  ...
}
```

### #4: Database Integration (Supabase) ⭐⭐
**Time: 2-4 hours | Impact: HIGH**

Currently everything is JSON files. We need a real database.

**Why:**
- Persist user uploads
- Support multiple projects
- Enable undo/version history
- Multi-user support later

**Steps:**
1. Sign up for Supabase (free tier is fine)
2. Create tables:
   - `projects` (id, user_id, title, created_at)
   - `books` (id, project_id, title, order)
   - `acts` (id, book_id, title, text, created_at, updated_at)
   - `characters` (id, project_id, name, core_want, core_flaw, state)
   - `reviews` (id, act_id, persona, findings, suggestions, created_at)
3. Replace JSON file reads with Supabase queries
4. Update upload endpoint to parse & save to DB

**Free tier includes:**
- 500 MB database
- Unlimited rows
- 2 projects

---

## 🎨 Polish Improvements (1-2 Hours Each)

### Add Breadcrumbs
Show: `Library > Book 1 > Chapter 1` at top of review page

### Add Keyboard Shortcuts
- `A` = Approve current suggestion
- `R` = Reject current suggestion
- `Tab` = Next suggestion
- `Shift+Tab` = Previous suggestion
- `S` = Save

### Add Word Count & Reading Time
On each act card: "2,450 words | ~8 min read"

### Add Visual Status Badges
On library view:
- 🔴 Needs Review
- 🟡 In Progress
- 🟢 Reviewed
- ✅ Approved for Publishing

---

## 📊 Recommended Priority Order

```
WEEK 1:
✅ [DONE] #1 - Homepage redesign
✅ [DONE] #2 - Review tabs
⏳ [TODO] Approve/Reject UX fix (1h)
⏳ [TODO] Auto-save to localStorage (1h)
⏳ [TODO] Progress meter (30min)

WEEK 2:
🔧 [TODO] Wire up Gemini API (2-3h)
🔧 [TODO] Database migration (2-4h)
🎨 [TODO] Polish: Breadcrumbs, shortcuts, badges (1-2h each)

WEEK 3:
🚀 [TODO] Uploader: Parse .docx properly (1-2h)
🚀 [TODO] Export to Word/PDF (2-3h)
```

---

## 💡 Feature Ideas (Post-MVP)

- **Collaboration Mode**: Multiple editors commenting on the same act
- **AI Writing Suggestions**: "This sentence is passive. Try: [suggestion]"
- **Reading Level Detection**: Warns if chapter is too simple/complex
- **Consistency Checker**: Flags character inconsistencies across chapters
- **Pacing Analyzer**: Warns if chapters are too short/long
- **Theme Tracker**: Shows which themes appear in each chapter
- **Publishing Pipeline**: Integrate with Amazon KDP, Smashwords, Draft2Digital

---

## 🚧 Known Issues

1. **node_modules permission error** on VirtualBox shared folder
   - Fix: Run `npm install` on host machine instead of VM
   - Or: Copy project to native Linux directory first

2. **ESLint config broken** 
   - Workaround: Skip linting for now (`npm run build` works fine)
   - Fix: Run `npm install` fresh

3. **No real API responses**
   - Currently `/api/review` returns stub data
   - Need to wire up Gemini API

---

## 📞 Questions to Clarify

1. **Multi-project support?** Should one user manage multiple books?
   - If yes: Need dashboard showing all books
   - If no: Keep it simple, one book per session

2. **Collaboration?** Will multiple editors work on same book?
   - If yes: Need user auth, permissions, conflict resolution
   - If no: Single-user is fine for now

3. **Publishing?** Should app export to Amazon/ereaders?
   - If yes: Need ebook formatting, ISBN integration
   - If no: Just internal editing tool

4. **Budget?** Any costs for hosting/databases?
   - Supabase free tier is fine for early stage
   - Can upgrade later as it grows

---

## 🎓 Learning Resources

If you want to implement these improvements yourself:

- **Nextjs Routes**: https://nextjs.org/docs/app/building-your-application/routing
- **Gemini API**: https://ai.google.dev/docs
- **Supabase**: https://supabase.com/docs
- **Tailwind**: https://tailwindcss.com/docs
- **React Hooks**: https://react.dev/reference/react

---

**Ready to tackle #3 (Approval UX)?** That's the highest ROI win. Should take ~1 hour and immediately improves usability.
