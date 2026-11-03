# Kenjitsu Wiki

This directory is the shared, version-controlled knowledge base for **Kenjitsu** (working title; also considering **Feynman** and **Socratic**).

Because this wiki lives inside the Git repository (`wiki/`), every idea, product decision, and architectural note has full version history (`git log -p wiki/`) so nothing is ever lost or overwritten when we refine our thinking.

---

## Pages in This Wiki

1. **[01 — Vision, Mission & Pitch](./01-vision-and-pitch.md)**
   - Why we exist: *"The best place to go when you want to learn something and actually remember it."*
   - Our two core insights: (1) The best way to learn is by getting asked questions, and (2) LLMs have knowledge, but humans have taste when it comes to teaching and learning.
2. **[02 — Target Users & Representative Domains](./02-users-and-use-cases.md)**
   - Who wants this most: Job interviewees, standardized test takers, high school/college students, and lifelong learners / Wikipedia rabbit-hole explorers.
   - Concrete fight examples across 7 distinct types of knowledge (ML, History/Mao's China, Biology, Statistics, Behavioral Economics, Law/LSAT, and Practical Books).
3. **[03 — Moat & Why Not Just Use ChatGPT/Claude?](./03-moat-and-vs-chatgpt.md)**
   - Our answer to Bob's question: what is the delta between our app and raw ChatGPT or Claude out of the box, and how does our moat compound over time?
4. **[04 — Product Experience & Learning Loop](./04-product-and-learning-loop.md)**
   - The zoomable 3D Fractal / Tree of Knowledge (where difficulty tracks naturally with depth on the tree).
   - How teaching and testing work together: the Socratic breakdown and primer flow when you get stuck (the *Backpropagation* lesson), plus Anki-style spaced repetition and private percentile rankings.
5. **[05 — Platform, Crowd Curation & Fight Building Blocks](./05-platform-crowd-and-curation.md)**
   - Why we are a **platform**, not a content studio.
   - Off-the-shelf vs. ad-hoc fights (generate once, reuse for everyone).
   - Freedom in creating fights (no forced boxes), forking/editing, automated LLM quality checks, and pruning the shelf via human ratings.
6. **[06 — Unit Economics, Pricing & Frontier Lab Data Deals](./06-economics-pricing-and-data-deals.md)**
   - Exact token math per fight (\$0.01–\$0.03 per reused fight), Free vs. Membership vs. Cram Pass, usage limits, and Bob's Mercor/Reddit angle for licensing post-training data and expert networks to frontier labs.
7. **[07 — Copyright & Legal Notes](./07-copyright-and-legal.md)**
   - Why questioning users on books like *Say Nothing*, *Empire of Pain*, or *Thinking, Fast and Slow* does not infringe copyright (`17 U.S.C. § 102(b)` and Fair Use).
8. **[08 — Open Questions & Decision Log](./08-open-questions-and-changelog.md)**
   - Active questions for Jimmy and Bob to sort out, plus a chronological log of major product decisions so we never forget earlier ideas.

---

## How to Collaborate & Leave Comments

1. **Line-by-Line Comments on GitHub (PRs or Commits):**
   - When changes are pushed to a branch or commit on `github.com/TheBuilderJR/kenjitsu`, either of us can click any line in the GitHub file diff and leave a threaded comment (just like Google Docs comments, anchored to the exact sentence).
2. **Inline Callout Notes in Markdown:**
   - Anytime you or Bob want to drop a quick question or reaction right inside a wiki page, add a blockquote callout like:
     > **[Jimmy]:** Should Round 1 start with a 30-second primer option by default?
     > **[Bob]:** Easy to add—we can pass `brief` if requested.
3. **HackMD / Obsidian GitHub Sync (Optional):**
   - Because these are standard Markdown files in a GitHub repo, you can connect [HackMD](https://hackmd.io) directly to the `TheBuilderJR/kenjitsu` repo if you ever want simultaneous Google-Docs-style margin comments that automatically commit back to `wiki/`.
