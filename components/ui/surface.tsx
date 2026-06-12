import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";

type SurfaceProps<T extends ElementType = "section"> = {
  as?: T;
  variant?: "default" | "inset" | "dashed";
} & ComponentPropsWithoutRef<T>;

export function Surface<T extends ElementType = "section">({
  as,
  variant = "default",
  className,
  ...props
}: SurfaceProps<T>) {
  const Component = as ?? "section";

  return (
    <Component
      className={cn(
        variant === "default" && "panel",
        variant === "inset" && "panel-inset",
        variant === "dashed" && "panel-dashed",
        className
      )}
      {...props}
    />
  );
}
