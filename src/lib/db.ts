import Dexie, { type EntityTable } from 'dexie';
import type { Feed, Post, Article, Settings } from '../types';
import { normalizeUrl } from './normalizer';

export class QuillDatabase extends Dexie {
  feeds!: EntityTable<Feed, 'id'>;
  posts!: EntityTable<Post, 'id'>;
  articles!: EntityTable<Article, 'postId'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor() {
    super('QuillDB');
    this.version(1).stores({
      feeds: 'id, url, title, folder, status, lastFetched',
      posts: 'id, feedId, published, isRead, link',
      articles: 'postId, extractedAt',
      settings: 'id',
    });
  }
}

export const db = new QuillDatabase();

/**
 * 12 Rich Seed Blogs for instant demoability
 */
export const SEED_FEEDS: Omit<Feed, 'id'>[] = [
  {
    url: normalizeUrl('https://overreacted.io/rss.xml'),
    title: 'Overreacted',
    siteUrl: 'https://overreacted.io',
    tags: ['react', 'frontend', 'javascript'],
    folder: 'Tech & Code',
    status: 'healthy',
    lastFetched: Date.now() - 1000 * 60 * 15,
  },
  {
    url: normalizeUrl('https://simonwillison.net/atom/everything/'),
    title: 'Simon Willison’s Weblog',
    siteUrl: 'https://simonwillison.net',
    tags: ['python', 'llm', 'databases', 'open-source'],
    folder: 'Tech & Code',
    status: 'healthy',
    lastFetched: Date.now() - 1000 * 60 * 30,
  },
  {
    url: normalizeUrl('https://jvns.ca/atom.xml'),
    title: 'Julia Evans',
    siteUrl: 'https://jvns.ca',
    tags: ['linux', 'git', 'networking', 'zines'],
    folder: 'Tech & Code',
    status: 'healthy',
    lastFetched: Date.now() - 1000 * 60 * 45,
  },
  {
    url: normalizeUrl('https://paulgraham.com/rss.html'),
    title: 'Paul Graham Essays',
    siteUrl: 'https://paulgraham.com',
    tags: ['startups', 'essays', 'philosophy'],
    folder: 'Essays & Thinking',
    status: 'healthy',
    lastFetched: Date.now() - 1000 * 60 * 60,
  },
  {
    url: normalizeUrl('https://maggieappleton.com/rss.xml'),
    title: 'Maggie Appleton',
    siteUrl: 'https://maggieappleton.com',
    tags: ['digital-gardens', 'anthropology', 'visual-essays', 'ui'],
    folder: 'Essays & Thinking',
    status: 'healthy',
    lastFetched: Date.now() - 1000 * 60 * 75,
  },
  {
    url: normalizeUrl('https://robinsloan.com/feed.xml'),
    title: 'Robin Sloan',
    siteUrl: 'https://robinsloan.com',
    tags: ['fiction', 'media', 'indie-web', 'libraries'],
    folder: 'Indie Web',
    status: 'healthy',
    lastFetched: Date.now() - 1000 * 60 * 90,
  },
  {
    url: normalizeUrl('https://kottke.org/feed'),
    title: 'kottke.org',
    siteUrl: 'https://kottke.org',
    tags: ['hypertext', 'culture', 'art', 'curation'],
    folder: 'Culture',
    status: 'healthy',
    lastFetched: Date.now() - 1000 * 60 * 120,
  },
  {
    url: normalizeUrl('https://pluralistic.net/feed/'),
    title: 'Pluralistic: Daily links by Cory Doctorow',
    siteUrl: 'https://pluralistic.net',
    tags: ['digital-rights', 'privacy', 'antitrust', 'internet'],
    folder: 'Culture',
    status: 'healthy',
    lastFetched: Date.now() - 1000 * 60 * 150,
  },
  {
    url: normalizeUrl('https://macwright.com/rss.xml'),
    title: 'Tom MacWright',
    siteUrl: 'https://macwright.com',
    tags: ['maps', 'open-source', 'software', 'design'],
    folder: 'Tech & Code',
    status: 'slow',
    lastFetched: Date.now() - 1000 * 60 * 200,
  },
  {
    url: normalizeUrl('https://andymatuschak.org/atom.xml'),
    title: 'Andy Matuschak',
    siteUrl: 'https://andymatuschak.org',
    tags: ['tools-for-thought', 'memory', 'interfaces'],
    folder: 'Essays & Thinking',
    status: 'healthy',
    lastFetched: Date.now() - 1000 * 60 * 300,
  },
  {
    url: normalizeUrl('https://interconnected.org/home/feed'),
    title: 'Matt Webb / Interconnected',
    siteUrl: 'https://interconnected.org',
    tags: ['hardware', 'prototyping', 'ai-interfaces'],
    folder: 'Indie Web',
    status: 'healthy',
    lastFetched: Date.now() - 1000 * 60 * 400,
  },
  {
    url: normalizeUrl('https://broken-feed-sample.internal/feed.xml'),
    title: 'The Silent Dispatch (Offline Archive)',
    siteUrl: 'https://broken-feed-sample.internal',
    tags: ['archive', 'resilience'],
    folder: 'Culture',
    status: 'dead',
    lastFetched: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
];

/**
 * Rich seed posts providing realistic article content and summaries
 */
export const SEED_POSTS: Array<{
  feedIndex: number;
  title: string;
  link: string;
  summary: string;
  contentHtml: string;
  hoursAgo: number;
  isRead: boolean;
  author: string;
}> = [
  {
    feedIndex: 0, // Overreacted
    title: 'A Philosophy of Software That Lasts',
    link: 'https://overreacted.io/a-philosophy-of-software-that-lasts/',
    author: 'Dan Abramov',
    hoursAgo: 1.5,
    isRead: false,
    summary: 'Why do some pieces of code endure for thirty years while modern web applications rewrite themselves every twenty-four months? A reflection on surface area, resilience, and architectural humility.',
    contentHtml: `<p>We often think about software durability in terms of speed, abstractions, or typing guarantees. But when you inspect the systems that have quietly run the world for decades—Unix utilities, SQLite, basic email protocols—you notice a recurring humility in their design.</p>
<h2>1. Minimal Surface Area</h2>
<p>Every public API function is an irreversible promise. The larger the contract you expose to consumers, the heavier your gravity becomes. Longevity comes from providing small primitives rather than guessing future workflows.</p>
<blockquote>"The real challenge of computer science is not how to write intricate systems, but how to write simple systems that do not rot when the winds of fashion shift."</blockquote>
<h2>2. Self-Contained Local State</h2>
<p>When state is centralized into fragile global networks, any packet loss or broken API token collapses the user experience. By moving the primary store to the edge—such as IndexedDB on the client machine—the user retains sovereignty over their reading material even without a network connection.</p>
<p>Good software is quiet, predictable, and doesn't demand attention unless it has something profound to say.</p>`,
  },
  {
    feedIndex: 1, // Simon Willison
    title: 'Catching up on Local-First Client Architecture with IndexedDB and Web Workers',
    link: 'https://simonwillison.net/2026/local-first-sqlite-indexeddb/',
    author: 'Simon Willison',
    hoursAgo: 3.2,
    isRead: false,
    summary: 'A deep dive into building web applications where IndexedDB serves as the source of truth, Web Workers handle background compute, and network calls are asynchronous synchronization events.',
    contentHtml: `<p>I’ve been spending significant time testing applications that work reliably on trains with intermittent cell reception. The traditional single-page app pattern of rendering a loading spinner while fetching thirty JSON endpoints is fundamentally broken for reading apps.</p>
<p>Here is what the architecture of a resilient web client looks like today:</p>
<ul>
  <li><strong>Database at the core:</strong> Dexie or SQLite compiled to WebAssembly stores documents directly on the user's hard drive.</li>
  <li><strong>Instant hydration:</strong> Initial paint renders in under 50ms from local storage before any network request is fired.</li>
  <li><strong>Off-thread computation:</strong> Heavy text extraction and cryptographic Proof-of-Work puzzles run inside Web Workers so UI scrolling remains locked at 60fps.</li>
</ul>
<p>When you build this way, your application feels like a native utility rather than a fragile window into someone else's server.</p>`,
  },
  {
    feedIndex: 2, // Julia Evans
    title: 'Bite-sized guide: How RSS and Atom actually work under the hood',
    link: 'https://jvns.ca/blog/2026/how-rss-works/',
    author: 'Julia Evans',
    hoursAgo: 5,
    isRead: true,
    summary: 'XML namespaces, pubDate formats that defy RFC standards, and the subtle differences between item and entry. Here are the cheerful quirks of feed syndication.',
    contentHtml: `<p>People often ask me: <em>"Julia, RSS is from 1999! Is it really still running the web?"</em> And the answer is a resounding YES! It is one of the most open, decentralized syndication layers we have.</p>
<h2>The Fun Quirks</h2>
<ol>
  <li><strong>Date Parsing:</strong> RSS 2.0 uses RFC 822 format (e.g. <code>Mon, 06 Sep 2026 14:01:00 GMT</code>), while Atom uses ISO 8601 timestamps (<code>2026-09-06T14:01:00Z</code>). Your parser needs to gracefully handle both!</li>
  <li><strong>Namespaces:</strong> <code>content:encoded</code> gives you the full blog post HTML, while <code>description</code> is often just an introductory paragraph.</li>
  <li><strong>Relative URLs:</strong> Many self-hosted blogs publish links like <code>/posts/my-story</code>. The reader must resolve them against the channel URL.</li>
</ol>
<p>Keep your parser resilient: if an item has a missing date, don't crash—just default to <code>Date.now()</code> and keep reading!</p>`,
  },
  {
    feedIndex: 4, // Maggie Appleton
    title: 'The Expanding Sprawl of Personal Digital Gardens',
    link: 'https://maggieappleton.com/digital-gardens-2026',
    author: 'Maggie Appleton',
    hoursAgo: 8,
    isRead: false,
    summary: 'Contrasting the ephemeral stream of social platforms with topological, evergreen digital gardens that grow interconnected tendrils over years.',
    contentHtml: `<p>A stream is chronological: modern posts push old thoughts into the abyss. A garden is topological: notes are grouped by conceptual kinships, nurtured over seasons, and revised as understanding matures.</p>
<p>Feed readers are the vital watering can of the digital garden ecosystem. When an author updates an essay three years after first publishing it, the syndication feed can whisper to your local reader that a new thought has emerged.</p>
<p>In a world of algorithmic noise, choosing who to read by explicitly subscribing to their RSS feed is an act of cognitive sovereignty.</p>`,
  },
  {
    feedIndex: 3, // Paul Graham
    title: 'The Lessons of Focused Silence',
    link: 'https://paulgraham.com/silence.html',
    author: 'Paul Graham',
    hoursAgo: 14,
    isRead: true,
    summary: 'The best ideas do not arrive while reacting to an unending timeline of manufactured outrage. They arrive when your attention is quiet enough to notice contradictions.',
    contentHtml: `<p>Most modern interfaces are designed to maximize engagement, which is another way of saying they are designed to agitate you. An agitated mind is attentive, reactive, and easily monetized.</p>
<p>Independent blogs are the antidote. You read an author only when they have distilled a thought worth committing to paragraphs. There is no endless infinite scroll algorithm telling you what to think next.</p>`,
  },
  {
    feedIndex: 6, // kottke.org
    title: 'The Wonder of Everyday Typography and Hypertext Art',
    link: 'https://kottke.org/26/10/hypertext-art',
    author: 'Jason Kottke',
    hoursAgo: 18,
    isRead: false,
    summary: 'A curated look at three web designers who build tiny experimental websites with handcrafted HTML, variable fonts, and zero trackers.',
    contentHtml: `<p>Every few months I stumble across a corner of the web that reminds me why we fell in love with hypertext in the first place.</p>
<p>Today's gem is a series of digital journals formatted like vintage broadsheets. No cookie banners, no popups asking you to sign up for a newsletter before reading sentence one, just crisp typography and high-bandwidth ideas.</p>`,
  },
  {
    feedIndex: 7, // Cory Doctorow
    title: 'Privacy By Architecture, Not Privacy By Policy',
    link: 'https://pluralistic.net/2026/10/privacy-by-architecture/',
    author: 'Cory Doctorow',
    hoursAgo: 22,
    isRead: false,
    summary: 'Why privacy policies are worthless contracts of adhesion, and why the only real guarantee is cryptographic architecture where the server cannot see your reading list.',
    contentHtml: `<p>A company can write a five-thousand-word privacy policy explaining how much they respect your personal boundaries. But the moment venture debt comes due or an acquisition happens, that policy is rewritten in twenty minutes with a polite email notification.</p>
<p>Real privacy does not ask for permission. Real privacy is architectural. If an RSS reader keeps your subscriptions in local IndexedDB on your personal device, and only submits zero-knowledge cryptographic hashes when discovering recommendations, there is no database for a subpoena or a data broker to seize.</p>`,
  },
  {
    feedIndex: 5, // Robin Sloan
    title: 'Notes on The Slow Web and Building Small Tools',
    link: 'https://robinsloan.com/lab/small-tools/',
    author: 'Robin Sloan',
    hoursAgo: 28,
    isRead: true,
    summary: 'Why we need tiny, bespoke utilities that do one job elegantly and can run unchanged for ten years on a modest laptop.',
    contentHtml: `<p>I have a little Python script on my home server that has run every midnight since 2014 without modification. It doesn't have an investor deck. It doesn't use AI to optimize my attention. It just checks three things and writes a text file.</p>
<p>We should demand the same permanence from our readers. A feed reader should be like a cedar desk: sturdy, well-proportioned, and built from materials that don't warp under damp weather.</p>`,
  },
  {
    feedIndex: 8, // Tom MacWright
    title: 'Why Offline-First Web Apps Are Worth The Effort',
    link: 'https://macwright.com/2026/offline-first-revisited/',
    author: 'Tom MacWright',
    hoursAgo: 36,
    isRead: false,
    summary: 'Handling sync conflicts and IndexedDB edge cases is difficult, but the feeling of opening an app with airplane mode enabled and seeing everything load instantly is unbeatable.',
    contentHtml: `<p>Building an app that works offline forces you to respect the browser as an operating system. You are no longer just sending HTML strings down the pipe; you are constructing a resilient local appliance.</p>
<p>Once you give users the confidence that their saved reading queue is physically present on their storage chip, the psychology of reading completely changes from hurried skimming to contemplative study.</p>`,
  },
  {
    feedIndex: 9, // Andy Matuschak
    title: 'Executable Reading Environments and Active Recall',
    link: 'https://andymatuschak.org/active-reading-2026/',
    author: 'Andy Matuschak',
    hoursAgo: 48,
    isRead: true,
    summary: 'How reader software can foster synthesis and mnemonic retention rather than passive consumption.',
    contentHtml: `<p>Most reading software treats text as a passive scroll of ink. But reading to understand requires active dialogue: underlining, margin inquiries, and progressive summarization.</p>
<p>When readers are built with clean typography, customizable font sizes, and distractions stripped away, the reader’s focus shifts from the chrome of the browser to the internal mechanics of the thought.</p>`,
  },
];

/**
 * Initializes the database with default settings and seed data if empty
 */
export async function initializeDatabase(): Promise<void> {
  const existingSettings = await db.settings.get('current');
  if (!existingSettings) {
    await db.settings.put({
      id: 'current',
      sharingEnabled: false, // OFF by default as required
      theme: 'system',
      fontSize: 'base',
      fontFamily: 'serif',
    });
  }

  const feedCount = await db.feeds.count();
  if (feedCount === 0) {
    // Populate seed feeds
    const createdFeeds: Feed[] = [];
    for (let i = 0; i < SEED_FEEDS.length; i++) {
      const feedData = SEED_FEEDS[i];
      const feed: Feed = {
        ...feedData,
        id: `feed_${i + 1}`,
      };
      await db.feeds.put(feed);
      createdFeeds.push(feed);
    }

    // Populate seed posts and articles
    for (let i = 0; i < SEED_POSTS.length; i++) {
      const p = SEED_POSTS[i];
      const parentFeed = createdFeeds[p.feedIndex];
      const postId = `post_${i + 1}`;
      const published = Date.now() - p.hoursAgo * 60 * 60 * 1000;

      const post: Post = {
        id: postId,
        feedId: parentFeed ? parentFeed.id : 'feed_1',
        title: p.title,
        link: p.link,
        summary: p.summary,
        contentHtml: p.contentHtml,
        published,
        isRead: p.isRead,
        author: p.author,
      };

      await db.posts.put(post);

      // Pre-cache full text article for offline reading
      await db.articles.put({
        postId,
        sanitizedHtml: p.contentHtml,
        extractedAt: Date.now() - Math.floor(Math.random() * 100000),
        title: p.title,
        byline: p.author,
        siteName: parentFeed?.title,
      });
    }
  }
}
