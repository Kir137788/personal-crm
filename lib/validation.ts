import { z } from "zod";
export const contactInput = z.object({
  name: z.string().trim().min(1, "Введите имя контакта").max(150, "Не более 150 символов"),
  context: z.string().trim().max(1000, "Не более 1000 символов").default(""),
  phone: z.string().trim().max(80, "Не более 80 символов").default(""),
  email: z.union([z.email("Проверьте адрес почты"), z.literal("")]).default(""),
  notes: z.string().max(20000, "Заметка слишком длинная").default(""),
});
export const noteInput = z.object({ notes: z.string().max(20000, "Заметка слишком длинная"), updatedAt: z.iso.datetime() });
