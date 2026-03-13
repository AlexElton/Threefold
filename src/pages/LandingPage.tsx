import { CalendarDays, TrendingUp, BarChart3, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

const FEATURES = [
  {
    icon: CalendarDays,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-100',
    title: 'Plan Your Training',
    desc: 'Drag-and-drop workout scheduling across swim, bike, run, and strength. Build structured weeks and see your full season at a glance.',
  },
  {
    icon: TrendingUp,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-100',
    title: 'Track Training Load',
    desc: 'Monitor CTL, ATL, and TSB — the same fitness/fatigue/form model used by professional coaches — so you always know when to push and when to rest.',
  },
  {
    icon: BarChart3,
    color: 'text-violet-600',
    bg: 'bg-violet-50 border-violet-100',
    title: 'Analyse Performance',
    desc: 'Weekly volume charts, discipline breakdowns, and trend comparisons give you a clear picture of your long-term progress.',
  },
];

const DISCIPLINES = [
  { label: 'Swim', color: 'bg-sky-500' },
  { label: 'Bike', color: 'bg-amber-500' },
  { label: 'Run', color: 'bg-green-500' },
  { label: 'Strength', color: 'bg-violet-500' },
];

interface Props {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function LandingPage({ onGetStarted, onSignIn }: Props) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <BrandLogo />
          <nav className="flex items-center gap-4">
            <button
              onClick={onSignIn}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={onGetStarted}
              className="text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 transition-colors"
            >
              Get started
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-5 sm:px-8 py-20 sm:py-28 bg-slate-50 border-b border-slate-100">
        <div className="flex gap-2 mb-8">
          {DISCIPLINES.map(d => (
            <span key={d.label} className={`${d.color} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
              {d.label}
            </span>
          ))}
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight max-w-2xl">
          Train smarter.<br />
          <span className="text-blue-700">Not just harder.</span>
        </h1>
        <p className="mt-5 text-lg text-slate-500 max-w-xl leading-relaxed">
          Threefold brings professional training-load science to endurance athletes.
          Plan, track, and analyse your swim–bike–run workouts in one clean workspace.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onGetStarted}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-7 py-3 transition-colors shadow-sm"
          >
            Get started — it's free
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onSignIn}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            Already have an account? Sign in
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto w-full px-5 sm:px-8 py-16 sm:py-20">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mb-10">
          Everything you need
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className={`border ${f.bg} p-6`}>
              <div className={`inline-flex p-2.5 rounded-lg mb-4 ${f.bg}`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Training load explainer */}
      <section className="border-t border-slate-100 bg-slate-50">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-18 grid grid-cols-1 sm:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug mb-4">
              The science of periodisation, built in.
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-5">
              Threefold automatically computes your chronic training load (CTL), acute training load (ATL),
              and training stress balance (TSB) from every workout you log — the same model trusted by
              professional triathlon coaches worldwide.
            </p>
            <ul className="space-y-2.5">
              {[
                'Know your current form before every key session',
                'Spot over-training risks before they become injuries',
                'Peak confidently for your A-race',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Mock training load card */}
          <div className="bg-white border border-slate-200 p-6 shadow-sm max-w-sm mx-auto w-full">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-900">Training Load</span>
            </div>
            <div className="text-xs font-semibold text-green-600 mb-5">Optimal Form</div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'CTL', value: '68', sub: 'Fitness' },
                { label: 'ATL', value: '61', sub: 'Fatigue' },
                { label: 'TSB', value: '+7', sub: 'Form', highlight: true },
              ].map(m => (
                <div key={m.label} className="text-center">
                  <div className="text-xs text-slate-400 mb-0.5">{m.label}</div>
                  <div className={`text-2xl font-bold ${m.highlight ? 'text-green-600' : 'text-slate-900'}`}>{m.value}</div>
                  <div className="text-xs text-slate-400">{m.sub}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-blue-500 inline-block rounded-sm" />CTL = chronic (42d) fitness</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-orange-400 inline-block rounded-sm" />ATL = acute (7d) fatigue</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-slate-300 inline-block rounded-sm" />TSB = form (CTL − ATL)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-blue-700 text-white text-center px-5 sm:px-8 py-14 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to train with purpose?</h2>
        <p className="text-blue-200 text-sm mb-7 max-w-md mx-auto">
          Create your free account in seconds. No credit card required.
        </p>
        <button
          onClick={onGetStarted}
          className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-semibold px-7 py-3 transition-colors shadow-sm"
        >
          Get started for free
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-12 flex items-center justify-between">
          <BrandLogo className="h-8 w-auto opacity-60" />
          <span className="text-xs text-slate-400">© {new Date().getFullYear()} Threefold</span>
        </div>
      </footer>
    </div>
  );
}
