import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a94d33] disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "bg-[#a94d33] text-[#fffaf0] hover:bg-[#8f3e29]", outline: "border border-[#ded5c5] bg-[#fffcf6] hover:bg-[#eee6d6]", ghost: "hover:bg-[#eee6d6]" }, size: { default: "h-11 px-4 py-2", sm: "h-9 px-3", icon: "h-10 w-10" } }, defaultVariants: { variant: "default", size: "default" } });
export function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) { const Comp = asChild ? Slot : "button"; return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />; }
