"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import type { Contact, ContactNote } from "@/lib/types";
import { reminderDue } from "@/lib/keep-in-touch";
const when = (value:string) => new Date(value).toLocaleString("ru-RU", {dateStyle:"medium",timeStyle:"short"});
async function request<T>(url:string, init?:RequestInit):Promise<T> {
 let response:Response;
 try { response=await fetch(url,{cache:"no-store",...init}); } catch { throw new Error("Нет связи с приложением. Текст сохранён в редакторе — попробуйте ещё раз."); }
 const body=await response.json();
 if(!response.ok)throw new Error(body.error || "Не удалось сохранить данные");
 return body;
}
export function ContactJournal({contact,onChanged,onDirty,onBusy}:{contact:Contact;onChanged:()=>void;onDirty:(dirty:boolean)=>void;onBusy:(busy:boolean)=>void}) {
 const [notes,setNotes]=useState<ContactNote[]>([]),[loading,setLoading]=useState(true),[loadError,setLoadError]=useState("");
 const [draft,setDraft]=useState(""),[editing,setEditing]=useState<ContactNote|null>(null),[editText,setEditText]=useState("");
 const [interval,setIntervalValue]=useState(String(contact.contactIntervalDays??""));
 const [version,setVersion]=useState(contact.updatedAt),[savedInterval,setSavedInterval]=useState(interval);
 const [error,setError]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const pending=useRef(false),operation=useRef<{id:string;body:string}|null>(null),sequence=useRef(0);
 const dirty=!!draft || !!editing && editText!==editing.body || interval!==savedInterval;
 useEffect(()=>onDirty(dirty),[dirty,onDirty]);
 useEffect(()=>onBusy(busy),[busy,onBusy]);
 useEffect(()=>{if(interval===savedInterval){setIntervalValue(String(contact.contactIntervalDays??""));setSavedInterval(String(contact.contactIntervalDays??""));setVersion(contact.updatedAt);}},[contact.updatedAt,contact.contactIntervalDays]);
 const load=useCallback(async()=>{
  const seq=++sequence.current;
  try{const result=await request<ContactNote[]>(`/api/contacts/${contact.id}/notes`);if(seq===sequence.current){setNotes(result);setLoadError("");}}
  catch{if(seq===sequence.current)setLoadError("Не удалось загрузить историю. Попробуйте ещё раз.");}
  finally{if(seq===sequence.current)setLoading(false);}
 },[contact.id]);
 useEffect(()=>{void load();const refresh=()=>{if(document.visibilityState==="visible")void load();};window.addEventListener("focus",refresh);document.addEventListener("visibilitychange",refresh);return()=>{sequence.current++;window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh);};},[load]);
 async function save(kind:"new"|"edit"|"reminder") {
  if(pending.current)return;
  pending.current=true;setBusy(true);setError("");setNotice("");
  try{
   if(kind==="reminder"){
    const result=await request<Contact>(`/api/contacts/${contact.id}/reminder`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({contactIntervalDays:interval?Number(interval):null,updatedAt:version})});
    setVersion(result.updatedAt);setSavedInterval(String(result.contactIntervalDays??""));setNotice("Частота общения сохранена");
   }else if(kind==="new"){
    operation.current??={id:crypto.randomUUID(),body:draft};
    await request(`/api/contacts/${contact.id}/notes`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(operation.current)});
    setDraft("");operation.current=null;setNotice("Заметка добавлена. Дата общения обновлена.");
   }else if(editing){
    await request(`/api/contacts/${contact.id}/notes/${editing.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({body:editText,updatedAt:editing.updatedAt})});
    setEditing(null);setNotice("Исправление сохранено. Дата общения не изменилась.");
   }
   onChanged();void load();
  }catch(e){setError(e instanceof Error?e.message:"Не удалось сохранить. Ваш текст остался в редакторе.");}
  finally{pending.current=false;setBusy(false);}
 }
 const due=reminderDue(contact,new Date());
 return <>
  <section className="reminder-settings" aria-labelledby="reminder-title">
   <h3 id="reminder-title">Не терять связь</h3><p className="notes-hint">Как часто вы хотите общаться с этим человеком?</p>
   <label htmlFor="contact-frequency">Частота общения</label>
   <div className="reminder-controls"><select id="contact-frequency" value={interval} onChange={e=>setIntervalValue(e.target.value)} disabled={busy}>
    <option value="">Не напоминать</option><option value="7">Раз в неделю</option><option value="30">Раз в месяц</option><option value="90">Раз в квартал</option><option value="365">Раз в год</option>
   </select><Button disabled={busy||interval===savedInterval} onClick={()=>void save("reminder")}>Сохранить частоту</Button></div>
   {due&&<p className="notes-hint">Следующее общение: {when(due.dueAt)}{!contact.lastContactAt?" · отсчёт с включения напоминания":""}</p>}
  </section>
  <section aria-labelledby="journal-title"><div className="notes-heading"><h3 id="journal-title">История общения</h3></div>
   <p className="notes-hint">Новая заметка отмечает разговор. Исправление текста не меняет дату общения.</p>
   <label htmlFor="new-contact-note">Новая заметка</label><textarea id="new-contact-note" value={draft} onChange={e=>setDraft(e.target.value)} disabled={busy||!!operation.current} rows={4} maxLength={20000} placeholder="О чём поговорили? Что хочется запомнить?"/>
   <div className="save-row"><span>{operation.current?"Повтор сохранит исходную заметку без дублирования":"После сохранения начнётся новый срок"}</span><Button disabled={busy||!draft.trim()} onClick={()=>void save("new")}>{operation.current?"Повторить сохранение":"Добавить заметку"}</Button></div>
   {error&&<div className="form-error" role="alert">{error}<div><Button variant="ghost" onClick={()=>{setIntervalValue(String(contact.contactIntervalDays??""));setSavedInterval(String(contact.contactIntervalDays??""));setVersion(contact.updatedAt);onChanged();void load();}}>Обновить данные</Button></div></div>}
   {notice&&<p className="journal-notice" role="status">{notice}</p>}
   {loading?<p className="notes-hint">Загружаем историю…</p>:loadError?<div role="alert" className="form-error">{loadError}<Button variant="ghost" onClick={()=>void load()}>Повторить загрузку</Button></div>:<div className="journal-list">
    {!notes.length&&<p className="notes-hint">Здесь появятся заметки после ваших разговоров.</p>}
    {notes.map(note=><article className="journal-entry" key={note.id}>
     <div className="journal-meta"><time>{note.occurredAt?when(note.occurredAt):"Дата общения неизвестна"}</time>{note.updatedAt!==note.createdAt&&<span>Изменено</span>}</div>
     {editing?.id===note.id?<><label className="sr-only" htmlFor="edit-contact-note">Исправление заметки</label><textarea id="edit-contact-note" rows={4} value={editText} onChange={e=>setEditText(e.target.value)} disabled={busy} maxLength={20000}/><div className="journal-actions"><Button disabled={busy||!editText.trim()||editText===editing.body} onClick={()=>void save("edit")}>Сохранить исправление</Button><Button variant="ghost" disabled={busy} onClick={()=>{if(editText===editing.body||window.confirm("Отменить исправление заметки?"))setEditing(null);}}>Отмена</Button></div>{editing.updatedAt!==note.updatedAt&&<p className="form-error">В истории уже есть другая версия. Скопируйте свой текст, отмените редактирование и откройте исправление заново.</p>}</>:<><p className="journal-body">{note.body}</p><Button variant="ghost" disabled={busy||!!editing} onClick={()=>{setEditing(note);setEditText(note.body);}}>Исправить</Button></>}
    </article>)}
   </div>}
  </section>
 </>;
}
