# 05 — Platform, Crowd Curation & Fight Building Blocks

## 1. Platform, Not a Content Producer

If we try to be an in-house content studio (like Brilliant.org, Khan Academy, or MasterClass), we can only ever cover a tiny fraction of what people want to learn, and our growth is bottlenecked by how fast we can write lessons ourselves.

Instead, **we are a platform and ecosystem where the crowd and domain experts create, fork, and curate the best lessons.**

### Why this works now (when Udemy and traditional marketplaces struggled)
- The people who actually know the sharpest mental models and trick questions in any field—a staff engineer at Meta, a 99th-percentile LSAT tutor, a cardiology fellow, or a historian—almost never make Udemy courses because filming and editing 10 hours of video takes 40+ hours of tedious production work.
- On our platform, **AI drops the cost of creating a lesson from 40 hours to 5 minutes.**
- The LLM already has the textbook knowledge and does the heavy work of drafting questions and grading answers. The human creator only has to supply their **taste**: *"Here are the 3 misconceptions everyone falls for on this topic, and here is the scenario that separates people who get it from people who don't."*

---

## 2. Off-the-Shelf vs. Ad-Hoc Fights (Reusing Fights by Default)

We don't separate "browse the catalog" and "type any topic" into two different apps—they happen through **one unified search and input bar**, with a clean rule separating public topics from private notes:

### Case A: Public Topics (Generate Once → Save to the Shelf → Reuse for Everyone)
When a user types a general topic (e.g., `"The Great Leap Forward"`, `"Collider bias"`, or `"How Transformers Work"`):
1. **Search checks the shelf first:** If a vetted fight already exists on the tree/shelf, we show it immediately.
2. **If it doesn't exist yet, an ad-hoc fight becomes the v1 off-the-shelf fight:** If nobody has ever asked for `"Collider bias"` before, our system generates the Focus Map and Rounds 1–4 on the fly—**and saves them to the shared database as the v1 fight on the shelf.**
3. **Why reusing Rounds 1–4 across users is a 4x win:**
   - **Zero wait time:** User #2 through User #10,000 get Rounds 1–4 in `0ms`.
   - **Half the compute cost:** We pay \$0 to generate Rounds 1–4 for every subsequent user, and only pay to grade their answers and generate Round 5 (their custom rematch).
   - **Fair percentile rankings:** Everyone who plays that fight answers the exact same Rounds 1–4, making the percentile curve accurate from User #2 onward.
   - **Continuous quality improvement:** When hundreds of people play the same saved fight, we can see if Round 3 is confusing and fix or replace just Round 3.

### Case B: Private Notes & Uploads (True Ad-Hoc for You or Your Class)
When a user pastes their own private lecture notes, syllabus, or internal company doc:
- The generated fight stays private to them (with a shareable link they can drop in their class Discord or study group so classmates can run the same fight).
- Because private uploads require fresh generation and aren't reused across the whole public platform, unlimited private uploads are a natural **Pro Membership** feature.

---

## 3. Freedom in Creating a Fight: No Forced Boxes

Bob's current 5-round structure (`1. Explain it simply → 2. What if it changes? → 3. Find the flaw → 4. New case → 5. Rematch`) is a great **default recipe** when generating a fight with no special instructions.

**However, creators are not locked into that fixed box.** Different subjects and teaching styles call for different moves:
- A fight on *The Great Leap Forward* might walk through 5 chronological historical dilemmas and incentive traps.
- A fight on *The Mom Test* might show 5 customer interview transcripts in a row and ask you to spot the leading question in each one.
- A fight on *Backpropagation* might start with 2 quick intuition-building warmup questions before asking for the full explanation.

### What is the minimum building block of a Fight?
To work in our interface (with a progress bar, Socratic help when stuck, grading, and percentile rankings), a Fight only needs to be **a sequence of N rounds (e.g., 3 to 7 rounds)** where each round has:
1. **The Prompt / Setup:** Whatever question, scenario, quote, code snippet, or multi-step clickable exhibit the creator (or LLM) wants to present.
2. **The Grading & Socratic Teaching Guide:** What a strong answer must cover, what common traps or buzzwords to watch for, and what stepping-stone questions to ask if the learner gets stuck.

When creating or editing a fight, **"anything goes"**: a creator can use our default 5-round recipe, describe in plain English how they want the LLM to structure the rounds, or edit any round directly by hand.

---

## 4. How Public Fights Get Better: Editing, Forking, and Pruning the Shelf

How do we let anyone create, edit, or fork a fight on *The Great Leap Forward* without turning public search results into a cluttered mess of 30 mediocre versions?

We combine **two ways to edit**, **an automated LLM gatekeeper**, and **human survival-of-the-fittest pruning**:

1. **In-Place Fixes vs. Forks:**
   - **Suggest a fix (Wikipedia-style):** If someone spots a poorly worded question in Round 3 and rewrites it (or asks the LLM to sharpen it), an LLM judge compares the old Round 3 and the new Round 3. If the new one is clearer and factually sound, it upgrades the fight in place.
   - **Fork into a new fight:** If someone wants to take a distinct angle or structure (e.g., a deeper fight specifically on *1958–1961 Grain Procurement & Famine Demography*), they save it as a fork.
2. **Automated LLM Quality Check (Before Reaching the Public Shelf):**
   - Before any newly created or forked fight is indexed in public search, an automated LLM check verifies:
     - **Coherence & factual accuracy:** Are the questions answerable, is there an unambiguous right answer, and is the grading guide factually accurate?
     - **Deduplication:** Is this 90% identical to the existing fight on the shelf? If so, keep it as a private shareable link rather than cluttering public search.
3. **Human Ratings & Completion Pruning:**
   - Staying on the public shelf depends on real user behavior: completion rates (do people finish all rounds or abandon Round 2?), thumbs-up/star ratings at the end, and whether users who take the Socratic hints pass the Rematch.
   - Fights with high drop-off or poor ratings are automatically pruned from public search, and if a fork consistently outperforms the original fight, the fork gets promoted to become the main node on the knowledge tree.
