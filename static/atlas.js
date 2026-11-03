'use strict';

// ===========================================================================
// Kenjitsu Knowledge Atlas — Integrated into the Kenjitsu web app.
// Supports both full-page view (#/atlas) and embedded home-page view.
// ===========================================================================
(function () {
  const LEVEL  = ['Atlas', 'Domain', 'Field', 'Subject', 'Topic', 'Fight'];
  const PLURAL = ['', 'domains', 'fields', 'subjects', 'topics', 'fights'];

  const N = (t, d, kids, q, mod) => ({ t, d, kids, q, mod });
  const F = (t, s, sc, q, mod) => ({ t, demoStatus: s, demoScore: sc, s, sc, q, mod, fight: true });

  const ROOT = N('Everything', 'Every subject on Kenjitsu. Scroll or click any card to zoom in, drag to pan, or search above.', [

    // =======================================================================
    // DOMAIN 1: MATHEMATICS & COMPUTING
    // =======================================================================
    N('Mathematics & Computing', 'Proof, data, algorithms, and machine intelligence.', [
      N('Computer Science', 'Algorithms, distributed systems, and machine learning.', [
        N('Machine Learning', 'How models learn, represent structure, and scale with compute.', [
          N('Transformers', 'Attention, positional representations, and inference bottlenecks.', [
            F('Self-attention: separate Q, K, and V', 'pass', 94, 'Explain what self-attention computes for one word in a sentence. What role do the query, key, and value play, and why are they three separate projections?', 'self-attention'),
            F('Scaling dot-products by √dₖ', 'gap', 57, 'With unit-variance q and k and dₖ = 4096, what is the variance of q·k before scaling, and what happens to softmax gradients?'),
            F('Positional encodings & permutation invariance', 'pass', 88, 'Remove positional encodings and the causal mask, then shuffle the input words. What happens to the output vector for “dog”?'),
            F('KV cache & memory bandwidth', 'pass', 90, 'The KV cache cuts work per new token to O(N). Why is token 32,000 still much slower to generate than token 100 on an H100?'),
          ]),
          N('Post-Training & RL', 'Turning a pretrained base model into a reasoning assistant.', [
            F('RLHF and the KL penalty', 'pass', 86, 'What happens to the policy if you set the KL coefficient β to zero while optimizing against a learned reward model?'),
            F('Direct Preference Optimization (DPO)', 'gap', 54, 'Show how the DPO loss can fall toward zero even while the model assigns lower probability to the preferred response than before training.'),
            F('GRPO with zero-variance group rewards', null, null, 'What happens to the GRPO gradient update on a hard math prompt if every sampled completion fails and gets a reward of zero?'),
            F('SFT memorization vs. on-policy RL', null, null, 'Why can supervised fine-tuning on 10,000 worked solutions hurt out-of-distribution generalization compared with on-policy RL?'),
          ]),
          N('Optimization & Generalization', 'How deep networks converge and generalize beyond training data.', [
            F('The bias–variance tradeoff', 'pass', 85, 'Explain the bias–variance tradeoff without using the words “bias”, “variance”, “overfitting” or “underfitting”, using a concrete example.', 'bias-variance'),
            F('Pre-LN vs. Post-LN residual streams', 'pass', 85, 'Why does putting LayerNorm inside the residual branch let deep transformers train without a fragile warmup phase?'),
            F('Decoupled weight decay (AdamW)', null, null, 'Why is adding λ‖θ‖² to the loss not equivalent to decoupled weight decay when training with adaptive learning rates in Adam?'),
            F('Chinchilla compute-optimal scaling', 'pass', 89, 'For a fixed compute budget, why does scaling model parameters and training tokens together beat training a 10x larger model for fewer steps?'),
          ]),
        ], 'Why does scaling parameters and training tokens together beat training a 10x larger model on fewer tokens for a fixed compute budget?'),

        N('Distributed Systems', 'Keeping data consistent and available across unreliable machines.', [
          N('Consensus & Replication', 'Agreeing on state when servers or network links fail.', [
            F('CAP theorem and consistency', 'pass', 87, 'People often say “CAP means pick two of three.” Explain in plain words what the theorem actually says using a two-datacenter example.', 'cap-theorem'),
            F('Quorum reads and writes (R + W > N)', null, null, 'With three replicas, why does R + W > N let reads see the latest write, and what edge case can still return stale data?'),
            F('Leader election & split-brain in Raft', null, null, 'How does Raft prevent an old leader on the wrong side of a network partition from committing new log entries?'),
          ]),
          N('Partitioning & Load Control', 'Spreading traffic and state across a fleet without meltdowns.', [
            F('Consistent hashing', 'pass', 84, 'Your cache cluster uses server = hash(key) % N. What goes wrong when you add a fifth server to four, and how does consistent hashing change that?', 'consistent-hashing'),
            F('Designing a rate limiter', null, null, 'Explain how a token bucket rate limiter works. What do its two settings control, and what happens if a user is idle for an hour and sends 50 requests at once?', 'rate-limiter'),
          ]),
        ], 'Why can you not build a distributed data store that is simultaneously linearizable and available during a network partition?'),

        N('Algorithms & Complexity', 'Data structures, graph search, and computational tractability.', [
          N('Dynamic Programming & Greedy Choice', 'When local choices work and when overlapping subproblems matter.', [
            F('Why Dijkstra fails with negative edges', 'pass', 91, 'Construct a 4-node graph with one negative edge (and no negative cycles) where Dijkstra’s algorithm locks in the wrong shortest path.'),
            F('Amortized O(1) in dynamic arrays', null, null, 'Resizing an array copies all N elements in O(N) time. Prove in plain words why N appends still cost O(1) on average per append.'),
          ]),
          N('Trees, Hashing & Indexing', 'How databases find records in milliseconds on disk and in memory.', [
            F('B-trees vs. LSM-trees for storage engines', null, null, 'Why does an LSM-tree sustain higher random write throughput than a B-tree, and what penalty do you pay on reads?'),
            F('Hash table load factors & Robin Hood hashing', null, null, 'What happens to open-addressed hash table lookup latency as load factor approaches 0.95?'),
          ]),
        ], 'Why does doubling the capacity of a dynamic array give O(1) amortized append, while adding a fixed 100 slots gives O(N) per append?'),
      ], 'How does a modern system move from raw bits on disk to fast, fault-tolerant computation at scale?'),

      N('Statistics', 'Reasoning under uncertainty and separating cause from correlation.', [
        N('Statistical Inference', 'What significance tests, intervals, and posteriors actually mean.', [
          N('P-values & Multiple Testing', 'What a significant result does and does not tell you.', [
            F('What p = 0.03 does not mean', 'pass', 92, 'A clinical trial reports p = 0.03. Explain in plain words why that is not a 97% probability that the drug works.'),
            F('False discovery rate in screening', 'pass', 89, 'You test 1,000 genetic variants and 10 truly matter. With 80% power and α = 0.05, what fraction of your significant hits are false alarms?'),
            F('The winner’s curse in low-power studies', 'gap', 61, 'A tiny study finds a huge, statistically significant effect. Why does low statistical power guarantee that significant hits exaggerate the true effect size?'),
          ]),
          N('Bayesian Inference', 'Updating prior beliefs with likelihood ratios.', [
            F('Bayes’ theorem and base rates', 'pass', 94, 'A disease affects 1 in 1,000 people. A test catches 99% of true cases with a 1% false-positive rate. Your friend tests positive. How likely is it they have the disease?', 'bayes'),
            F('Conjugate priors & shrinkage', null, null, 'A baseball player goes 4-for-4 on opening day. How should a Bayesian shrinkage estimator combine that 1.000 average with the league mean?'),
          ]),
        ], 'Explain what a p-value is the probability of in one plain sentence, and name the most common way people misread it.'),

        N('Causal Inference', 'Identifying causal mechanisms from experimental and observational data.', [
          N('Confounding & Simpson’s Paradox', 'When an unobserved third variable reverses the conclusion.', [
            F('Constructing Simpson’s paradox', 'pass', 88, 'A treatment has a higher recovery rate for men and for women separately, yet a lower rate overall. Explain the causal structure that makes this happen.'),
            F('When to stratify vs. aggregate', null, null, 'In two studies with identical numbers, one requires conditioning on the third variable and the other forbids it. What differs between the two causal graphs?'),
          ]),
          N('Collider & Selection Bias', 'How conditioning on a common effect creates phantom correlations.', [
            F('Berkson’s paradox among actors', null, null, 'Suppose talent and attractiveness are independent in the general population. Among Hollywood stars, are they correlated? Which way, and why?'),
            F('Abraham Wald and returning bombers', 'pass', 85, 'WWII analysts found bullet holes clustered on the fuselage and wings of returning bombers, with almost none on the engines. Where should armor go, and why?'),
          ]),
          N('Natural Experiments', 'Extracting causal estimates when you cannot randomize directly.', [
            F('Instrumental variables & exclusion restriction', null, null, 'Draft lottery numbers were used to estimate the effect of military service on civilian earnings. What assumption must hold for the instrument to be valid?'),
            F('Difference-in-differences & parallel trends', null, null, 'New Jersey raised its minimum wage while Pennsylvania did not. How do you estimate the causal effect, and what breaks the parallel-trends assumption?'),
          ]),
        ], 'Ice cream sales and drownings rise together. Explain two distinct causal graphs where A and B correlate without A causing B.'),

        N('Experimental Design', 'Designing A/B tests and trials that do not fool you.', [
          N('Variance Reduction & Interference', 'Getting clean signal when units interact.', [
            F('Network interference in marketplace A/B tests', null, null, 'You randomize 50% of Uber riders into a lower-price treatment. Why does comparing treated vs. control riders bias the estimated city-wide effect?'),
            F('Pre-experiment covariates (CUPED)', null, null, 'How does subtracting a user’s pre-experiment baseline activity shrink confidence intervals without biasing the treatment effect?'),
          ]),
        ], 'Why does randomizing individual users fail when testing a new pricing algorithm in a two-sided ride-sharing market?'),
      ], 'How do we distinguish genuine causal mechanisms from noise and selection artifacts?'),

      N('Mathematics', 'Linear algebra, calculus, and probability from geometric first principles.', [
        N('Linear Algebra', 'Transformations, eigenvalues, and matrix factorizations.', [
          N('Eigenvalues & SVD', 'Finding the natural axes of a linear transformation.', [
            F('Geometric meaning of the determinant', 'pass', 90, 'Without writing a formula, what does it mean geometrically when a 3×3 matrix has determinant 0, or determinant −2?'),
            F('Singular Value Decomposition (SVD)', null, null, 'Explain why every matrix—even a non-square one—can be viewed as a rotation, a stretch along perpendicular axes, and another rotation.'),
          ]),
          N('Projections & Least Squares', 'Finding the closest solution when equations have no exact match.', [
            F('Orthogonal projection and normal equations', null, null, 'When Ax = b has no exact solution, why must the residual vector (b − Ax̂) be perpendicular to every column of A?'),
          ]),
        ], 'What does it mean geometrically for a matrix to have rank 2 in a 5-dimensional space?'),

        N('Calculus & Analysis', 'Rates of change, accumulation, and local linear approximations.', [
          N('Fundamental Theorems', 'Why differentiation and integration are inverses.', [
            F('The mean value theorem', 'pass', 86, 'State the mean value theorem in plain language using a car trip. Which hypothesis does the car trip story quietly assume, and what does it mean physically?', 'mean-value-theorem'),
            F('Taylor series & local approximation', null, null, 'Why does matching a function’s value, slope, and curvature at a single point let a polynomial approximate sin(x) near zero?'),
          ]),
        ], 'Why is the derivative of the area under a curve equal to the height of the curve itself?'),

        N('Probability Theory', 'Distributions, expectations, and limit theorems.', [
          N('Limit Theorems & Tail Bounds', 'Why averages stabilize and when heavy tails break them.', [
            F('Law of Large Numbers vs. Gambler’s Fallacy', 'pass', 91, 'A fair coin lands heads 10 times in a row. How does the fraction of heads converge to 1/2 without tails ever “catching up”?'),
            F('Why Cauchy distributions break the CLT', null, null, 'The Central Limit Theorem says sample averages become normal. What property of the Cauchy distribution causes the average of 10,000 draws to be just as noisy as 1 draw?'),
          ]),
        ], 'Why is expectation linear even when random variables are strongly dependent on each other?'),
      ], 'How do linear transformations, limits, and probability distributions fit together?'),
    ]),

    // =======================================================================
    // DOMAIN 2: NATURAL SCIENCES
    // =======================================================================
    N('Natural Sciences', 'How living systems, molecules, energy, and matter work.', [
      N('Biology', 'Life, from molecular switches to evolving populations.', [
        N('Molecular Biology', 'How genetic information is read, regulated, and edited.', [
          N('Gene Regulation', 'How cells decide which genes to switch on or keep silent.', [
            F('The lac operon as an AND gate', 'pass', 88, 'E. coli has both glucose and lactose available. Is the lac operon strongly on, off, or barely on? Name the two molecular switches and what each senses.'),
            F('Cis vs. trans regulatory mutations', 'gap', 54, 'In a partial diploid with genotype I⁺ Oᶜ Z⁻ / I⁻ O⁺ Z⁺, is β-galactosidase produced when lactose is absent? Walk through each DNA copy.'),
            F('Distal enhancers & chromatin looping', null, null, 'How can an enhancer 50,000 base pairs away activate a promoter, and what prevents it from turning on neighboring genes indiscriminately?'),
            F('Epigenetic silencing across cell types', null, null, 'A cortical neuron and a hepatocyte carry identical genomic DNA. What physical marks keep liver enzymes permanently silenced in the neuron?'),
          ]),
          N('CRISPR & Genome Editing', 'Bacterial adaptive immunity repurposed as a programmable nuclease.', [
            F('Why Cas9 spares the host CRISPR array', 'pass', 91, 'The bacterium’s own chromosome stores the exact 20-nt spacer that its guide RNA targets. Why doesn’t Cas9 cleave the host genome?'),
            F('Seed region vs. PAM-distal mismatches', null, null, 'A guide RNA has two mismatches to an off-target site. Why are mismatches adjacent to the PAM far more disruptive to cleavage than distal mismatches?'),
            F('Base editors vs. double-strand breaks', null, null, 'Why is a cytosine base editor safer than standard Cas9 + HDR when correcting a single point mutation in post-mitotic cells?'),
          ]),
          N('The Central Dogma', 'Information flow from DNA to RNA to protein—and its exceptions.', [
            F('Wobble base pairing & third-position degeneracy', null, null, 'There are 64 codons for 20 amino acids. Why does clustering degeneracy in the third codon position buffer against point mutations?'),
            F('Alternative splicing & isoform diversity', 'pass', 84, 'Humans have ~20,000 protein-coding genes but produce over 100,000 distinct protein isoforms. Explain the mechanism and how splice-site mutations cause disease.'),
            F('Retroviral reverse transcriptase error rates', null, null, 'Why does HIV evolve resistance to single-drug therapy within days while many DNA viruses remain genetically stable for decades?'),
          ]),
        ], 'What does a cell physically do to turn a gene on, from chromatin remodeling to a folded protein?'),

        N('Evolutionary Biology', 'Natural selection, drift, kin selection, and evolutionary constraints.', [
          N('Natural Selection & Adaptation', 'Variation, heritability, and differential reproductive success.', [
            F('Natural selection & antibiotic resistance', 'pass', 90, 'Explain how a population of bacteria becomes resistant to an antibiotic, as if to someone who believes “the bacteria get used to the drug.”', 'natural-selection'),
            F('Evolutionary fitness vs. physical strength', 'pass', 86, 'Compare a dominant alpha lion that leaves zero surviving offspring with a smaller male that sires eight cubs. Which has higher Darwinian fitness, and why?'),
            F('Historical constraint & the vertebrate retina', null, null, 'Why are vertebrate photoreceptors wired backward—creating a blind spot—while cephalopod eyes have no blind spot? Why hasn’t selection re-wired ours?'),
          ]),
          N('Kin Selection & Altruism', 'Why organisms sacrifice for relatives and cooperate with non-kin.', [
            F('Hamilton’s rule (rB > C)', 'pass', 87, 'Using rB > C, explain why a Belding’s ground squirrel gives an alarm call that attracts predators to itself. When does it stay silent?'),
            F('Haplodiploidy and eusocial insects', 'pass', 88, 'In hymenopterans (ants, bees, wasps), why do full sisters share 3/4 of their genes instead of 1/2, and how does polyandry complicate that story?'),
            F('The tragedy of group selection', 'gap', 58, 'Why does a trait where individuals voluntarily restrict reproduction “to prevent overgrazing” almost always lose to selfish mutants within the group?'),
          ]),
          N('Population Genetics', 'How drift, mutation, and selection shift allele frequencies.', [
            F('Genetic drift vs. selection in small populations', null, null, 'Why can a mildly deleterious allele drift to 100% fixation in an isolated island population of 40, but almost never in a mainland population of 400,000?'),
            F('Hardy–Weinberg carrier frequency', null, null, 'Cystic fibrosis affects roughly 1 in 2,500 newborns in a population. Roughly what fraction of healthy adults are silent carriers?'),
          ]),
        ], 'Why is it almost always wrong to explain an adaptation as evolving “for the survival of the species”?'),

        N('Genetics & Genomics', 'Mendelian inheritance, linkage, and complex polygenic traits.', [
          N('Linkage & Recombination', 'How chromosomes shuffle alleles during meiosis.', [
            F('Recombination frequency & centimorgans', 'pass', 85, 'Why can the recombination frequency between two loci on the same chromosome never exceed 50%, even if they sit at opposite ends of a long chromosome?'),
            F('GWAS hits vs. causal variants', null, null, 'A genome-wide association study flags a non-coding SNP with p < 10⁻⁹. Why might knocking out that exact SNP have zero effect on the trait?'),
          ]),
        ], 'How does meiotic recombination let linked genes assort nearly independently when they are far apart on the same chromosome?'),

        N('Neuroscience', 'How excitable membranes, synapses, and circuits compute.', [
          N('Action Potentials & Synapses', 'Electrical signaling and chemical transmission in neurons.', [
            F('The refractory period & unidirectional spikes', 'pass', 89, 'Once an action potential reaches the middle of an axon, what stops it from propagating backward toward the cell body?'),
            F('Saltatory conduction in myelinated axons', null, null, 'How does wrapping an axon in myelin speed up conduction 20-fold while simultaneously cutting metabolic ATP consumption?'),
          ]),
        ], 'How do voltage-gated sodium and potassium channels produce an all-or-none spike that travels down an axon without decaying?'),
      ], 'How do molecular rules inside a single cell give rise to physiology, behavior, and evolution across millions of years?'),

      N('Physics', 'Mechanics, conservation laws, thermodynamics, and quantum phenomena.', [
        N('Classical Mechanics', 'Force, momentum, energy conservation, and orbital motion.', [
          N('Conservation Laws & Frames', 'When energy and momentum are conserved—and when they aren’t.', [
            F('Why a bullet in a block loses kinetic energy', 'pass', 90, 'A bullet embeds in a wooden block on frictionless ice. Momentum is conserved, so why is 98% of the kinetic energy lost? Where did it go?'),
            F('Orbital speed: speeding up by braking', null, null, 'A satellite in circular low-Earth orbit fires its thrusters briefly to oppose its motion. Once it settles into its new lower orbit, is its speed faster or slower than before?'),
          ]),
        ], 'Why does firing retro-rockets to drop into a lower orbit end up making a spacecraft travel faster rather than slower?'),

        N('Thermodynamics', 'Entropy, heat engines, and statistical mechanics.', [
          N('Entropy & The Second Law', 'Why heat flows from hot to cold and why efficiency has a ceiling.', [
            F('Leaving the refrigerator door open', 'pass', 88, 'You leave a working refrigerator’s door wide open in a sealed, insulated room. Does the room get cooler, warmer, or stay the same temperature?'),
            F('Microstates and statistical entropy', null, null, 'Why do gas molecules never spontaneously gather in the left half of a room, in terms of counting microstates?'),
          ]),
        ], 'Why can no heat engine operating between two temperatures ever beat the Carnot efficiency, even with zero friction?'),

        N('Quantum Mechanics', 'Superposition, measurement, and wave-particle duality.', [
          N('Wavefunctions & Uncertainty', 'Why position and momentum cannot simultaneously be sharp.', [
            F('The Heisenberg uncertainty principle as Fourier math', null, null, 'Explain why localizing a wave packet in space necessarily spreads out its wavelength spectrum—independent of any clumsy measurement apparatus.'),
            F('Three polarizing filters at 45°', 'pass', 87, 'Crossed horizontal and vertical polarizers block 100% of light. Insert a third filter at 45° between them and light comes through again. Why?'),
          ]),
        ], 'Why does inserting a third polarizer between two perpendicular polarizers increase the transmitted light instead of blocking more of it?'),
      ], 'How do symmetry principles and conservation laws govern motion from subatomic particles to planetary orbits?'),

      N('Chemistry', 'Bonding, reaction kinetics, equilibrium, and molecular structure.', [
        N('Physical Chemistry', 'Equilibrium, kinetics, and the thermodynamics of reactions.', [
          N('Equilibrium & Kinetics', 'The difference between how far a reaction goes and how fast it gets there.', [
            F('Why diamond does not turn into graphite', 'pass', 86, 'At room temperature and pressure, graphite is thermodynamically more stable than diamond (ΔG < 0). Why don’t engagement rings turn into pencil lead?'),
            F('Le Chatelier’s principle & inert gas trap', null, null, 'For N₂ + 3H₂ ⇌ 2NH₃ in a rigid constant-volume steel vessel, you pump in inert argon gas to double the total pressure. Which way does equilibrium shift?'),
          ]),
        ], 'Why does adding a catalyst speed up the forward reaction without shifting the final equilibrium ratio of products to reactants?'),

        N('Organic & Biochemistry', 'Structure, catalysis, and energy currency in carbon compounds.', [
          N('Enzyme Catalysis & ATP', 'How enzymes lower activation barriers and couple unfavorable steps.', [
            F('Why enzymes bind the transition state, not the substrate', null, null, 'If an enzyme evolved to bind its starting substrate as tightly as possible, why would that actually slow the reaction down?'),
          ]),
        ], 'Why must an enzyme bind the unstable transition state more tightly than the ground-state substrate?'),
      ], 'What determines whether a chemical reaction is energetically favorable versus kinetically fast?'),
    ]),

    // =======================================================================
    // DOMAIN 3: SOCIAL SCIENCES
    // =======================================================================
    N('Social Sciences', 'How individuals, markets, and political institutions make decisions.', [
      N('Economics', 'Scarcity, incentives, market design, and behavioral anomalies.', [
        N('Behavioral Economics', 'Where human judgment and choice systematically depart from rational-agent axioms.', [
          N('Prospect Theory', 'Reference dependence, loss aversion, and probability weighting.', [
            F('Asian disease framing & reference points', 'pass', 90, 'Framing an identical policy as “200 of 600 saved” vs. “400 of 600 die” reverses most people’s preference. Explain why using the curvature of Kahneman & Tversky’s value function.'),
            F('Small-stakes loss aversion & Rabin’s paradox', 'pass', 86, 'Most people reject a 50/50 coin flip between losing $100 and winning $110. Why does utility curvature alone fail to explain this without absurd large-stakes predictions?'),
            F('The endowment effect & Coase theorem', null, null, 'In Kahneman, Knetsch & Thaler’s Cornell mug experiment, owners demanded ~$7 while buyers offered ~$3.50. How does this violate the Coase theorem?'),
            F('Risk-seeking in the domain of losses', 'gap', 63, 'Why do people facing a sure loss of $500 typically prefer a 50% chance of losing $1,000 and a 50% chance of losing nothing?'),
          ]),
          N('Intertemporal Choice', 'Present bias, hyperbolic discounting, and commitment devices.', [
            F('Exponential vs. quasi-hyperbolic (β-δ) discounting', 'pass', 84, 'People prefer 1 apple today over 2 tomorrow, yet prefer 2 apples in 31 days over 1 in 30 days. Show why constant exponential discounting can never produce this reversal.'),
            F('Naive vs. sophisticated present bias', null, null, 'Why does a naive β-δ agent overpay for a monthly gym contract they rarely use, while a sophisticated β-δ agent buys illiquid commitment devices?'),
          ]),
          N('Heuristics & Judgment Biases', 'Mental shortcuts that work fast but fail in predictable ways.', [
            F('Thinking, Fast and Slow: System 1 vs. System 2', 'pass', 92, 'Explain the difference between System 1 and System 2, then explain why the bat-and-ball problem ($1.10 total) trips up smart people.', 'thinking-fast-slow'),
            F('Regression to the mean in flight school', 'pass', 91, 'Israeli flight instructors noticed cadets flew worse after praise for a great landing and better after being yelled at for a rough one. What statistical trap fooled the instructors?'),
            F('The law of small numbers in rural counties', null, null, 'The U.S. counties with the lowest kidney cancer incidence are mostly small, rural, Midwestern counties. So are the counties with the highest incidence. Why?'),
          ]),
          N('Incentives & Goodhart’s Law', 'When extrinsic rewards and targets corrupt the behavior they measure.', [
            F('Goodhart’s law & Campbell’s law', 'pass', 89, '“When a measure becomes a target, it ceases to be a good measure.” Give a concrete mechanism and explain when a metric resists gaming.'),
            F('Gneezy & Rustichini’s daycare fine', null, null, 'An Israeli daycare introduced a monetary fine for parents arriving late to pick up their children, and late pickups immediately doubled. Why?'),
          ]),
        ], 'Where specifically does Kahneman and Tversky’s prospect theory depart from classical expected utility theory?'),

        N('Microeconomics', 'Prices, market equilibrium, externalities, and strategic interaction.', [
          N('Price Signals & Market Design', 'How prices coordinate dispersed knowledge—and what caps do.', [
            F('Supply, demand and price ceilings', 'pass', 87, 'A city caps rents below the market rate. Explain step by step what happens to apartments wanted, apartments available, and who ends up better or worse off.', 'price-ceilings'),
            F('Monopsony & minimum wage employment effects', null, null, 'In a competitive labor market a binding minimum wage reduces employment. Show why a monopsonistic employer can actually hire *more* workers when a minimum wage is imposed.'),
          ]),
          N('Game Theory & Information', 'Strategic equilibrium, adverse selection, and moral hazard.', [
            F('Akerlof’s market for lemons', 'pass', 91, 'Used cars are worth $10,000 if plums and $4,000 if lemons (50/50 mix). If sellers know which they hold and buyers don’t, why can trade for plums collapse completely?'),
            F('Vickrey second-price auctions', null, null, 'Prove in plain words why bidding your exact true valuation is a dominant strategy in a sealed-bid second-price auction, regardless of how others bid.'),
          ]),
        ], 'How does asymmetric information between buyers and sellers cause mutually beneficial markets to unravel?'),

        N('Macroeconomics', 'Money, inflation, interest rates, and business cycles.', [
          N('Monetary Policy & Inflation', 'Central banking, expectations, and liquidity traps.', [
            F('The Fisher equation: nominal vs. real rates', 'pass', 85, 'Why does a central bank that permanently accelerates money growth end up with *higher* nominal interest rates rather than lower ones?'),
            F('The paradox of thrift in a recession', null, null, 'If every household simultaneously tries to double its savings rate during a demand slump, why can total aggregate savings fail to rise?'),
          ]),
        ], 'What happens to output and inflation when a central bank raises interest rates, and what are the transmission channels?'),
      ], 'How do incentives, information, and institutional rules shape human choices under scarcity?'),

      N('Psychology', 'Perception, memory, social cognition, and developmental processes.', [
        N('Cognitive Psychology', 'Attention, working memory, and how schemas reconstruct recall.', [
          N('Memory & Attention', 'Why human memory is reconstructive rather than a video recorder.', [
            F('Loftus & Palmer’s “smashed” vs. “hit” study', 'pass', 88, 'Asking witnesses how fast cars were going when they “smashed into” vs. “hit” each other made them recall broken glass a week later when none existed. What does this show about memory consolidation?'),
            F('Spaced repetition & desirable difficulties', null, null, 'Why does re-reading a chapter three times in one night feel fluent in the moment but produce far worse recall a week later than three spaced retrieval tests?'),
          ]),
        ], 'Why do study techniques that feel hardest in the moment produce the strongest long-term retention?'),

        N('Social Psychology', 'Attribution, conformity, and situational power.', [
          N('Attribution & Conformity', 'How social context overrides individual dispositions.', [
            F('The fundamental attribution error', 'pass', 86, 'Even when subjects are told a debate speaker was assigned their pro-Castro stance by a coin flip, listeners still infer the speaker privately holds sympathetic views. Why?'),
            F('Pluralistic ignorance in emergencies', null, null, 'Smoke pours through a vent into a waiting room. Why does a lone subject report it 75% of the time, while a subject sitting with two calm confederates reports it only 10% of the time?'),
          ]),
        ], 'When do situational pressures and social norms override individual personality differences?'),
      ], 'How does the mind construct perception, memory, and social meaning from ambiguous inputs?'),

      N('Political Science', 'State capacity, voting institutions, collective action, and international order.', [
        N('Institutions & Public Choice', 'How electoral rules and collective action shape political outcomes.', [
          N('Voting Rules & Collective Action', 'Why concentrated interests beat diffuse majorities.', [
            F('Olson’s logic of collective action', 'pass', 89, 'A sugar tariff costs 300 million consumers $10 each ($3B total) and gives 5,000 producers $300,000 each ($1.5B total). In a democracy, why does the tariff survive decade after decade?'),
            F('Duverger’s law & first-past-the-post', null, null, 'Through what two mechanisms (one mechanical, one psychological) do single-member plurality districts converge toward a two-party system?'),
          ]),
        ], 'Why do small, concentrated interest groups routinely defeat large, diffuse majorities in democratic policymaking?'),

        N('International Relations', 'Deterrence, credible commitments, and the security dilemma.', [
          N('Bargaining & War', 'Why rational states fight costly wars instead of settling.', [
            F('Fearon’s bargaining model of war', null, null, 'Since war destroys resources, there always exists a peaceful bargain both sides prefer to fighting. What three mechanisms prevent rational leaders from reaching that bargain?'),
          ]),
        ], 'If war is always costly for both sides, why do states ever fail to strike a peaceful bargain beforehand?'),
      ], 'How is political power organized, constrained, and contested within and between states?'),
    ]),

    // =======================================================================
    // DOMAIN 4: HUMANITIES
    // =======================================================================
    N('Humanities', 'History, philosophy, and legal reasoning.', [
      N('History', 'How states, revolutions, and economic transformations unfold.', [
        N('Modern Chinese History', 'From the Communist rise in Yan’an through Mao’s campaigns and Deng’s reforms.', [
          N('The Civil War & Yan’an', 'How the CCP built party discipline, mobilized the peasantry, and won.', [
            F('The Yan’an Rectification Movement (1942–44)', null, null, 'What political techniques did Mao forge during the Yan’an Rectification, and how did they shape cadre survival behavior in the 1950s?'),
            F('Why the Nationalists lost the Civil War', 'pass', 83, 'In 1946 Chiang Kai-shek had 3x the troops and U.S. equipment. Give the fiscal, military, and rural mechanisms that explain why the KMT collapsed by 1949.'),
          ]),
          N('The Great Leap Forward', 'Collectivization, tournament reporting, and the 1958–1962 famine.', [
            F('Inflated harvest reporting & state procurement', 'pass', 92, 'A county harvests 100,000 tons of grain, reports 300,000 tons to win political praise, and the state procures a “modest” 30% quota. Trace the arithmetic on the ground.'),
            F('Peng Dehuai and the 1959 Lushan Conference', 'pass', 91, 'Before Peng Dehuai’s private letter in July 1959, Mao was already cooling the Leap’s excesses. Why did Peng’s letter trigger a devastating second radical wave instead?'),
            F('Backyard steel furnaces & commune kitchens', null, null, 'Why did diverting rural labor into backyard steel furnaces and free communal dining halls amplify famine mortality even in provinces with decent weather?'),
            F('The Seven Thousand Cadres Conference (1962)', null, null, 'How did Liu Shaoqi’s diagnosis of “three parts natural disaster, seven parts man-made error” halt the famine while planting the seeds of the Cultural Revolution?'),
          ]),
          N('The Cultural Revolution', 'Mao’s assault on his own Party bureaucracy, 1966–1976.', [
            F('Why Mao mobilized outside the Party apparatus', 'gap', 60, 'Why did Mao unleash student Red Guards to smash the Party committee system he himself headed, rather than purging Liu Shaoqi and Deng Xiaoping through standard Politburo procedures?'),
            F('Conservative vs. Rebel Red Guard factions', 'gap', 58, 'Both Conservative and Rebel Red Guards swore fanatical loyalty to Mao. What concrete class-label and family-status interests split them into armed warfare?'),
            F('The Lin Biao affair (1971)', null, null, 'Why did the defection flight and crash of Mao’s constitutionally designated successor shatter ideological belief among urban youth more deeply than years of violence had?'),
          ]),
          N('Reform & Opening', 'Deng Xiaoping’s institutional transition after 1978.', [
            F('Xiaogang village & the Household Responsibility System', 'pass', 84, 'How did contracting collective land to individual households change a farmer’s marginal return on an extra hour of effort compared with commune work points?'),
            F('Dual-track pricing (plan vs. market margin)', null, null, 'Explain how dual-track pricing worked for a state steel mill in 1985: why did it preserve political stability and output while simultaneously inviting official corruption (guandao)?'),
            F('Why Shenzhen before Shanghai', null, null, 'Why did Deng launch Special Economic Zones in border towns like Shenzhen and Zhuhai while keeping Shanghai tightly under central fiscal control throughout the 1980s?'),
          ]),
        ], 'Trace the political logic connecting the Lushan Conference (1959), the Seven Thousand Cadres Conference (1962), and the launch of the Cultural Revolution (1966).'),

        N('The Cold War', 'Nuclear deterrence, containment, proxy conflicts, and Soviet collapse.', [
          N('Deterrence & Crises', 'Brinkmanship, alliance credibility, and command-and-control.', [
            F('The stability-instability paradox', 'pass', 87, 'Why did mutual assured destruction at the strategic nuclear level simultaneously make superpower proxy wars in the Third World *more* frequent?'),
            F('The Cuban Missile Crisis & Jupiter missiles', null, null, 'Why did Kennedy insist that the U.S. pledge to remove Jupiter missiles from Turkey remain strictly secret while Khrushchev’s withdrawal from Cuba was public?'),
          ]),
        ], 'Why did the forty-year rivalry between the United States and the Soviet Union remain “cold” in Europe while turning hot across Asia, Africa, and Latin America?'),

        N('Economic & Institutional History', 'Why the Industrial Revolution happened where and when it did.', [
          N('The Industrial Revolution', 'Energy, factor prices, and institutions in 18th-century Britain.', [
            F('High wages, cheap coal, and Newcomen’s engine', 'pass', 86, 'Why was the early steam engine profitable to adopt in British coal mines in 1730 despite being wildly fuel-inefficient, whereas no one adopted it in France or China?'),
          ]),
        ], 'Why did sustained per-capita income growth break out of the Malthusian trap in 18th-century Britain rather than Song China or Roman Italy?'),
      ], 'How do incentives, ideology, and institutional constraints interact to drive historical turning points?'),

      N('Law', 'Constitutional structure, private law incentives, and judicial reasoning.', [
        N('Torts & Liability', 'Negligence, strict liability, causation, and deterrence.', [
          N('Negligence & Economic Torts', 'Allocating accident costs between injurers and victims.', [
            F('Judge Learned Hand’s B < PL formula', 'pass', 93, 'In United States v. Carroll Towing, Judge Hand wrote that a barge owner is negligent when B < P·L. Explain why B, P, and L must be evaluated at the *margin* rather than in total.'),
            F('Strict liability vs. negligence for activity levels', 'pass', 89, 'Even if courts set the due-care standard perfectly, why does a negligence rule fail to regulate how *often* an actor engages in a dangerous activity, whereas strict liability succeeds?'),
            F('Palsgraf & proximate vs. but-for causation', null, null, 'A railroad guard pushes a passenger carrying unlabeled fireworks; the explosion tips scales at the far end of the platform onto Mrs. Palsgraf. How do Cardozo and Andrews frame the duty/proximate-cause boundary?'),
          ]),
        ], 'When does strict liability produce better incentives than a negligence rule, and when does negligence need a contributory fault defense?'),

        N('Contracts & Remedies', 'Bargaining, consideration, and expectation versus reliance damages.', [
          N('Breach & Damages', 'How contract remedies price promises and allocate risk.', [
            F('Expectation damages & efficient breach', 'pass', 90, 'Why does awarding expectation damages (putting the promisee in the position as if performed) induce a seller to breach *if and only if* a third party values the goods more than the original buyer?'),
            F('Hadley v. Baxendale as an information-forcing default', null, null, 'Why does denying consequential damages for unforeseeable mill shutdowns force a high-loss shipper to disclose their special vulnerability at the time of contracting?'),
          ]),
        ], 'Why is the standard remedy for breach of contract money damages rather than forcing specific performance?'),

        N('Constitutional Law', 'Separation of powers, federalism, and judicial review.', [
          N('Structure & Rights', 'How structural checks and standards of scrutiny constrain state power.', [
            F('Madison’s Federalist No. 10 & No. 51', 'pass', 88, 'Why did Madison argue that an extended republic controls factions better than a small direct democracy, and what does “ambition must be made to counteract ambition” require institutionally?'),
          ]),
        ], 'How do structural separation-of-powers rules protect individual liberty differently from a parchment Bill of Rights?'),
      ], 'How do legal doctrines allocate risk, information, and decision authority across society?'),

      N('Philosophy', 'Epistemology, normative ethics, and philosophy of mind.', [
        N('Epistemology & Logic', 'What turns true belief into knowledge, and how valid inference works.', [
          N('Knowledge, Logic & Reading', 'Gettier cases, necessary vs. sufficient conditions, and active reading.', [
            F('Necessary vs. sufficient conditions', 'pass', 88, 'Explain the difference between a necessary condition and a sufficient condition. If “you may enter only if you have a ticket,” what follows if someone has a ticket?', 'lsat-conditionals'),
            F('Kenjitsu, the essay: reading like a programmer', 'pass', 91, 'Somers borrows the analogy of a programmer reading someone else’s code. Explain what that says reading should look like, with a concrete example.', 'kenjitsu-essay'),
            F('Gettier’s justified true belief counterexamples', 'pass', 87, 'You look at a clock that reads 3:00 and form the true belief that it is 3:00—unaware the clock stopped 12 hours ago. Why is justified true belief insufficient for knowledge?'),
          ]),
        ], 'What separates genuine knowledge from a lucky guess that happens to be true?'),

        N('Normative Ethics', 'Consequentialism, deontology, and moral luck.', [
          N('Utilitarianism vs. Deontology', 'Trolley problems, rights constraints, and demandingness.', [
            F('Spur track vs. footbridge (Doctrine of Double Effect)', 'pass', 85, 'Five people are saved and one dies in both the switch case and the footbridge case. What structural distinction between foreseeing harm as a side effect and using a person as a means explains the moral asymmetry?'),
          ]),
        ], 'When do individual rights act as side-constraints on maximizing aggregate welfare?'),
      ], 'How do we justify what we claim to know and what we ought to do?'),
    ]),
  ]);

  const byId = {};
  const ALL = [];
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  (function index(n, parent, depth) {
    n.parent = parent;
    n.depth = depth;
    n.id = parent ? `${parent.id}.${slug(n.t)}` : 'root';
    byId[n.id] = n;
    ALL.push(n);
    (n.kids || []).forEach(k => index(k, n, depth + 1));
  })(ROOT, null, 0);

  const isFight = n => !!n.fight;
  const isContainer = n => !n.fight;
  const ancestors = n => { const a = []; for (let p = n.parent; p; p = p.parent) a.unshift(p); return a; };

  function esc(s) {
    return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function stats(n) {
    if (n.fight) return { p: n.s === 'pass' ? 1 : 0, g: n.s === 'gap' ? 1 : 0, t: 1 };
    return (n.kids || []).reduce((a, k) => {
      const s = stats(k);
      return { p: a.p + s.p, g: a.g + s.g, t: a.t + s.t };
    }, { p: 0, g: 0, t: 0 });
  }

  function weight(n) {
    if (n.fight) return 1;
    if (n.depth === 1) return 1;
    const childCount = (n.kids || []).length;
    return Math.pow(Math.max(1, childCount), 0.28);
  }

  function opener(n) {
    return n.q || `Pick the central mechanism in ${n.t}. Explain how it works in plain words, and give a case where a surface-level intuition gets it wrong.`;
  }

  function squarify(nodes, x, y, w, h, aspectBias = 1.35) {
    if (!nodes || !nodes.length || w <= 0 || h <= 0) return [];
    const items = nodes.map(n => ({ n, v: weight(n) }));
    if (nodes[0].depth > 1) items.sort((a, b) => b.v - a.v);

    const total = items.reduce((s, i) => s + i.v, 0) || 1;
    items.forEach(i => { i.a = (i.v / total) * w * h; });

    const out = [];
    let rect = { x, y, w, h }, row = [], i = 0;

    const worst = (r, side, horiz) => {
      const s = r.reduce((a, b) => a + b.a, 0);
      if (s <= 0 || side <= 0) return Infinity;
      let maxR = 0;
      for (const z of r) {
        const cw = horiz ? (s / side) : (z.a / (s / side));
        const ch = horiz ? (z.a / (s / side)) : (s / side);
        const adjW = cw / aspectBias;
        const ratio = Math.max(adjW / ch, ch / adjW);
        if (ratio > maxR) maxR = ratio;
      }
      return maxR;
    };

    const place = (r) => {
      const s = r.reduce((a, b) => a + b.a, 0);
      if (rect.w >= rect.h * 0.92) {
        const cw = s / rect.h;
        let cy = rect.y;
        r.forEach(z => {
          const ch = z.a / cw;
          out.push({ n: z.n, x: rect.x, y: cy, w: cw, h: ch });
          cy += ch;
        });
        rect = { x: rect.x + cw, y: rect.y, w: Math.max(0, rect.w - cw), h: rect.h };
      } else {
        const rh = s / rect.w;
        let cx = rect.x;
        r.forEach(z => {
          const cw = z.a / rh;
          out.push({ n: z.n, x: cx, y: rect.y, w: cw, h: rh });
          cx += cw;
        });
        rect = { x: rect.x, y: rect.y + rh, w: rect.w, h: Math.max(0, rect.h - rh) };
      }
    };

    while (i < items.length) {
      const horiz = rect.w >= rect.h * 0.92;
      const side = horiz ? rect.h : rect.w;
      if (!row.length || worst([...row, items[i]], side, horiz) <= worst(row, side, horiz)) {
        row.push(items[i]);
        i++;
      } else {
        place(row);
        row = [];
      }
    }
    if (row.length) place(row);
    return out;
  }

  // Sync live user history from /api/me with the tree
  let useDemoRecord = true;
  let liveHistory = [];

  function applyRecordMode() {
    const byMod = {};
    const byTitle = {};
    for (const h of liveHistory) {
      if (h.status !== 'done') continue;
      if (h.module && h.module !== 'custom') {
        const prev = byMod[h.module];
        if (!prev || h.score > prev.score) byMod[h.module] = h;
      }
      const key = (h.title || '').toLowerCase();
      if (key) {
        const prev = byTitle[key];
        if (!prev || h.score > prev.score) byTitle[key] = h;
      }
    }

    for (const n of ALL) {
      if (!isFight(n)) continue;
      const liveHit = (n.mod && byMod[n.mod]) || byTitle[n.t.toLowerCase()];
      if (useDemoRecord) {
        n.s = n.demoStatus;
        n.sc = n.demoScore;
        if (liveHit) {
          n.s = liveHit.passed ? 'pass' : 'gap';
          n.sc = liveHit.score;
        }
      } else {
        if (liveHit) {
          n.s = liveHit.passed ? 'pass' : 'gap';
          n.sc = liveHit.score;
        } else {
          n.s = null;
          n.sc = null;
        }
      }
    }
  }

  // Mount an interactive Atlas instance inside `hostEl`
  window.mountKenjitsuAtlas = function (hostEl, opts = {}) {
    const embedded = !!opts.embedded;
    const onStartFight = opts.onStartFight; // (node) => void
    const externalInput = opts.externalInput || null;
    const externalResults = opts.externalResults || null;
    const hasInternalSearch = !externalInput;

    hostEl.innerHTML = `
      <div class="kj-atlas ${embedded ? 'kj-atlas-embedded' : 'kj-atlas-full'}" id="kj-atlas-root">
        <div class="kj-atlas-bar">
          <div class="kj-atlas-ctx-left">
            <div class="kj-atlas-nav-row">
              <button type="button" class="kj-back-btn" id="kj-zoom-out" hidden>&larr; Zoom out</button>
              <div class="kj-crumbs" id="kj-crumbs"></div>
            </div>
            <div class="kj-title-row">
              <h2 id="kj-title">Everything</h2>
              <span class="kj-badge" id="kj-level-badge">Atlas</span>
            </div>
            <div class="kj-sub" id="kj-sub"></div>
          </div>

          ${hasInternalSearch ? `
          <div class="kj-atlas-search">
            <svg class="kj-glass" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6">
              <circle cx="7" cy="7" r="5.2"/>
              <path d="M11 11l3.6 3.6" stroke-linecap="round"/>
            </svg>
            <input id="kj-q" type="text" autocomplete="off" spellcheck="false" placeholder="Search any field, subject, topic, or fight…" />
            <kbd>/</kbd>
            <div class="kj-results" id="kj-results"></div>
          </div>` : ''}

          <div class="kj-atlas-actions">
            <button type="button" class="btn small ghost" id="kj-mode-toggle" title="Toggle between sample mastery and your personal record"></button>
            <button type="button" class="btn small primary" id="kj-fight-here" style="display:none"></button>
            ${embedded ? `<a class="btn small" href="#/atlas">Full screen &nearr;</a>` : ''}
          </div>
        </div>

        <div class="kj-stage-wrap">
          <div class="kj-stage" id="kj-stage"></div>
          <div class="kj-map-controls">
            <button type="button" class="kj-ctrl-btn kj-ctrl-reset" id="kj-ctrl-reset" hidden>Reset view</button>
            <button type="button" class="kj-ctrl-btn" id="kj-ctrl-out" title="Zoom out (Esc)">&minus;</button>
            <span class="kj-zoom-readout" id="kj-zoom-readout">1.0&times;</span>
            <button type="button" class="kj-ctrl-btn" id="kj-ctrl-in" title="Zoom in">+</button>
          </div>
        </div>

        <div class="kj-foot">
          <span>Scroll or pinch to zoom &middot; Drag to pan &middot; Click any card to zoom in &middot; Esc to zoom out</span>
          <div class="kj-legend">
            <span><i class="kj-sw-pass"></i>Passed</span>
            <span><i class="kj-sw-gap"></i>Needs rematch</span>
            <span><i class="kj-sw-open"></i>Ready to fight</span>
          </div>
        </div>

        <div class="kj-tip" id="kj-tip"></div>
        <div class="kj-scrim" id="kj-scrim"></div>
        <aside class="kj-sheet" id="kj-sheet"></aside>
      </div>
    `;

    const rootEl = hostEl.querySelector('#kj-atlas-root');
    const stage = hostEl.querySelector('#kj-stage');
    const q = externalInput || hostEl.querySelector('#kj-q');
    const results = externalResults || hostEl.querySelector('#kj-results');
    const tip = hostEl.querySelector('#kj-tip');
    const sheet = hostEl.querySelector('#kj-sheet');
    const scrim = hostEl.querySelector('#kj-scrim');
    const domById = {};

    let worldW = 1000, worldH = 560;
    const MIN_ZOOM = 1;
    const MAX_ZOOM = 32;

    let cam = { cx: 500, cy: 280, z: 1 };
    let targetCam = { cx: 500, cy: 280, z: 1 };
    let flight = null;
    let focusedNode = ROOT;
    let hoveredNode = null;
    let manualCameraMode = false;
    let rafId = 0;

    function fightKickerText(n) {
      if (n.s === 'pass') return `Passed · ${n.sc}`;
      if (n.s === 'gap') return `Rematch · ${n.sc}`;
      return n.mod ? 'Ranked module' : 'Fight';
    }

    function buildContainerInnerHtml(n) {
      const s = stats(n);
      const pct = s.t ? (100 * s.p / s.t).toFixed(1) : 0;
      const statText = `<b>${s.p}</b>/${s.t} passed${s.g ? '<i class="kj-gap-dot"></i>' : ''}`;
      const pillsHtml = (n.kids || []).map(k => {
        const ks = stats(k);
        const hasPass = ks.p > 0;
        return `<span class="kj-sum-pill">${hasPass ? '<i></i>' : ''}${esc(k.t)}</span>`;
      }).join('');

      return `
        <div class="kj-node-head">
          <h3 class="kj-node-head-title">${esc(n.t)}</h3>
          <div class="kj-node-head-right">
            <span class="kj-node-stat-pill">${statText}</span>
          </div>
        </div>
        <div class="kj-node-summary">
          <div class="kj-sum-top">
            <span class="kj-sum-cat">${LEVEL[n.depth]}</span>
            <span class="kj-sum-stat">${statText}</span>
          </div>
          <div class="kj-sum-main">
            <h3 class="kj-sum-title">${esc(n.t)}</h3>
            ${n.d ? `<p class="kj-sum-desc">${esc(n.d)}</p>` : ''}
          </div>
          <div class="kj-sum-foot">
            <div class="kj-sum-pills">${pillsHtml}</div>
            <div class="kj-sum-bar"><i style="width:${pct}%"></i></div>
          </div>
        </div>
      `;
    }

    function buildWorldDOM() {
      stage.innerHTML = '';
      for (const n of ALL) {
        if (n === ROOT) continue;
        const el = document.createElement('div');
        el.dataset.id = n.id;

        if (isFight(n)) {
          el.className = `kj-node fight depth-${n.depth} ${n.s === 'pass' ? 'passed' : n.s === 'gap' ? 'gap' : ''}`;
          el.innerHTML = `
            <div class="kj-fight-kicker"><span>${fightKickerText(n)}</span></div>
            <h4 class="kj-fight-title">${esc(n.t)}</h4>
            <div class="kj-fight-q">${esc(n.q)}</div>
            <div class="kj-fight-go">Fight &rarr;</div>
          `;
        } else {
          el.className = `kj-node container depth-${n.depth}`;
          const s = stats(n);
          const ratio = s.t ? s.p / s.t : 0;
          el.style.setProperty('--wash', (ratio * 0.18).toFixed(3));
          el.innerHTML = buildContainerInnerHtml(n);
        }

        stage.appendChild(el);
        domById[n.id] = el;
      }
    }

    function refreshAllNodes() {
      for (const n of ALL) {
        if (n === ROOT) continue;
        const el = domById[n.id];
        if (!el) continue;
        if (isFight(n)) {
          el.classList.toggle('passed', n.s === 'pass');
          el.classList.toggle('gap', n.s === 'gap');
          const k = el.querySelector('.kj-fight-kicker span');
          if (k) k.textContent = fightKickerText(n);
        } else {
          const s = stats(n);
          const ratio = s.t ? s.p / s.t : 0;
          el.style.setProperty('--wash', (ratio * 0.18).toFixed(3));
          el.innerHTML = buildContainerInnerHtml(n);
        }
      }
      setFocusedNode(focusedNode);
      scheduleFrame();
    }

    function computeWorldLayout(W, H) {
      worldW = W;
      worldH = H;
      ROOT.rect = { x: 0, y: 0, w: W, h: H };
      ROOT.idealZ = 1;

      (function recurse(node) {
        const { x, y, w, h } = node.rect;
        if (node !== ROOT) {
          const padFactor = node.depth >= 4 ? 0.90 : 0.94;
          const rawZ = Math.min(worldW / w, worldH / h) * padFactor;
          node.idealZ = Math.max(node.parent.idealZ * 1.35, Math.min(MAX_ZOOM, rawZ));
        }
        if (!node.kids || !node.kids.length) return;

        let ix, iy, iw, ih, gap;
        if (node === ROOT) {
          const pad = 10;
          gap = 10;
          ix = x + pad;
          iy = y + pad;
          iw = w - pad * 2;
          ih = h - pad * 2;
        } else {
          const minSide = Math.min(w, h);
          const pad = minSide * 0.035;
          const headH = h * 0.155;
          gap = minSide * 0.028;
          node.headH = headH;
          ix = x + pad;
          iy = y + headH + pad * 0.65;
          iw = Math.max(1, w - pad * 2);
          ih = Math.max(1, h - headH - pad * 1.65);
        }

        const boxes = squarify(node.kids, ix, iy, iw, ih, 1.35);
        boxes.forEach(b => {
          const g = Math.min(gap, Math.min(b.w, b.h) * 0.12);
          b.n.rect = {
            x: b.x + g / 2,
            y: b.y + g / 2,
            w: Math.max(0.5, b.w - g),
            h: Math.max(0.5, b.h - g),
          };
          recurse(b.n);
        });
      })(ROOT);
    }

    function clampCamera(c) {
      c.z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, c.z));
      const viewW = worldW / c.z;
      const viewH = worldH / c.z;
      const halfW = viewW / 2;
      const halfH = viewH / 2;
      if (viewW >= worldW) c.cx = worldW / 2;
      else c.cx = Math.max(halfW, Math.min(worldW - halfW, c.cx));

      if (viewH >= worldH) c.cy = worldH / 2;
      else c.cy = Math.max(halfH, Math.min(worldH - halfH, c.cy));
    }

    function cameraForNode(n) {
      if (!n || n === ROOT) {
        return { cx: worldW / 2, cy: worldH / 2, z: 1 };
      }
      const r = n.rect;
      const next = { cx: r.x + r.w / 2, cy: r.y + r.h / 2, z: n.idealZ || 1 };
      clampCamera(next);
      return next;
    }

    function flyToNode(n, customDur) {
      if (!n) n = ROOT;
      const dest = isFight(n) ? (n.parent || ROOT) : n;
      const goal = cameraForNode(dest);

      manualCameraMode = false;
      const startW = worldW / cam.z;
      const endW = worldW / goal.z;
      const scaleRatio = Math.abs(Math.log(endW / startW));
      const distNorm = Math.hypot(goal.cx - cam.cx, goal.cy - cam.cy) / Math.max(startW, endW);
      const dur = customDur || Math.max(360, Math.min(680, (scaleRatio * 220 + distNorm * 200 + 240)));

      flight = {
        startCx: cam.cx,
        startCy: cam.cy,
        startW,
        endCx: goal.cx,
        endCy: goal.cy,
        endW,
        t0: performance.now(),
        dur,
      };
      targetCam = { ...goal };
      setFocusedNode(dest);
      scheduleFrame();
    }

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function stepCamera(now) {
      if (flight) {
        const rawT = Math.min(1, (now - flight.t0) / flight.dur);
        const s = easeOutCubic(rawT);

        const curW = flight.startW * Math.pow(flight.endW / flight.startW, s);
        cam.z = worldW / curW;

        const dw = flight.endW - flight.startW;
        const u = Math.abs(dw) > 1e-4 ? (curW - flight.startW) / dw : s;
        cam.cx = flight.startCx + (flight.endCx - flight.startCx) * u;
        cam.cy = flight.startCy + (flight.endCy - flight.startCy) * u;
        clampCamera(cam);

        if (rawT >= 1) {
          flight = null;
          targetCam = { ...cam };
        }
        return true;
      }

      const dz = Math.log(targetCam.z / cam.z);
      const dx = targetCam.cx - cam.cx;
      const dy = targetCam.cy - cam.cy;

      if (Math.abs(dz) > 0.0008 || Math.abs(dx) > 0.08 || Math.abs(dy) > 0.08) {
        const alpha = 0.28;
        cam.z = cam.z * Math.exp(dz * alpha);
        cam.cx += dx * alpha;
        cam.cy += dy * alpha;
        clampCamera(cam);
        return true;
      } else {
        cam.cx = targetCam.cx;
        cam.cy = targetCam.cy;
        cam.z = targetCam.z;
        return false;
      }
    }

    function scheduleFrame() {
      if (!rafId) rafId = requestAnimationFrame(renderFrame);
    }

    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function smoothstep(edge0, edge1, x) {
      const t = clamp01((x - edge0) / (edge1 - edge0));
      return t * t * (3 - 2 * t);
    }

    function computeExpandFactor(n, z) {
      if (n === ROOT || n.depth === 1) return 1;
      if (isFight(n)) return 0;
      const zp = n.parent.idealZ || 1;
      const zs = n.idealZ || (zp * 1.8);
      const z0 = zp * Math.pow(zs / zp, 0.25);
      const z1 = zp * Math.pow(zs / zp, 0.72);
      return smoothstep(z0, z1, z);
    }

    function renderFrame(now) {
      rafId = 0;
      if (! hostEl.isConnected) return;
      const moving = stepCamera(now);

      const z = cam.z;
      const viewLeft = cam.cx - (worldW / 2) / z;
      const viewTop = cam.cy - (worldH / 2) / z;
      const viewRight = viewLeft + worldW / z;
      const viewBottom = viewTop + worldH / z;

      ROOT._visAlpha = 1;
      ROOT._expandT = 1;

      for (const n of ALL) {
        if (n === ROOT) continue;
        const el = domById[n.id];
        const r = n.rect;
        const parent = n.parent;

        const visAlpha = (parent._visAlpha || 0) * (parent._expandT || 0);
        n._visAlpha = visAlpha;

        if (visAlpha <= 0.01 || r.x + r.w < viewLeft || r.x > viewRight || r.y + r.h < viewTop || r.y > viewBottom) {
          n._expandT = 0;
          if (el.style.display !== 'none') el.style.display = 'none';
          continue;
        }

        const sx = (r.x - viewLeft) * z;
        const sy = (r.y - viewTop) * z;
        const sw = r.w * z;
        const sh = r.h * z;
        const minSide = Math.min(sw, sh);

        const expandT = computeExpandFactor(n, z);
        n._expandT = expandT;

        if (el.style.display === 'none') el.style.display = '';
        el.style.opacity = visAlpha.toFixed(3);
        el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
        el.style.width = `${sw.toFixed(1)}px`;
        el.style.height = `${sh.toFixed(1)}px`;
        el.style.borderRadius = `${Math.max(8, Math.min(14, minSide * 0.045)).toFixed(1)}px`;

        if (isContainer(n)) {
          const headEl = el.children[0];
          const sumEl = el.children[1];

          if (headEl) {
            if (expandT <= 0.01) {
              headEl.style.display = 'none';
            } else {
              headEl.style.display = '';
              headEl.style.opacity = expandT.toFixed(3);
              const headH = (n.headH || r.h * 0.155) * z;
              headEl.style.height = `${headH.toFixed(1)}px`;
              const headFs = Math.max(13, Math.min(22, Math.min(headH * 0.48, sw * 0.055)));
              headEl.style.setProperty('--head-fs', `${headFs.toFixed(1)}px`);
            }
          }

          if (sumEl) {
            const sumAlpha = 1 - expandT;
            if (sumAlpha <= 0.01) {
              sumEl.style.display = 'none';
            } else {
              sumEl.style.display = '';
              sumEl.style.opacity = sumAlpha.toFixed(3);
              const pad = Math.max(9, Math.min(18, minSide * 0.08));
              const sumFs = Math.max(13.5, Math.min(21, Math.min(sh * 0.16, sw * 0.095)));
              sumEl.style.setProperty('--sum-pad', `${pad.toFixed(1)}px`);
              sumEl.style.setProperty('--sum-fs', `${sumFs.toFixed(1)}px`);

              const descEl = sumEl.querySelector('.kj-sum-desc');
              const pillsEl = sumEl.querySelector('.kj-sum-pills');
              if (descEl) descEl.style.display = (sh >= 130 && sw >= 180) ? '' : 'none';
              if (pillsEl) pillsEl.style.display = (sh >= 100 && sw >= 150) ? '' : 'none';
            }
          }
        } else if (isFight(n)) {
          const pad = Math.max(9, Math.min(18, minSide * 0.08));
          const titleFs = Math.max(13, Math.min(19, Math.min(sh * 0.15, sw * 0.09)));
          el.style.setProperty('--f-pad', `${pad.toFixed(1)}px`);
          el.style.setProperty('--ftitle-fs', `${titleFs.toFixed(1)}px`);

          const qEl = el.children[2];
          const goEl = el.children[3];
          const showDetail = smoothstep(120, 165, sh) * smoothstep(150, 195, sw);
          if (qEl) {
            qEl.style.display = showDetail > 0.02 ? '' : 'none';
            qEl.style.opacity = showDetail.toFixed(2);
          }
          if (goEl) {
            goEl.style.display = showDetail > 0.02 ? '' : 'none';
            goEl.style.opacity = showDetail.toFixed(2);
          }
        }
      }

      updateControlsReadout();
      if (manualCameraMode && !flight) syncContextNodeFromCamera();

      if (moving) scheduleFrame();
    }

    function syncContextNodeFromCamera() {
      const z = cam.z;
      if (z < 1.25) {
        if (focusedNode !== ROOT) setFocusedNode(ROOT);
        return;
      }
      let best = ROOT;
      let bestDist = Math.abs(Math.log(1 / z));
      let cur = ROOT;
      while (cur.kids && cur.kids.length) {
        let nextChild = null;
        for (const k of cur.kids) {
          if (isFight(k)) continue;
          const r = k.rect;
          if (cam.cx >= r.x && cam.cx <= r.x + r.w && cam.cy >= r.y && cam.cy <= r.y + r.h) {
            nextChild = k;
            break;
          }
        }
        if (!nextChild) break;
        const dist = Math.abs(Math.log((nextChild.idealZ || 1) / z));
        if (dist <= bestDist) {
          bestDist = dist;
          best = nextChild;
        }
        cur = nextChild;
      }
      if (best !== focusedNode) setFocusedNode(best);
    }

    function setFocusedNode(n) {
      focusedNode = n;
      const s = stats(n);
      const chain = [...ancestors(n), n];
      hostEl.querySelector('#kj-crumbs').innerHTML = chain.map((a, i) =>
        `${i ? '<span class="kj-sep">/</span>' : ''}<button type="button" class="${a === n ? 'active' : ''}" data-go="${a.id}">${esc(a.t)}</button>`
      ).join('');

      hostEl.querySelector('#kj-zoom-out').hidden = (n === ROOT && cam.z < 1.08);
      hostEl.querySelector('#kj-title').textContent = n.t;
      hostEl.querySelector('#kj-level-badge').textContent = LEVEL[n.depth];

      const parts = [];
      if (n.kids && n.kids.length) parts.push(`${n.kids.length} ${PLURAL[n.depth + 1]}`);
      if (n.d) parts.push(`<span class="muted">${esc(n.d)}</span>`);
      let subHtml = parts.join(' &middot; ');
      if (s.t) {
        const pct = (100 * s.p / s.t).toFixed(1);
        subHtml += ` <span class="kj-meter"><i style="width:${pct}%"></i></span> <span><b>${s.p}</b> of ${s.t} passed</span>`;
      }
      hostEl.querySelector('#kj-sub').innerHTML = subHtml;

      const modeBtn = hostEl.querySelector('#kj-mode-toggle');
      if (modeBtn) {
        modeBtn.textContent = useDemoRecord ? 'Showing: Demo record' : 'Showing: Your record';
      }

      const fightBtn = hostEl.querySelector('#kj-fight-here');
      if (n === ROOT) {
        fightBtn.style.display = 'none';
      } else {
        fightBtn.style.display = 'inline-flex';
        fightBtn.textContent = `Fight this ${LEVEL[n.depth].toLowerCase()}`;
      }
    }

    function updateControlsReadout() {
      hostEl.querySelector('#kj-zoom-readout').innerHTML = `${cam.z.toFixed(1)}&times;`;
      hostEl.querySelector('#kj-ctrl-out').disabled = cam.z <= 1.01 && focusedNode === ROOT;
      hostEl.querySelector('#kj-ctrl-in').disabled = cam.z >= MAX_ZOOM - 0.1;
      hostEl.querySelector('#kj-ctrl-reset').hidden = cam.z <= 1.05 && focusedNode === ROOT;
      hostEl.querySelector('#kj-zoom-out').hidden = (focusedNode === ROOT && cam.z <= 1.05);
    }

    function clientToWorld(clientX, clientY) {
      const rect = stage.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const viewLeft = cam.cx - (worldW / 2) / cam.z;
      const viewTop = cam.cy - (worldH / 2) / cam.z;
      return { wx: viewLeft + sx / cam.z, wy: viewTop + sy / cam.z, sx, sy };
    }

    function pickNodeAt(wx, wy) {
      let cur = ROOT;
      let picked = null;

      while (cur.kids && cur.kids.length) {
        if ((cur._expandT || 0) < 0.45) break;

        let hitChild = null;
        for (const k of cur.kids) {
          const r = k.rect;
          if (wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h) {
            hitChild = k;
            break;
          }
        }
        if (!hitChild) break;

        picked = hitChild;

        if (isContainer(hitChild) && (hitChild._expandT || 0) >= 0.45) {
          const headH = hitChild.headH || hitChild.rect.h * 0.155;
          if (wy <= hitChild.rect.y + headH) break;
        }

        cur = hitChild;
      }
      return picked;
    }

    function setHoveredNode(n) {
      if (hoveredNode === n) return;
      if (hoveredNode && domById[hoveredNode.id]) {
        domById[hoveredNode.id].classList.remove('hovered');
      }
      hoveredNode = n;
      if (hoveredNode && domById[hoveredNode.id]) {
        domById[hoveredNode.id].classList.add('hovered');
      }
    }

    function hideTip() { tip.style.opacity = 0; }

    function updateTooltip(e, n) {
      if (!n) return hideTip();
      let info = '';
      if (isFight(n)) {
        info = `${fightKickerText(n)} · Click to start fight`;
      } else {
        const s = stats(n);
        const action = (n === focusedNode) ? 'Click header to fight this level' : 'Click to zoom in';
        info = `${s.p} of ${s.t} passed · ${action}`;
      }

      tip.innerHTML = `
        <div class="kj-tip-top"><span class="kj-tip-lvl">${LEVEL[n.depth]}</span></div>
        <b>${esc(n.t)}</b>
        <div class="kj-tip-meta">${info}</div>
      `;

      const a = rootEl.getBoundingClientRect();
      let x = e.clientX - a.left + 14;
      let y = e.clientY - a.top + 16;
      const tw = tip.offsetWidth || 220;
      const th = tip.offsetHeight || 64;
      if (x + tw > a.width - 12) x = e.clientX - a.left - tw - 14;
      if (y + th > a.height - 12) y = e.clientY - a.top - th - 12;
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
      tip.style.opacity = 1;
    }

    let dragState = null;

    stage.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      stage.setPointerCapture(e.pointerId);
      dragState = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        moved: false,
      };
    });

    stage.addEventListener('pointermove', e => {
      if (dragState && e.pointerId === dragState.pointerId) {
        const dx = e.clientX - dragState.lastX;
        const dy = e.clientY - dragState.lastY;
        if (Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY) > 5) {
          dragState.moved = true;
          flight = null;
          manualCameraMode = true;
          stage.classList.add('dragging');
          hideTip();
        }
        if (dragState.moved) {
          cam.cx -= dx / cam.z;
          cam.cy -= dy / cam.z;
          clampCamera(cam);
          targetCam = { ...cam };
          dragState.lastX = e.clientX;
          dragState.lastY = e.clientY;
          scheduleFrame();
          return;
        }
      }

      const { wx, wy } = clientToWorld(e.clientX, e.clientY);
      const hit = pickNodeAt(wx, wy);
      setHoveredNode(hit);
      updateTooltip(e, hit);
    });

    stage.addEventListener('pointerup', e => {
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      const wasDrag = dragState.moved;
      dragState = null;
      stage.classList.remove('dragging');

      if (!wasDrag) {
        const { wx, wy } = clientToWorld(e.clientX, e.clientY);
        const hit = pickNodeAt(wx, wy);
        if (!hit) return;

        if (isFight(hit)) {
          flyToNode(hit.parent || ROOT);
          openSheet(hit);
        } else if (hit === focusedNode && Math.abs(Math.log(cam.z / (hit.idealZ || 1))) < 0.25) {
          openSheet(hit);
        } else {
          flyToNode(hit);
        }
      }
    });

    stage.addEventListener('mouseleave', () => {
      setHoveredNode(null);
      hideTip();
    });

    stage.addEventListener('wheel', e => {
      e.preventDefault();
      if (flight) {
        flight = null;
        targetCam = { ...cam };
      }
      manualCameraMode = true;

      const rect = stage.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      const viewLeft = targetCam.cx - (worldW / 2) / targetCam.z;
      const viewTop = targetCam.cy - (worldH / 2) / targetCam.z;
      const wx = viewLeft + sx / targetCam.z;
      const wy = viewTop + sy / targetCam.z;

      const delta = Math.max(-120, Math.min(120, e.deltaY));
      const factor = Math.exp(-delta * 0.0035);
      const newZ = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetCam.z * factor));

      const newViewLeft = wx - sx / newZ;
      const newViewTop = wy - sy / newZ;
      targetCam.z = newZ;
      targetCam.cx = newViewLeft + (worldW / 2) / newZ;
      targetCam.cy = newViewTop + (worldH / 2) / newZ;
      clampCamera(targetCam);

      scheduleFrame();
    }, { passive: false });

    function zoomStepOut() {
      closeSheet();
      if (!focusedNode || focusedNode === ROOT) {
        flyToNode(ROOT);
        return;
      }
      if (focusedNode.depth <= 2) {
        flyToNode(ROOT);
        return;
      }
      let anc = focusedNode.parent;
      while (anc && anc !== ROOT && (anc.idealZ || 1) >= cam.z * 0.85) {
        anc = anc.parent;
      }
      flyToNode(anc || ROOT);
    }

    hostEl.querySelector('#kj-zoom-out').addEventListener('click', zoomStepOut);
    hostEl.querySelector('#kj-ctrl-reset').addEventListener('click', () => { closeSheet(); flyToNode(ROOT); });
    hostEl.querySelector('#kj-ctrl-out').addEventListener('click', zoomStepOut);
    hostEl.querySelector('#kj-ctrl-in').addEventListener('click', () => {
      flight = null;
      manualCameraMode = true;
      targetCam.z = Math.min(MAX_ZOOM, targetCam.z * 1.65);
      clampCamera(targetCam);
      scheduleFrame();
    });

    hostEl.querySelector('#kj-crumbs').addEventListener('click', e => {
      const b = e.target.closest('[data-go]');
      if (b && byId[b.dataset.go]) {
        closeSheet();
        flyToNode(byId[b.dataset.go]);
      }
    });

    hostEl.querySelector('#kj-mode-toggle').addEventListener('click', () => {
      useDemoRecord = !useDemoRecord;
      applyRecordMode();
      refreshAllNodes();
    });

    function openSheet(n) {
      const path = n.virtual ? '' : ancestors(n).slice(1).map(a => esc(a.t)).join(' / ');
      let statusPill = '', blurb = '';

      if (n.virtual) {
        statusPill = `<span class="kj-status-pill">New Topic</span>`;
        blurb = `Nothing on the map matches “${esc(n.t)}” yet. You can still get grilled on it right now: Kenjitsu writes the five-round fight on the spot.`;
      } else if (isFight(n)) {
        if (n.s === 'pass') statusPill = `<span class="kj-status-pill passed">Passed &middot; ${n.sc}/100</span>`;
        else if (n.s === 'gap') statusPill = `<span class="kj-status-pill gap">Needs Rematch &middot; ${n.sc}/100</span>`;
        else statusPill = `<span class="kj-status-pill">${n.mod ? 'Ranked Module' : 'Ready to fight'}</span>`;
      } else {
        const s = stats(n);
        statusPill = `<span class="kj-status-pill ${s.p ? 'passed' : ''}">${s.p} of ${s.t} fights passed</span>`;
        blurb = esc(n.d || '');
      }

      const level = n.virtual ? 'Custom Fight' : LEVEL[n.depth];
      sheet.innerHTML = `
        <button type="button" class="kj-x" data-close aria-label="Close">&times;</button>
        <div class="kj-path">${path}</div>
        <div class="kj-lvl-row">
          <span class="kj-lvl">${level}</span>
          ${statusPill}
        </div>
        <h2>${esc(n.t)}</h2>
        ${blurb ? `<p class="kj-blurb">${blurb}</p>` : ''}
        <div class="kj-label">Opening Question</div>
        <blockquote>${esc(n.virtual ? `Explain the core mechanism of ${n.t} in plain words, and show where a naive explanation goes wrong.` : opener(n))}</blockquote>
        <div class="kj-label">Five Rounds</div>
        <ol class="kj-rounds">
          <li><span>01</span>Explain it simply (jargon flagged)</li>
          <li><span>02</span>What if it changes?</li>
          <li><span>03</span>Find the flaw in the exhibit</li>
          <li><span>04</span>Apply to a new case</li>
          <li><span>05</span>Rematch on your weakest point</li>
        </ol>
        <div class="kj-actions">
          <button type="button" class="btn primary" data-launch="1">${isFight(n) && n.s === 'pass' ? 'Fight again' : 'Start fight'} &rarr;</button>
          ${n.mod ? `<a class="btn" href="#/create?fork=${encodeURIComponent(n.mod)}">Fork / Edit &#9998;</a>` : ''}
          ${isFight(n) && n.s !== 'pass' ? `<button type="button" class="btn ghost" data-pass="${n.id}">Simulate a pass</button>` : ''}
        </div>
      `;
      sheet._currentNode = n;
      sheet.classList.add('open');
      scrim.classList.add('open');
    }

    function closeSheet() {
      sheet.classList.remove('open');
      scrim.classList.remove('open');
    }

    sheet.addEventListener('click', e => {
      if (e.target.closest('[data-close]')) return closeSheet();
      const launch = e.target.closest('[data-launch]');
      if (launch && sheet._currentNode) {
        const node = sheet._currentNode;
        if (onStartFight) onStartFight(node, launch);
        return;
      }
      const p = e.target.closest('[data-pass]');
      if (p) {
        const n = byId[p.dataset.pass];
        if (!n) return;
        n.s = 'pass';
        n.sc = Math.max(n.sc || 0, 90);
        closeSheet();
        refreshAllNodes();
        const el = domById[n.id];
        if (el) {
          el.classList.remove('ping');
          void el.offsetWidth;
          el.classList.add('ping');
        }
      }
    });

    scrim.addEventListener('click', closeSheet);
    hostEl.querySelector('#kj-fight-here').addEventListener('click', () => openSheet(focusedNode));

    // Search
    const SUGGEST = [
      'Peng Dehuai and the 1959 Lushan Conference',
      'Direct Preference Optimization (DPO)',
      'The lac operon as an AND gate',
      'Judge Learned Hand’s B < PL formula',
      'Bayes’ theorem and base rates',
      'Consistent hashing'
    ];
    let hits = [], sel = 0;

    function pathText(n) { return ancestors(n).slice(1).map(a => a.t).join(' › '); }

    function searchNodes(text) {
      const s = text.trim().toLowerCase();
      if (!s) return [];
      const scored = [];
      for (const n of ALL) {
        if (n === ROOT) continue;
        const t = n.t.toLowerCase();
        let sc = 0;
        if (t.startsWith(s)) sc = 100;
        else if (t.split(/[\s–-]+/).some(w => w.startsWith(s))) sc = 85;
        else if (t.includes(s)) sc = 70;
        else if ((n.d || '').toLowerCase().includes(s) || (n.q || '').toLowerCase().includes(s)) sc = 40;
        if (sc) scored.push([sc - n.depth * 0.4, n]);
      }
      return scored.sort((a, b) => b[0] - a[0]).slice(0, 7).map(x => x[1]);
    }

    function highlightMatch(t, s) {
      const i = t.toLowerCase().indexOf(s.toLowerCase());
      if (!s || i < 0) return esc(t);
      return esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + s.length)) + '</mark>' + esc(t.slice(i + s.length));
    }

    function swatch(n) {
      if (isFight(n)) {
        if (n.s === 'pass') return '<i class="sw" style="background:var(--seal)"></i>';
        if (n.s === 'gap') return '<i class="sw" style="background:var(--warn);border-radius:50%"></i>';
      }
      return '';
    }

    function renderResults() {
      const text = q.value.trim();
      if (!text) {
        if (externalInput) {
          closeResults();
          return;
        }
        results.innerHTML = `
          <div class="kj-sugg">
            <p>Jump straight to a topic or fight</p>
            <div class="kj-chips">
              ${SUGGEST.map(s => `<button type="button" class="kj-chip" data-chip="${esc(s)}">${esc(s)}</button>`).join('')}
            </div>
          </div>`;
        results.classList.add('open');
        return;
      }
      hits = searchNodes(text);
      if (externalInput) {
        if (!hits.length) {
          closeResults();
          return;
        }
        sel = Math.min(sel, hits.length - 1);
        results.innerHTML = `
          <div class="kj-sugg" style="padding:6px 10px 4px"><p style="margin:0">Matching tiles in the Knowledge Atlas below (click to zoom, or press Enter to start a custom fight)</p></div>
          ${hits.map((n, i) => `
          <div class="kj-res ${i === sel ? 'on' : ''}" data-hit="${i}">
            <div>
              <div class="rt">${highlightMatch(n.t, text)}</div>
              <div class="rp">${esc(pathText(n))}</div>
            </div>
            <div class="rl">${swatch(n)}${LEVEL[n.depth]} &middot; Zoom &darr;</div>
          </div>`).join('')}`;
        results.classList.add('open');
        return;
      }
      sel = Math.min(sel, Math.max(0, hits.length - 1));
      if (!hits.length) {
        results.innerHTML = `
          <div class="kj-res on" data-new="1">
            <div>
              <div class="rt">Grill me on “${esc(text)}”</div>
              <div class="rp">Press Enter to generate a five-round fight on the spot.</div>
            </div>
            <div class="rl">New</div>
          </div>`;
      } else {
        results.innerHTML = hits.map((n, i) => `
          <div class="kj-res ${i === sel ? 'on' : ''}" data-hit="${i}">
            <div>
              <div class="rt">${highlightMatch(n.t, text)}</div>
              <div class="rp">${esc(pathText(n))}</div>
            </div>
            <div class="rl">${swatch(n)}${LEVEL[n.depth]}</div>
          </div>`).join('');
      }
      results.classList.add('open');
    }

    function closeResults() { results.classList.remove('open'); }

    function selectSearchHit(n) {
      closeResults();
      if (!externalInput) q.value = '';
      q.blur();
      closeSheet();
      flyToNode(n);
      const el = domById[n.id];
      if (el) {
        el.classList.remove('ping');
        void el.offsetWidth;
        el.classList.add('ping');
      }
      if (isFight(n)) {
        setTimeout(() => openSheet(n), 450);
      }
    }

    function selectNewTopic(text) {
      closeResults();
      if (!externalInput) q.value = '';
      q.blur();
      openSheet({ t: text, virtual: true });
    }

    q.addEventListener('focus', () => {
      if (!externalInput || q.value.trim()) renderResults();
    });
    q.addEventListener('input', () => { sel = externalInput ? -1 : 0; renderResults(); });
    q.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') {
        if (!results.classList.contains('open') && hits.length) {
          e.preventDefault();
          sel = 0;
          renderResults();
          return;
        }
        if (results.classList.contains('open')) {
          e.preventDefault();
          sel = Math.min(sel + 1, Math.max(0, hits.length - 1));
          renderResults();
        }
      } else if (e.key === 'ArrowUp') {
        if (results.classList.contains('open')) {
          e.preventDefault();
          sel = Math.max(sel - 1, externalInput ? -1 : 0);
          renderResults();
        }
      } else if (e.key === 'Enter') {
        if (externalInput) {
          if (results.classList.contains('open') && sel >= 0 && hits[sel]) {
            e.preventDefault();
            selectSearchHit(hits[sel]);
          } else {
            closeResults();
          }
          return;
        }
        e.preventDefault();
        const text = q.value.trim();
        if (!text) return;
        if (hits.length) selectSearchHit(hits[sel]);
        else selectNewTopic(text);
      } else if (e.key === 'Escape') {
        closeResults();
        q.blur();
        e.stopPropagation();
      }
    });

    results.addEventListener('mousedown', e => {
      e.preventDefault();
      const chip = e.target.closest('[data-chip]');
      if (chip) {
        const h = searchNodes(chip.dataset.chip);
        if (h.length) selectSearchHit(h[0]);
        return;
      }
      const r = e.target.closest('[data-hit]');
      if (r) return selectSearchHit(hits[+r.dataset.hit]);
      if (e.target.closest('[data-new]')) selectNewTopic(q.value.trim());
    });

    results.addEventListener('mousemove', e => {
      const r = e.target.closest('[data-hit]');
      if (r && +r.dataset.hit !== sel) {
        sel = +r.dataset.hit;
        results.querySelectorAll('.kj-res').forEach((x, i) => x.classList.toggle('on', i === sel));
      }
    });

    q.addEventListener('blur', () => setTimeout(closeResults, 140));

    const onKeyDown = e => {
      if (!hostEl.isConnected) {
        window.removeEventListener('keydown', onKeyDown);
        return;
      }
      if (e.key === '/' && document.activeElement !== q && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        q.focus();
        return;
      }
      if (e.key === 'Escape') {
        if (sheet.classList.contains('open')) closeSheet();
        else if (focusedNode !== ROOT || cam.z > 1.05) zoomStepOut();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    applyRecordMode();
    buildWorldDOM();

    function initOrResize() {
      if (!hostEl.isConnected) return;
      const W = stage.clientWidth || 1000;
      const H = stage.clientHeight || 560;
      computeWorldLayout(W, H);
      const goal = cameraForNode(focusedNode);
      cam = { ...goal };
      targetCam = { ...goal };
      flight = null;
      scheduleFrame();
    }

    let lastSize = '';
    const ro = new ResizeObserver(() => {
      if (!hostEl.isConnected) { ro.disconnect(); return; }
      const size = `${stage.clientWidth}x${stage.clientHeight}`;
      if (size === lastSize) return;
      lastSize = size;
      initOrResize();
    });
    ro.observe(stage);

    setFocusedNode(ROOT);
    initOrResize();

    // Fetch live user history in the background to sync passed modules/topics
    fetch('/api/me', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data.history)) {
          liveHistory = data.history;
          applyRecordMode();
          refreshAllNodes();
        }
      })
      .catch(() => {});
  };
})();
