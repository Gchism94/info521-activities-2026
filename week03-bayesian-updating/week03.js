/* Week 3 — Bayesian updating (Beta-Binomial). Quiz layer over the reused demo.
   Notation matches the demo: r = P(heads), Beta(a,b) prior, posterior Beta(a+H, b+T). */
(function () {
  'use strict';
  var CONFIG = {
    unitId: 'week03-bayesian-updating',
    unitNumber: 3,
    token: 'BAYESUP-5K1D',         // rotate per term; add to your week->token map
    masteryThreshold: 0.8,
    quizPerAttempt: null,
    quiz: [
      { stem: 'Bayes\u2019 theorem says the posterior is proportional to\u2026', options: [
        { text: '$p(r \\mid D) \\propto p(D \\mid r)\\,p(r)$ (likelihood \u00d7 prior)', correct: true, feedback: 'Correct \u2014 posterior \u221d likelihood \u00d7 prior.' },
        { text: '$p(r \\mid D) \\propto p(D \\mid r) / p(r)$', correct: false, feedback: 'No \u2014 you multiply by the prior, not divide.' },
        { text: '$p(r \\mid D) \\propto p(r)$ alone', correct: false, feedback: 'That ignores the data through the likelihood.' },
        { text: '$p(r \\mid D) \\propto p(D)$ alone', correct: false, feedback: '$p(D)$ is just the normalizing constant.' }
      ]},
      { stem: 'With $a = b = 1$ (the tool\u2019s default), the Beta$(1,1)$ prior is\u2026', options: [
        { text: 'uniform on $[0,1]$ \u2014 every value of $r$ equally likely', correct: true, feedback: 'Correct \u2014 Beta$(1,1)$ is the flat, uniform prior.' },
        { text: 'sharply peaked at $r = 0.5$', correct: false, feedback: 'That would be a large-$a,b$ prior.' },
        { text: 'zero everywhere except $r = 0.5$', correct: false, feedback: 'No \u2014 it is flat across all $r$.' },
        { text: 'undefined', correct: false, feedback: 'Beta$(1,1)$ is perfectly well defined \u2014 the uniform.' }
      ]},
      { stem: 'The Beta prior is called <em>conjugate</em> to the Binomial likelihood because\u2026', options: [
        { text: 'the posterior is again a Beta, so updating stays in closed form', correct: true, feedback: 'Correct \u2014 conjugacy keeps prior and posterior in one family.' },
        { text: 'the prior and likelihood are equal', correct: false, feedback: 'They are different objects.' },
        { text: 'it requires no data', correct: false, feedback: 'You still update on data.' },
        { text: 'it makes $r$ deterministic', correct: false, feedback: '$r$ stays a distribution, just a sharper one.' }
      ]},
      { stem: 'Starting from Beta$(a, b)$ and observing $H$ heads and $T$ tails, the posterior is\u2026', options: [
        { text: 'Beta$(a + H,\\; b + T)$', correct: true, feedback: 'Correct \u2014 heads increment $a$, tails increment $b$. Exactly what the tool computes.' },
        { text: 'Beta$(a + T,\\; b + H)$', correct: false, feedback: 'Swapped \u2014 heads go with $a$.' },
        { text: 'Beta$(aH,\\; bT)$', correct: false, feedback: 'Counts add, they do not multiply.' },
        { text: 'Beta$(a - T,\\; b - H)$', correct: false, feedback: 'Updating adds counts, it does not subtract.' }
      ]},
      { stem: 'As you add tosses in the tool, the posterior-variance plot\u2026', options: [
        { text: 'decreases \u2014 the distribution concentrates as evidence accumulates', correct: true, feedback: 'Correct \u2014 more data \u2192 narrower posterior \u2192 more certainty about $r$.' },
        { text: 'increases without bound', correct: false, feedback: 'Evidence sharpens belief, not the reverse.' },
        { text: 'stays constant', correct: false, feedback: 'It shrinks as tosses accumulate.' },
        { text: 'oscillates around the prior variance', correct: false, feedback: 'It trends downward, not oscillating.' }
      ]},
      { stem: 'With a weak prior and many tosses, the posterior mean $(a+H)/(a+b+H+T)$ approaches\u2026', options: [
        { text: 'the observed fraction of heads, $H/(H+T)$', correct: true, feedback: 'Correct \u2014 with lots of data the likelihood swamps the prior.' },
        { text: 'the prior mean $a/(a+b)$', correct: false, feedback: 'The data dominates once there are many tosses.' },
        { text: '$0.5$ always', correct: false, feedback: 'Only if the data happens to be balanced.' },
        { text: '$1 - H/(H+T)$', correct: false, feedback: 'No \u2014 it approaches the heads fraction itself.' }
      ]},
      { stem: 'A strong prior (large $a$ and $b$) means\u2026', options: [
        { text: 'it takes more data to move the posterior \u2014 the prior acts like many prior observations', correct: true, feedback: 'Correct \u2014 large $a,b$ are many pseudo-counts that resist the data.' },
        { text: 'the data is ignored entirely', correct: false, feedback: 'It still updates, just slowly.' },
        { text: 'the posterior equals the likelihood', correct: false, feedback: 'That is the flat-prior case.' },
        { text: 'the prior variance is large', correct: false, feedback: 'A strong prior is narrow, not wide.' }
      ]},
      { stem: 'Interpreting $a$ and $b$ as pseudo-counts, raising $a$ expresses\u2026', options: [
        { text: 'a stronger prior belief that $r$ is high (more prior \u201cheads\u201d)', correct: true, feedback: 'Correct \u2014 $a$ behaves like prior heads-counts.' },
        { text: 'more observed tails', correct: false, feedback: 'That is $b$.' },
        { text: 'a flatter prior', correct: false, feedback: 'It sharpens the prior toward high $r$.' },
        { text: 'a smaller sample size', correct: false, feedback: 'Larger $a$ means more prior weight, not less.' }
      ]},
      { stem: 'The Binomial/Bernoulli likelihood of the data given $r$ is proportional to\u2026', options: [
        { text: '$r^{H}(1-r)^{T}$', correct: true, feedback: 'Correct \u2014 each head contributes $r$, each tail $(1-r)$.' },
        { text: '$r^{T}(1-r)^{H}$', correct: false, feedback: 'Heads carry the $r$ exponent, not tails.' },
        { text: '$r^{H} + (1-r)^{T}$', correct: false, feedback: 'It is a product over tosses, not a sum.' },
        { text: '$Hr + T(1-r)$', correct: false, feedback: 'That is not a likelihood.' }
      ]},
      { stem: 'The maximum-likelihood estimate of $r$ (ignoring the prior) is\u2026', options: [
        { text: '$H/(H+T)$, the empirical fraction of heads', correct: true, feedback: 'Correct \u2014 the MLE is the raw data fraction; the posterior mean pulls it toward the prior.' },
        { text: '$a/(a+b)$, the prior mean', correct: false, feedback: 'That uses the prior, so it is not the MLE.' },
        { text: 'the posterior mean', correct: false, feedback: 'The posterior mean blends prior and data.' },
        { text: 'always $0.5$', correct: false, feedback: 'Only for balanced data.' }
      ]},
      { stem: 'The marginal likelihood (evidence) $p(D)$ in Bayes\u2019 rule\u2026', options: [
        { text: 'normalizes the posterior so it integrates to 1; it does not depend on $r$', correct: true, feedback: 'Correct \u2014 it is the normalizing constant, constant with respect to $r$.' },
        { text: 'is the same as the prior', correct: false, feedback: 'They are different quantities.' },
        { text: 'determines the MLE', correct: false, feedback: 'The MLE comes from the likelihood alone.' },
        { text: 'changes the shape of the posterior over $r$', correct: false, feedback: 'Being constant in $r$, it only rescales.' }
      ]},
      { stem: 'The tool adds tosses one at a time. Updating toss-by-toss vs. all at once gives\u2026', options: [
        { text: 'the same posterior \u2014 it depends only on the counts $H$ and $T$, not their order', correct: true, feedback: 'Correct \u2014 sequential and batch updating agree (exchangeability).' },
        { text: 'a different posterior depending on order', correct: false, feedback: 'Order does not matter for this model.' },
        { text: 'a posterior only if heads come first', correct: false, feedback: 'Order is irrelevant.' },
        { text: 'a wider posterior if updated sequentially', correct: false, feedback: 'Same counts \u2192 same posterior.' }
      ]},
      { stem: 'As the number of tosses grows very large, the posterior\u2026', options: [
        { text: 'concentrates around the true $r$ regardless of a reasonable prior \u2014 the prior \u201cwashes out\u201d', correct: true, feedback: 'Correct \u2014 with enough data the prior\u2019s influence vanishes.' },
        { text: 'stays centered on the prior mean', correct: false, feedback: 'The data dominates eventually.' },
        { text: 'becomes the uniform distribution', correct: false, feedback: 'It narrows, not flattens.' },
        { text: 'depends entirely on the prior', correct: false, feedback: 'The opposite \u2014 the prior washes out.' }
      ]}
    ]
  };

  PL.mountQuiz(document.getElementById('quiz'), CONFIG);
})();
