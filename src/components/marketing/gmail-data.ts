export type MailCategory = "primary" | "promotions" | "social";
export type MailView = "inbox" | "starred" | "snoozed" | "sent" | "drafts";

export type DemoMail = {
  id: string;
  sender: string;
  email: string;
  subject: string;
  snippet: string;
  time: string;
  unread: boolean;
  starred: boolean;
  category: MailCategory;
  color: string;
  body: string[];
};

export type ComposerState = {
  mode: "open" | "minimized" | "closed";
  expanded: boolean;
  to: string;
  subject: string;
  body: string;
  cc: string;
  bcc: string;
  showCc: boolean;
};

export const mailCategories: Array<{ id: MailCategory; label: string }> = [
  { id: "primary", label: "Primary" },
  { id: "promotions", label: "Promotions" },
  { id: "social", label: "Social" },
];

export const viewLabels: Record<MailView, string> = {
  inbox: "Inbox",
  starred: "Starred",
  snoozed: "Snoozed",
  sent: "Sent",
  drafts: "Drafts",
};

export const initialMails: DemoMail[] = [
  {
    id: "lumen",
    sender: "Lumen Analytics",
    email: "talent@lumen-analytics.example",
    subject: "Application received",
    snippet: "We have your details and will be in touch.",
    time: "10:42 AM",
    unread: true,
    starred: true,
    category: "primary",
    color: "#0b8043",
    body: [
      "Hi Aarav,",
      "We have received your application for the Platform Engineer role. Our team reviews applications within five business days, and we will contact you if your experience matches the role.",
      "You can track your status in your candidate portal. Please do not reply to this automated message.",
    ],
  },
  {
    id: "reachbee",
    sender: "ReachBee",
    email: "notes@reachbee.example",
    subject: "Your weekly outreach summary",
    snippet: "Three drafts reviewed. One is still waiting for you.",
    time: "9:18 AM",
    unread: false,
    starred: false,
    category: "primary",
    color: "#7a5209",
    body: [
      "Your weekly outreach summary",
      "You reviewed three drafts this week. One is still waiting in your Gmail drafts.",
      "Next follow-up: Meridian Cloud, Thursday.",
      "You set every stage yourself. ReachBee does not read your inbox.",
    ],
  },
  {
    id: "kite",
    sender: "Kite Robotics",
    email: "meera@kite-robotics.example",
    subject: "Platform engineering roles",
    snippet: "Two openings on the infrastructure team.",
    time: "Yesterday",
    unread: false,
    starred: false,
    category: "primary",
    color: "#5e35b1",
    body: [
      "Hi Aarav,",
      "You mentioned that you work on realtime pipelines. We are hiring two platform engineers for our infrastructure team in Pune.",
      "If you are open to a conversation, reply with a time that works for you.",
      "Meera",
    ],
  },
];

export const initialComposer: ComposerState = {
  mode: "open",
  expanded: false,
  to: "Priya Sharma",
  subject: "Platform role at Lumen, a quick question",
  body: "Hi Priya,\n\nLast year I built a realtime events pipeline handling 40k events a minute, and I led our checkout migration to TypeScript. I saw your team works on fintech analytics pipelines and would value a short conversation.\n\nAarav",
  cc: "",
  bcc: "",
  showCc: false,
};

export function mailCountLabel(count: number) {
  if (count === 0) return "No messages";
  if (count === 1) return "1 message";
  return `1-${count} of ${count}`;
}
