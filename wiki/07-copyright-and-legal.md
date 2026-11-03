# 07 — Copyright & Legal Notes

## Question: Can We Offer Fights on Copyrighted Books (e.g., *Say Nothing*, *Empire of Pain*, *Thinking, Fast and Slow*)?

Yes. Under US copyright law, an interactive questioning and testing platform is in a much stronger legal position than book summary apps (like Blinkist or ChatPDF).

---

## 1. The Idea / Fact vs. Expression Dichotomy (`17 U.S.C. § 102(b)`)

- Copyright **never** protects ideas, mental models, scientific theories, processes, or historical facts. It *only* protects the author's specific verbatim expression (their exact sentences and creative phrasing).
- **Examples:**
  - In Daniel Kahneman's *Thinking, Fast and Slow*: System 1 vs. System 2, anchoring, availability bias, prospect theory, and regression to the mean are uncopyrightable scientific ideas.
  - In Patrick Radden Keefe's *Say Nothing* or *Empire of Pain*: Who abducted Jean McConville, the strategic dilemmas inside the Provisional IRA, how Purdue Pharma marketed OxyContin's FDA label, and how the Sackler family structured payouts are **historical facts**. Keefe owns his prose; he does not own the history of Northern Ireland or the opioid crisis.

---

## 2. Market Complement vs. Market Substitute (The #1 Fair Use Factor)

- Why have **SparkNotes and CliffsNotes** legally sold chapter-by-chapter study guides and quizzes on copyrighted books for 50+ years without licenses from publishers? Because commentary, critique, and quizzing a reader on a book's ideas are permitted as long as they **do not reproduce substantial verbatim text** and **do not act as a substitute for buying the book**.
- Summary apps live in a legal gray zone because their pitch is often: *"Read our 5-minute summary instead of buying the book."*
- **Our platform is a market complement:** You come to fight *Say Nothing* or *Thinking, Fast and Slow* because you **care** about the book and want to retain its ideas. Everything on screen (the counterfactual scenarios, the "put yourself in the room" dilemmas, the flawed arguments, and the Socratic questions) is newly written diagnostic material, not copied pages from the book.

---

## 3. Technical Implementation for Books (Avoiding Spoilers & Hallucinations Without Storing Book Prose)

While parametric memory in frontier LLMs already knows popular books like *Thinking, Fast and Slow*, *Say Nothing*, and *Empire of Pain* well, relying purely on raw parametric memory has one UX flaw: **chapter boundary confusion** (if a user is only on Chapter 4, the model might accidentally ask a question about an event from Chapter 11).

We solve this cleanly without storing copyrighted prose:
1. **Structured Chapter Concept & Fact Maps:** For popular books on our shelf, each chapter node on the tree stores a short, factual list of the concepts, historical events, and characters introduced up to that chapter (similar to a Wikipedia plot/concept index).
2. **User-Pasted Notes for Niche Texts:** If a user is reading a niche book or paper and pastes their own notes or highlights into a private fight, that is private personal study use.
