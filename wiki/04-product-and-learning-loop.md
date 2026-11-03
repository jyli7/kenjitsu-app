# 04 — Product Experience & Learning Loop

## 1. The Fractal / 3D Tree of Knowledge (How Granularity and Difficulty Work)

Instead of a flat course catalog or a blank chat box, users can explore knowledge as a **zoomable 3D Tree of Knowledge** (or search directly for any topic):

- **Every node on the tree is a playable Fight, and every node can branch into deeper child nodes:**
  - **Zoomed out (Macro level):** Broad areas like *Machine Learning*, *Chinese History*, *Biology*, *Statistics*, *Physics*, or *Behavioral Economics*.
  - **Zoomed in (Mid level):** Clicking *Chinese Communist History* branches into *The Yan'an Period*, *The Great Leap Forward*, *The Cultural Revolution*, and *Deng's Reform and Opening Up*.
  - **Zoomed way in (Micro level):** Clicking *The Great Leap Forward* reveals specific sub-fights like *The 1959 Lushan Conference & Peng Dehuai's Letter* or *How Inflated Grain Yields & Procurement Quotas Caused Famine*.
- **Nodes light up as you conquer them:** Unexplored nodes are dim; nodes where you struggled glow amber; nodes you passed light up green/gold. Cross-domain bridges connect related ideas across branches (for example, linking *1958 inflated grain quotas* and *LLM reward hacking* both to *Goodhart's Law* in Economics).
- **Level of difficulty tracks naturally with where you are on the fractal of knowledge:**
  - How do we handle a topic like *"How do black holes work"* across a middle schooler, a college physics undergrad, and a PhD student?
  - At the **top-level node** (*Black Holes*), the fight tests core, accessible intuition without heavy math (gravity, escape velocity, what the event horizon is, and why light cannot escape).
  - As you **zoom deeper down the fractal**, the child nodes naturally require more advanced tools and rigor (*Orbital Mechanics & the Photon Sphere* → *General Relativity & the Schwarzschild Metric* → *Hawking Radiation & the Black Hole Information Paradox*).
  - Creators can also tag alternative fights at the same node with explicit level badges (e.g., *Intuition / No Math* vs. *Undergrad Physics*), each with its own percentile pool.

---

## 2. Inside a Subject: Focuses & Belts

In Bob's prototype ([kenjitsu.expt.sh](https://kenjitsu.expt.sh/)), each Subject is organized into **6 Focuses** (*The core idea* + 5 progressively deeper angles: mechanisms, edge cases, tradeoffs, common confusions, applications).

- Passing a Focus earns the next belt:
  > **White → Yellow → Orange → Green → Blue → Brown → Black**
- In the unified tree model, a Subject's 6 Focuses are simply its immediate child nodes on the tree.

---

## 3. How Teaching and Testing Fit Together (The *Backpropagation* Lesson)

### What went wrong with pure grading
When we tested the *Backpropagation* module on `kenjitsu.expt.sh`, Round 1 asked:
> *"Explain to a smart friend outside machine learning how backpropagation lets a neural network figure out how to adjust each of its many weights to reduce its error... why does passing information backward work, and why is it more efficient than checking each weight separately?"*

When Jimmy was rusty on how the chain rule applied and typed *"oh god i don't understand this well. i'm being really hand wavy. help!"*, the prototype acted like a cold exam grader: it gave a `0/10 (VAGUE)`, dumped a full paragraph answer key on the screen, and showed a button to `Continue to round 2 ->`.

That revealed two problems:
1. Getting slapped with a `0` when you are asking to learn feels discouraging.
2. Dumping a paragraph answer key on the screen forces the user **right back into passive reading**—they read the paragraph, nod along, and click Continue without ever reconstructing the explanation in their own words.

### How our Socratic Teaching Flow fixes this
We follow the **UWorld / Socratic principle**: *we never lecture you for the sake of lecturing, and reading never earns you progress—every bit of teaching exists to help you answer the question yourself.*

When a user is rusty or stuck on a round:
1. **"Give me a quick primer" / "Break this down" button right on the question card:**
   - Before or during any round, the user can click **Break this down** (or type *"help!"* in the answer box).
2. **Stepping-stone questions instead of an answer dump:**
   - Instead of ending the round and showing the final answer key, the app switches from Grader to Socratic Teacher. It gives a short 2-sentence intuition (e.g., comparing the chain rule to a chain of gears) and asks **1–2 smaller stepping-stone questions**:
     - *Stepping Stone 1:* "Suppose a network has 1 million weights. If we tested each weight one by one by nudging Weight #1 slightly and running the network forward to see if the error changed, how many forward passes would we need to check all 1 million weights?" *(User: 1 million.)*
     - *Stepping Stone 2:* "Right—1 million passes is way too slow. Now picture three gears: Gear A turns Gear B (2x), and Gear B turns Gear C (3x). If you already know Gear B's effect on the output (3x), how do you find Gear A's effect without re-running the rest of the machine?" *(User: Multiply Gear A's local effect on B by B's effect on C.)*
3. **Re-attempt the main question in your own words:**
   - Once the stepping stones click, the user answers the original Round 1 question in their own words.
4. **Verify in the Rematch and in Spaced Repetition:**
   - Because the user used stepping stones on Round 1, their score on Round 1 is capped, and **Round 5 (the Rematch)**—plus a spaced-repetition check a few days later—tests them on a fresh problem with the same underlying logic *without* hints, proving they actually learned it.

---

## 4. Personal Mastery Record, Spaced Repetition & Private Percentiles

To make the app feel like **Strava + Chess.com + Anki + TypeRacer** for your mind:
- **Your Record (Conquered Shelf):** Marking a book "Read" on Goodreads feels hollow because you forget 90% of it. Earning a Black Belt on a book or technical subject on our platform means you actually fought through it and proved you understand it.
- **Anki-Style Spaced Repetition:** Belts and conquered nodes slowly face "rematch due" reminders over days/weeks (especially on Focuses where you needed Socratic hints), so you retain what you learned over months and years.
- **Private Percentile Rankings:** We show you how your score and thinking time compare against everyone else who took that exact fight (*"You passed in 2m 15s — 92nd percentile"*). Keeping rankings **private to you by default** gives you the competitive motivation of TypeRacer without incentivizing people to cheat for public clout.
