import Link from "next/link";
import { getEntries } from "@/lib/entries";
import { dayKey, formatMinutes, formatTime12h, RECORD_START, totalMinutes } from "@/lib/format";
import { StoryMotion } from "@/components/StoryMotion";
import { SoundControl } from "@/components/SoundControl";

export const dynamic = "force-dynamic";

function dateLabel(date: Date) {
  return date.toLocaleDateString("en", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}

export default async function Home() {
  const allEntries = await getEntries();
  const entries = allEntries.filter((entry) => !entry.isSample && dayKey(entry.startedAt) >= RECORD_START);
  const todayEntries = entries.filter((entry) => dayKey(entry.startedAt) === dayKey(new Date()));
  const todayTotal = totalMinutes(todayEntries);
  const recent = entries.slice(0, 5);
  const now = new Date();

  return (
    <main className="cinema-site">
      <StoryMotion />
      <a className="skip-link" href="#top">SKIP TO THE STORY</a>

      <div className="cinema-loader" aria-hidden="true">
        <div className="cinema-loader-wash" />
        <div className="loader-portal-field" />
        <div className="cinema-loader-copy">
          <svg className="cinema-loader-monogram" viewBox="0 0 740 250" fill="none" role="presentation">
            <defs>
              <mask id="draw-s" maskUnits="userSpaceOnUse" x="0" y="0" width="740" height="250">
                <path className="loader-draw-path" d="M171 51C145 25 71 28 52 65C27 113 151 104 157 158C163 209 70 228 35 190" />
              </mask>
              <mask id="draw-a-body" maskUnits="userSpaceOnUse" x="0" y="0" width="740" height="250">
                <path className="loader-draw-path" d="M211 205C231 150 250 94 277 42C301 94 326 150 346 205" />
              </mask>
              <mask id="draw-a-bar" maskUnits="userSpaceOnUse" x="0" y="0" width="740" height="250">
                <path className="loader-draw-path" d="M235 154C263 147 291 146 320 151" />
              </mask>
              <mask id="draw-i" maskUnits="userSpaceOnUse" x="0" y="0" width="740" height="250">
                <path className="loader-draw-path" d="M411 43C410 96 409 153 413 207" />
              </mask>
              <mask id="draw-m" maskUnits="userSpaceOnUse" x="0" y="0" width="740" height="250">
                <path className="loader-draw-path" d="M486 207C491 151 493 98 491 43C522 83 548 125 571 169C596 122 621 80 654 42C653 96 658 153 663 207" />
              </mask>
            </defs>
            <g className="loader-ink loader-ink-main">
              <path mask="url(#draw-s)" d="M171 51C145 25 71 28 52 65C27 113 151 104 157 158C163 209 70 228 35 190" />
              <path mask="url(#draw-a-body)" d="M211 205C231 150 250 94 277 42C301 94 326 150 346 205" />
              <path mask="url(#draw-a-bar)" d="M235 154C263 147 291 146 320 151" />
              <path mask="url(#draw-i)" d="M411 43C410 96 409 153 413 207" />
              <path mask="url(#draw-m)" d="M486 207C491 151 493 98 491 43C522 83 548 125 571 169C596 122 621 80 654 42C653 96 658 153 663 207" />
            </g>
            <circle className="loader-portal-dot" cx="696" cy="198" r="0" />
          </svg>
        </div>
      </div>

      <header className="cinema-nav">
        <a href="#top" className="cinema-logo" aria-label="Saim, home" data-magnetic>S.</a>
        <p>PRODUCT BUILDER<br /><span>ISLAMABAD / 2026</span></p>
        <nav><a href="#vexilot">Vexilot</a><a href="#today">Today</a><Link href="/journey">Living record ↗</Link><SoundControl /></nav>
        <Link href="/journey" className="journey-nav" data-magnetic><strong>↺</strong><span>LIVING RECORD<br /><b>REWIND THE DAYS ↗</b></span></Link>
      </header>

      <section className="cinema-hero" id="top">
        <div className="film-mark" aria-hidden="true"><span>01</span><i /><span>24</span></div>
        <div className="cinema-shell hero-stage">
          <div className="hero-label" data-hero-copy>
            <span>A LIVING RECORD OF PRODUCT INSTINCT</span>
            <span>{dateLabel(now)}</span>
          </div>

          <h1 aria-label="I think in products. I pitch them into motion.">
            <span><b data-hero-line>I think in products.</b></span>
            <span className="hero-second"><b data-hero-line>I pitch them into <em>motion.</em></b></span>
          </h1>

          <div className="hero-media" data-product-frame data-tilt>
            <div className="media-placeholder">
              <span>VEXILOT / PRODUCT FRAME</span>
              <strong>YOUR SCREENSHOT<br />GOES HERE</strong>
              <small>16:10 / IMAGE 01</small>
            </div>
            <p>THE PRODUCT THAT CHANGED<br />HOW I SEE MYSELF.</p>
          </div>

          <p className="hero-intro" data-hero-copy>I’m Saim, a 19-year-old product builder. This portfolio is a living record of how I spot problems, shape products, make people believe—and do the daily work after the pitch.</p>
        </div>

        <aside className="today-now" data-hero-copy>
          <div><i /><span>MY DAY / LIVE</span></div>
          <strong>{formatMinutes(todayTotal)}</strong>
          <p>{todayEntries.length ? `${todayEntries.length} ${todayEntries.length === 1 ? "moment" : "moments"} recorded today` : "No entry yet. The empty day stays visible."}</p>
          <a href="#today">OPEN TODAY ↓</a>
        </aside>

        <div className="hero-scroll" aria-hidden="true"><span>SCROLL TO ENTER</span><i>↓</i></div>
      </section>

      <section className="zoom-bridge">
        <a className="vexilot-link" href="https://vexilot.dev" target="_blank" rel="noreferrer" data-vexilot-link aria-label="Visit Vexilot">
          <div className="zoom-word"><span>VEXILOT</span><i>PRODUCT / 001</i></div>
          <b className="vexilot-mobile-cta">VISIT VEXILOT ↗</b>
        </a>
        <div className="vexilot-cursor" aria-hidden="true"><span>VISIT</span><strong>VEXILOT ↗</strong></div>
      </section>

      <section className="horizontal-story" id="vexilot">
        <div className="horizontal-sticky">
          <div className="horizontal-track">
            <article className="story-panel panel-opening">
              <div className="panel-index"><span>01 / 04</span><span>THE QUESTION</span></div>
              <h2>Why does university<br />theory feel so far<br />from the <em>real world?</em></h2>
              <p>That frustration became the starting point.</p>
            </article>

            <article className="story-panel panel-product">
              <div className="panel-index"><span>02 / 04</span><span>THE PRODUCT</span></div>
              <div className="product-window" data-tilt>
                <span>VEXILOT / SCREEN 02</span>
                <strong>DUMMY<br />PRODUCT<br />VISUAL</strong>
                <small>REPLACE WITH REAL ASSET</small>
              </div>
              <h2>From theory<br />to systems.</h2>
            </article>

            <article className="story-panel panel-proof-new">
              <div className="panel-index"><span>03 / 04</span><span>THE RECEIPTS</span></div>
              <div className="proof-number"><strong>2,400</strong><span>+ SIGNUPS</span></div>
              <div className="proof-pair"><div><strong>40</strong><span>PAID USERS</span></div><div><strong>01</strong><span>LIVE PRODUCT</span></div></div>
              <p>The idea stopped being private.</p>
            </article>

            <article className="story-panel panel-pitch">
              <div className="panel-index"><span>04 / 04</span><span>THE PITCH</span></div>
              <div className="pitch-place"><span>PARWAZ-E-TAKHYUL / 2026</span><strong>01</strong><small>FIRST OF SIXTEEN TEAMS</small></div>
              <h2>I made the room<br /><em>believe.</em></h2>
              <div className="pitch-ticket" data-tilt><span>CASH PRIZE</span><strong>PKR 40,000</strong><small>THE MOMENT CONFIDENCE BECAME EVIDENCE</small></div>
            </article>
          </div>
          <div className="horizontal-progress" aria-hidden="true"><i /></div>
        </div>
      </section>

      <section className="vertical-statement">
        <div className="cinema-shell">
          <span>AFTER THE PRODUCT / 02</span>
          <button className="statement-orbit" type="button" data-magnetic aria-label="The confidence shift"><span>THE CONFIDENCE SHIFT</span><i>↗</i></button>
          <p className="statement-small" data-reveal>Vexilot gave me proof.<br />The win gave me permission.</p>
          <h2 data-statement>Confidence changed<br />the way I <em>introduced<br />myself.</em></h2>
          <p className="statement-end" data-reveal>I stopped saying “I want to build.”<br />I could finally say: “I built this.”</p>
        </div>
      </section>

      <section className="network-story" id="rooms">
        <div className="network-sticky cinema-shell">
          <div className="network-heading" data-network-copy>
            <span>THE ROOMS GOT BIGGER / 03</span>
            <h2>Proof made the<br />introduction.<br /><em>Curiosity kept it going.</em></h2>
            <p>Vexilot and the pitch win gave me a credible reason to reach out. Cold messages became conversations with people building at a level I had only watched from outside.</p>
          </div>

          <div className="conversation-stack" data-network-field aria-hidden="true">
            <article className="conversation-card card-ceos"><span>OUTREACH / RECEIPT 01</span><strong>10+</strong><p>CEO CONVERSATIONS</p><small>COLD MESSAGE → REAL ROOM</small></article>
            <article className="conversation-card card-founders"><span>OUTREACH / RECEIPT 02</span><strong>$3M+</strong><p>FOUNDER SIGNAL</p><small>RAISED BY PEOPLE I SPOKE WITH</small></article>
            <article className="conversation-card card-yc"><span>OUTREACH / RECEIPT 03</span><strong>YC</strong><p>ENGINEER CONVERSATION</p><small>THE ROOM KEPT GETTING BIGGER</small></article>
          </div>

        </div>
      </section>

      <section className="portrait-story">
        <div className="portrait-sticky">
          <div className="cinema-shell portrait-layout">
            <figure data-portrait>
              <div className="portrait-disc"><span>PORTRAIT / PLACEHOLDER</span><strong>YOUR<br />PHOTO<br />HERE</strong><small>CIRCULAR FRAME / 04</small></div>
              <figcaption>MUHAMMAD SAIM / 19 / ISLAMABAD</figcaption>
            </figure>
            <div className="portrait-copy" data-portrait-copy>
              <span>THE PERSON BEHIND THE PROOF / 04</span>
              <h2>Not a finished<br />founder.<br /><em>A visible one.</em></h2>
              <p>I want the work, uncertainty and improvement to remain visible—not polished into a personality that never existed.</p>
            </div>
          </div>

          <div className="identity-orbit" data-identity-orbit>
            <header><span>THE PERSON BEHIND THE PROOF</span><span>ORBIT / 04</span></header>
            <div className="orbit-rings" data-orbit-rings aria-hidden="true"><i /><i /><i /><span>SAIM / BECOMING</span></div>
            <article className="orbit-beat orbit-beat-one" data-orbit-beat><span>01 / INSTINCT</span><h3>I notice product<br />problems.</h3><p>Before there is a roadmap, I can usually feel where the friction lives.</p></article>
            <article className="orbit-beat orbit-beat-two" data-orbit-beat><span>02 / PERSUASION</span><h3>I make people<br /><em>believe.</em></h3><p>A useful product still needs a story people can enter.</p></article>
            <article className="orbit-beat orbit-beat-three" data-orbit-beat><span>03 / DISCIPLINE</span><h3>I stay after the<br />excitement ends.</h3><p>The daily record is where confidence becomes practice—or disappears.</p></article>
            <div className="orbit-exit" data-orbit-exit><span>THE PERSON IS STILL BECOMING</span><strong>NOT<br />FINISHED.</strong><i>↓</i></div>
          </div>
        </div>
      </section>

      <section className="daily-record" id="today">
        <div className="cinema-shell">
          <header className="daily-header">
            <div><span>MY DAY / LIVE RECORD</span><h2 data-reveal>What I did<br /><em>today?</em></h2></div>
            <div className="daily-date"><span>{now.toLocaleDateString("en", { weekday: "long" })}</span><strong>{dateLabel(now)}</strong><small>THE RECORD UPDATES AS I DO</small></div>
          </header>

          <div className="daily-summary" data-reveal>
            <div><span>TIME RECORDED</span><strong>{formatMinutes(todayTotal)}</strong></div>
            <div><span>MOMENTS</span><strong>{todayEntries.length.toString().padStart(2, "0")}</strong></div>
            <div><span>STATE</span><strong>{todayEntries.length ? "MOVING" : "UNWRITTEN"}</strong></div>
          </div>

          <div className="daily-list">
            {recent.length ? recent.map((entry, index) => (
              <article key={entry.id} data-reveal>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <time>{formatTime12h(entry.startedAt)}</time>
                <div><small>{entry.category}</small><h3>{entry.title}</h3>{entry.detail && <p>{entry.detail}</p>}</div>
                <strong>{formatMinutes(entry.durationMinutes)}</strong>
              </article>
            )) : (
              <div className="daily-empty" data-reveal><strong>00</strong><div><h3>Nothing recorded yet.</h3><p>Not every day needs to look productive. It only needs to be honest.</p></div></div>
            )}
          </div>

          <Link href="/studio" className="daily-cta"><span>ADD THE NEXT MOMENT</span><i>↗</i></Link>
        </div>
      </section>

      <section className="collaboration-call">
        <div className="cinema-shell">
          <div className="collaboration-meta"><span>WHAT I AM OPEN TO / NOW</span><span>PRODUCTS · INTERNSHIPS · FOUNDER CONVERSATIONS</span></div>
          <h2 data-reveal>Bring me a difficult<br />product <em>problem.</em></h2>
          <div className="collaboration-bottom">
            <p data-reveal>I am at my best when an idea is still unclear—when someone needs to find the product, shape the story and make the room understand why it matters.</p>
            <div><a href="mailto:hello@saim.dev">START A CONVERSATION ↗</a><a href="https://vexilot.dev" target="_blank" rel="noreferrer">SEE THE PRODUCT ↗</a></div>
          </div>
        </div>
      </section>

      <section className="timeline-tease">
        <div className="cinema-shell">
          <span>THE FUTURE / STILL UNWRITTEN</span>
          <h2 data-reveal>I do not know exactly<br />what I will become.</h2>
          <p className="future-lead" data-reveal>Or where all of this is going.</p>
          <p data-reveal>But I have a strange confidence that something good will happen—if I keep thinking, building, reaching out and leaving honest evidence behind.</p>
          <Link href="/journey" className="future-journey" data-reveal><span>WATCH IT HAPPEN, DAY BY DAY</span><i>OPEN THE LIVING RECORD ↗</i></Link>
        </div>
      </section>

      <footer className="cinema-footer cinema-shell"><span>MUHAMMAD SAIM / ©2026</span><a href="mailto:hello@saim.dev">START A CONVERSATION ↗</a></footer>
    </main>
  );
}
