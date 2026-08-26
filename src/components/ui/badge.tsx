import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4 [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-rule bg-paper-sunken text-ink-soft",
        north: "border-band-north/30 bg-band-north-soft text-band-north",
        border: "border-band-border/30 bg-band-border-soft text-band-border",
        south: "border-band-south/30 bg-band-south-soft text-band-south",
        national:
          "border-band-national/30 bg-band-national-soft text-band-national",
        ok: "border-ok/30 bg-ok-soft text-ok",
        warn: "border-warn/30 bg-warn-soft text-warn",
        err: "border-err/30 bg-err-soft text-err",
        accent: "border-accent/30 bg-accent-soft text-accent",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
