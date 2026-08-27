import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import HomeRedirectGate from './HomeRedirectGate';

const SITE_URL = 'https://duebook.shopbdit.com';
const APK_URL = '/api/apk-builder/download/duebook';

export const metadata: Metadata = {
  title: 'DueBook — বাকির খাতা, দোকানের হিসাব ও লেনদেন অ্যাপ | ফ্রি ডাউনলোড',
  description:
    'বাংলাদেশের দোকানদারদের জন্য #১ ফ্রি বাকির খাতা অ্যাপ। কাস্টমার, সাপ্লায়ার ও কর্মচারীর দেনা-পাওনা, বিকাশ পেমেন্ট, SMS রিমাইন্ডার, অফলাইন সাপোর্ট — সব একসাথে। এখনই ফ্রি ডাউনলোড করুন।',
  alternates: { canonical: SITE_URL },
};

type Feature = { icon: string; title: string; titleEn: string; body: string };
const FEATURES: Feature[] = [
  { icon: '📒', title: 'বাকির খাতা', titleEn: 'Digital Due Book',
    body: 'কাস্টমারের বাকি, সাপ্লায়ারের পাওনা, কর্মচারীর বেতন — সব একসাথে, খাতায় লেখার চেয়ে দ্রুত।' },
  { icon: '📶', title: 'অফলাইনেও চলে', titleEn: 'Works Offline',
    body: 'নেট না থাকলেও লেনদেন যোগ হবে। নেট আসলে অটোমেটিক sync হয়ে যাবে।' },
  { icon: '💬', title: 'SMS ও WhatsApp রিমাইন্ডার', titleEn: 'Reminders',
    body: 'এক ট্যাপে কাস্টমারকে বাকি পরিশোধের রিমাইন্ডার পাঠান — কাস্টমাইজ করা মেসেজে।' },
  { icon: '📱', title: 'বিকাশ / নগদ QR', titleEn: 'bKash / Nagad QR',
    body: 'কাস্টমার সরাসরি QR স্ক্যান করে বাকি পরিশোধ করতে পারবে।' },
  { icon: '🧮', title: 'কুইক ক্যালকুলেটর', titleEn: 'Quick Calculator',
    body: 'FAB থেকে এক ট্যাপে ক্যালকুলেটর — যোগফল হিসাবে ঢুকে যাবে।' },
  { icon: '🎯', title: 'পরিস্থিতি গাইড (নতুন)', titleEn: 'Situation Coach',
    body: 'কাস্টমার তর্ক করছে? ভিড়ে চাপ? এক ট্যাপে বাংলা স্ক্রিপ্ট + ৫-সেকেন্ড রুল।' },
  { icon: '📦', title: 'ইনভেন্টরি ও প্রোডাক্ট', titleEn: 'Inventory',
    body: 'প্রোডাক্ট, দাম, স্টক — কার্টে যোগ করে সরাসরি বিক্রি ও বাকির এন্ট্রি।' },
  { icon: '🔒', title: 'সিকিউর ও প্রাইভেট', titleEn: 'Private & Secure',
    body: 'আপনার হিসাব শুধু আপনার। প্রতিটি দোকানের ডেটা আলাদা টেন্যান্টে।' },
  { icon: '📄', title: 'PDF রিপোর্ট', titleEn: 'PDF Reports',
    body: 'যেকোনো সময় লেনদেন PDF-এ export করে প্রিন্ট বা শেয়ার করুন।' },
];

type FAQ = { q: string; a: string };
const FAQS: FAQ[] = [
  { q: 'DueBook কি ফ্রি?',
    a: 'হ্যাঁ, DueBook সম্পূর্ণ ফ্রি। কাস্টমারের বাকি, সাপ্লায়ারের পাওনা, SMS রিমাইন্ডার, ইনভেন্টরি — সব ফিচার ফ্রিতে ব্যবহার করতে পারবেন।' },
  { q: 'নেট না থাকলে কি চলবে?',
    a: 'হ্যাঁ, DueBook অফলাইনেও কাজ করে। নেট না থাকলে লেনদেন লোকাল স্টোরেজে সেভ হবে, নেট আসলে অটোমেটিক sync হয়ে যাবে।' },
  { q: 'বাকির টাকা কিভাবে collect করব?',
    a: 'প্রতিটি কাস্টমারের জন্য বিকাশ / নগদ QR তৈরি হয়, এক ট্যাপে SMS বা WhatsApp রিমাইন্ডার পাঠাতে পারবেন। কাস্টমার QR স্ক্যান করে সরাসরি টাকা পাঠাতে পারবে।' },
  { q: 'অ্যাপটা কি Android-এ চলবে?',
    a: 'হ্যাঁ, DueBook Android APK ফ্রিতে ডাউনলোড করা যাবে। iPhone/iPad ও যেকোনো ব্রাউজারে ওয়েব অ্যাপ হিসেবেও চলে।' },
  { q: 'আমার ডেটা কি সুরক্ষিত?',
    a: 'প্রতিটি দোকানের ডেটা আলাদা টেন্যান্টে থাকে, শুধু আপনি নিজে দেখতে পারবেন। পাসওয়ার্ড ও সিকিউরিটি প্রশ্ন দিয়ে অ্যাকাউন্ট সুরক্ষিত।' },
  { q: 'একাধিক কর্মচারী কি একসাথে ব্যবহার করতে পারবে?',
    a: 'হ্যাঁ, দোকানের যেকোনো ডিভাইস থেকে সাইন-ইন করে ব্যবহার করা যাবে — সব ডিভাইসে ডেটা রিয়েল-টাইমে sync হবে।' },
];

const jsonLdSoftware = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'DueBook — বাকির খাতা',
  operatingSystem: 'Android, Web, iOS',
  applicationCategory: 'FinanceApplication',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'BDT' },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '1240' },
  inLanguage: ['bn', 'en'],
  description:
    'DueBook — বাংলাদেশি দোকানদারদের জন্য ফ্রি বাকির খাতা অ্যাপ। দেনা-পাওনা, বিকাশ পেমেন্ট, SMS রিমাইন্ডার, অফলাইন সাপোর্ট।',
  url: SITE_URL,
  downloadUrl: `${SITE_URL}${APK_URL}`,
  softwareVersion: '1.3.0',
  publisher: { '@type': 'Organization', name: 'ShopBD IT', url: SITE_URL },
};

const jsonLdFaq = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(f => ({
    '@type': 'Question', name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const jsonLdOrg = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'DueBook',
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  areaServed: { '@type': 'Country', name: 'Bangladesh' },
  sameAs: [],
};

export default function LandingPage() {
  return (
    <>
      <HomeRedirectGate />
      <Script id="ld-software" type="application/ld+json" strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftware) }} />
      <Script id="ld-faq" type="application/ld+json" strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      <Script id="ld-org" type="application/ld+json" strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }} />

      <div className="min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: '"Hind Siliguri","Noto Sans Bengali",system-ui,-apple-system,Segoe UI,Roboto,sans-serif' }}>
        {/* ─── Nav ─── */}
        <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-slate-200">
          <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
            <Link href="/" className="flex items-center gap-2" aria-label="DueBook Home">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 grid place-items-center text-white font-black">৳</span>
              <span className="font-black text-lg tracking-tight">DueBook</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
              <a href="#features" className="hover:text-sky-600">Features</a>
              <a href="#how" className="hover:text-sky-600">কিভাবে চলে</a>
              <a href="#faq" className="hover:text-sky-600">FAQ</a>
              <a href="#download" className="hover:text-sky-600">Download</a>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm font-bold text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100">
                Sign In
              </Link>
              <a href={APK_URL} className="text-sm font-bold text-white px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 shadow">
                ফ্রি APK
              </a>
            </div>
          </nav>
        </header>

        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-emerald-50" aria-hidden="true" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl" aria-hidden="true" />
          <div className="relative max-w-6xl mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                🇧🇩 বাংলাদেশের #১ বাকির খাতা অ্যাপ
              </span>
              <h1 className="mt-4 text-3xl md:text-5xl font-black leading-tight tracking-tight">
                বাকির হিসাব রাখুন
                <span className="block bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                  খাতা ছাড়াই, ফ্রিতে।
                </span>
              </h1>
              <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed">
                DueBook দিয়ে কাস্টমার, সাপ্লায়ার ও কর্মচারীর দেনা-পাওনা রাখুন এক জায়গায়।
                বিকাশ / নগদ পেমেন্ট, SMS রিমাইন্ডার, অফলাইন সাপোর্ট — সব এক ট্যাপে।
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={APK_URL} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-bold shadow-lg shadow-sky-200 active:scale-95 transition">
                  📥 Android APK ডাউনলোড
                </a>
                <Link href="/login" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-800 font-bold border-2 border-slate-200 hover:border-sky-300 active:scale-95 transition">
                  🌐 ওয়েবে ব্যবহার করুন
                </Link>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-slate-500 font-semibold">
                <li>✓ ১০০% ফ্রি</li>
                <li>✓ অফলাইন সাপোর্ট</li>
                <li>✓ বাংলা ও English</li>
                <li>✓ বিকাশ / নগদ QR</li>
              </ul>
            </div>

            {/* Phone mockup */}
            <div className="relative mx-auto w-[260px] md:w-[280px] aspect-[9/19] bg-slate-900 rounded-[36px] p-2 shadow-2xl shadow-sky-200">
              <div className="w-full h-full bg-white rounded-[28px] overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-10 bg-white flex items-center justify-between px-4 text-[10px] font-bold text-slate-800">
                  <span>9:41</span>
                  <span>DueBook</span>
                </div>
                <div className="pt-10 px-3 pb-3 h-full flex flex-col gap-2 bg-gradient-to-b from-sky-50 to-emerald-50">
                  <div className="bg-white rounded-xl p-2.5 shadow-sm">
                    <div className="text-[9px] text-slate-500 font-bold">মোট পাবেন</div>
                    <div className="text-[18px] font-black text-emerald-600">৳ ৪২,৩০০</div>
                  </div>
                  <div className="bg-white rounded-xl p-2.5 shadow-sm">
                    <div className="text-[9px] text-slate-500 font-bold">মোট দিবেন</div>
                    <div className="text-[18px] font-black text-rose-600">৳ ৮,৫০০</div>
                  </div>
                  {['রহিম চাচা', 'করিম স্টোর', 'বিল্লাল', 'শাহেদ ভাই'].map((n, i) => (
                    <div key={n} className="bg-white rounded-xl px-2.5 py-2 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-full grid place-items-center text-white text-[10px] font-black ${
                          ['bg-sky-400','bg-emerald-400','bg-amber-400','bg-fuchsia-400'][i]
                        }`}>{n[0]}</div>
                        <div className="text-[11px] font-bold text-slate-800 truncate">{n}</div>
                      </div>
                      <div className={`text-[11px] font-black ${i % 2 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ৳ {[8500, 3200, 12000, 900][i].toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                  <div className="mt-auto self-end w-11 h-11 rounded-full bg-sky-500 grid place-items-center text-white text-2xl shadow-lg">+</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Trust bar ─── */}
        <section className="bg-white border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { n: '১০,০০০+', l: 'সক্রিয় দোকানদার' },
              { n: '৳ ৫ কোটি+', l: 'ট্র্যাক করা লেনদেন' },
              { n: '৪.৮★', l: 'ইউজার রেটিং' },
              { n: '২৪/৭', l: 'বাংলা সাপোর্ট' },
            ].map(s => (
              <div key={s.l}>
                <div className="text-xl md:text-2xl font-black text-slate-900">{s.n}</div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Features ─── */}
        <section id="features" className="max-w-6xl mx-auto px-4 py-14 md:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight">
              যা যা করতে পারবেন
            </h2>
            <p className="mt-3 text-slate-600">
              ছোট দোকান থেকে সুপারস্টোর — DueBook-এ সব ফিচার ফ্রি।
            </p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <article key={f.title} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition">
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-3 text-lg font-black text-slate-900">{f.title}</h3>
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{f.titleEn}</div>
                <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section id="how" className="bg-gradient-to-b from-white to-slate-50 border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-4xl font-black tracking-tight">কিভাবে শুরু করবেন</h2>
              <p className="mt-3 text-slate-600">তিনটি ধাপে DueBook চালু হয়ে যাবে।</p>
            </div>
            <ol className="mt-10 grid md:grid-cols-3 gap-5">
              {[
                { t: 'ডাউনলোড বা সাইন-আপ', b: 'Android APK বা ওয়েবে ফ্রি সাইন-আপ করুন। ইমেইল + পাসওয়ার্ড।' },
                { t: 'কাস্টমার/সাপ্লায়ার যোগ করুন', b: 'কন্টাক্ট, ফোন নম্বর, প্রোফাইল ছবি — এক ট্যাপে যোগ।' },
                { t: 'লেনদেন এন্ট্রি করুন', b: 'FAB থেকে টাকার অংক দিন, "They Owe" / "I Owe" বাছুন, sync অটো।' },
              ].map((s, i) => (
                <li key={s.t} className="bg-white rounded-2xl border border-slate-100 p-5 relative">
                  <span className="absolute -top-4 left-5 w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 grid place-items-center text-white font-black shadow-lg">{i + 1}</span>
                  <h3 className="mt-3 text-lg font-black">{s.t}</h3>
                  <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">{s.b}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ─── Testimonials ─── */}
        <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight">দোকানদারদের কথা</h2>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              { n: 'সবুজ ভাই', s: 'মুদি দোকান, চিটাগাং', t: 'বাকির খাতা হারিয়ে গিয়েছিল। DueBook দিয়ে সব ব্যাক পেলাম, এখন কাস্টমার আর তর্ক করে না।' },
              { n: 'রফিক স্টোর', s: 'ফার্মেসি, ঢাকা', t: 'SMS রিমাইন্ডার পাঠানোর পর কাস্টমার একদিনেই টাকা দিয়ে গেছে। অসাধারণ ফিচার।' },
              { n: 'কারিমা এন্টারপ্রাইজ', s: 'হোলসেল, খুলনা', t: 'অফলাইনেও চলে, ইন্টারনেট গেলেও কাজ থামে না — এইটাই দরকার ছিল।' },
            ].map(t => (
              <blockquote key={t.n} className="bg-white border border-slate-100 rounded-2xl p-5">
                <p className="text-[14px] text-slate-700 leading-relaxed">&ldquo;{t.t}&rdquo;</p>
                <footer className="mt-4 flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 grid place-items-center text-white font-black">{t.n[0]}</div>
                  <div>
                    <div className="text-[13px] font-black text-slate-900">{t.n}</div>
                    <div className="text-[11px] text-slate-500">{t.s}</div>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* ─── Download CTA ─── */}
        <section id="download" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-600 to-emerald-600" aria-hidden="true" />
          <div className="relative max-w-6xl mx-auto px-4 py-14 md:py-20 text-center text-white">
            <h2 className="text-2xl md:text-4xl font-black">আজই শুরু করুন — সম্পূর্ণ ফ্রি</h2>
            <p className="mt-3 text-white/90 max-w-xl mx-auto">
              ১০ হাজারের বেশি দোকানদার DueBook ব্যবহার করছেন। আপনিও শুরু করুন।
            </p>
            <div className="mt-7 flex flex-wrap gap-3 justify-center">
              <a href={APK_URL} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-sky-700 font-black shadow-lg active:scale-95 transition">
                📥 Android APK ডাউনলোড
              </a>
              <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900/30 backdrop-blur text-white font-black border-2 border-white/40 active:scale-95 transition">
                🌐 ওয়েবে চালু করুন
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="max-w-3xl mx-auto px-4 py-14 md:py-20">
          <div className="text-center">
            <h2 className="text-2xl md:text-4xl font-black tracking-tight">প্রশ্ন ও উত্তর</h2>
            <p className="mt-3 text-slate-600">DueBook সম্পর্কে সাধারণ প্রশ্ন।</p>
          </div>
          <div className="mt-10 space-y-3">
            {FAQS.map((f, i) => (
              <details key={i} className="group bg-white border border-slate-100 rounded-2xl p-4 open:shadow-md transition">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-[15px] font-black text-slate-900 pr-4">{f.q}</span>
                  <span className="text-sky-500 font-black text-xl group-open:rotate-45 transition">+</span>
                </summary>
                <p className="mt-3 text-[13px] text-slate-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="bg-slate-900 text-slate-300">
          <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 grid place-items-center text-white font-black">৳</span>
                <span className="font-black text-lg text-white">DueBook</span>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
                বাংলাদেশি দোকানদারদের জন্য বাকির খাতা অ্যাপ। ছোট ব্যবসাকে ডিজিটাল করার সহজ পথ।
              </p>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Product</div>
              <ul className="mt-3 space-y-1.5 text-[13px]">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#how" className="hover:text-white">কিভাবে চলে</a></li>
                <li><a href="#download" className="hover:text-white">Download APK</a></li>
                <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Company</div>
              <ul className="mt-3 space-y-1.5 text-[13px]">
                <li>ShopBD IT · Bangladesh</li>
                <li><a href="mailto:support@shopbdit.com" className="hover:text-white">support@shopbdit.com</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800">
            <div className="max-w-6xl mx-auto px-4 py-4 text-[12px] text-slate-500 flex flex-wrap gap-2 justify-between">
              <span>© {new Date().getFullYear()} DueBook · ShopBD IT</span>
              <span>Made with ❤ in Bangladesh</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
