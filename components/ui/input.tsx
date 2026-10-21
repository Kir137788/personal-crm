import * as React from "react";
import { cn } from "@/lib/utils";
export function Input({className, ...props}: React.ComponentProps<"input">) { return <input data-slot="input" className={cn("w-full rounded-xl border border-[#ded5c5] bg-[#fffcf6] px-3 py-2.5 text-sm outline-none focus:border-[#a94d33] focus:ring-2 focus:ring-[#a94d33]/15 disabled:opacity-50", className)} {...props} />; }
