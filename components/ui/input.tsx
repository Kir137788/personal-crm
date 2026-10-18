import * as React from "react";
import { cn } from "@/lib/utils";
export function Input({className, ...props}: React.ComponentProps<"input">) { return <input data-slot="input" className={cn("w-full rounded-xl border border-[#deded6] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#48745d] focus:ring-2 focus:ring-[#48745d]/15 disabled:opacity-50", className)} {...props} />; }
