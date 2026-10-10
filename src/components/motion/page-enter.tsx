import { cn } from "@/lib/cn";

/**
 * Route/body enter: one short rise, then nothing moves.
 *
 * Lives outside `@/components/motion` because that module is a client boundary:
 * the shells only need a class name, and importing it from the client module
 * shipped the whole app-motion chunk (observers, CountUp RAF) into every
 * workspace and admin route.
 */
export function PageEnter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("ab-page-enter", className)}>{children}</div>;
}
