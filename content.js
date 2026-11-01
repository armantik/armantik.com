/*
  content.js: the one file you edit to add things to armantik.com.

  HOW TO
  1. Add an article, post or talk: copy one block in WRITING or TALKS, change the values, save, push.
  2. Add a lab guide: put the HTML file in /lab/ and copy one block in LAB.
  3. Hide something without deleting it: set  hidden: true  on that block.
  4. Hide or show a whole section: change the switch in SHOW below.
  5. Change the services: edit the SERVICES list (switch the whole section with show.services).
  6. Preview hidden things on the live site: open  https://armantik.com/?preview
     Hidden sections and items then appear with a yellow "hidden" tag. Nobody else sees them.

  RULES
  - Dates are "YYYY-MM-DD" (or "YYYY-MM" if you only know the month). Lists sort newest first.
  - "href" for your own pages is relative to the site root, like "lab/two-sum.html".
    Anything starting with https:// opens in a new tab.
  - Keep every value in "double quotes" and end each block with a comma.
*/

window.SITE = {

  /* ---------- SHOW: switch whole sections on (true) or off (false) ---------- */
  show: {
    writing: true,       // articles and posts
    talks: false,        // conference talks and meetups
    kairos: true,        // the "Now building" section
    services: false,     // the "How I can help" section (off until side work is approved)
    help: true,          // the "How I help" pages (/help/): their links in the menus, on the home page and on the card
    persianName: false   // your name in Persian in the footer (spelling is ready, just switch it on)
  },

  /* ---------- LINKS: leave a value empty ("") to hide that button ---------- */
  links: {
    // Your email is not written anywhere as text, so spam bots can't collect it. It is stored as scrambled
    // bytes, and pages only put it together after a person taps, scrolls or types. To change it, see
    // "Your email address and phone number" in README.md. Set it to [] to hide the email everywhere.
    emailBytes: [227, 115, 230, 230, 39, 231, 104, 235, 169, 33, 252, 125, 197, 166, 45, 227, 110, 228],
    // Your phone number is not here on purpose: it lives only on the card page (card/index.html).
    linkedin: "https://www.linkedin.com/in/arman-ajabkhani/",
    github: "",          // e.g. "https://github.com/your-username"
    medium: "https://armantik.medium.com/",
    // The "Ask me" buttons open this Google Form (owned by your Google account, answers go to the
    // "Ask Arman (Responses)" sheet). Set it to "" to hide every Ask me button.
    ask: "https://docs.google.com/forms/d/e/1FAIpQLSc_x_prXVaSssiuNMqdATwNN5P5FHgB2FE7v49tN9TM30wnEQ/viewform",
    // The id of the form's "What do you need help with?" question, so a button on the interview prep
    // page opens the form with Interview prep already ticked. Find it with Get pre-filled link in the form.
    askTopicField: "entry.755961089"
  },

  /* ---------- LAB GROUPS: the three categories, in the order they appear ---------- */
  groups: [
    {
      id: "system-design",
      title: "System design",
      summary: "How real systems are put together: scaling from one server to millions, rate limiting, and the patterns behind AI systems."
    },
    {
      id: "algorithms",
      title: "Algorithms",
      summary: "Classic coding problems, each solved several ways and run step by step next to the Java code. Links point to the problem statements; the solutions are my own."
    },
    {
      id: "java",
      title: "Java",
      summary: "Collections, concurrency, Spring, the JVM and everything around a Java backend, as a field guide and a searchable question bank."
    }
  ],

  /* ---------- LAB: interactive guides. group is one of the ids above ----------
     problems (optional): links to the problem statement on LeetCode and NeetCode. */
  lab: [
    /* System design */
    {
      title: "System Design Casebook",
      href: "lab/system-design-casebook.html",
      group: "system-design",
      summary: "From one server to millions of users: foundations, building blocks, simulators and 14 case studies from a URL shortener to a payment system.",
      tags: ["14 case studies", "simulators"]
    },
    {
      title: "Rate Limiter",
      href: "lab/rate-limiter.html",
      group: "system-design",
      summary: "Fixed window, sliding log, sliding counter and token bucket get the same traffic side by side. Watch which requests each one lets through.",
      tags: ["4 algorithms", "live traffic"]
    },
    {
      title: "AI Engineering Patterns",
      href: "lab/ai-engineering-patterns.html",
      group: "system-design",
      summary: "When to reach for prompting, RAG, workflows, agents or several agents, what each one costs, and a ticket to PR pipeline as a worked example.",
      tags: ["field guide", "Spring AI and LangGraph"]
    },

    /* Algorithms */
    {
      title: "Two Sum",
      href: "lab/two-sum.html",
      group: "algorithms",
      summary: "Brute force, sort with two pointers, and two hash map versions, each run step by step next to its Java code.",
      tags: ["4 solutions", "hash map"],
      problems: [
        { site: "LeetCode", label: "1. Two Sum", href: "https://leetcode.com/problems/two-sum/" },
        { site: "NeetCode", href: "https://neetcode.io/problems/two-integer-sum" }
      ]
    },
    {
      title: "Merge Intervals",
      href: "lab/merge-intervals.html",
      group: "algorithms",
      summary: "Sort and sweep once, build an overlap graph, or sweep a line over start and end events.",
      tags: ["3 solutions", "sorting"],
      problems: [
        { site: "LeetCode", label: "56. Merge Intervals", href: "https://leetcode.com/problems/merge-intervals/" },
        { site: "NeetCode", href: "https://neetcode.io/problems/merge-intervals" }
      ]
    },
    {
      title: "Kth Largest Element",
      href: "lab/kth-largest.html",
      group: "algorithms",
      summary: "Sorting, a min heap, quickselect and counting, with every comparison and swap on screen.",
      tags: ["4 solutions", "heap"],
      problems: [
        { site: "LeetCode", label: "215. Kth Largest Element in an Array", href: "https://leetcode.com/problems/kth-largest-element-in-an-array/" },
        { site: "NeetCode", href: "https://neetcode.io/problems/kth-largest-element-in-an-array" }
      ]
    },
    {
      title: "Number of Islands",
      href: "lab/number-of-islands.html",
      group: "algorithms",
      summary: "Recursive DFS, BFS, an explicit stack and Union-Find on a map you can edit by clicking cells.",
      tags: ["4 solutions", "graphs"],
      problems: [
        { site: "LeetCode", label: "200. Number of Islands", href: "https://leetcode.com/problems/number-of-islands/" },
        { site: "NeetCode", href: "https://neetcode.io/problems/count-number-of-islands" }
      ]
    },
    {
      title: "Word Search",
      href: "lab/word-search.html",
      group: "algorithms",
      summary: "Three backtracking versions: watch a path grow letter by letter, hit a dead end, and get undone.",
      tags: ["backtracking", "pruning"],
      problems: [
        { site: "LeetCode", label: "79. Word Search", href: "https://leetcode.com/problems/word-search/" },
        { site: "NeetCode", href: "https://neetcode.io/problems/search-for-word" }
      ]
    },
    {
      title: "BFS and DFS",
      href: "lab/bfs-dfs.html",
      group: "algorithms",
      summary: "Breadth first and depth first search on a graph and a tree. The queue or the stack is the only real difference.",
      tags: ["graph and tree", "foundations"]
    },
    {
      title: "LRU and LFU Cache",
      href: "lab/lru-lfu-cache.html",
      group: "algorithms",
      summary: "How each cache picks what to evict, one operation at a time, with diagrams of the data structures underneath.",
      tags: ["design", "O(1) operations"],
      problems: [
        { site: "LeetCode", label: "146. LRU Cache", href: "https://leetcode.com/problems/lru-cache/" },
        { site: "NeetCode", label: "LRU Cache", href: "https://neetcode.io/problems/lru-cache" },
        { site: "LeetCode", label: "460. LFU Cache", href: "https://leetcode.com/problems/lfu-cache/" },
        { site: "NeetCode", label: "LFU Cache", href: "https://neetcode.io/problems/lfu-cache" }
      ]
    },
    {
      title: "Logger Rate Limiter",
      href: "lab/logger-rate-limiter.html",
      group: "algorithms",
      summary: "Three ways to suppress repeated log messages within 10 seconds, and how much each one keeps in memory.",
      tags: ["design", "3 solutions"],
      problems: [
        { site: "LeetCode", label: "359. Logger Rate Limiter", href: "https://leetcode.com/problems/logger-rate-limiter/" },
        { site: "NeetCode", href: "https://neetcode.io/problems/logger-rate-limiter" }
      ]
    },
    {
      title: "Hit Counter",
      href: "lab/hit-counter.html",
      group: "algorithms",
      summary: "A queue of timestamps against a ring of buckets: same answers, very different memory under heavy traffic.",
      tags: ["design", "2 solutions"],
      problems: [
        { site: "LeetCode", label: "362. Design Hit Counter", href: "https://leetcode.com/problems/design-hit-counter/" },
        { site: "NeetCode", href: "https://neetcode.io/problems/design-hit-counter" }
      ]
    },

    /* Java */
    {
      title: "Java Collections Field Guide",
      href: "lab/java-collections.html",
      group: "java",
      summary: "Every collection worth knowing: what each operation costs, which problems it solves, and the mistakes that bite.",
      tags: ["complexity table", "pitfalls"]
    },
    {
      title: "Senior Java Backend Guide",
      href: "lab/java-backend-guide.html",
      group: "java",
      summary: "243 questions from Java fundamentals and concurrency to Spring, databases, Kafka, Kubernetes and production troubleshooting, each marked Basic or Advanced, with a short answer, code and follow-ups.",
      tags: ["243 questions", "22 topics", "basic and advanced"]
    }
  ],

  /* ---------- SERVICES: what you can help with (switch: show.services) ----------
     Each block is one card: a title, one sentence, and up to four points. */
  services: [
    {
      title: "System design and architecture review",
      summary: "A second pair of eyes on a design before you build it, or on a system that is starting to hurt.",
      points: ["Design document and API review", "Data model, consistency and scaling tradeoffs", "A written report with clear recommendations"]
    },
    {
      title: "Production readiness and reliability",
      summary: "Find the weak spots in a running system before your users do.",
      points: ["Performance and capacity check", "Failure modes, retries, timeouts and idempotency", "Observability gaps: metrics, tracing and alerts"]
    },
    {
      title: "AI in your backend",
      summary: "Bring LLMs into Java, Go or Python services in a way you can test, monitor and trust.",
      points: ["MCP servers and tool integrations", "RAG pipelines and agent workflows in Python (LangChain, LangGraph) or Java (Spring AI)", "Evals, guardrails and cost control"]
    },
    {
      title: "Modern Java and the JVM",
      summary: "Get more out of the platform you already run.",
      points: ["Upgrades to modern Java", "Virtual threads and concurrency", "Profiling, GC and dependency hygiene"]
    },
    {
      title: "Technical hiring",
      summary: "Interviews that find strong backend engineers and treat candidates well.",
      points: ["Design your interview loop and exercises", "System design and coding interviews", "Calibration with your team"]
    },
    {
      title: "Mentoring and team workshops",
      summary: "Help engineers grow toward senior and staff, using the Learning Lab as material.",
      points: ["One to one mentoring", "Workshops on system design, Java or AI engineering", "Onboarding paths for new joiners"]
    }
  ],

  /* ---------- WRITING: articles and posts ----------
     source: "Medium", "LinkedIn" or "armantik.com" (for pages in /writing/)
     Sorted newest first. The date is not shown on the site; it only sets the order.
     The home page shows the five newest. */
  writing: [
    {
      title: "Stop fighting the JVM garbage collector",
      date: "2026-10-08",
      href: "https://www.linkedin.com/feed/update/urn:li:activity:7513825841739350019/",
      source: "LinkedIn",
      summary: "The heap problem is usually the dependency tree, not the GC. Trust the collector until profiling proves otherwise."
    },
    {
      title: "Java finally gets a JSON API in the JDK",
      date: "2026-10-06",
      href: "https://www.linkedin.com/feed/update/urn:li:activity:7513103698508632064/",
      source: "LinkedIn",
      summary: "A small JSON API is coming to the JDK as an incubator: parse and navigate JSON with no library. Jackson keeps its job."
    },
    {
      title: "When a coding agent leaks your screenshots",
      date: "2026-10-03",
      href: "https://www.linkedin.com/feed/update/urn:li:activity:7512109223464521728/",
      source: "LinkedIn",
      summary: "The PixelLeak study, and why guardrails for agents belong at the level of actions, not prompts."
    },
    {
      title: "AI can do the work. It can't replace understanding",
      date: "2026-09-27",
      href: "https://www.linkedin.com/feed/update/urn:li:activity:7509924046482849792/",
      source: "LinkedIn",
      summary: "Writing code matters less every year. Knowing when an answer is wrong matters more."
    },
    {
      title: "Where does Rust land in an MCP benchmark? I tried to find out",
      date: "2026-02-22",
      href: "https://armantik.medium.com/where-does-rust-land-in-an-mcp-benchmark-i-tried-to-find-out-4695909717b8",
      source: "Medium",
      summary: "I added a Rust server to an MCP benchmark of Java, Go, Node.js and Python. Rust served 4,806 requests a second in 10 MB of memory; Java and Go were faster, and every Rust tool call hit a 42 ms floor."
    },
    {
      title: "Resolving conflicts in teams: a real scenario and lessons learned",
      date: "2025-02-02",
      href: "https://armantik.medium.com/resolving-conflicts-in-teams-a-real-scenario-and-lessons-learned-a67e51e99e25",
      source: "Medium",
      summary: "An older Medium post. Remove hidden: true to show it.",
      hidden: true
    },
    {
      title: "Semantic versioning: clarity and predictability in software development",
      date: "2024-07-14",
      href: "https://armantik.medium.com/semantic-versioning-clarity-and-predictability-in-software-development-2c71ec350ab7",
      source: "Medium",
      summary: "An older Medium post. Remove hidden: true to show it.",
      hidden: true
    }
    /* Example of an article hosted on this site:
    ,{
      title: "What a year of AI-assisted Java taught me",
      date: "2026-11-02",
      href: "writing/2026-11-ai-assisted-java.html",
      source: "armantik.com",
      summary: "One sentence that makes people want to click."
    }
    */
  ],

  /* ---------- TALKS (hidden until show.talks is true) ---------- */
  talks: [
    /*
    {
      title: "Talk title",
      date: "2026-11-05",
      event: "Øredev, Malmö",
      href: "https://link-to-slides-or-video",
      summary: "One line about the talk."
    }
    */
  ]
};
