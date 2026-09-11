import Link from "next/link";
import { ArrowRight, ArrowUpRight, Layers3, MessageSquare, ScanLine, WandSparkles } from "lucide-react";
import { Header } from "./header";
import { Hero } from "./hero";
import { Services } from "./services";
import { MaterialStudio } from "./material-studio";
import { Inspiration } from "./inspiration";
import { Comparison } from "./comparison";
import { FAQ } from "./faq";
import { Logo } from "./logo";
import { EstimateProvider, EstimateTrigger } from "./estimate-context";
export function LayeredFXHome() {
  return <EstimateProvider><div className="lfx" id="top"><Link className="lfx-skip" href="#main">Skip to content</Link><Header /><main id="main">
    <Hero />
    <div className="lfx-service-strip"><span>Wrap & resurface</span><Layers3 size={17} /><span>Architectural finishes</span><Layers3 size={17} /><span>Window tint & film</span><Layers3 size={17} /><span>Interior & exterior paint</span></div>
    <Services /><MaterialStudio /><Inspiration /><Comparison />
    <section id="approach" className="lfx-section lfx-container lfx-process"><div className="lfx-section-heading"><div><div className="lfx-eyebrow">04 / The way we see it</div><h2>Considered from<br /><em>the first conversation.</em></h2></div><p>Your space. Your vision. A thoughtful path from “what could this be?” to “this feels right.”</p></div><div className="lfx-process-grid">{[
      { number: "01", title: "Let’s talk possibilities.", text: "Tell us what you have, what you love, and what you’re ready to change. A few photos are a great place to start.", Icon: MessageSquare },
      { number: "02", title: "Find your direction.", text: "Explore materials, colors, and finishes. Together, we can shape a direction that fits your surfaces and your style.", Icon: ScanLine },
      { number: "03", title: "Bring it to the surface.", text: "With scope and selections confirmed, your project moves toward preparation, application, and the finishing details.", Icon: WandSparkles },
    ].map(({ number, title, text, Icon }) => <article key={number}><div className="lfx-process-top"><span>{number}</span><Icon size={24} /></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <FAQ />
    <section id="contact" className="lfx-contact-band"><div className="lfx-container"><div className="lfx-eyebrow">Your next chapter starts here</div><div className="lfx-contact-row"><h2>Let’s bring your<br /><em>next layer to life.</em></h2><div><EstimateTrigger variant="light" size="lg">Start your project <ArrowUpRight size={22} /></EstimateTrigger><p>A few ideas. A little inspiration.<br />That’s all you need to begin.</p></div></div><span className="lfx-contact-line" /></div></section>
  </main><footer className="lfx-footer lfx-container"><div className="lfx-footer-main"><div><Logo /><p>Beautiful surfaces.<br />Spaces with a little more soul.</p></div><div><h3>Explore</h3><Link href="/services">Services</Link><Link href="/inspiration">Inspiration</Link><Link href="#studio">Material studio <ArrowUpRight size={13} /></Link></div><div><h3>Let’s connect</h3><Link href="/about">About Us</Link><Link href="#questions">Common questions</Link><EstimateTrigger variant="ghost" className="lfx-footer-estimate">Explore an estimate <ArrowRight size={14} /></EstimateTrigger></div><div className="lfx-footer-note"><span className="lfx-live-dot" />Made for homes.<br />Made for business.<p>Residential & commercial<br />surface transformations.</p></div></div><div className="lfx-footer-bottom"><span>© 2026 LayeredFX. All rights reserved.</span><span>Interactive homepage concept · No live submissions</span><Link href="/admin">Team dashboard</Link></div></footer></div></EstimateProvider>;
}
