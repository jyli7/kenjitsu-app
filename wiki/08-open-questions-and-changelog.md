# 08 — Open Questions & Decision Log

## Active Open Questions to Sort Out

1. **Product Name:**
   - Do we stick with **Kenjitsu**, or switch to **Feynman** or **Socratic** (or something else) now that our mission is framed more broadly as *"the best place to go to learn and remember, by getting asked questions"*?
2. **Designing the Socratic "Break This Down / Primer" Flow in `kenjitsu.expt.sh`:**
   - When a user clicks **"Give me a quick primer"** or **"Break this down"** on Round 1 (like on the *Backpropagation* chain rule question), how many stepping-stone questions should the examiner ask before bringing them back to answer the main round question? (Probably 1–2 short stepping stones + a 2-sentence intuition?)
   - How should using a primer/breakdown affect the round's score cap (e.g., capping the round at `7/10` or `8/10`, while still letting the user pass the Focus if they win the unassisted Round 5 Rematch)?
3. **Calibrating Difficulty Across the Fractal of Knowledge (e.g., *"How do black holes work"*):**
   - As users zoom deeper down the tree of knowledge, difficulty naturally increases. Should we also let users pick a starting level when they search a top-level topic (e.g., *Everyday Intuition* vs. *Undergrad / Technical* vs. *Advanced / Grad*), or show those as sibling nodes right at the top of the subject?
4. **The Fight Creation & Forking UI:**
   - What does the simplest possible screen look like for a user or domain expert who wants to create a new fight without forced boxes, or edit/fork Round 3 of an existing fight?
5. **Showcasing Interactive UI Mechanics in the Demo:**
   - Beyond text answers and Round 3's clickable step exhibit, which 1–2 additional interactive mechanics should we build into the prototype next (e.g., live crutch-word/jargon highlighting while typing, interactive diagram/code-line clicking, or rapid-fire multi-turn scenario rounds)?
6. **Initial Beachhead for Launch:**
   - When we share this publicly, which cluster of the knowledge tree do we seed the deepest first to get immediate word-of-mouth traction? (e.g., *ML / AI / Systems Engineering* + *Behavioral Econ / Statistics* + *Great Non-Fiction Books*?)

---

## Chronological Decision & Idea Log

*(We append to this log whenever our thinking evolves, so we never overwrite or forget earlier ideas.)*

- **2026-11-01 — Initial Exploration & Filter:**
  - Established structural filter for Jimmy (Google AI Researcher in post-training/evals/RL + Yale Law JD) and Bob (Meta SWE): self-serve D2C/prosumer, no enterprise sales cycle, no regulatory gatekeepers, and a product where better evals/verification directly make the experience 10x better.
- **2026-11-01 — Landing on *Kenjitsu* ("RL Environments for Humans"):**
  - Anchored around James Somers' essay *[Kenjitsu](https://jsomers.net/blog/kenjitsu)* (*"Don't just read it; fight it!"*). Identified the core problem with current AI reading/learning tools (NotebookLM, Blinkist, summarizers): they remove friction, which leads to zero retention and an illusion of competence.
- **2026-11-01 — Private Percentile Rankings & Personal Mastery Shelf:**
  - Inspired by TypeRacer, competitive quizzing, Strava, and Anki: users get a personal record of topics/books they have actually conquered, plus **private-by-default percentile rankings** (giving users competitive motivation without encouraging cheating on public leaderboards).
- **2026-11-01 — Communication Style Rule (`GEMINI.md`):**
  - Established workspace rule: write in plain, direct sentences with active verbs; never use compressed buzzword noun phrases (like "The AI Paradox" or "purpose-built fight interface").
- **2026-11-02 — Bob's Live Prototype (`kenjitsu.expt.sh`):**
  - Bob built and deployed the full v0 prototype at `https://kenjitsu.expt.sh` (`TheBuilderJR/kenjitsu`), implementing Subjects, 6 Focuses, Belts (White to Black), 5 rounds (`Explain`, `Perturb`, `Flaw`, `Apply`, `Rematch`), in-round pushback, thinking-time tracking, and private percentiles.
- **2026-11-02 — Answering Bob's Question on the Delta vs. ChatGPT/Claude & Moat:**
  - Defined the 6-part delta over raw chatbots (dropping the weak claim that LLMs are too sycophantic to recognize wrong answers): (1) Human taste in lesson creation & rating filtering, (2) Visible map & finish line vs. wandering chat, (3) Active testing interface vs. essay chat box, (4) Reused/cached fights, (5) Percentile calibration across users, and (6) Long-term spaced repetition (like Anki).
- **2026-11-02 — The 3D Zoomable Tree of Knowledge:**
  - Built interactive prototype (`kenjitsu_knowledge_tree.html`) showing how subjects and focuses form a zoomable fractal/tree of knowledge where nodes light up as you conquer them and difficulty tracks with depth on the tree.
- **2026-11-02 — Major Reframe After Testing *Backpropagation* ("The Best Place to Learn and Remember"):**
  - When testing *Backpropagation*, blanking on the chain rule in Round 1 resulted in a cold `0/10` and a dumped paragraph answer key (which pushes the user back into passive reading).
  - Reframed the mission from *"Learn elsewhere first, come here to be tested"* to **"We are the best place to go to learn and remember—and the best way to learn something is to get asked questions."** Added the in-round **Primer / Socratic Stepping-Stones** design.
- **2026-11-02 — Platform Thesis ("LLMs Have Knowledge; Humans Have Taste"):**
  - Decided to build a **platform and crowd ecosystem**, not an in-house content studio. AI makes creating raw lessons cheap; humans supply the taste (by creating, editing, and forking fights without forced boxes, and by filtering fights through completion rates and ratings).
  - Established that public topics are generated once, saved to the shelf, and reused across users (cutting compute cost to \$0.01–\$0.03/fight, making loading instant, and enabling fair percentiles).
- **2026-11-02 — Unit Economics & Frontier Lab Data Angle (Mercor/Reddit):**
  - Calculated unit costs (\$0.01–\$0.03 per reused fight; ~85% gross margin on a \$20/mo membership because human thinking time is the bottleneck).
  - Documented Bob's Mercor/Reddit data insight: our platform naturally generates closed-loop Socratic teaching traces, human expert diffs on domain rubrics/flaws, graded human answers across the skill curve for reward models, and a vetted network of 99th-percentile domain experts.
