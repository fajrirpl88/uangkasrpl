import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutGrid, Users, Wallet, ArrowLeftRight, QrCode, ShieldCheck, LogOut,
  Plus, X, Check, Trash2, Pencil, Settings, TrendingUp, TrendingDown,
  AlertCircle, Copy, CheckCircle2, Search, Sparkles, Send, Upload, Eye,
  ClipboardCheck, Clock, GraduationCap, Lock, ChevronRight, PiggyBank, Image as ImageIcon,
} from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';

const DATA_KEY = 'xirpl:data:v1';
const SESSION_KEY = 'xirpl:session:v1';

const EMOJIS = ['🐻', '🐱', '🐰', '🦊', '🐨', '🐼', '🐸', '🦄', '🐙', '🐧', '🦋', '🌸', '⭐', '🍓', '🌈', '🐥', '🦖', '🌻', '🍀', '🔮'];
const rid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const now = () => Date.now();
const rupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n) || 0);
const tglID = (s) => new Date((s || today()) + (String(s).length <= 10 ? 'T00:00:00' : '')).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const DEFAULT = {
  settings: { className: 'XI RPL', iuran: 5000, periodType: 'Mingguan', adminPin: '1234', qris: '', payNote: 'Scan QRIS di atas pakai m-banking / e-wallet, lalu upload bukti transfer.' },
  members: [],
  periods: [{ id: 'p1', label: 'Minggu 1' }],
  payments: {},   // `${mid}__${pid}` -> { amount, date, method:'tunai'|'qris' }
  income: [],     // { id, desc, amount, date }
  expenses: [],   // { id, desc, amount, date, cat }
  pending: [],    // { id, memberId, periodId, amount, proof, note, at }
};

// Standalone storage: uses the browser's localStorage (per-device).
// The extra `shared` argument is ignored here — kept so call sites don't change.
async function sGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
async function sSet(key, val) { try { localStorage.setItem(key, val); } catch (e) { console.error(e); } }

function resizeImage(file, max = 900, q = 0.72) {
  return new Promise((res, rej) => {
    const rdr = new FileReader();
    rdr.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > h && w > max) { h = Math.round(h * max / w); w = max; }
        else if (h >= w && h > max) { w = Math.round(w * max / h); h = max; }
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        res(cv.toDataURL('image/jpeg', q));
      };
      img.onerror = rej; img.src = rdr.result;
    };
    rdr.onerror = rej; rdr.readAsDataURL(file);
  });
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
:root{
  --bg:#F5F6F8; --card:#FFFFFF; --ink:#0D0E12; --muted:#8A8E97; --faint:#B7BBC2;
  --line:#EBECEF; --line2:#F2F3F5;
  --brand:#4F46E5; --brand-2:#6366F1; --brand-soft:#EEEEFE;
  --green:#12A150; --green-soft:#E7F6EE; --red:#E5484D; --red-soft:#FCEBEC; --sun:#E8930C; --sun-soft:#FDF1DE;
  --sh:0 1px 2px rgba(13,14,18,.04), 0 10px 30px -22px rgba(13,14,18,.35);
}
*{box-sizing:border-box}
.app{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;-webkit-font-smoothing:antialiased;letter-spacing:-.01em}
.app button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
.wrap{max-width:900px;margin:0 auto;padding:0 18px 118px}
/* header */
.hd{position:sticky;top:0;z-index:30;background:rgba(245,246,248,.82);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.hd-in{max-width:900px;margin:0 auto;padding:13px 18px;display:flex;align-items:center;gap:11px}
.logo{display:flex;align-items:center;gap:11px;min-width:0}
.mark{width:38px;height:38px;border-radius:11px;background:var(--ink);color:#fff;display:grid;place-items:center;font-weight:800;font-size:13px;letter-spacing:.02em;flex:none}
.logo h1{font-size:15.5px;font-weight:800;margin:0;line-height:1.1;white-space:nowrap}
.logo .rl{font-size:11.5px;color:var(--muted);font-weight:600;display:flex;align-items:center;gap:4px}
.hd-act{margin-left:auto;display:flex;gap:8px}
.hbtn{height:38px;padding:0 12px;border-radius:11px;background:var(--card);border:1px solid var(--line);display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--ink)}
.hbtn:hover{background:var(--line2)}
.hbtn.sq{width:38px;padding:0;justify-content:center}
.hbtn .badge{background:var(--red);color:#fff;font-size:10px;font-weight:800;min-width:17px;height:17px;border-radius:99px;display:grid;place-items:center;padding:0 4px}
/* balance / hero */
.bal{background:var(--ink);color:#fff;border-radius:22px;padding:22px 22px 20px;margin-top:18px;position:relative;overflow:hidden}
.bal .rip{position:absolute;inset:0;background:radial-gradient(120% 120% at 100% 0%,rgba(99,102,241,.35),transparent 55%)}
.bal>*{position:relative}
.bal .k{font-size:12.5px;font-weight:600;color:#9ea2ad;display:flex;align-items:center;gap:6px}
.bal .v{font-size:36px;font-weight:800;letter-spacing:-.03em;margin:7px 0 3px}
.bal .s{font-size:12.5px;color:#9ea2ad;font-weight:500}
.bal-row{display:flex;gap:22px;margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.1)}
.bal-row .c .t{font-size:11px;color:#9ea2ad;font-weight:600;display:flex;align-items:center;gap:5px}
.bal-row .c .n{font-size:16px;font-weight:700;margin-top:3px}
/* stat grid */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:12px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:11px;margin-top:12px}
@media(max-width:520px){.g3{grid-template-columns:1fr 1fr}}
.st{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;box-shadow:var(--sh)}
.st .ic{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;margin-bottom:10px}
.st .n{font-size:18px;font-weight:800;letter-spacing:-.02em}
.st .l{font-size:11.5px;color:var(--muted);font-weight:600;margin-top:2px}
/* section */
.sec{margin-top:26px}
.sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.sh h2{font-size:14px;font-weight:800;margin:0;display:flex;align-items:center;gap:8px;letter-spacing:-.01em}
.sh .lnk{font-size:12.5px;font-weight:700;color:var(--brand);display:flex;align-items:center;gap:2px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:var(--sh)}
.pad{padding:16px}
/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;font-weight:700;font-size:13.5px;padding:11px 15px;border-radius:12px;transition:.14s}
.btn-p{background:var(--brand);color:#fff}
.btn-p:hover{background:#413bd1}
.btn-d{background:var(--ink);color:#fff}
.btn-d:hover{opacity:.9}
.btn-s{background:var(--line2);color:var(--ink);border:1px solid var(--line)}
.btn-s:hover{background:#e9eaee}
.btn-sm{padding:8px 12px;font-size:12.5px;border-radius:10px}
.btn-dg{background:var(--red-soft);color:#c0332f}
.btn-dg:hover{background:#f9dcdd}
.btn-full{width:100%}
/* rows */
.row{display:flex;align-items:center;gap:12px;padding:13px 15px;border-bottom:1px solid var(--line2)}
.row:last-child{border-bottom:none}
.av{width:38px;height:38px;border-radius:11px;background:var(--brand-soft);display:grid;place-items:center;font-size:18px;flex:none}
.nm{font-weight:700;font-size:14px}
.mt{font-size:11.5px;color:var(--muted);font-weight:600;margin-top:1px}
.sp{margin-left:auto}
.pill{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:4px 9px;border-radius:99px}
.pill-ok{background:var(--green-soft);color:#0d7a3d}
.pill-no{background:var(--red-soft);color:#c0332f}
.pill-wait{background:var(--sun-soft);color:#a9690a}
.ib{width:33px;height:33px;border-radius:9px;display:grid;place-items:center;color:var(--muted);flex:none}
.ib:hover{background:var(--line2);color:var(--ink)}
.ib.del:hover{background:var(--red-soft);color:#c0332f}
/* pay toggle */
.tgl{display:inline-flex;align-items:center;gap:6px;padding:8px 13px;border-radius:11px;font-weight:700;font-size:12.5px;flex:none;transition:.14s}
.tgl.on{background:var(--green);color:#fff}
.tgl.off{background:var(--card);color:var(--muted);border:1.5px dashed var(--line)}
.tgl.off:hover{border-color:var(--brand);color:var(--brand)}
/* chips */
.chips{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
.chips::-webkit-scrollbar{display:none}
.chip{flex:none;padding:9px 14px;border-radius:11px;font-weight:700;font-size:12.5px;background:var(--card);border:1px solid var(--line);color:var(--muted);display:flex;align-items:center;gap:7px}
.chip.act{background:var(--ink);color:#fff;border-color:var(--ink)}
.chip .c{opacity:.7}
/* progress */
.pr{height:8px;border-radius:99px;background:var(--line2);overflow:hidden}
.pr>i{display:block;height:100%;background:var(--green);border-radius:99px;transition:width .4s}
/* empty */
.empty{text-align:center;padding:34px 20px;color:var(--muted)}
.empty .e{font-size:34px}
.empty p{font-weight:700;margin:11px 0 3px;color:var(--ink);font-size:14px}
.empty small{font-size:12.5px}
/* tabbar */
.tb{position:fixed;bottom:0;left:0;right:0;z-index:40;background:rgba(255,255,255,.92);backdrop-filter:blur(14px);border-top:1px solid var(--line);padding:7px 6px calc(7px + env(safe-area-inset-bottom))}
.tb-in{max-width:900px;margin:0 auto;display:flex;justify-content:space-around}
.tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 2px;border-radius:11px;color:var(--faint);font-size:10.5px;font-weight:700;position:relative}
.tab.act{color:var(--ink)}
.tab .ti{width:44px;height:28px;border-radius:10px;display:grid;place-items:center;transition:.14s}
.tab.act .ti{background:var(--brand-soft);color:var(--brand)}
.tab .dot{position:absolute;top:5px;right:calc(50% - 16px);width:7px;height:7px;border-radius:99px;background:var(--red)}
/* modal */
.ovl{position:fixed;inset:0;z-index:70;background:rgba(13,14,18,.4);display:flex;align-items:flex-end;justify-content:center;animation:fade .18s}
@keyframes fade{from{opacity:0}to{opacity:1}}
@media(min-width:560px){.ovl{align-items:center;padding:20px}}
.modal{background:var(--card);width:100%;max-width:440px;border-radius:22px 22px 0 0;padding:22px;max-height:92vh;overflow:auto;animation:up .24s cubic-bezier(.2,.9,.3,1.15)}
@media(min-width:560px){.modal{border-radius:22px}}
@keyframes up{from{transform:translateY(26px)}to{transform:translateY(0)}}
.modal h3{font-size:18px;font-weight:800;margin:0 0 3px}
.modal .desc{font-size:12.5px;color:var(--muted);font-weight:500;margin-bottom:16px;line-height:1.5}
.fld{margin-bottom:13px}
.fld label{display:block;font-size:12px;font-weight:700;margin-bottom:6px}
.inp{width:100%;padding:12px 13px;border-radius:12px;border:1.5px solid var(--line);font-size:14.5px;font-family:inherit;font-weight:600;background:var(--bg);outline:none;transition:.14s}
.inp:focus{border-color:var(--brand);background:#fff}
.emoji{display:flex;flex-wrap:wrap;gap:6px}
.emoji button{width:38px;height:38px;border-radius:10px;font-size:19px;background:var(--bg);border:1.5px solid transparent}
.emoji button.sel{border-color:var(--brand);background:var(--brand-soft)}
.seg{display:flex;gap:5px;background:var(--bg);padding:4px;border-radius:12px}
.seg button{flex:1;padding:9px;border-radius:9px;font-weight:700;font-size:12.5px;color:var(--muted)}
.seg button.on{background:#fff;color:var(--ink);box-shadow:var(--sh)}
/* login */
.login{min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:26px;max-width:440px;margin:0 auto}
.login .brandbig{display:flex;align-items:center;gap:12px;margin-bottom:6px}
.login .mark{width:46px;height:46px;border-radius:13px;font-size:15px}
.login h2{font-size:24px;font-weight:800;margin:0;letter-spacing:-.03em}
.login .tag{font-size:13.5px;color:var(--muted);font-weight:600;margin-top:2px}
.role{width:100%;text-align:left;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;display:flex;align-items:center;gap:14px;margin-top:12px;box-shadow:var(--sh);transition:.14s}
.role:hover{border-color:var(--brand);transform:translateY(-1px)}
.role .ri{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;flex:none}
.role .rt{font-weight:800;font-size:15px}
.role .rd{font-size:12px;color:var(--muted);font-weight:600;margin-top:2px}
/* qris */
.qris-box{background:var(--bg);border:1px solid var(--line);border-radius:16px;padding:16px;text-align:center}
.qris-box img{max-width:230px;width:100%;border-radius:12px;border:1px solid var(--line);background:#fff}
.drop{border:1.6px dashed var(--line);border-radius:13px;padding:20px;text-align:center;color:var(--muted);font-weight:600;font-size:13px;background:var(--bg)}
.drop:hover{border-color:var(--brand);color:var(--brand)}
.proof-thumb{width:52px;height:52px;border-radius:10px;object-fit:cover;border:1px solid var(--line);flex:none;cursor:pointer}
.money-in{color:#0d7a3d}.money-out{color:#c0332f}
.note{font-size:12px;color:var(--muted);font-weight:500;line-height:1.5}
.imgview{max-width:100%;max-height:70vh;border-radius:14px}
table.rep{width:100%;border-collapse:collapse;font-size:13.5px}
table.rep td{padding:11px 0;border-bottom:1px solid var(--line2)}
`;

export default function App() {
  const [data, setData] = useState(DEFAULT);
  const [session, setSession] = useState(null); // {role, memberId, name}
  const [loaded, setLoaded] = useState(false);
  const lastSync = useRef('');

  // load shared data + local session
  useEffect(() => {
    (async () => {
      const d = await sGet(DATA_KEY, true);
      if (d) { lastSync.current = d; try { setData({ ...DEFAULT, ...JSON.parse(d) }); } catch {} }
      const s = await sGet(SESSION_KEY, false);
      if (s) { try { setSession(JSON.parse(s)); } catch {} }
      setLoaded(true);
    })();
  }, []);

  // persist data (shared)
  useEffect(() => {
    if (!loaded) return;
    const s = JSON.stringify(data);
    if (s === lastSync.current) return;
    lastSync.current = s;
    sSet(DATA_KEY, s, true);
  }, [data, loaded]);

  // persist session (local)
  useEffect(() => {
    if (!loaded) return;
    sSet(SESSION_KEY, JSON.stringify(session), false);
  }, [session, loaded]);

  // poll shared data so admin & students stay in sync
  useEffect(() => {
    if (!loaded) return;
    const id = setInterval(async () => {
      const d = await sGet(DATA_KEY, true);
      if (d && d !== lastSync.current) { lastSync.current = d; try { setData(JSON.parse(d)); } catch {} }
    }, 6000);
    return () => clearInterval(id);
  }, [loaded]);

  const up = (fn) => setData((d) => { const c = structuredClone(d); fn(c); return c; });

  if (!loaded) return (
    <div className="app" style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
      <style>{CSS}</style>
      <div style={{ textAlign: 'center' }}>
        <div className="mark" style={{ margin: '0 auto' }}>XI</div>
        <p className="note" style={{ marginTop: 12 }}>Membuka kas kelas…</p>
      </div>
    </div>
  );

  if (!session) return <Login data={data} onLogin={setSession} />;

  return session.role === 'admin'
    ? <AdminApp data={data} up={up} session={session} logout={() => setSession(null)} />
    : <MuridApp data={data} up={up} session={session} logout={() => setSession(null)} />;
}

/* ============================ LOGIN ============================ */
function Login({ data, onLogin }) {
  const [step, setStep] = useState('role'); // role | murid | admin
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [pick, setPick] = useState('');

  return (
    <div className="app">
      <style>{CSS}</style>
      <div className="login">
        <div className="brandbig">
          <div className="mark">XI</div>
          <div>
            <h2>{data.settings.className}</h2>
            <div className="tag">Kas Kelas · transparan & rapi</div>
          </div>
        </div>

        {step === 'role' && (
          <div style={{ marginTop: 20 }}>
            <button className="role" onClick={() => setStep('murid')}>
              <div className="ri" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}><GraduationCap size={22} /></div>
              <div style={{ flex: 1 }}>
                <div className="rt">Masuk sebagai Murid</div>
                <div className="rd">Bayar QRIS, lihat pemasukan, pengeluaran & siapa yang sudah bayar</div>
              </div>
              <ChevronRight size={18} color="var(--faint)" />
            </button>
            <button className="role" onClick={() => setStep('admin')}>
              <div className="ri" style={{ background: 'var(--ink)', color: '#fff' }}><ShieldCheck size={22} /></div>
              <div style={{ flex: 1 }}>
                <div className="rt">Masuk sebagai Admin</div>
                <div className="rd">Bendahara & guru — verifikasi, edit, & kelola keuangan</div>
              </div>
              <ChevronRight size={18} color="var(--faint)" />
            </button>
            <p className="note" style={{ textAlign: 'center', marginTop: 22 }}>
              Data kas dibagikan ke semua yang membuka halaman ini, jadi seluruh kelas melihat catatan yang sama.
            </p>
          </div>
        )}

        {step === 'murid' && (
          <div className="card pad" style={{ marginTop: 20 }}>
            <div className="fld">
              <label>Pilih namamu</label>
              {data.members.length === 0 ? (
                <p className="note">Belum ada nama terdaftar. Minta bendahara menambahkanmu lewat menu Admin dulu ya.</p>
              ) : (
                <select className="inp" value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="">— pilih nama —</option>
                  {data.members.map((m) => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
                </select>
              )}
            </div>
            <button className="btn btn-p btn-full" disabled={!pick}
              style={{ opacity: pick ? 1 : .5 }}
              onClick={() => { const m = data.members.find((x) => x.id === pick); onLogin({ role: 'murid', memberId: m.id, name: m.name }); }}>
              Masuk
            </button>
            <button className="btn btn-s btn-full" style={{ marginTop: 9 }} onClick={() => setStep('role')}>Kembali</button>
          </div>
        )}

        {step === 'admin' && (
          <div className="card pad" style={{ marginTop: 20 }}>
            <div className="fld">
              <label>PIN Admin</label>
              <input className="inp" type="password" inputMode="numeric" autoFocus placeholder="••••"
                value={pin} onChange={(e) => { setPin(e.target.value); setErr(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') tryAdmin(); }} />
              {err && <p className="note" style={{ color: 'var(--red)', marginTop: 7 }}>{err}</p>}
              <p className="note" style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}><Lock size={12} /> PIN awal: 1234 — ganti nanti di Pengaturan.</p>
            </div>
            <button className="btn btn-d btn-full" onClick={tryAdmin}>Masuk sebagai Admin</button>
            <button className="btn btn-s btn-full" style={{ marginTop: 9 }} onClick={() => setStep('role')}>Kembali</button>
          </div>
        )}
      </div>
    </div>
  );

  function tryAdmin() {
    if (pin === (data.settings.adminPin || '1234')) onLogin({ role: 'admin', name: 'Bendahara' });
    else setErr('PIN salah. Coba lagi.');
  }
}

/* ============================ shared compute ============================ */
function useCompute(data) {
  return useMemo(() => {
    const totalKas = Object.values(data.payments).reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const totalIncome =
