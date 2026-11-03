# 02 — Target Users & Representative Domains

## Who Wants This Most?

Anyone who wants to learn a topic and keep it in their head long-term can use our platform. Across the market, four groups stand out:

### 1. Job Interviewees (SWE, System Design, AI/ML, Quant, Finance, Consulting)
- **Why they care:** Lots of money and career trajectory are on the line in a 2–4 week window.
- **Why existing tools fail them:** Because anyone can memorize standard coding or system design templates with AI now, interviewers increasingly test candidates by changing constraints and probing edge cases. Reading a system design guide passively creates an illusion of competence that falls apart the moment an interviewer asks *"What breaks if one key gets 100x the traffic?"*
- **Willingness to pay:** Very high out-of-pocket spend (\$30–\$100+ for short-term interview passes).

### 2. Standardized Test Takers (LSAT, MCAT, GMAT, Bar, AP Exams)
- **Why they care:** High-stakes exams with an objective score and a ticking clock.
- **Why existing tools fail them:** When students miss a practice problem on UWorld or 7Sage, they usually read the written answer explanation, nod along (*"Oh yeah, that makes sense"*), and move on—then fall for the exact same logical trap three days later. Reading an answer key is still passive reading. They need to be walked through the flaw with questions and tested on a fresh problem with the same underlying logic.

### 3. High School and College Students
- **Why they care:** Students use ChatGPT and Claude to breeze through homework all semester, getting 100% on problem sets without actually internalizing the material. Then, 48 hours before a closed-book, in-person midterm or AP exam, panic sets in.
- **Built-in sharing loop:** If one student generates or curates a great set of fights for *Organic Chemistry Midterm 2* or *Econ 101* and drops the link in the class Discord/GroupMe, classmates adopt it immediately.

### 4. Lifelong Learners, Wikipedia Rabbit-Hole Explorers, Engineers & Readers
- **Why they care:** Curious people who love going down Wikipedia rabbit holes (on history, biology, economics, statistics, physics, or machine learning) or reading serious non-fiction books (*Thinking, Fast and Slow*, *Say Nothing*, *Empire of Pain*, *The Power Broker*).
- **Why existing tools fail them:** You can spend two hours clicking links on Wikipedia or twenty hours reading a history book and retain almost none of it a month later. Our platform turns curiosity and rabbit-hole browsing into a visual **tree of knowledge** where nodes light up as you master them and spaced repetition keeps them in your memory.

---

## Representative Domains & Test Units

To make sure our platform works across **all** kinds of knowledge—not just computer science—we mapped out concrete fight units across 7 different areas:

### 1. Machine Learning & Systems
- **Backpropagation & the Chain Rule:** Why working backward reuses intermediate sensitivities in one pass instead of running a separate forward pass for each of a million weights.
- **Transformer Mechanics:** Why $Q, K, V$ are separate projections, why unmasked positionless self-attention is permutation-equivariant, why $\sqrt{d_k}$ prevents softmax gradients from vanishing, and why batch-1 decoding is bottlenecked by memory bandwidth rather than FLOPs.
- **Post-Training LLMs (RLHF / PPO vs. DPO vs. GRPO):** What the KL penalty prevents, how DPO turns reward modeling + RL into a direct loss on preference pairs, and how GRPO replaces the value network with group sampling.
- **Residual Streams & Pre-LN vs. Post-LN Transformers:** How Pre-LN keeps a clean identity path for gradients from the loss back to layer 1.

### 2. History, Biography & Investigative Non-Fiction
- **Mao's China — The Great Leap Forward & Lushan (1958–1961):** How local cadres competing to report inflated grain yields triggered excessive state procurement quotas, and why Peng Dehuai's private letter at the 1959 Lushan Conference caused Mao to double down rather than reverse course.
- **Deng Xiaoping's Dual-Track Price Reform:** How letting farmers and factories sell above-quota output at market prices created market incentives at the margin without causing immediate political collapse.
- **Patrick Radden Keefe's *Empire of Pain* / *Say Nothing*:** How Purdue Pharma used the FDA's "delayed absorption" label claim to market OxyContin, or the internal strategic dilemmas of the Provisional IRA during The Troubles.
- **What History reveals about Fight design:** In history, asking for "a formula in plain words" feels unnatural. Great history fights test **incentives, constraints, counterfactuals, and putting yourself in the room** (*"Why did Actor A have no choice but to do X?"*).

### 3. Behavioral Economics
- **Prospect Theory vs. Expected Utility (Kahneman & Tversky):** Reference dependence, loss aversion, and why people are risk-averse in gains (preferring a sure \$500 over a 50% shot at \$1,000) but risk-seeking in losses (preferring a 50% shot at losing \$1,000 over a sure \$500 loss).
- **Goodhart's Law & Perverse Incentives:** Why turning a diagnostic measure into a rewarded target causes agents to optimize the proxy and break the system (connecting the 1902 Hanoi rat bounty, 1958 grain quotas, and LLM reward hacking).

### 4. Molecular & Evolutionary Biology
- **The *lac* Operon as a Logic Gate:** How *E. coli* combines a negative repressor (lifted by allolactose) and a positive activator (CAP-cAMP when glucose is low) to build an `AND NOT` gate, and predicting what breaks under specific mutations ($I^-$, $O^c$).
- **Hamilton's Rule ($rB > C$) & Gene-Centered Evolution:** Why natural selection acts on allele copies rather than "the good of the species."

### 5. Statistics & Causal Inference
- **$p$-Values, Base Rates & Multiple Testing:** Why $p = 0.03$ does *not* mean a 3% chance the null hypothesis is true, and how testing 20 hypotheses or peeking at data inflates false positives.
- **Collider Bias (Berkson's Paradox) vs. Confounding:** Why conditioning on a common *effect* of two independent causes creates a fake correlation between them (e.g., why talent and attractiveness appear negatively correlated among famous actors).
- **Simpson's Paradox:** How a treatment can have a higher recovery rate in men and a higher recovery rate in women, yet a lower recovery rate overall.

### 6. Law & Logical Reasoning
- **1L Torts (*Palsgraf v. Long Island Railroad*):** Cardozo's foreseeable-zone-of-danger rule vs. Andrews' direct-consequences dissent, tested by mutating the facts on the station platform.
- **LSAT Logical Reasoning:** Spotting necessary vs. sufficient confusions, causal flaws, and base-rate neglect in short arguments.

### 7. Practical Frameworks ("How-To" Books)
- **Rob Fitzpatrick's *The Mom Test*:** Spotting leading questions in customer discovery interview transcripts where a founder accidentally fishes for compliments, and rewriting them to ask about past behavior.
