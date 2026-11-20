import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const baseVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-foreground hover:bg-[#a50d26]",
        navy: "bg-primary text-primary-foreground hover:bg-[#1e0d8a]",
        green: "bg-secondary text-secondary-foreground hover:bg-[#00592a]",
        outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
        ghost: "text-primary hover:bg-muted",
        light: "bg-white text-primary hover:bg-muted",
        danger: "bg-red-700 text-white hover:bg-red-800",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5",
        lg: "h-13 px-7 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonVariantProps = VariantProps<typeof baseVariants>;

/** cva + tailwind-merge, so a passed className (e.g. "hidden sm:inline-flex") wins over the defaults. */
export function buttonVariants(props?: ButtonVariantProps & { className?: string }) {
  const { className, ...variants } = props ?? {};
  return cn(baseVariants(variants), className);
}

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonVariantProps) {
  return <button className={buttonVariants({ variant, size, className })} {...props} />;
}
