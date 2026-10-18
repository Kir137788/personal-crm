import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "bg-[#214f43] text-white hover:bg-[#173c32]", outline: "border border-[#deded6] bg-white hover:bg-[#f4f5f0]", ghost: "hover:bg-[#eeeeE7]" }, size: { default: "h-11 px-4 py-2", sm: "h-9 px-3", icon: "h-10 w-10" } }, defaultVariants: { variant: "default", size: "default" } });
export function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) { const Comp = asChild ? Slot : "button"; return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />; }
