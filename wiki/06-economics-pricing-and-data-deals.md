# 06 — Unit Economics, Pricing & Frontier Lab Data Deals

## 1. Unit Economics & Compute Costs per Fight

Looking at Bob's implementation in [`app.py`](https://github.com/TheBuilderJR/kenjitsu/blob/main/app.py) and [`providers.py`](https://github.com/TheBuilderJR/kenjitsu/blob/main/providers.py):

### How many tokens does one 5-round Fight use?
- A full 5-round fight makes **4 to 5 question-generation calls** and **5 to 7 grading/hint calls**.
- Each call sends roughly `1,500–2,500` input tokens and generates `250–450` output tokens (with `effort='low'` enabled on routine calls so the model doesn't burn thousands of hidden reasoning tokens).
- **Total tokens per 5-round Fight (when generated from scratch):** ~`18,000` input tokens and ~`3,000` output tokens.
- **Cost per Fight:**
  - **Generated from scratch (User #1):** **$0.02 to $0.06** using fast frontier models (Claude Sonnet, GPT-5 mini, or Gemini Flash).
  - **Reused from the shelf (User #2 through User #10,000):** Because Rounds 1–4 are already written and cached for off-the-shelf fights, we pay **$0** to generate Rounds 1–4 and only pay to grade the user's 5 answers and generate Round 5 (the custom rematch). That cuts our compute cost to **$0.01 to $0.03 per fight**.

### Why our margins are much healthier than coding agents or chat wrappers
- In coding tools (like Cursor or Claude Code), a single prompt triggers an autonomous loop that reads 20 files and burns $0.50–$2.00 in 30 seconds while the user sits back and watches.
- In our app, **the human's brain is the bottleneck**: a single 5-round fight takes a human **5 to 10 minutes of active thinking and typing**, and costs us **1 to 3 cents**.
- Even a heavy user who plays **3 full fights every single day** (90 fights/month, ~12 hours of intense mental effort) only costs us **~$1.80 to $2.70/month** in API fees. On a **$20/month** subscription, that is an **85%+ gross margin**.

---

## 2. Consumer & Prosumer Pricing Models

Because we serve both **lifelong learners** (who explore the knowledge tree year-round) and **urgent crammers** (who have an interview or exam in 2 weeks), we combine recurring membership with one-time passes:

1. **Free Tier (The Acquisition Hook):**
   - **2–3 free fights per day** on public off-the-shelf modules.
   - Lets any visitor click a shared link, light up a node on the tree, see their private percentile ranking, and get hooked—while costing us less than 5 cents per active free day.
2. **Pro Membership ($15–$20/month or $120/year) — For Lifelong Learners & Regular Students:**
   - Unlimited fights across the whole knowledge tree, unlimited Socratic breakdowns when stuck, Anki-style spaced repetition scheduling, and custom fight generation from private notes/PDFs.
3. **One-Time "Cram Pass" ($29–$39 for 14 or 30 days, no auto-renew) — For Interviewees & Exam Takers:**
   - Candidates prepping for a Meta/Google interview or students facing finals often hate recurring subscriptions, but will happily pay $35 once for 2–4 weeks of unlimited access before their big day (similar to UWorld and 7Sage passes).
4. **Creator Marketplace (Later):**
   - Top domain experts and tutors can sell specialized packs of fights or earn a share of subscription revenue based on how many paying users run their fights.

### Usage Guardrails Behind the Scenes
1. **Hourly velocity cap (`CALLS_PER_HOUR` per user/IP, already built in `spend_call()` in `app.py`):** Since a real human takes at least 3–5 minutes per fight, capping hourly API calls blocks bots and script abuse without a real learner ever hitting the limit.
2. **Model routing:** Use fast `effort='low'` calls for grading and Socratic hints; reserve deeper reasoning calls only for generating and verifying new "Find the Flaw" exhibits once when a module is created.
3. **Separate cap on private PDF/notes uploads:** Reusing public fights is dirt cheap; generating brand-new fights from large private uploads is gated to Pro users.

---

## 3. The Frontier Lab / Mercor / Reddit Data & Expert Angle

Bob noted in the proposal doc:
> *"If this works out, you could also imagine a Reddit/Mercor-like deal with the frontier labs (`https://www.mercor.com/data/`)."*

Why would frontier labs (Google DeepMind, OpenAI, Anthropic, Meta) pay for our data or expert network if an LLM generates the initial draft of a fight?

Labs don't want raw LLM outputs—they want **the human taste, human corrections, and closed-loop learning outcomes** that LLMs cannot generate synthetically:

### 1. Closed-Loop Traces of What Actually Helps a Human Learn (Unique to Us)
- When labs try to train a "Tutor Mode" or Socratic reasoning behavior today, they rely on synthetic dialogues or single-turn user thumbs-up (which rewards flattery and handing out answers).
- Whenever a user gets stuck on our platform (like on *Backpropagation*), asks for a Socratic breakdown, answers the stepping-stone questions, and then takes **Round 5 (the Rematch)** and a **spaced-repetition check 3 days later** *without hints*, we record the full closed-loop trace:
  `Initial Human Misconception → Socratic Question Sequence → Verified Human Transfer on Follow-Up Test`.
- That provides a ground-truth reward signal for training models on human pedagogy and collaborative reasoning.

### 2. Expert Edits & Empirical Filtering of Reasoning Problems (What Labs Pay Mercor $150/hr For)
- Labs pay contractors at Mercor, Scale, and Surge $100–$200/hr to write hard domain questions, "find the flaw" exhibits, and grading rubrics.
- On our platform:
  - **Expert diffs:** When a domain expert edits or forks an AI-generated round because the AI's question was trivial or its rubric missed the real mechanism, we capture `(What the frontier model drafted) → (How a domain expert fixed it)`.
  - **Empirical validation across hundreds of runs:** When 500 humans play Round 3 (*Find the flaw*), if 90% of top-scoring users disagree with the model's answer key, our platform catches where the model had a hallucinated flaw or broken assumption.

### 3. Training Better "Rubric Judges" (Reward Models for Non-Code RL)
- Outside of math and code (where you have unit tests), the hardest problem in RL post-training is training **LLM-as-a-judge reward models** that grade open-ended explanations against a rubric accurately.
- Every popular fight on our platform collects hundreds of real human answers across the full 0–10 skill curve (from novice hand-waving to 99th-percentile crisp explanations), paired with creator-refined rubrics and human grade disputes.

### 4. A Pre-Vetted Network of Top 1% Domain Experts
- Mercor spends heavily on ads and AI screening interviews just to find out who actually knows CUDA kernels, M&A accounting, 1L Torts, or molecular biology.
- On our platform, users voluntarily prove (a) **who is in the 99th percentile of understanding a niche subject** (by conquering deep nodes on the knowledge tree under a clock) and (b) **who has the sharpest taste in writing rubrics and trick questions** (the creators whose fights earn 4.9★ ratings from learners).
