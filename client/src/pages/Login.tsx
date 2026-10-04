import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Eye, EyeOff, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!supabase) { setError("إعدادات المصادقة غير مكتملة في بيئة النشر."); return; }
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
      : await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { full_name: name.trim() } } });
    if (result.error) { setError(result.error.message.includes("Invalid") ? "البريد الإلكتروني أو كلمة السر غير صحيحة." : result.error.message); return; }
    if (mode === "register" && !result.data.session) { toast.success("تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتفعيله."); setMode("login"); return; }
    toast.success(mode === "login" ? "مرحبًا بعودتك" : "تم إنشاء الحساب بنجاح");
    const isAdmin = email.trim().toLowerCase() === "ibrahimahmed@gmail.com";
    navigate(mode === "login" && isAdmin ? "/admin" : "/");
  };

  return <main dir="rtl" className="min-h-screen bg-[#fbfaf8] px-4 py-8 text-[#27231f]"><div className="mx-auto max-w-md"><button onClick={() => navigate("/")} className="mb-10 flex items-center gap-2 text-sm text-[#766b61]"><ArrowRight size={17}/> العودة للمتجر</button><div className="rounded-[28px] border border-[#27231f]/10 bg-white p-7 shadow-sm sm:p-10"><div className="mb-8 text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#f1e6d7] text-[#9b7646]"><ShieldCheck/></div><div className="font-serif text-2xl tracking-[.16em]">NADOLA</div><p className="mt-2 text-sm text-[#85796e]">{mode === "login" ? "تسجيل الدخول إلى حسابك" : "إنشاء حساب جديد"}</p></div>{error && <div role="alert" className="mb-5 rounded-2xl border border-[#d69b77]/40 bg-[#fff5ef] p-4 text-sm leading-7 text-[#8a4f39]">{error}{mode === "login" && <button type="button" onClick={() => { setError(null); setMode("register"); }} className="mt-3 flex items-center gap-2 font-medium text-[#9b7646] underline"><UserPlus size={16}/> إنشاء حساب جديد</button>}</div>}<form onSubmit={submit} className="space-y-4">{mode === "register" && <label className="block text-sm">الاسم<input value={name} onChange={e=>setName(e.target.value)} required className="mt-2 w-full rounded-xl border border-[#27231f]/15 px-4 py-3 outline-none focus:border-[#bd8f56]"/></label>}<label className="block text-sm">البريد الإلكتروني<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-2 w-full rounded-xl border border-[#27231f]/15 px-4 py-3 outline-none focus:border-[#bd8f56]"/></label><label className="block text-sm">كلمة السر<div className="relative mt-2"><input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} className="w-full rounded-xl border border-[#27231f]/15 px-4 py-3 pl-12 outline-none focus:border-[#bd8f56]"/><button type="button" onClick={()=>setShow(!show)} className="absolute left-3 top-3 text-[#8d8176]">{show?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></label><button className="w-full rounded-full bg-[#27231f] py-3.5 text-sm text-white transition hover:bg-[#9b7646]">{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}</button></form><div className="mt-6 text-center text-sm text-[#85796e]">{mode === "login" ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}<button onClick={()=>{setError(null);setMode(mode === "login" ? "register" : "login")}} className="mr-2 text-[#9b7646] underline">{mode === "login" ? "إنشاء حساب جديد" : "تسجيل الدخول"}</button></div></div></div></main>;
}
