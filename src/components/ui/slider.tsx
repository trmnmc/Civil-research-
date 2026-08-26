"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

/**
 * Radix slider with the accessible name applied to each thumb (the element
 * that actually carries role="slider"), so `aria-label`/`aria-valuetext`
 * passed to this component reach assistive technology.
 */
const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  const values = props.value ?? props.defaultValue ?? [0];
  const label = props["aria-label"];
  const valueText = (props as Record<string, unknown>)["aria-valuetext"] as
    | string
    | undefined;
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className,
      )}
      {...props}
      aria-label={undefined}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-paper-sunken border border-rule">
        <SliderPrimitive.Range className="absolute h-full bg-rule-strong" />
      </SliderPrimitive.Track>
      {values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={
            label
              ? values.length > 1
                ? `${label} (${i === 0 ? "start" : "end"})`
                : label
              : undefined
          }
          aria-valuetext={valueText}
          className="block h-5 w-5 rounded-full border-2 border-ink-soft bg-paper-raised shadow transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-band-north focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = "Slider";

export { Slider };
