"use client";
import { faqs } from "@/lib/layeredfx/content";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
export function FAQ() {
  return <section id="questions" className="lfx-section lfx-container lfx-faq"><div><div className="lfx-eyebrow">Good questions. A good place to start.</div><h2>A little clarity.<br /><em>A lot of possibility.</em></h2></div><Accordion type="single" collapsible className="lfx-faq-list">{faqs.map((item, index) => <AccordionItem key={item.q} value={`item-${index}`}><AccordionTrigger>{item.q}</AccordionTrigger><AccordionContent>{item.a}</AccordionContent></AccordionItem>)}</Accordion></section>;
}
