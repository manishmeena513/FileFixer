import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center min-h-[44px] sm:min-h-0 py-2.5 sm:py-2",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
      <SliderPrimitive.Range className="absolute h-full bg-[hsl(var(--primary))]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="relative block h-6 w-6 sm:h-5 sm:w-5 rounded-full border-2 border-[hsl(var(--primary))] bg-[hsl(var(--background))] shadow-md transition-transform active:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing touch-manipulation after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-11 after:h-11 after:min-w-[44px] after:min-h-[44px] after:content-['']" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
