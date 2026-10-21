"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Check, ChevronRight, CircleHelp, LoaderCircle, Mail, NotebookPen, Plus, Search, Users, X, Phone, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Contact } from "@/lib/types";

const date = (value: string) => new Date(value).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
const initials = (name: string) => name.split(/\s+/).slice(0,2).map(n=>n[0]).join("");
function Avatar({name, large=false}: {name: string; large?: boolean}) { const colors=["sage","peach","lavender","sand","blue"]; return <span className={`avatar ${colors[name.charCodeAt(0)%5]} ${large?"large":""}`}>{initials(name)}</span>; }

export function ContactsApp() {
 const [contacts,setContacts]=useState<Contact[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [search,setSearch]=useState("");
 const [page,setPage]=useState(1);
 const [selected,setSelected]=useState<Contact|null>(null);
 const [creating,setCreating]=useState(false);
 const [toast,setToast]=useState("");
 const searchRef=useRef<HTMLInputElement>(null);
 const load=useCallback(async()=>{ setError(""); try { const r=await fetch("/api/contacts",{cache:"no-store"}); if(!r.ok) throw new Error(); setContacts(await r.json()); } catch { setError("Не удалось загрузить контакты. Проверьте, что база запущена, и попробуйте снова."); } finally {setLoading(false);} },[]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(""),4000);return()=>clearTimeout(timer);},[toast]);
 useEffect(()=>{const handler=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();searchRef.current?.focus();}};window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler);},[]);
 const filtered=contacts.filter(c=>`${c.name} ${c.context} ${c.email} ${c.phone}`.toLocaleLowerCase("ru").includes(search.toLocaleLowerCase("ru").trim())).sort((a,b)=>a.name.localeCompare(b.name,"ru"));
 const pages=Math.max(1,Math.ceil(filtered.length/50));
 const currentPage=Math.min(page,pages);
 const visible=filtered.slice((currentPage-1)*50,currentPage*50);
 function update(contact: Contact) { setContacts(items=>items.map(c=>c.id===contact.id?contact:c));setSelected(contact);setToast("Заметка сохранена"); }
 return <div className="app-shell">
  <aside className="sidebar">
   <a className="brand" href="/" aria-label="Круг — главная"><span className="brand-mark" aria-hidden="true"/>круг</a>
   <div className="workspace-label">ЛИЧНОЕ ПРОСТРАНСТВО</div>
   <button className="nav-item active" onClick={()=>{setSearch("");setPage(1);}}><Users size={18}/><span>Все контакты</span><span className="nav-count">{loading?"—":contacts.length}</span></button>
   <div className="sidebar-note"><span className="note-illustration"><Sprout size={32} strokeWidth={1.4}/></span><h3>Хорошие связи<br/>начинаются с внимания</h3><p>Сохраняйте не только номера,<br/>но и то, что вас связывает.</p></div>
   <div className="sidebar-footer"><span className="owner-avatar">Я</span><div><strong>Мой круг</strong><small>Личная CRM</small></div><span className="online-dot" title="Локальное приложение"/></div>
  </aside>
  <main className="main">
   <header className="topbar"><span>Мой круг</span><ChevronRight size={14}/><strong>Контакты</strong><span className="topbar-caption">Место для ваших людей</span></header>
   <section className="content">
    <div className="page-heading"><div><div className="eyebrow">ЛЮДИ, КОТОРЫХ ВЫ ЗНАЕТЕ</div><h1>Ваш <span>круг общения.</span></h1><p>Люди, встречи и детали, которые хочется помнить.</p></div><Button onClick={()=>setCreating(true)}><Plus size={18}/>Добавить контакт</Button></div>
    <div className="summary-grid">
     <div className="summary-card"><span className="stat-icon sage"><Users size={20}/></span><div><small>Всего контактов</small><strong>{loading?"—":contacts.length.toLocaleString("ru-RU")}</strong></div><span className="stat-tail">в вашем круге</span></div>
     <div className="summary-card"><span className="stat-icon peach"><NotebookPen size={20}/></span><div><small>С заметками</small><strong>{loading?"—":contacts.filter(c=>c.notes.trim()).length.toLocaleString("ru-RU")}</strong></div><span className="stat-tail">контекст сохранён</span></div>
    </div>
    <section className="contacts-panel" aria-label="Список контактов">
     <div className="panel-heading"><div><h2>Все контакты <span>{loading?"…":contacts.length}</span></h2><p>Откройте карточку, чтобы вспомнить детали общения.</p></div><span className="sort-label">По имени <ArrowDown size={14}/></span></div>
     <div className="search-row"><div className="search-field"><Search size={19}/><input ref={searchRef} placeholder="Найти по имени, почте или знакомству…" aria-label="Поиск контактов" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>{search?<button aria-label="Очистить поиск" onClick={()=>{setSearch("");setPage(1);}}><X size={16}/></button>:<kbd>⌘ K</kbd>}</div>{search&&<span className="search-count">Найдено: {filtered.length}</span>}</div>
     {error?<div className="empty-state" role="alert"><CircleHelp/><h3>Контакты пока недоступны</h3><p>{error}</p><Button variant="outline" onClick={()=>{setLoading(true);void load();}}>Повторить</Button></div>:loading?<div className="empty-state"><LoaderCircle className="animate-spin"/><p>Загружаем ваш круг…</p></div>:!filtered.length?<div className="empty-state"><Users size={32}/><h3>{search?"Никого не нашли":"Начните с первого знакомства"}</h3><p>{search?"Попробуйте другое имя или очистите поиск.":"Добавьте человека и пару слов о том, что вас связывает."}</p><Button variant="outline" onClick={()=>search?setSearch(""):setCreating(true)}>{search?"Очистить поиск":"Добавить контакт"}</Button></div>:<>
      <div className="table-scroll"><table><thead><tr><th>ИМЯ</th><th>ОТКУДА ЗНАКОМЫ</th><th>КОНТАКТЫ</th><th>ОБНОВЛЕНО</th><th><span className="sr-only">Открыть</span></th></tr></thead><tbody>{visible.map(c=><tr key={c.id} onClick={()=>setSelected(c)}><td><button className="contact-name" onClick={e=>{e.stopPropagation();setSelected(c);}}><Avatar name={c.name}/><span><strong>{c.name}</strong><small>{c.notes.trim()?"Есть заметка":"Пока без заметок"}</small></span></button></td><td><span className="context-cell">{c.context||"Не указано"}</span></td><td><span className="email-cell">{c.email||c.phone||"—"}</span></td><td><span className="date-cell">{date(c.updatedAt)}</span></td><td><ChevronRight size={17} className="row-arrow"/></td></tr>)}</tbody></table></div>
      <div className="pagination"><span>{(currentPage-1)*50+1}–{Math.min(currentPage*50,filtered.length)} из {filtered.length.toLocaleString("ru-RU")} контактов</span><div><Button variant="outline" size="icon" aria-label="Предыдущая страница" disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}><ArrowLeft size={16}/></Button><span>{currentPage} / {pages}</span><Button variant="outline" size="icon" aria-label="Следующая страница" disabled={currentPage===pages} onClick={()=>setPage(currentPage+1)}><ArrowRight size={16}/></Button></div></div>
     </>}
    </section>
    <footer className="content-footer"><span><Sprout size={14}/> Меньше забытых деталей. Больше настоящего общения.</span><span>Ваш личный круг</span></footer>
   </section>
  </main>
  {creating&&<ContactForm onClose={()=>setCreating(false)} onCreated={c=>{setContacts(items=>[...items,c]);setSearch("");setPage(1);setCreating(false);setSelected(c);setToast("Контакт добавлен");}}/>}
  {selected&&!creating&&<ContactDetails key={selected.id} contact={selected} onClose={()=>{setSelected(null);void load();}} onSaved={update}/>}
  {toast&&<div className="toast" role="status"><Check size={18}/>{toast}</div>}
 </div>;
}

function Sheet({title,onClose,children}: {title:string;onClose:()=>void;children:React.ReactNode}) {
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const element=dialog.current;const previous=document.activeElement as HTMLElement|null;element?.showModal();return()=>{element?.close();previous?.focus();};},[]);
 return <dialog ref={dialog} className="sheet" aria-label={title} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose();}}}><div className="sheet-top"><span>{title}</span><Button variant="ghost" size="icon" aria-label="Закрыть карточку" onClick={onClose}><X size={20}/></Button></div>{children}</dialog>;
}
function ContactForm({onClose,onCreated}: {onClose:()=>void;onCreated:(c:Contact)=>void}) {
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [dirty,setDirty]=useState(false);
 const close=()=>{if(!busy&&(!dirty||window.confirm("Закрыть без сохранения контакта?")))onClose();};
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");const data=Object.fromEntries(new FormData(e.currentTarget));try{const r=await fetch("/api/contacts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const result=await r.json();if(!r.ok)throw new Error(result.error);onCreated(result);}catch(e){setError(e instanceof Error?e.message:"Не удалось сохранить контакт");}finally{setBusy(false);}}
 return <Sheet title="Новый контакт" onClose={close}><div className="sheet-body"><div className="form-intro"><span className="stat-icon sage"><Users size={25}/></span><h2>Добавьте человека<br/>в свой круг</h2><p>Начните с имени. Остальное можно оставить пустым.</p></div><form onSubmit={submit} onChange={()=>setDirty(true)}><fieldset disabled={busy} className="form-fields"><label>Имя <span className="required">*</span><Input name="name" placeholder="Например, Анна Смирнова" required maxLength={150} autoFocus/></label><label>Откуда знакомы<Input name="context" placeholder="Работа, друзья, случайная встреча…" maxLength={1000}/></label><div className="form-pair"><label>Телефон<Input name="phone" type="tel" placeholder="+7 …" maxLength={80}/></label><label>Почта<Input name="email" type="email" placeholder="name@example.com"/></label></div><label>Заметка<textarea name="notes" placeholder="Что важно помнить об этом человеке?" rows={5} maxLength={20000}/></label></fieldset>{error&&<p className="form-error" role="alert">{error}</p>}<div className="form-actions"><Button variant="outline" type="button" onClick={close} disabled={busy}>Отмена</Button><Button type="submit" disabled={busy}>{busy?<LoaderCircle size={16} className="animate-spin"/>:<Plus size={16}/>}Добавить контакт</Button></div></form></div></Sheet>;
}
function ContactDetails({contact,onClose,onSaved}: {contact:Contact;onClose:()=>void;onSaved:(c:Contact)=>void}) {
 const [notes,setNotes]=useState(contact.notes);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const dirty=notes!==contact.notes;
 const close=()=>{if(!busy&&(!dirty||window.confirm("В заметке есть несохранённые изменения. Закрыть без сохранения?")))onClose();};
 async function save(){setBusy(true);setError("");try{const r=await fetch(`/api/contacts/${contact.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({notes,updatedAt:contact.updatedAt})});const data=await r.json();if(!r.ok)throw new Error(data.error);onSaved(data);}catch(e){setError(e instanceof Error?e.message:"Не удалось сохранить заметку");}finally{setBusy(false);}}
 return <Sheet title="Карточка контакта" onClose={close}><div className="sheet-body"><div className="profile"><Avatar name={contact.name} large/><h2>{contact.name}</h2><span>В вашем круге с {date(contact.createdAt)}</span></div><div className="detail-group"><h3>ОТКУДА ЗНАКОМЫ</h3><p>{contact.context||"Пока не указано"}</p></div><div className="detail-group"><h3>КОНТАКТЫ</h3><div className="detail-line"><Phone size={17}/>{contact.phone?<a href={`tel:${contact.phone.replace(/[^+0-9]/g,"")}`}>{contact.phone}</a>:<span>Телефон не указан</span>}</div><div className="detail-line"><Mail size={17}/>{contact.email?<a href={`mailto:${contact.email}`}>{contact.email}</a>:<span>Почта не указана</span>}</div></div><div className="notes-heading"><NotebookPen size={18}/><h3>Заметки о человеке</h3></div><p className="notes-hint">О чём говорили, что обещали, что хочется запомнить.</p><label className="sr-only" htmlFor="contact-notes">Заметка о контакте</label><textarea id="contact-notes" value={notes} onChange={e=>setNotes(e.target.value)} rows={9} maxLength={20000} disabled={busy} placeholder="Добавьте заметку после разговора…"/>{error&&<p className="form-error" role="alert">{error}</p>}<div className="save-row"><span aria-live="polite">{dirty?"Есть несохранённые изменения":`Сохранено · ${date(contact.updatedAt)}`}</span><Button onClick={save} disabled={busy||!dirty}>{busy?<LoaderCircle size={16} className="animate-spin"/>:<Check size={16}/>}Сохранить</Button></div></div></Sheet>;
}
