import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { contacts } from "../lib/schema";
const firstNames = ["Александр", "Михаил", "Дмитрий", "Андрей", "Алексей", "Сергей", "Иван", "Максим", "Артём", "Никита", "Анна", "Мария", "Елена", "Ольга", "Ирина", "Наталья", "Дарья", "Софья", "Юлия", "Полина"];
const surnames = ["Иванов", "Петров", "Смирнов", "Кузнецов", "Волков", "Соколов", "Морозов", "Новиков", "Фёдоров", "Попов", "Орлов", "Белов", "Козлов", "Лебедев", "Зайцев", "Соловьёв", "Васильев", "Павлов", "Семёнов", "Голубев", "Виноградов", "Богданов", "Воробьёв", "Титов", "Комаров", "Киселёв", "Макаров", "Андреев", "Ковалёв", "Ильин", "Гусев", "Никитин", "Егоров", "Тарасов", "Фомин", "Денисов", "Давыдов", "Жуков", "Громов", "Крылов", "Захаров", "Борисов", "Мельников", "Данилов", "Куликов", "Лазарев", "Савельев", "Романов", "Медведев", "Осипов"];
const contexts = ["Познакомились на курсе по ИИ", "Работали вместе над проектом", "Встретились на конференции по дизайну", "Знакомы по беговому клубу", "Учились вместе в университете", "Познакомились через общих друзей", "Общаемся в книжном клубе", "Познакомились в путешествии", "Соседство и общие интересы", "Встретились на мастер-классе"];
const notes = ["Обсудили идеи для совместного проекта. Договорились обменяться материалами после следующей встречи.", "Любит путешествия и хорошие книги. В следующий раз рассказать о недавно прочитанном.", "Интересуется технологиями и дизайном. Обещал поделиться подборкой полезных материалов.", "Поговорили о планах на осень. Договорились встретиться за кофе и продолжить разговор.", "Знакомство на мероприятии. Было интересно обсудить работу и увлечения."];
async function main() {
 if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
 const client = postgres(process.env.DATABASE_URL, {max: 1});
 try {
 const db=drizzle(client);
 const data=Array.from({length:1000}, (_, i) => ({ id: `10000000-0000-4000-8000-${String(i+1).padStart(12,"0")}`, name: `${firstNames[i%20]} ${surnames[Math.floor(i/20)]}${i%20>=10?"а":""}`, context: contexts[i%10], phone: "", email: `contact.${i+1}@example.com`, notes: notes[i%5], createdAt: new Date(Date.UTC(2026,8,1+i%40)), updatedAt: new Date(Date.UTC(2026,9,1+i%17)) }));
 await db.insert(contacts).values(data).onConflictDoNothing({target:contacts.id});
 console.log("Seed complete: 1000 synthetic contacts; existing records preserved.");
 } finally { await client.end(); }
}
main().catch(() => { console.error("Seed failed. Check database availability and configuration."); process.exit(1); });
