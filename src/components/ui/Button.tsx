import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

// UI kit · Кнопки. Variant sets priority, size sets density (32 · 40 · 48).
const variants = {
  primary: "bg-action text-white hover:bg-action-hover active:bg-action-pressed",
  secondary: "bg-light text-ink hover:bg-light-hover active:bg-light-pressed",
  ghost: "bg-transparent text-ink hover:bg-light active:bg-light-pressed",
  danger: "bg-danger text-white hover:bg-danger-hover active:bg-danger-hover",
} as const;

const sizes = {
  sm: "h-8 px-3 gap-1.5",
  md: "h-10 px-4 gap-2",
  lg: "h-12 px-5 gap-2",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  /** Icon before the label: an action. */
  icon?: ReactNode;
  /** Icon after the label: moving forward. */
  trailingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", icon, trailingIcon, className = "", children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-sm font-semibold transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
      {trailingIcon}
    </button>
  );
});

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required accessible name: icon-only buttons always have one. */
  label: string;
  size?: "sm" | "md";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", className = "", children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={`inline-grid shrink-0 place-items-center rounded-sm text-ink-secondary transition-colors duration-[120ms] hover:bg-light hover:text-ink active:bg-light-pressed ${size === "sm" ? "size-8" : "size-10"} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
