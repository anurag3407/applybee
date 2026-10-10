/**
 * Landing sections (§10).
 *
 * The page is assembled in `src/app/(marketing)/page.tsx`. Each section lives
 * in `./sections/` with its own file — the hero scene gets one, the nine content
 * sections each get one — so a change to pricing never diffs against the FAQ.
 * This module re-exports them under their original names so `/features`,
 * `/pricing`, `/faq` and `/how-it-works` keep rendering the same components.
 *
 * Every example shown is fictional with reserved .example domains and labelled
 * "Illustrative preview". There are no fake testimonials, logo walls, or
 * invented statistics anywhere in this page.
 */

export { Hero, GuaranteeBand } from "./sections/hero";
export { ProductFacts } from "./sections/facts";
export { Problem } from "./sections/problem";
export { DirectoryFeature } from "./sections/directory";
export { ResumeIntelligence } from "./sections/resume";
export { AgenticWorkflow } from "./sections/workflow";
export { WritingModes } from "./sections/modes";
export { WorkspaceTeaser } from "./sections/workspace";
export { Trust } from "./sections/trust";
export { Pricing } from "./sections/pricing";
export { FAQ, FAQS } from "./sections/faq";
export { FinalCta } from "./sections/cta";
