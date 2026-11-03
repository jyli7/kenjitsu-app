# 01 — Vision, Mission & Pitch

*(Working title: **Kenjitsu** — also considering **Feynman** or **Socratic**)*

## Our Mission

**We want to be the best place to go when you want to learn something and actually remember it.**

Right now, when people want to learn a topic—whether it's how backpropagation works, distributed caching for an interview, Mao's China, LSAT logic, or a book like *Thinking, Fast and Slow*—they usually read an article, watch a video, go down a Wikipedia rabbit hole, or ask ChatGPT to explain it. As they read, their eyes glide over the page. It makes sense in the moment, so they nod along and think they understand it. Two weeks later, they have forgotten almost all of it.

Most AI learning tools today (NotebookLM, Blinkist, ChatPDF, summarizers) make this problem worse. By compressing a 300-page book or lecture into a 5-minute summary, they remove the mental effort that makes ideas stick. Meanwhile, students use ChatGPT to breeze through homework all semester, and then panic two days before an in-person exam when they realize they haven't actually learned the material.

---

## Intellectual Roots: Feynman & Somers' *Kenjitsu*

Two essays/traditions capture what real learning actually looks like:

1. **Richard Feynman on the illusion of competence:**
   - *"The first principle is that you must not fool yourself—and you are the easiest person to fool."*
   - *"What I cannot create, I do not understand."*
   - Feynman's father taught him the difference between knowing the **name** of a bird in six languages and knowing anything at all about the bird. Whenever Feynman wanted to learn a new field, he didn't passively read textbooks; he forced himself to explain the core mechanism in plain words without jargon, carry a concrete example in his head (*"I can't understand anything in general unless I'm carrying along in my mind a specific example and watching it go"*), and test where his understanding broke down.
2. **James Somers' *[Kenjitsu](https://jsomers.net/blog/kenjitsu)* (and Paul Halmos):**
   - Somers asks why people read whole books or articles and forget 90% of them two weeks later, and points to mathematician Paul Halmos's advice on how to read a math book:
     > *"Don't just read it; fight it! Ask your own questions, look for your own examples, discover your own proofs. Is the hypothesis necessary? Is the converse true? What happens in the classical special case? What about the degenerate cases?"*
   - Somers calls this **kenjitsu** (*ken* = one's range of knowledge, *jitsu* = fighting art)—interrogating what you read the way a programmer debugs unfamiliar code: running it with varied inputs, testing edge cases, and reading strictly "at the speed of understanding."

---

## The Two Core Insights Behind Our Product

### 1. The best way to learn and remember something is to get asked questions
Early on, we debated whether users should only come to us *after* they studied a topic somewhere else ("Learn offline first, then come to Kenjitsu to take an exam").

When we tested Bob's prototype on *Backpropagation*, we saw why that framing is too narrow:
- Almost nobody wakes up excited to take a cold exam, and even when you *think* you learned a topic before, you often blank on a key step (like how the chain rule makes working backward efficient) and want help learning it in the moment.
- Instead of telling users *"Go learn the topic somewhere else first, and only come to us when you're ready to be tested,"* **users come to us when they want to learn a topic from the start.**
- Learning and remembering is the goal; **getting asked questions** (and getting short primers and stepping-stone questions whenever you get stuck) is our method for teaching you.

### 2. LLMs have knowledge, but humans have taste when it comes to teaching and learning
AI has made *creating* raw lessons and questions cheap. An LLM knows every textbook fact about transformers, molecular biology, or Chinese history.

What an LLM lacks on its own is **taste**:
- Knowing which 20% of a subject actually matters in reality vs. which 80% is textbook filler.
- Knowing which specific analogy or stepping-stone question makes a counterintuitive idea click for a human.
- Knowing which subtle misconception fools smart people every time.
- Knowing when a question feels fun and illuminating to wrestle with versus tedious and pedantic.

Therefore, **we are building a platform and ecosystem, not an in-house content studio.** AI does the heavy lifting of drafting rounds and grading answers, while humans supply the taste—both as **creators** (who can steer, edit, or fork a lesson in 5 minutes instead of spending 40 hours filming a video course) and as **learners** (whose ratings and completion data filter out weak AI questions so the best lessons rise to the top).

---

## Product Name Candidates

We are currently weighing three names given our expanded mission:
- **Kenjitsu:** Distinctive, memorable, and matches the belts/rounds/fighting metaphor already live at [kenjitsu.expt.sh](https://kenjitsu.expt.sh/). Potential downside: "fighting" can sound purely like a tough test rather than a welcoming place to *learn* something new.
- **Feynman:** Instantly recognizable to ambitious learners, engineers, and scientists as shorthand for *"explain it simply without jargon until you truly understand how it works."*
- **Socratic:** Immediately communicates *"learn by getting asked questions,"* though the name has been used by earlier EdTech homework apps (e.g., Google's Socratic app).
