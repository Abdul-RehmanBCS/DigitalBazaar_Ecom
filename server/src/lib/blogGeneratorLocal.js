const AUTHORS = [
  "Sarah Chen",
  "James Okonkwo",
  "Mia Rodriguez",
  "Alex Kim",
  "Priya Sharma",
  "Digital Bazaar Team"
];

function pick(arr, seed = 0) {
  return arr[Math.abs(seed) % arr.length];
}

function hashTitle(title) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h + title.charCodeAt(i) * (i + 1)) % 9973;
  return h;
}

function inferTags(title) {
  const t = title.toLowerCase();
  const tags = new Set(["Digital Products", "Digital Bazaar"]);
  const rules = [
    [/figma|ui kit|design system|component/i, "Figma"],
    [/template|theme|wordpress/i, "Templates"],
    [/font|typography/i, "Fonts"],
    [/icon|illustration/i, "Icons"],
    [/saas|startup|founder/i, "SaaS"],
    [/license|legal|commercial/i, "Licensing"],
    [/ai|prompt|chatgpt|automation/i, "AI"],
    [/marketing|seo|conversion/i, "Marketing"],
    [/developer|code|react|tailwind/i, "Development"],
    [/ecommerce|shop|store/i, "E-commerce"]
  ];
  for (const [re, tag] of rules) {
    if (re.test(t)) tags.add(tag);
  }
  return [...tags].slice(0, 5);
}

function buildParagraphs(title) {
  const t = title.toLowerCase();
  const intro = `${title} matters more than ever for teams building and selling digital products. Whether you are a founder, designer, or developer, a clear strategy helps you move faster without sacrificing quality.`;

  let body1 =
    "Start by writing down your constraints: budget, timeline, tech stack, and brand guidelines. Compare at least three options against those criteria instead of chasing trends alone.";
  let body2 =
    "Quality digital assets ship with documentation, organized layers, and sensible naming. Preview files, changelog notes, and license clarity are signs of a professional creator.";
  let body3 =
    "After you adopt a resource, run a short internal review: accessibility, responsive behavior, and performance. Small fixes early prevent expensive rework later.";
  let body4 =
    "Digital Bazaar curates templates, UI kits, fonts, and tools from experienced makers—many include lifetime updates, so your purchase scales with your product roadmap.";

  if (/figma|ui kit|design system/i.test(t)) {
    body1 =
      "In Figma, favor libraries with variants for states and sizes. A strong UI kit should include forms, tables, navigation, and empty states—not only marketing blocks.";
    body2 =
      "Publish shared styles for color and typography so updates propagate globally. Pair your kit with a short token reference your developers can mirror in code.";
  } else if (/license|commercial|legal/i.test(t)) {
    body1 =
      "Personal licenses usually cover non-commercial work. Commercial licenses allow client projects and revenue-generating products—always match the tier to your use case.";
    body2 =
      "Extended licenses may cover resale or unlimited seats. When selling your own assets, state modification rights, redistribution rules, and attribution clearly on the product page.";
  } else if (/ai|prompt/i.test(t)) {
    body1 =
      "Strong prompts define role, audience, tone, format, and constraints. Few-shot examples improve consistency more than vague one-line requests.";
    body2 =
      "Keep a swipe file of prompts that worked for your niche. Layer subject, style, and output length when generating marketing copy or visual briefs.";
  } else if (/marketing|seo/i.test(t)) {
    body1 =
      "Lead with the outcome your reader wants—time saved, higher conversion, or clearer brand. Support claims with specifics: metrics, steps, or before/after examples.";
    body2 =
      "For SEO, align the title, H1, meta description, and first paragraph around one primary phrase. Internal links to related guides keep visitors exploring your catalog.";
  } else if (/saas|startup/i.test(t)) {
    body1 =
      "Early-stage teams should optimize for speed: buy proven patterns instead of reinventing dashboards and onboarding flows from scratch.";
    body2 =
      "Instrument key funnels once your MVP is live. Templates are only valuable if they help you ship experiments and talk to customers faster.";
  }

  const checklist = `**Quick checklist for "${title}":**
- Define success metrics before you buy or build
- Verify license coverage for client and commercial work
- Test on real content, not placeholder lorem ipsum
- Document what you customized for your team`;

  const close =
    "Treat every digital purchase as part of your product stack—not a one-off download. The best teams revisit assets quarterly, retire what underperforms, and invest in resources that compound over time.";

  return [intro, body1, body2, body3, checklist, body4, close];
}

export function generateBlogLocal(title) {
  const h = hashTitle(title);
  const paragraphs = buildParagraphs(title);
  const content = paragraphs.join("\n\n");
  const words = content.split(/\s+/).length;
  const readTime = Math.min(12, Math.max(4, Math.ceil(words / 200)));
  const excerpt = `Learn ${title.toLowerCase()} with practical tips for buying and using digital products on Digital Bazaar.`;
  const metaTitle = title.length > 58 ? `${title.slice(0, 55)}…` : title;
  const metaDescription = excerpt.slice(0, 155);

  return {
    excerpt: excerpt.slice(0, 160),
    content,
    tags: inferTags(title),
    author: pick(AUTHORS, h),
    readTime,
    metaTitle,
    metaDescription,
    provider: "builtin"
  };
}
