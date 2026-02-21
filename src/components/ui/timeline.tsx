import * as React from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Timeline                                                          */
/* ------------------------------------------------------------------ */

const Timeline = React.forwardRef<
  HTMLOListElement,
  React.HTMLAttributes<HTMLOListElement>
>(({ className, children, ...props }, ref) => (
  <ol
    ref={ref}
    aria-label="Timeline"
    className={cn("relative flex flex-col gap-0", className)}
    {...props}
  >
    {children}
  </ol>
));
Timeline.displayName = "Timeline";

/* ------------------------------------------------------------------ */
/*  TimelineItem                                                      */
/* ------------------------------------------------------------------ */

interface TimelineItemProps extends React.HTMLAttributes<HTMLLIElement> {
  /** Hide the connector line (last item) */
  hideConnector?: boolean;
}

const TimelineItem = React.forwardRef<HTMLLIElement, TimelineItemProps>(
  ({ className, hideConnector, children, ...props }, ref) => (
    <li
      ref={ref}
      className={cn("relative grid grid-cols-[auto_1fr] gap-x-3 pb-5 last:pb-0", className)}
      {...props}
    >
      {children}
      {/* Connector line */}
      {!hideConnector && (
        <div
          aria-hidden
          className="absolute left-[7px] top-5 bottom-0 w-px bg-border"
        />
      )}
    </li>
  ),
);
TimelineItem.displayName = "TimelineItem";

/* ------------------------------------------------------------------ */
/*  TimelineDot                                                       */
/* ------------------------------------------------------------------ */

type DotVariant =
  | "blue"
  | "amber"
  | "orange"
  | "emerald"
  | "red"
  | "default";

const dotVariantClasses: Record<DotVariant, string> = {
  blue: "bg-blue-500 ring-blue-500/20",
  amber: "bg-amber-500 ring-amber-500/20",
  orange: "bg-orange-500 ring-orange-500/20",
  emerald: "bg-emerald-500 ring-emerald-500/20",
  red: "bg-red-500 ring-red-500/20",
  default: "bg-muted-foreground ring-muted-foreground/20",
};

interface TimelineDotProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: DotVariant;
}

const TimelineDot = React.forwardRef<HTMLDivElement, TimelineDotProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative z-10 mt-[3px] h-3.5 w-3.5 shrink-0 rounded-full ring-[3px]",
        dotVariantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);
TimelineDot.displayName = "TimelineDot";

/* ------------------------------------------------------------------ */
/*  TimelineContent                                                   */
/* ------------------------------------------------------------------ */

const TimelineContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("min-w-0 pt-px", className)} {...props} />
));
TimelineContent.displayName = "TimelineContent";

export {
  Timeline,
  TimelineItem,
  TimelineDot,
  TimelineContent,
  type DotVariant,
};
