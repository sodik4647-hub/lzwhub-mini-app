import React, { useState, useEffect, useMemo } from "react";
import {
  Home, Dumbbell, History as HistoryIcon, BarChart3, User, Plus, X, Check,
  Flame, TrendingUp, TrendingDown, Trophy, Search, ChevronRight, Target,
  Award, ArrowLeft, Trash2, Repeat,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                                */
/* ------------------------------------------------------------------ */

const MUSCLES = [
  "Грудь", "Спина", "Плечи", "Бицепс", "Трицепс",
  "Ноги", "Ягодицы", "Пресс", "Икры", "Предплечья", "Другое",
];

const SPLIT_NAMES = ["Толкающие", "Тяговые", "Ноги", "Всё тело"];
const GOALS = ["Набор массы", "Похудение", "Поддержание формы", "Сила", "Общая физическая форма"];
const EXPERIENCE = ["Только начинаю", "До 6 месяцев", "6–12 месяцев", "1–2 года", "Более 2 лет"];

const DEFAULT_EXERCISES = [
  { id: "e1", name: "Жим штанги лёжа", muscle: "Грудь", secondary: "Трицепс", custom: false },
  { id: "e2", name: "Жим гантелей лёжа", muscle: "Грудь", secondary: "Трицепс", custom: false },
  { id: "e3", name: "Жим в тренажёре", muscle: "Грудь", secondary: null, custom: false },
  { id: "e4", name: "Разведение гантелей", muscle: "Грудь", secondary: null, custom: false },
  { id: "e5", name: "Подтягивания", muscle: "Спина", secondary: "Бицепс", custom: false },
  { id: "e6", name: "Тяга штанги в наклоне", muscle: "Спина", secondary: "Бицепс", custom: false },
  { id: "e7", name: "Тяга блока к груди", muscle: "Спина", secondary: "Бицепс", custom: false },
  { id: "e8", name: "Становая тяга", muscle: "Спина", secondary: "Ноги", custom: false },
  { id: "e9", name: "Жим гантелей сидя", muscle: "Плечи", secondary: "Трицепс", custom: false },
  { id: "e10", name: "Махи гантелями в стороны", muscle: "Плечи", secondary: null, custom: false },
  { id: "e11", name: "Подъём штанги на бицепс", muscle: "Бицепс", secondary: null, custom: false },
  { id: "e12", name: "Молотки с гантелями", muscle: "Бицепс", secondary: "Предплечья", custom: false },
  { id: "e13", name: "Разгибание на блоке", muscle: "Трицепс", secondary: null, custom: false },
  { id: "e14", name: "Французский жим", muscle: "Трицепс", secondary: null, custom: false },
  { id: "e15", name: "Приседания со штангой", muscle: "Ноги", secondary: "Ягодицы", custom: false },
  { id: "e16", name: "Жим ногами", muscle: "Ноги", secondary: "Ягодицы", custom: false },
  { id: "e17", name: "Разгибание ног", muscle: "Ноги", secondary: null, custom: false },
  { id: "e18", name: "Сгибание ног", muscle: "Ноги", secondary: null, custom: false },
  { id: "e19", name: "Подъём на носки", muscle: "Икры", secondary: null, custom: false },
  { id: "e20", name: "Скручивания", muscle: "Пресс", secondary: null, custom: false },
  { id: "e21", name: "Ягодичный мостик", muscle: "Ягодицы", secondary: "Ноги", custom: false },
];

const DEFAULT_PROFILE = {
  name: "",
  targetWeight: null,
  height: null,
  goal: null,
  experience: null,
  joinDate: null,
  hintsEnabled: true,
  isRegistered: false,
  telegram: null,
};

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .tabular { font-variant-numeric: tabular-nums; }
  @keyframes btnShine {
    0% { transform: translateX(-130%) skewX(-20deg); }
    55%, 100% { transform: translateX(230%) skewX(-20deg); }
  }
  .btn-shine { position: relative; overflow: hidden; }
  .btn-shine::after {
    content: '';
    position: absolute; top: 0; left: 0; height: 100%; width: 45%;
    background: linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent);
    animation: btnShine 3.2s ease-in-out infinite;
    animation-delay: 0.6s;
    pointer-events: none;
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .card-in { animation: cardIn 260ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
`;

/* ---------------------------- storage ------------------------------ */

const STORAGE_KEY = "lzwhub_data";

function loadStored() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}
function saveStored(data) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    /* ignore quota / privacy-mode errors */
  }
}
const initialStored = loadStored();

/* ---------------------------- telegram ------------------------------ */

function getTelegramUser() {
  try {
    const tg = window.Telegram && window.Telegram.WebApp;
    if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) return null;
    return tg.initDataUnsafe.user;
  } catch (e) {
    return null;
  }
}
function haptic(type = "light") {
  try {
    const tg = window.Telegram && window.Telegram.WebApp;
    if (!tg || !tg.HapticFeedback) return;
    if (type === "success" || type === "error" || type === "warning") {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch (e) {
    /* not running inside Telegram */
  }
}

/* ---------------------------- formatting ---------------------------- */

const pad = (n) => (n < 10 ? "0" + n : "" + n);

function formatTimer(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}
function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}
function formatDateLong(d) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}
function formatDateShort(d) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
function formatTime(d) {
  return new Date(d).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}
function isSameDay(a, b) {
  const x = new Date(a), y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function getMonday(d) {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7;
  return addDays(x, -day);
}
function weekRange(offsetWeeks) {
  const monday = addDays(getMonday(new Date()), offsetWeeks * 7);
  const nextMonday = addDays(monday, 7);
  return [monday, nextMonday];
}
function fmtNum(n) {
  return Math.round(n).toLocaleString("ru-RU");
}
function fmtWeight(n) {
  return (Math.round(n * 10) / 10).toLocaleString("ru-RU");
}
function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
function pluralRu(n, one, few, many) {
  const mod = Math.abs(n) % 100;
  const n1 = mod % 10;
  if (mod > 10 && mod < 20) return many;
  if (n1 > 1 && n1 < 5) return few;
  if (n1 === 1) return one;
  return many;
}
const pluralDays = (n) => pluralRu(n, "день", "дня", "дней");
const pluralSets = (n) => pluralRu(n, "подход", "подхода", "подходов");

/* ------------------------------------------------------------------ */
/*  Small shared UI pieces                                              */
/* ------------------------------------------------------------------ */

const BLUE = "#3B82F6";

function Card({ children, className = "", style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`card-in rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 ${
        onClick ? "cursor-pointer transition-transform duration-150 active:scale-[0.98]" : ""
      } ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ transitionTimingFunction: SPRING }}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-90 ${
        active ? "bg-blue-600 text-white shadow-md shadow-blue-950/40" : "bg-zinc-900 text-zinc-400 border border-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled, className = "", icon: Icon, shine = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ transitionTimingFunction: SPRING }}
      className={`group relative flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 px-5 py-4 text-[15px] font-semibold text-white shadow-lg shadow-blue-950/50 transition-all duration-150 active:translate-y-0.5 active:scale-[0.97] active:shadow-sm disabled:opacity-40 disabled:shadow-none ${
        shine ? "btn-shine" : ""
      } ${className}`}
    >
      {Icon ? <Icon size={18} strokeWidth={2.5} className="transition-transform duration-200 group-active:rotate-90" /> : null}
      <span className="relative">{children}</span>
    </button>
  );
}

function GhostButton({ children, onClick, className = "", icon: Icon }) {
  return (
    <button
      onClick={onClick}
      style={{ transitionTimingFunction: SPRING }}
      className={`group flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-200 transition-all duration-150 active:scale-[0.96] active:bg-zinc-800 ${className}`}
    >
      {Icon ? <Icon size={16} className="transition-transform duration-200 group-active:rotate-90" /> : null}
      {children}
    </button>
  );
}

function Sheet({ open, onClose, title, children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (open) {
      const t = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(t);
    } else {
      setMounted(false);
    }
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black transition-opacity duration-200 ${mounted ? "opacity-60" : "opacity-0"}`}
      />
      <div
        className={`relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-zinc-800 bg-neutral-950 px-5 pb-8 pt-4 transition-transform duration-300 ${
          mounted ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ transitionTimingFunction: mounted ? SPRING : "ease-in" }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />
        {title ? (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button onClick={onClose} className="rounded-full bg-zinc-900 p-2 text-zinc-400 transition-transform duration-150 active:scale-90">
              <X size={18} />
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function EmptyState({ title, subtitle, cta, onCta }) {
  return (
    <div className="card-in flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 px-6 py-14 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900">
        <Dumbbell size={26} className="text-blue-500" />
      </div>
      <p className="text-[15px] font-semibold text-white">{title}</p>
      {subtitle ? <p className="mt-1 max-w-[240px] text-sm text-zinc-500">{subtitle}</p> : null}
      {cta ? (
        <PrimaryButton onClick={onCta} className="mt-5 w-full max-w-[260px]" shine>
          {cta}
        </PrimaryButton>
      ) : null}
    </div>
  );
}

function Delta({ value, suffix = "" }) {
  if (value === 0) return <span className="text-sm font-medium text-zinc-500">без изменений</span>;
  const up = value > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${up ? "text-blue-400" : "text-zinc-500"}`}>
      <Icon size={14} />
      {up ? "+" : ""}{value}{suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Onboarding                                                          */
/* ------------------------------------------------------------------ */

function OnboardingScreen({ onComplete }) {
  const tgUser = useMemo(() => getTelegramUser(), []);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(() => (tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") : ""));
  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [height, setHeight] = useState("");
  const [goal, setGoal] = useState(null);
  const [experience, setExperience] = useState(null);
  const [done, setDone] = useState(false);
  const totalSteps = 6;

  function next() {
    haptic("light");
    if (step < totalSteps - 1) setStep(step + 1);
    else setDone(true);
  }
  function finish() {
    haptic("success");
    onComplete({
      name: name.trim() || "Атлет",
      currentWeight: currentWeight !== "" ? parseFloat(currentWeight) : null,
      targetWeight: targetWeight !== "" ? parseFloat(targetWeight) : null,
      height: height !== "" ? parseFloat(height) : null,
      goal,
      experience,
      telegram: tgUser ? { id: tgUser.id, username: tgUser.username || null, photoUrl: tgUser.photo_url || null } : null,
    });
  }

  const nextDisabled = step === 0 && !name.trim();

  if (done) {
    return (
      <div
        className="relative mx-auto flex h-[812px] max-h-[100vh] w-full max-w-[420px] flex-col items-center justify-center overflow-hidden bg-black px-8 text-center text-white"
        style={{ fontFamily: "'Manrope', system-ui, -apple-system, sans-serif" }}
      >
        <style>{GLOBAL_STYLES}</style>
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="card-in relative">
          <p className="text-5xl">🔥</p>
          <h1 className="mt-4 text-2xl font-bold">Готово</h1>
          <p className="mt-2 text-sm text-zinc-500">Теперь LZWHUB будет отслеживать твой прогресс.</p>
          <PrimaryButton onClick={finish} className="mt-8 w-full" shine>
            Перейти в LZWHUB
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto flex h-[812px] max-h-[100vh] w-full max-w-[420px] flex-col justify-between overflow-hidden bg-black px-6 py-10 text-white"
      style={{ fontFamily: "'Manrope', system-ui, -apple-system, sans-serif" }}
    >
      <style>{GLOBAL_STYLES}</style>
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="relative">
        <div className="mb-8 flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-blue-500" : "bg-zinc-800"}`} />
          ))}
        </div>
        <p className="text-[13px] font-semibold uppercase tracking-wide text-blue-500">LZWHUB</p>

        {step === 0 && (
          <div key={step} className="card-in mt-3">
            <p className="text-sm text-zinc-500">Давай познакомимся</p>
            <h1 className="mt-1 text-2xl font-bold">Как тебя зовут?</h1>
            <p className="mt-1 text-sm text-zinc-500">Заполни несколько данных, чтобы настроить LZWHUB под себя</p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !nextDisabled && next()}
              placeholder="Имя"
              className="mt-6 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-lg text-white placeholder-zinc-600 outline-none focus:border-blue-600"
            />
          </div>
        )}
        {step === 1 && (
          <div key={step} className="card-in mt-3">
            <h1 className="text-2xl font-bold">Твой текущий вес</h1>
            <p className="mt-1 text-sm text-zinc-500">Можно пропустить и указать позже</p>
            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4">
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                placeholder="__"
                className="w-full bg-transparent text-lg text-white placeholder-zinc-600 outline-none"
              />
              <span className="text-zinc-500">кг</span>
            </div>
          </div>
        )}
        {step === 2 && (
          <div key={step} className="card-in mt-3">
            <h1 className="text-2xl font-bold">Твой целевой вес</h1>
            <p className="mt-1 text-sm text-zinc-500">Можно пропустить и указать позже</p>
            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4">
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="__"
                className="w-full bg-transparent text-lg text-white placeholder-zinc-600 outline-none"
              />
              <span className="text-zinc-500">кг</span>
            </div>
          </div>
        )}
        {step === 3 && (
          <div key={step} className="card-in mt-3">
            <h1 className="text-2xl font-bold">Твой рост</h1>
            <p className="mt-1 text-sm text-zinc-500">Можно пропустить и указать позже</p>
            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4">
              <input
                autoFocus
                type="number"
                inputMode="numeric"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="__"
                className="w-full bg-transparent text-lg text-white placeholder-zinc-600 outline-none"
              />
              <span className="text-zinc-500">см</span>
            </div>
          </div>
        )}
        {step === 4 && (
          <div key={step} className="card-in mt-3">
            <h1 className="text-2xl font-bold">Твоя цель</h1>
            <p className="mt-1 text-sm text-zinc-500">Можно пропустить и указать позже</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <Chip key={g} active={goal === g} onClick={() => setGoal(goal === g ? null : g)}>{g}</Chip>
              ))}
            </div>
          </div>
        )}
        {step === 5 && (
          <div key={step} className="card-in mt-3">
            <h1 className="text-2xl font-bold">Как давно ты тренируешься?</h1>
            <p className="mt-1 text-sm text-zinc-500">Можно пропустить и указать позже</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {EXPERIENCE.map((ex) => (
                <Chip key={ex} active={experience === ex} onClick={() => setExperience(experience === ex ? null : ex)}>{ex}</Chip>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative flex items-center gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            style={{ transitionTimingFunction: SPRING }}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 text-zinc-400 transition-transform duration-150 active:scale-90"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <PrimaryButton onClick={next} disabled={nextDisabled} className="flex-1 py-4 text-base" shine>
          Продолжить
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Root App                                                           */
/* ------------------------------------------------------------------ */

export default function App() {
  const [tab, setTab] = useState("home");
  const [exercises, setExercises] = useState(initialStored?.exercises ?? DEFAULT_EXERCISES);
  const [workouts, setWorkouts] = useState(initialStored?.workouts ?? []);
  const [weightEntries, setWeightEntries] = useState(initialStored?.weightEntries ?? []);
  const [profile, setProfile] = useState({ ...DEFAULT_PROFILE, ...(initialStored?.profile || {}) });
  const [activeWorkout, setActiveWorkout] = useState(initialStored?.activeWorkout ?? null);

  const [elapsed, setElapsed] = useState(0);
  const [finishSummary, setFinishSummary] = useState(null);

  const [showStartSheet, setShowStartSheet] = useState(false);
  const [pendingRepeat, setPendingRepeat] = useState(null);

  const [viewingWorkoutId, setViewingWorkoutId] = useState(null);
  const [workoutEditMode, setWorkoutEditMode] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [addExercisePreset, setAddExercisePreset] = useState("");

  const [showWeightSheet, setShowWeightSheet] = useState(false);
  const [editingWeightEntry, setEditingWeightEntry] = useState(null);
  const [historyView, setHistoryView] = useState("list");
  const [selectedDay, setSelectedDay] = useState(null);
  const [statsView, setStatsView] = useState("overview");
  const [showEditProfile, setShowEditProfile] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  /* ---------- Telegram WebApp bootstrap ---------- */
  useEffect(() => {
    try {
      const tg = window.Telegram && window.Telegram.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        if (tg.setHeaderColor) tg.setHeaderColor("#000000");
        if (tg.setBackgroundColor) tg.setBackgroundColor("#000000");
      }
    } catch (e) {
      /* not inside Telegram, ignore */
    }
  }, []);

  /* ---------- persistence ---------- */
  useEffect(() => {
    saveStored({ profile, exercises, workouts, weightEntries, activeWorkout });
  }, [profile, exercises, workouts, weightEntries, activeWorkout]);

  /* ---------- active workout timer ---------- */
  useEffect(() => {
    if (!activeWorkout) return;
    const start = new Date(activeWorkout.startTime).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeWorkout?.startTime]);

  useEffect(() => {
    setWorkoutEditMode(false);
  }, [viewingWorkoutId]);

  /* -------------------- derived data -------------------- */

  const sortedWorkouts = useMemo(
    () => [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [workouts]
  );

  const currentWeight = weightEntries.length ? weightEntries[weightEntries.length - 1].weight : null;

  const streak = useMemo(() => {
    if (sortedWorkouts.length === 0) return 0;
    const daysSinceLast = Math.floor((startOfDay(new Date()) - startOfDay(sortedWorkouts[0].date)) / 86400000);
    if (daysSinceLast > 2) return 0;
    const uniqueDates = [...new Set(sortedWorkouts.map((w) => startOfDay(w.date).getTime()))].sort((a, b) => b - a);
    let s = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const gap = (uniqueDates[i - 1] - uniqueDates[i]) / 86400000;
      if (gap <= 2) s++;
      else break;
    }
    return s;
  }, [sortedWorkouts]);

  const thisWeekWorkouts = useMemo(() => {
    const [start, end] = weekRange(0);
    return sortedWorkouts.filter((w) => new Date(w.date) >= start && new Date(w.date) < end);
  }, [sortedWorkouts]);

  function recordsMap(list) {
    const map = new Map();
    for (const w of list) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          if (s.type === "warmup") continue;
          const cur = map.get(ex.name);
          if (!cur || s.weight > cur.weight || (s.weight === cur.weight && s.reps > cur.reps)) {
            map.set(ex.name, { weight: s.weight, reps: s.reps, date: w.date, muscle: ex.muscle });
          }
        }
      }
    }
    return map;
  }
  const allTimeRecords = useMemo(() => recordsMap(sortedWorkouts), [sortedWorkouts]);

  function muscleAggregate(list) {
    const agg = {};
    MUSCLES.forEach((m) => (agg[m] = { sets: 0, exerciseNames: new Set(), workoutIds: new Set(), volume: 0 }));
    for (const w of list) {
      for (const ex of w.exercises) {
        const m = agg[ex.muscle] ? ex.muscle : "Другое";
        for (const s of ex.sets) {
          agg[m].sets += 1;
          agg[m].exerciseNames.add(ex.name);
          agg[m].workoutIds.add(w.id);
          agg[m].volume += s.weight * s.reps;
        }
      }
    }
    return agg;
  }

  const smartHints = useMemo(() => {
    if (sortedWorkouts.length === 0) return [];
    const hints = [];
    const last = sortedWorkouts[0];
    const lastEx = last.exercises.find((ex) => ex.sets.length > 0);
    if (lastEx) {
      const s = lastEx.sets[lastEx.sets.length - 1];
      hints.push(`В прошлой тренировке ты сделал «${lastEx.name}» ${fmtWeight(s.weight)} кг × ${s.reps}. Попробуй повторить или добавить 2,5 кг.`);
    }
    const lastTrained = {};
    sortedWorkouts.forEach((w) =>
      w.exercises.forEach((ex) => {
        if (ex.sets.length === 0) return;
        if (!lastTrained[ex.muscle] || new Date(w.date) > new Date(lastTrained[ex.muscle])) lastTrained[ex.muscle] = w.date;
      })
    );
    let worstMuscle = null, worstGap = 0;
    Object.entries(lastTrained).forEach(([m, d]) => {
      const gap = Math.floor((startOfDay(new Date()) - startOfDay(d)) / 86400000);
      if (gap >= 6 && gap > worstGap) { worstGap = gap; worstMuscle = m; }
    });
    if (worstMuscle) hints.push(`Ты не тренировал «${worstMuscle}» уже ${worstGap} ${pluralDays(worstGap)}.`);

    const [wS, wE] = weekRange(0);
    const weekWorkouts = sortedWorkouts.filter((w) => new Date(w.date) >= wS && new Date(w.date) < wE);
    if (weekWorkouts.length) {
      const agg = muscleAggregate(weekWorkouts);
      const top = MUSCLES.reduce((best, m) => (agg[m].sets > (agg[best]?.sets || 0) ? m : best), null);
      if (top && agg[top].sets > 0) hints.push(`На этой неделе у тебя ${agg[top].sets} ${pluralSets(agg[top].sets)} на «${top}».`);
    }
    const avgDur = sortedWorkouts.reduce((a, w) => a + w.duration, 0) / sortedWorkouts.length;
    hints.push(`Твоя средняя длительность тренировок — ${formatDuration(avgDur)}.`);
    return hints.slice(0, 3);
  }, [sortedWorkouts]);

  /* -------------------- actions -------------------- */

  function completeOnboarding({ name, currentWeight: cw, targetWeight, height, goal, experience, telegram }) {
    setProfile((p) => ({
      ...p,
      name,
      targetWeight,
      height,
      goal,
      experience,
      joinDate: new Date().toISOString(),
      isRegistered: true,
      telegram: telegram || p.telegram,
    }));
    if (cw != null) {
      setWeightEntries([{ id: uid("we"), date: startOfDay(new Date()).toISOString(), weight: cw }]);
    }
  }

  function startWorkout(name) {
    haptic("medium");
    if (pendingRepeat) {
      setActiveWorkout({
        id: uid("wk"),
        name,
        startTime: new Date().toISOString(),
        exercises: pendingRepeat.exercises.map((ex) => ({
          id: uid("wex"),
          exerciseId: ex.exerciseId,
          name: ex.name,
          muscle: ex.muscle,
          secondary: ex.secondary,
          sets: [],
        })),
      });
      setPendingRepeat(null);
    } else {
      setActiveWorkout({ id: uid("wk"), name, startTime: new Date().toISOString(), exercises: [] });
    }
    setShowStartSheet(false);
    setElapsed(0);
    setTab("workout");
  }

  function dispatchPickExercise(exercise) {
    if (!pickerTarget) return;
    if (pickerTarget.kind === "active") {
      setActiveWorkout((wk) => ({
        ...wk,
        exercises: [
          ...wk.exercises,
          { id: uid("wex"), exerciseId: exercise.id, name: exercise.name, muscle: exercise.muscle, secondary: exercise.secondary, sets: [] },
        ],
      }));
    } else if (pickerTarget.kind === "history") {
      setWorkouts((all) =>
        all.map((w) => {
          if (w.id !== pickerTarget.workoutId) return w;
          const newEx = { id: uid("wex"), exerciseId: exercise.id, name: exercise.name, muscle: exercise.muscle, secondary: exercise.secondary, sets: [] };
          const list = [...w.exercises, newEx];
          return { ...w, exercises: list, muscles: [...new Set(list.map((e) => e.muscle))] };
        })
      );
    }
    setPickerTarget(null);
    setExercisePickerOpen(false);
  }

  function addSet(wexId, set) {
    haptic("light");
    setActiveWorkout((wk) => ({
      ...wk,
      exercises: wk.exercises.map((ex) => (ex.id === wexId ? { ...ex, sets: [...ex.sets, { id: uid("set"), ...set }] } : ex)),
    }));
  }
  function deleteSet(wexId, setId) {
    setActiveWorkout((wk) => ({
      ...wk,
      exercises: wk.exercises.map((ex) => (ex.id === wexId ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) } : ex)),
    }));
  }
  function removeExerciseFromActive(wexId) {
    setActiveWorkout((wk) => ({ ...wk, exercises: wk.exercises.filter((ex) => ex.id !== wexId) }));
  }

  function lastPerformance(exerciseName) {
    for (const w of sortedWorkouts) {
      const ex = w.exercises.find((e) => e.name === exerciseName);
      if (ex && ex.sets.length) {
        const last = ex.sets[ex.sets.length - 1];
        return { weight: last.weight, reps: last.reps };
      }
    }
    return null;
  }

  function finishWorkout() {
    const wk = activeWorkout;
    if (!wk) return;
    haptic("success");
    const nonEmpty = wk.exercises.filter((ex) => ex.sets.length > 0);
    const endDate = new Date();
    const durationSec = Math.floor((endDate - new Date(wk.startTime)) / 1000);
    const totalSets = nonEmpty.reduce((a, ex) => a + ex.sets.length, 0);
    const totalReps = nonEmpty.reduce((a, ex) => a + ex.sets.reduce((b, s) => b + s.reps, 0), 0);
    const muscleBreak = {};
    nonEmpty.forEach((ex) => {
      muscleBreak[ex.muscle] = (muscleBreak[ex.muscle] || 0) + ex.sets.length;
    });

    const priorRecords = allTimeRecords;
    const prs = [];
    nonEmpty.forEach((ex) => {
      const prior = priorRecords.get(ex.name);
      const bestSet = ex.sets.reduce(
        (best, s) => (!best || s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps) ? s : best),
        null
      );
      if (bestSet && (!prior || bestSet.weight > prior.weight || (bestSet.weight === prior.weight && bestSet.reps > prior.reps))) {
        prs.push({ name: ex.name, weight: bestSet.weight, reps: bestSet.reps });
      }
    });

    const finished = {
      id: wk.id,
      name: wk.name,
      date: wk.startTime,
      endDate: endDate.toISOString(),
      duration: durationSec,
      exercises: nonEmpty,
      muscles: [...new Set(nonEmpty.map((e) => e.muscle))],
    };
    setWorkouts((all) => [finished, ...all]);
    setActiveWorkout(null);
    setElapsed(0);
    setFinishSummary({ duration: durationSec, exerciseCount: nonEmpty.length, totalSets, totalReps, muscleBreak, prs });
  }

  function deleteWorkout(id) {
    setWorkouts((all) => all.filter((w) => w.id !== id));
    setConfirmDeleteId(null);
    setViewingWorkoutId(null);
  }

  function deleteSetFromWorkout(workoutId, wexId, setId) {
    setWorkouts((all) =>
      all.map((w) => {
        if (w.id !== workoutId) return w;
        const exercises = w.exercises.map((ex) => (ex.id === wexId ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) } : ex));
        return { ...w, exercises, muscles: [...new Set(exercises.map((e) => e.muscle))] };
      })
    );
  }
  function addSetToWorkoutHistory(workoutId, wexId, set) {
    setWorkouts((all) =>
      all.map((w) =>
        w.id !== workoutId
          ? w
          : { ...w, exercises: w.exercises.map((ex) => (ex.id === wexId ? { ...ex, sets: [...ex.sets, { id: uid("set"), ...set }] } : ex)) }
      )
    );
  }
  function updateSetInWorkout(workoutId, wexId, setId, patch) {
    setWorkouts((all) =>
      all.map((w) =>
        w.id !== workoutId
          ? w
          : {
              ...w,
              exercises: w.exercises.map((ex) =>
                ex.id !== wexId ? ex : { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }
              ),
            }
      )
    );
  }
  function removeExerciseFromWorkout(workoutId, wexId) {
    setWorkouts((all) =>
      all.map((w) => {
        if (w.id !== workoutId) return w;
        const exercises = w.exercises.filter((ex) => ex.id !== wexId);
        return { ...w, exercises, muscles: [...new Set(exercises.map((e) => e.muscle))] };
      })
    );
  }
  function updateWorkoutName(workoutId, name) {
    setWorkouts((all) => all.map((w) => (w.id === workoutId ? { ...w, name } : w)));
  }
  function updateWorkoutDateTime(workoutId, field, value) {
    setWorkouts((all) =>
      all.map((w) => {
        if (w.id !== workoutId) return w;
        let newDate = new Date(w.date);
        let newEnd = new Date(w.endDate);
        if (field === "date") {
          const [y, m, d] = value.split("-").map(Number);
          newDate.setFullYear(y, m - 1, d);
          newEnd.setFullYear(y, m - 1, d);
        } else if (field === "startTime") {
          const [h, mi] = value.split(":").map(Number);
          newDate.setHours(h, mi, 0, 0);
        } else if (field === "endTime") {
          const [h, mi] = value.split(":").map(Number);
          newEnd.setHours(h, mi, 0, 0);
        }
        const duration = Math.max(0, Math.round((newEnd - newDate) / 1000));
        return { ...w, date: newDate.toISOString(), endDate: newEnd.toISOString(), duration };
      })
    );
  }

  function repeatWorkout(workout) {
    setPendingRepeat(workout);
    setViewingWorkoutId(null);
    setShowStartSheet(true);
  }

  function openAddWeight() { setEditingWeightEntry(null); setShowWeightSheet(true); }
  function openEditWeight(entry) { setEditingWeightEntry(entry); setShowWeightSheet(true); }
  function closeWeightSheet() { setShowWeightSheet(false); setEditingWeightEntry(null); }
  function saveWeightEntry(weight) {
    haptic("light");
    if (editingWeightEntry) {
      setWeightEntries((list) => list.map((e) => (e.id === editingWeightEntry.id ? { ...e, weight } : e)));
    } else {
      const today = startOfDay(new Date()).toISOString();
      setWeightEntries((list) => {
        const without = list.filter((e) => e.date !== today);
        return [...without, { id: uid("we"), date: today, weight }].sort((a, b) => new Date(a.date) - new Date(b.date));
      });
    }
    closeWeightSheet();
  }
  function deleteWeightEntryById(id) {
    setWeightEntries((list) => list.filter((e) => e.id !== id));
    closeWeightSheet();
  }

  function addCustomExercise({ name, muscle, secondary }) {
    const ex = { id: uid("ex"), name, muscle, secondary: secondary || null, custom: true };
    setExercises((list) => [ex, ...list]);
    setShowAddExercise(false);
    dispatchPickExercise(ex);
  }
  function deleteExercise(id) {
    setExercises((list) => list.filter((e) => e.id !== id));
  }

  function saveProfileEdit(data) {
    setProfile((p) => ({ ...p, name: data.name, targetWeight: data.targetWeight, height: data.height, goal: data.goal, experience: data.experience }));
    if (data.weight != null) saveWeightEntry(data.weight);
    setShowEditProfile(false);
  }

  const viewingWorkout = sortedWorkouts.find((w) => w.id === viewingWorkoutId) || null;

  /* -------------------- render -------------------- */

  if (!profile.isRegistered) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  return (
    <div
      className="relative mx-auto flex h-[812px] max-h-[100vh] w-full max-w-[420px] flex-col overflow-hidden bg-black text-white"
      style={{ fontFamily: "'Manrope', system-ui, -apple-system, sans-serif" }}
    >
      <style>{GLOBAL_STYLES}</style>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-28 pt-6">
        {tab === "home" && (
          <HomeScreen
            profile={profile}
            currentWeight={currentWeight}
            weightEntries={weightEntries}
            thisWeekWorkouts={thisWeekWorkouts}
            sortedWorkouts={sortedWorkouts}
            streak={streak}
            activeWorkout={activeWorkout}
            elapsed={elapsed}
            onStart={() => { setPendingRepeat(null); setShowStartSheet(true); }}
            onContinue={() => setTab("workout")}
            onOpenWorkout={(id) => setViewingWorkoutId(id)}
          />
        )}

        {tab === "workout" && (
          <WorkoutScreen
            activeWorkout={activeWorkout}
            elapsed={elapsed}
            onStart={() => { setPendingRepeat(null); setShowStartSheet(true); }}
            onAddExercise={() => { setPickerTarget({ kind: "active" }); setExercisePickerOpen(true); }}
            onAddSet={addSet}
            onDeleteSet={deleteSet}
            onRemoveExercise={removeExerciseFromActive}
            onFinish={finishWorkout}
            lastPerformance={lastPerformance}
            sortedWorkouts={sortedWorkouts}
          />
        )}

        {tab === "history" && (
          <HistoryScreen
            view={historyView}
            setView={setHistoryView}
            workouts={sortedWorkouts}
            onOpen={(id) => setViewingWorkoutId(id)}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            onStartFirst={() => { setPendingRepeat(null); setShowStartSheet(true); }}
          />
        )}

        {tab === "stats" && (
          <StatsScreen
            view={statsView}
            setView={setStatsView}
            workouts={sortedWorkouts}
            thisWeekWorkouts={thisWeekWorkouts}
            muscleAggregate={muscleAggregate}
            weightEntries={weightEntries}
            profile={profile}
            setProfile={setProfile}
            allTimeRecords={allTimeRecords}
            onAddWeight={openAddWeight}
            onEditWeight={openEditWeight}
          />
        )}

        {tab === "profile" && (
          <ProfileScreen
            profile={profile}
            setProfile={setProfile}
            workouts={sortedWorkouts}
            currentWeight={currentWeight}
            muscleAggregate={muscleAggregate}
            smartHints={smartHints}
            onEditProfile={() => setShowEditProfile(true)}
          />
        )}
      </div>

      <BottomNav tab={tab} setTab={setTab} hasActiveWorkout={!!activeWorkout} />

      <StartWorkoutSheet
        open={showStartSheet}
        onClose={() => { setShowStartSheet(false); setPendingRepeat(null); }}
        onStart={startWorkout}
        repeatOf={pendingRepeat}
      />

      <ExercisePickerSheet
        open={exercisePickerOpen}
        onClose={() => { setExercisePickerOpen(false); setPickerTarget(null); }}
        exercises={exercises}
        onPick={dispatchPickExercise}
        onDelete={deleteExercise}
        onCreateNew={(query) => { setAddExercisePreset(query); setExercisePickerOpen(false); setShowAddExercise(true); }}
      />

      <AddExerciseSheet
        open={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        preset={addExercisePreset}
        onCreate={addCustomExercise}
      />

      <WeightEntrySheet
        open={showWeightSheet}
        onClose={closeWeightSheet}
        currentWeight={currentWeight}
        editingEntry={editingWeightEntry}
        onSave={saveWeightEntry}
        onDelete={deleteWeightEntryById}
      />

      <WorkoutDetailSheet
        workout={viewingWorkout}
        onClose={() => setViewingWorkoutId(null)}
        onRepeat={repeatWorkout}
        onDelete={(id) => setConfirmDeleteId(id)}
        onDeleteSet={deleteSetFromWorkout}
        confirmDeleteId={confirmDeleteId}
        onConfirmDelete={deleteWorkout}
        onCancelDelete={() => setConfirmDeleteId(null)}
        editMode={workoutEditMode}
        onToggleEdit={() => setWorkoutEditMode((e) => !e)}
        onAddExercise={() => { setPickerTarget({ kind: "history", workoutId: viewingWorkoutId }); setExercisePickerOpen(true); }}
        onRemoveExercise={removeExerciseFromWorkout}
        onAddSet={addSetToWorkoutHistory}
        onUpdateSet={updateSetInWorkout}
        onUpdateName={updateWorkoutName}
        onUpdateDateTime={updateWorkoutDateTime}
      />

      <EditProfileSheet
        open={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profile={profile}
        currentWeight={currentWeight}
        onSave={saveProfileEdit}
      />

      <FinishSummarySheet summary={finishSummary} onClose={() => { setFinishSummary(null); setTab("home"); }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bottom navigation                                                   */
/* ------------------------------------------------------------------ */

function BottomNav({ tab, setTab, hasActiveWorkout }) {
  const items = [
    { id: "home", label: "Главная", icon: Home },
    { id: "workout", label: "Тренировка", icon: Dumbbell },
    { id: "history", label: "История", icon: HistoryIcon },
    { id: "stats", label: "Статистика", icon: BarChart3 },
    { id: "profile", label: "Профиль", icon: User },
  ];
  const activeIndex = Math.max(0, items.findIndex((i) => i.id === tab));
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-40 border-t border-zinc-900 bg-black/95 pt-2 backdrop-blur"
      style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
    >
      <div className="relative flex items-center justify-around px-2">
        <div
          className="pointer-events-none absolute top-0 z-0 h-[52px] rounded-2xl bg-blue-500/10 transition-all duration-300"
          style={{ width: `${100 / items.length}%`, left: `${activeIndex * (100 / items.length)}%`, transitionTimingFunction: SPRING }}
        />
        {items.map((it) => {
          const active = tab === it.id;
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              onClick={() => { haptic("light"); setTab(it.id); }}
              className="relative z-10 flex flex-1 flex-col items-center gap-1 py-2.5 transition-transform duration-150 active:scale-90"
              style={{ transitionTimingFunction: SPRING }}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={2.2}
                  className={`transition-all duration-200 ${active ? "scale-110 text-blue-500 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]" : "text-zinc-500"}`}
                />
                {it.id === "workout" && hasActiveWorkout && !active && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-200 ${active ? "text-blue-500" : "text-zinc-500"}`}>
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Home screen                                                         */
/* ------------------------------------------------------------------ */

function HomeScreen({
  profile, currentWeight, weightEntries, thisWeekWorkouts, sortedWorkouts,
  streak, activeWorkout, elapsed, onStart, onContinue, onOpenWorkout,
}) {
  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "Поздняя тренировка?" : hour < 12 ? "Доброе утро" : hour < 18 ? "Готов к тренировке?" : "Добро пожаловать обратно";

  const weightWeekAgo = useMemo(() => {
    const target = addDays(new Date(), -7);
    const past = weightEntries.filter((e) => new Date(e.date) <= target);
    return past.length ? past[past.length - 1].weight : null;
  }, [weightEntries]);
  const weightChange = currentWeight != null && weightWeekAgo != null ? Math.round((currentWeight - weightWeekAgo) * 10) / 10 : null;

  const last = sortedWorkouts[0];
  const totalTime = sortedWorkouts.reduce((a, w) => a + w.duration, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <div className="pointer-events-none absolute -top-10 left-0 h-32 w-56 rounded-full bg-blue-600/10 blur-3xl" />
        <p className="relative text-[13px] font-semibold uppercase tracking-wide text-blue-500">LZWHUB</p>
        <h1 className="relative mt-1 text-2xl font-bold text-white">{greeting}, {profile.name}</h1>
      </div>

      {activeWorkout ? (
        <Card className="border-blue-900 bg-blue-950/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-blue-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" /> Тренировка идёт
              </p>
              <p className="tabular mt-1 text-3xl font-bold text-white">{formatTimer(elapsed)}</p>
            </div>
            <button
              onClick={onContinue}
              style={{ transitionTimingFunction: SPRING }}
              className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-transform duration-150 active:scale-95"
            >
              Продолжить
            </button>
          </div>
        </Card>
      ) : (
        <PrimaryButton onClick={onStart} icon={Plus} className="w-full py-5 text-base" shine>
          Начать тренировку
        </PrimaryButton>
      )}

      {sortedWorkouts.length === 0 ? (
        <EmptyState
          title="Пока здесь пусто"
          subtitle="Начни первую тренировку, и LZWHUB начнёт собирать твою статистику."
          cta={activeWorkout ? undefined : "Начать первую тренировку"}
          onCta={onStart}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <p className="text-[13px] text-zinc-500">На этой неделе</p>
              <p className="mt-1 text-2xl font-bold">{thisWeekWorkouts.length}</p>
            </Card>
            <Card>
              <p className="text-[13px] text-zinc-500">Всего тренировок</p>
              <p className="mt-1 text-2xl font-bold">{sortedWorkouts.length}</p>
            </Card>
            <Card>
              <p className="text-[13px] text-zinc-500">Серия</p>
              <p className="mt-1 flex items-center gap-1 text-2xl font-bold">
                {streak > 0 && <Flame size={18} className="animate-pulse text-blue-500" />} {streak} {pluralDays(streak)}
              </p>
            </Card>
            <Card>
              <p className="text-[13px] text-zinc-500">Время в зале</p>
              <p className="mt-1 text-2xl font-bold">{formatDuration(totalTime)}</p>
            </Card>
          </div>

          {last && (
            <Card onClick={() => onOpenWorkout(last.id)}>
              <p className="text-[13px] text-zinc-500">Последняя тренировка</p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-[17px] font-semibold text-white">
                    {last.muscles.length ? last.muscles.slice(0, 2).join(" + ") : last.name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {last.exercises.length} упражнений · {formatDuration(last.duration)}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {isSameDay(last.date, new Date()) ? "Сегодня" : formatDateLong(last.date)}, {formatTime(last.date)}
                  </p>
                </div>
                <ChevronRight size={20} className="text-zinc-600" />
              </div>
            </Card>
          )}
        </>
      )}

      {currentWeight != null && (
        <Card>
          <p className="text-[13px] text-zinc-500">Вес</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl font-bold">{fmtWeight(currentWeight)} кг</p>
            {weightChange != null && <Delta value={weightChange} suffix=" кг за неделю" />}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Start workout sheet                                                 */
/* ------------------------------------------------------------------ */

function StartWorkoutSheet({ open, onClose, onStart, repeatOf }) {
  const [name, setName] = useState(SPLIT_NAMES[0]);
  const [custom, setCustom] = useState("");
  useEffect(() => {
    if (open) {
      setName(repeatOf ? repeatOf.name : SPLIT_NAMES[0]);
      setCustom("");
    }
  }, [open, repeatOf]);

  return (
    <Sheet open={open} onClose={onClose} title={repeatOf ? "Повторить тренировку" : "Новая тренировка"}>
      <p className="mb-3 text-sm text-zinc-500">
        {repeatOf ? `Те же упражнения, что и в тренировке «${repeatOf.name}»` : "Выбери название или напиши своё"}
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {SPLIT_NAMES.map((n) => (
          <Chip key={n} active={name === n && !custom} onClick={() => { setName(n); setCustom(""); }}>
            {n}
          </Chip>
        ))}
      </div>
      <input
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        placeholder="Своё название тренировки"
        className="mb-5 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-[15px] text-white placeholder-zinc-600 outline-none focus:border-blue-600"
      />
      <PrimaryButton onClick={() => onStart(custom.trim() || name)} className="w-full" shine>
        Начать тренировку
      </PrimaryButton>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Active workout screen                                               */
/* ------------------------------------------------------------------ */

function SetTypeChip({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ transitionTimingFunction: SPRING }}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-90 ${
        active ? "bg-blue-600 text-white" : "bg-zinc-900 text-zinc-500 border border-zinc-800"
      }`}
    >
      {label}
    </button>
  );
}

function AddSetForm({ wex, lastPerf, onAdd }) {
  const suggestion = wex.sets.length ? wex.sets[wex.sets.length - 1] : lastPerf || { weight: "", reps: "" };
  const [weight, setWeight] = useState(suggestion.weight ?? "");
  const [reps, setReps] = useState("");
  const [type, setType] = useState("normal");
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    setWeight(suggestion.weight ?? "");
    // eslint-disable-next-line
  }, [wex.sets.length]);

  function submit() {
    if (weight === "" || reps === "") return;
    onAdd({ weight: parseFloat(weight), reps: parseInt(reps, 10), type, note });
    setReps("");
    setType("normal");
    setNote("");
    setShowNote(false);
  }

  return (
    <div className="mt-3 rounded-xl bg-black/40 p-3">
      {!wex.sets.length && lastPerf && (
        <p className="mb-2 text-xs text-zinc-500">В прошлой тренировке: {fmtWeight(lastPerf.weight)} кг × {lastPerf.reps}</p>
      )}
      <div className="mb-2 flex gap-2">
        <SetTypeChip label="Рабочий" active={type === "normal"} onClick={() => setType("normal")} />
        <SetTypeChip label="Разминка" active={type === "warmup"} onClick={() => setType("warmup")} />
        <SetTypeChip label="До отказа" active={type === "failure"} onClick={() => setType("failure")} />
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-[11px] text-zinc-500">Вес, кг</label>
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-[15px] text-white outline-none focus:border-blue-600"
          />
        </div>
        <div className="flex-1">
          <label className="text-[11px] text-zinc-500">Повторения</label>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-[15px] text-white outline-none focus:border-blue-600"
          />
        </div>
        <button
          onClick={submit}
          style={{ transitionTimingFunction: SPRING }}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-transform duration-150 active:scale-90"
        >
          <Check size={19} />
        </button>
      </div>
      {showNote ? (
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Комментарий к подходу"
          className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-600"
        />
      ) : (
        <button onClick={() => setShowNote(true)} className="mt-2 text-xs text-zinc-600">
          + комментарий
        </button>
      )}
    </div>
  );
}

function ExerciseCard({ wex, onAddSet, onDeleteSet, onRemove, lastPerf }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[16px] font-semibold text-white">{wex.name}</p>
          <p className="text-xs text-zinc-500">{wex.muscle}{wex.secondary ? ` · ${wex.secondary}` : ""}</p>
        </div>
        <button
          onClick={onRemove}
          style={{ transitionTimingFunction: SPRING }}
          className="rounded-full p-1.5 text-zinc-600 transition-transform duration-150 active:scale-90"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {wex.sets.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="grid grid-cols-[28px_1fr_1fr_28px] gap-2 px-1 text-[11px] text-zinc-600">
            <span>#</span><span>Вес</span><span>Повт.</span><span></span>
          </div>
          {wex.sets.map((s, i) => (
            <div key={s.id} className="card-in grid grid-cols-[28px_1fr_1fr_28px] items-center gap-2 rounded-lg bg-zinc-900/70 px-2 py-2">
              <span className="text-sm text-zinc-500">{i + 1}</span>
              <span className="text-sm font-semibold text-white">
                {fmtWeight(s.weight)} кг {s.type === "warmup" && <span className="text-zinc-600">(р)</span>}
              </span>
              <span className="text-sm text-zinc-300">{s.reps}{s.type === "failure" ? " (отказ)" : ""}</span>
              <button onClick={() => onDeleteSet(s.id)} className="text-zinc-700 transition-transform duration-150 active:scale-90">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <AddSetForm wex={wex} lastPerf={lastPerf} onAdd={(set) => onAddSet(wex.id, set)} />
    </Card>
  );
}

function WorkoutScreen({
  activeWorkout, elapsed, onStart, onAddExercise, onAddSet, onDeleteSet,
  onRemoveExercise, onFinish, lastPerformance, sortedWorkouts,
}) {
  if (!activeWorkout) {
    const last = sortedWorkouts[0];
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Тренировка</h1>
        <Card className="items-center py-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900">
            <Dumbbell size={26} className="text-blue-500" />
          </div>
          <p className="text-[15px] font-semibold">Готов начать?</p>
          <p className="mt-1 text-sm text-zinc-500">Таймер и все упражнения — на одном экране</p>
          <PrimaryButton onClick={onStart} icon={Plus} className="mt-5 w-full" shine>
            Начать тренировку
          </PrimaryButton>
        </Card>
        {last && (
          <p className="px-1 text-center text-sm text-zinc-600">
            Последняя тренировка «{last.name}» — {formatDateLong(last.date)}
          </p>
        )}
      </div>
    );
  }

  const totalSets = activeWorkout.exercises.reduce((a, e) => a + e.sets.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-blue-500">Новая тренировка</p>
          <h1 className="text-xl font-bold">{activeWorkout.name}</h1>
        </div>
        <div className="text-right">
          <p className="tabular text-2xl font-bold">{formatTimer(elapsed)}</p>
          <p className="text-xs text-zinc-500">{activeWorkout.exercises.length} упр. · {totalSets} подх.</p>
        </div>
      </div>

      {activeWorkout.exercises.length === 0 ? (
        <EmptyState title="Пока нет упражнений" subtitle="Добавь первое упражнение, чтобы начать записывать подходы" />
      ) : (
        <div className="flex flex-col gap-3">
          {activeWorkout.exercises.map((wex) => (
            <ExerciseCard
              key={wex.id}
              wex={wex}
              onAddSet={onAddSet}
              onDeleteSet={(setId) => onDeleteSet(wex.id, setId)}
              onRemove={() => onRemoveExercise(wex.id)}
              lastPerf={lastPerformance(wex.name)}
            />
          ))}
        </div>
      )}

      <GhostButton onClick={onAddExercise} icon={Plus} className="w-full py-4">
        Добавить упражнение
      </GhostButton>

      <PrimaryButton onClick={onFinish} disabled={totalSets === 0} className="sticky bottom-0 mt-2 w-full py-5 text-base">
        Завершить тренировку
      </PrimaryButton>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Exercise picker & creation                                          */
/* ------------------------------------------------------------------ */

function ExercisePickerSheet({ open, onClose, exercises, onPick, onDelete, onCreateNew }) {
  const [query, setQuery] = useState("");
  useEffect(() => { if (open) setQuery(""); }, [open]);
  const filtered = exercises.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Sheet open={open} onClose={onClose} title="Добавить упражнение">
      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2.5">
        <Search size={16} className="text-zinc-600" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск упражнения"
          className="w-full bg-transparent text-[15px] text-white placeholder-zinc-600 outline-none"
        />
      </div>
      <button
        onClick={() => onCreateNew(query)}
        style={{ transitionTimingFunction: SPRING }}
        className="mb-3 flex w-full items-center gap-2 rounded-2xl border border-dashed border-blue-800 bg-blue-950/30 px-4 py-3 text-[15px] font-medium text-blue-400 transition-transform duration-150 active:scale-[0.98]"
      >
        <Plus size={17} /> Создать своё упражнение
      </button>
      <div className="flex flex-col gap-1">
        {filtered.length === 0 && <p className="py-6 text-center text-sm text-zinc-600">Ничего не найдено</p>}
        {filtered.map((ex) => (
          <div key={ex.id} className="flex items-center justify-between rounded-xl px-2 py-1">
            <button onClick={() => onPick(ex)} className="flex-1 py-2 text-left">
              <p className="text-[15px] text-white">{ex.name}</p>
              <p className="text-xs text-zinc-500">{ex.muscle}{ex.secondary ? ` · ${ex.secondary}` : ""}</p>
            </button>
            {ex.custom ? (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(ex.id); }}
                className="p-2 text-zinc-700 transition-transform duration-150 active:scale-90"
              >
                <Trash2 size={15} />
              </button>
            ) : (
              <ChevronRight size={16} className="text-zinc-700" />
            )}
          </div>
        ))}
      </div>
    </Sheet>
  );
}

function AddExerciseSheet({ open, onClose, preset, onCreate }) {
  const [name, setName] = useState("");
  const [muscle, setMuscle] = useState(MUSCLES[0]);
  const [secondary, setSecondary] = useState("");
  useEffect(() => {
    if (open) {
      setName(preset || "");
      setMuscle(MUSCLES[0]);
      setSecondary("");
    }
  }, [open, preset]);

  return (
    <Sheet open={open} onClose={onClose} title="Новое упражнение">
      <label className="text-xs text-zinc-500">Название</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Например, Жим гантелей лёжа"
        className="mb-4 mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-[15px] text-white placeholder-zinc-600 outline-none focus:border-blue-600"
      />
      <label className="text-xs text-zinc-500">Основная группа мышц</label>
      <div className="mb-4 mt-2 flex flex-wrap gap-2">
        {MUSCLES.map((m) => (
          <Chip key={m} active={muscle === m} onClick={() => setMuscle(m)}>{m}</Chip>
        ))}
      </div>
      <label className="text-xs text-zinc-500">Вторичная группа (необязательно)</label>
      <div className="mb-5 mt-2 flex flex-wrap gap-2">
        <Chip active={secondary === ""} onClick={() => setSecondary("")}>Нет</Chip>
        {MUSCLES.filter((m) => m !== muscle).map((m) => (
          <Chip key={m} active={secondary === m} onClick={() => setSecondary(m)}>{m}</Chip>
        ))}
      </div>
      <PrimaryButton onClick={() => name.trim() && onCreate({ name: name.trim(), muscle, secondary })} disabled={!name.trim()} className="w-full" shine>
        Создать упражнение
      </PrimaryButton>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Weight entry sheet                                                  */
/* ------------------------------------------------------------------ */

function WeightEntrySheet({ open, onClose, currentWeight, editingEntry, onSave, onDelete }) {
  const [weight, setWeight] = useState("");
  useEffect(() => {
    if (open) setWeight(editingEntry ? String(editingEntry.weight) : currentWeight != null ? String(currentWeight) : "");
  }, [open, editingEntry, currentWeight]);

  return (
    <Sheet open={open} onClose={onClose} title={editingEntry ? `Вес — ${formatDateLong(editingEntry.date)}` : "Мой вес сегодня"}>
      <input
        type="number"
        inputMode="decimal"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        placeholder="__"
        className="mb-5 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-center text-2xl font-bold text-white placeholder-zinc-700 outline-none focus:border-blue-600"
      />
      <PrimaryButton onClick={() => weight !== "" && onSave(parseFloat(weight))} disabled={weight === ""} className="w-full" shine>
        Сохранить
      </PrimaryButton>
      {editingEntry && (
        <button
          onClick={() => onDelete(editingEntry.id)}
          className="mt-3 w-full rounded-2xl border border-red-900/50 py-3 text-sm font-medium text-red-400 transition-transform duration-150 active:scale-[0.97]"
        >
          Удалить запись
        </button>
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Editable sets (workout history edit mode)                           */
/* ------------------------------------------------------------------ */

function EditableSets({ workoutId, ex, onAddSet, onUpdateSet, onDeleteSet }) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");

  function submit() {
    if (weight === "" || reps === "") return;
    onAddSet(workoutId, ex.id, { weight: parseFloat(weight), reps: parseInt(reps, 10), type: "normal", note: "" });
    setWeight("");
    setReps("");
  }

  return (
    <div className="flex flex-col gap-1.5">
      {ex.sets.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <span className="w-4 text-xs text-zinc-600">{i + 1}</span>
          <input
            type="number"
            value={s.weight}
            onChange={(e) => onUpdateSet(workoutId, ex.id, s.id, { weight: parseFloat(e.target.value) || 0 })}
            className="w-16 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-white outline-none focus:border-blue-600"
          />
          <span className="text-xs text-zinc-600">кг ×</span>
          <input
            type="number"
            value={s.reps}
            onChange={(e) => onUpdateSet(workoutId, ex.id, s.id, { reps: parseInt(e.target.value, 10) || 0 })}
            className="w-14 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-white outline-none focus:border-blue-600"
          />
          <button onClick={() => onDeleteSet(workoutId, ex.id, s.id)} className="ml-auto text-zinc-600 transition-transform duration-150 active:scale-90">
            <X size={14} />
          </button>
        </div>
      ))}
      {ex.sets.length === 0 && <p className="text-xs text-zinc-600">Подходов пока нет</p>}
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          placeholder="кг"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-16 rounded-lg border border-dashed border-zinc-700 bg-transparent px-2 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-600"
        />
        <span className="text-xs text-zinc-600">×</span>
        <input
          type="number"
          placeholder="повт"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="w-14 rounded-lg border border-dashed border-zinc-700 bg-transparent px-2 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-600"
        />
        <button
          onClick={submit}
          style={{ transitionTimingFunction: SPRING }}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white transition-transform duration-150 active:scale-90"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Workout detail sheet                                                */
/* ------------------------------------------------------------------ */

function WorkoutDetailSheet({
  workout, onClose, onRepeat, onDelete, onDeleteSet, confirmDeleteId, onConfirmDelete, onCancelDelete,
  editMode, onToggleEdit, onAddExercise, onRemoveExercise, onAddSet, onUpdateSet, onUpdateName, onUpdateDateTime,
}) {
  if (!workout) return null;
  const totalSets = workout.exercises.reduce((a, e) => a + e.sets.length, 0);
  const confirming = confirmDeleteId === workout.id;
  const dateStr = new Date(workout.date).toISOString().slice(0, 10);
  const startStr = new Date(workout.date).toTimeString().slice(0, 5);
  const endStr = new Date(workout.endDate).toTimeString().slice(0, 5);

  return (
    <Sheet open={!!workout} onClose={onClose} title={editMode ? "Редактирование" : workout.name}>
      {editMode ? (
        <input
          value={workout.name}
          onChange={(e) => onUpdateName(workout.id, e.target.value)}
          className="mb-3 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-lg font-semibold text-white outline-none focus:border-blue-600"
        />
      ) : (
        <p className="mb-4 text-sm text-zinc-500">
          {formatDateLong(workout.date)} · {formatTime(workout.date)} — {formatTime(workout.endDate)}
        </p>
      )}

      {editMode && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] text-zinc-500">Дата</label>
            <input type="date" value={dateStr} onChange={(e) => onUpdateDateTime(workout.id, "date", e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-2 py-2 text-xs text-white outline-none focus:border-blue-600" />
          </div>
          <div>
            <label className="text-[11px] text-zinc-500">Начало</label>
            <input type="time" value={startStr} onChange={(e) => onUpdateDateTime(workout.id, "startTime", e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-2 py-2 text-xs text-white outline-none focus:border-blue-600" />
          </div>
          <div>
            <label className="text-[11px] text-zinc-500">Конец</label>
            <input type="time" value={endStr} onChange={(e) => onUpdateDateTime(workout.id, "endTime", e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-2 py-2 text-xs text-white outline-none focus:border-blue-600" />
          </div>
        </div>
      )}

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-zinc-900 py-3"><p className="text-lg font-bold">{formatDuration(workout.duration)}</p><p className="text-[11px] text-zinc-500">время</p></div>
        <div className="rounded-xl bg-zinc-900 py-3"><p className="text-lg font-bold">{workout.exercises.length}</p><p className="text-[11px] text-zinc-500">упражнений</p></div>
        <div className="rounded-xl bg-zinc-900 py-3"><p className="text-lg font-bold">{totalSets}</p><p className="text-[11px] text-zinc-500">подходов</p></div>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        {workout.exercises.map((ex) => (
          <div key={ex.id} className="rounded-xl border border-zinc-800 p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white">{ex.name}</p>
                <p className="mb-2 text-xs text-zinc-500">{ex.muscle}</p>
              </div>
              {editMode && (
                <button onClick={() => onRemoveExercise(workout.id, ex.id)} className="p-1 text-zinc-600 transition-transform duration-150 active:scale-90">
                  <Trash2 size={15} />
                </button>
              )}
            </div>

            {editMode ? (
              <EditableSets workoutId={workout.id} ex={ex} onAddSet={onAddSet} onUpdateSet={onUpdateSet} onDeleteSet={onDeleteSet} />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {ex.sets.map((s) => (
                  <span key={s.id} className="rounded-lg bg-zinc-900 px-2 py-1 text-xs text-zinc-300">{fmtWeight(s.weight)}кг × {s.reps}</span>
                ))}
                {ex.sets.length === 0 && <span className="text-xs text-zinc-600">нет подходов</span>}
              </div>
            )}
          </div>
        ))}
        {workout.exercises.length === 0 && <p className="text-sm text-zinc-600">Упражнений пока нет</p>}
      </div>

      {editMode && (
        <GhostButton onClick={onAddExercise} icon={Plus} className="mb-4 w-full">Добавить упражнение</GhostButton>
      )}

      {confirming ? (
        <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-4">
          <p className="mb-3 text-sm font-medium text-red-300">Удалить эту тренировку без возможности восстановления?</p>
          <div className="flex gap-2">
            <GhostButton onClick={onCancelDelete} className="flex-1">Отмена</GhostButton>
            <button
              onClick={() => onConfirmDelete(workout.id)}
              style={{ transitionTimingFunction: SPRING }}
              className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-transform duration-150 active:scale-95"
            >
              Удалить
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <GhostButton onClick={onToggleEdit} icon={editMode ? Check : undefined} className="flex-1">
              {editMode ? "Готово" : "Редактировать"}
            </GhostButton>
            <GhostButton onClick={() => onDelete(workout.id)} icon={Trash2} className="flex-1">Удалить</GhostButton>
          </div>
          <PrimaryButton onClick={() => onRepeat(workout)} icon={Repeat} className="w-full">Повторить</PrimaryButton>
        </div>
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Finish summary sheet                                                */
/* ------------------------------------------------------------------ */

function FinishSummarySheet({ summary, onClose }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (summary) {
      const t = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(t);
    }
    setMounted(false);
  }, [summary]);
  if (!summary) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-5">
      <div
        className={`w-full max-w-sm rounded-3xl border border-zinc-800 bg-neutral-950 p-6 text-center transition-all duration-300 ${
          mounted ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
        style={{ transitionTimingFunction: SPRING }}
      >
        <p className="text-2xl font-bold">Тренировка завершена 🔥</p>
        <p className="tabular mt-3 text-4xl font-extrabold text-blue-500">{formatDuration(summary.duration)}</p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-zinc-900 py-3"><p className="text-xl font-bold">{summary.exerciseCount}</p><p className="text-[11px] text-zinc-500">упражнений</p></div>
          <div className="rounded-xl bg-zinc-900 py-3"><p className="text-xl font-bold">{summary.totalSets}</p><p className="text-[11px] text-zinc-500">подходов</p></div>
          <div className="rounded-xl bg-zinc-900 py-3"><p className="text-xl font-bold">{summary.totalReps}</p><p className="text-[11px] text-zinc-500">повторений</p></div>
        </div>

        <div className="mt-5 text-left">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Группы мышц</p>
          <div className="flex flex-col gap-1.5">
            {Object.entries(summary.muscleBreak).map(([m, sets]) => (
              <div key={m} className="flex items-center justify-between rounded-lg bg-zinc-900/60 px-3 py-2 text-sm">
                <span className="text-zinc-300">{m}</span>
                <span className="font-semibold text-white">{sets} подх.</span>
              </div>
            ))}
          </div>
        </div>

        {summary.prs.length > 0 && (
          <div className="mt-5 rounded-2xl border border-blue-800 bg-blue-950/40 p-4 text-left">
            <p className="flex items-center gap-2 font-bold text-blue-400">
              <Trophy size={17} /> Новый личный рекорд!
            </p>
            <div className="mt-2 flex flex-col gap-1">
              {summary.prs.map((pr) => (
                <p key={pr.name} className="text-sm text-zinc-200">{pr.name} — {fmtWeight(pr.weight)} кг × {pr.reps}</p>
              ))}
            </div>
          </div>
        )}

        <PrimaryButton onClick={onClose} className="mt-6 w-full" shine>Готово</PrimaryButton>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  History screen (list + calendar)                                    */
/* ------------------------------------------------------------------ */

function HistoryScreen({ view, setView, workouts, onOpen, selectedDay, setSelectedDay, onStartFirst }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">История</h1>
        <div className="flex rounded-full bg-zinc-900 p-1">
          <button onClick={() => setView("list")} style={{ transitionTimingFunction: SPRING }} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${view === "list" ? "bg-blue-600 text-white" : "text-zinc-500"}`}>Список</button>
          <button onClick={() => setView("calendar")} style={{ transitionTimingFunction: SPRING }} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${view === "calendar" ? "bg-blue-600 text-white" : "text-zinc-500"}`}>Календарь</button>
        </div>
      </div>

      {workouts.length === 0 ? (
        <EmptyState title="Пока здесь пусто" subtitle="Начни первую тренировку, и LZWHUB начнёт собирать твою статистику." cta="Начать первую тренировку" onCta={onStartFirst} />
      ) : view === "list" ? (
        <div className="flex flex-col gap-3">
          {workouts.map((w) => (
            <Card key={w.id} onClick={() => onOpen(w.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-white">{formatDateLong(w.date)}</p>
                  <p className="text-sm text-zinc-500">{w.muscles.length ? w.muscles.slice(0, 2).join(" + ") : w.name}</p>
                  <p className="mt-1 text-xs text-zinc-600">{formatTime(w.date)} — {formatTime(w.endDate)} · {formatDuration(w.duration)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blue-400">{w.exercises.length} упр.</p>
                  <p className="text-xs text-zinc-600">{w.exercises.reduce((a, e) => a + e.sets.length, 0)} подх.</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <CalendarView workouts={workouts} selectedDay={selectedDay} setSelectedDay={setSelectedDay} onOpen={onOpen} />
      )}
    </div>
  );
}

function CalendarView({ workouts, selectedDay, setSelectedDay, onOpen }) {
  const weeks = 14;
  const today = startOfDay(new Date());
  const gridStart = addDays(getMonday(today), -(weeks - 1) * 7);

  const byDay = useMemo(() => {
    const map = new Map();
    workouts.forEach((w) => {
      const key = startOfDay(w.date).getTime();
      const arr = map.get(key) || [];
      arr.push(w);
      map.set(key, arr);
    });
    return map;
  }, [workouts]);

  function intensity(sets) {
    if (sets === 0) return "bg-zinc-900";
    if (sets <= 6) return "bg-blue-900";
    if (sets <= 14) return "bg-blue-700";
    return "bg-blue-500";
  }

  const columns = [];
  for (let c = 0; c < weeks; c++) {
    const days = [];
    for (let r = 0; r < 7; r++) {
      const date = addDays(gridStart, c * 7 + r);
      if (date > today) { days.push(null); continue; }
      const key = date.getTime();
      const dayWorkouts = byDay.get(key) || [];
      const totalSets = dayWorkouts.reduce((a, w) => a + w.exercises.reduce((b, e) => b + e.sets.length, 0), 0);
      days.push({ date, workouts: dayWorkouts, totalSets });
    }
    columns.push(days);
  }

  const selected = selectedDay ? byDay.get(startOfDay(selectedDay).getTime()) : null;

  return (
    <div>
      <Card>
        <div className="flex gap-[3px]">
          <div className="flex flex-col gap-[3px] pr-1 pt-[3px] text-[9px] text-zinc-600">
            {["Пн", "", "Ср", "", "Пт", "", ""].map((l, i) => (<span key={i} className="h-[13px] leading-[13px]">{l}</span>))}
          </div>
          <div className="no-scrollbar flex gap-[3px] overflow-x-auto">
            {columns.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map((d, ri) => (
                  <button
                    key={ri}
                    disabled={!d}
                    onClick={() => d && setSelectedDay(d.date)}
                    style={{ transitionTimingFunction: SPRING }}
                    className={`h-[13px] w-[13px] rounded-[3px] transition-transform duration-150 active:scale-125 ${d ? intensity(d.totalSets) : "opacity-0"} ${
                      d && selectedDay && isSameDay(d.date, selectedDay) ? "ring-1 ring-white" : ""
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-zinc-600">
          <span>меньше</span>
          <span className="h-[10px] w-[10px] rounded-[2px] bg-zinc-900" />
          <span className="h-[10px] w-[10px] rounded-[2px] bg-blue-900" />
          <span className="h-[10px] w-[10px] rounded-[2px] bg-blue-700" />
          <span className="h-[10px] w-[10px] rounded-[2px] bg-blue-500" />
          <span>больше</span>
        </div>
      </Card>

      {selectedDay && (
        <Card className="mt-3">
          <p className="text-[15px] font-semibold">{formatDateLong(selectedDay)}</p>
          {!selected || selected.length === 0 ? (
            <p className="mt-1 text-sm text-zinc-500">Тренировок не было</p>
          ) : (
            selected.map((w) => (
              <div key={w.id} onClick={() => onOpen(w.id)} className="mt-2 cursor-pointer rounded-xl bg-zinc-900 p-3 transition-transform duration-150 active:scale-[0.98]">
                <p className="text-sm font-medium text-white">{w.name} · {w.muscles.join(", ")}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Начало: {formatTime(w.date)} · {formatDuration(w.duration)} · {w.exercises.length} упр. · {w.exercises.reduce((a, e) => a + e.sets.length, 0)} подх.
                </p>
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats screen                                                        */
/* ------------------------------------------------------------------ */

function StatsScreen({
  view, setView, workouts, thisWeekWorkouts, muscleAggregate, weightEntries,
  profile, setProfile, allTimeRecords, onAddWeight, onEditWeight,
}) {
  const tabs = [
    { id: "overview", label: "Обзор" },
    { id: "muscles", label: "Мышцы" },
    { id: "weekly", label: "Неделя" },
    { id: "weight", label: "Вес" },
    { id: "records", label: "Рекорды" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Статистика</h1>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {tabs.map((t) => (<Chip key={t.id} active={view === t.id} onClick={() => setView(t.id)}>{t.label}</Chip>))}
      </div>

      {view === "weight" ? (
        <WeightStats weightEntries={weightEntries} profile={profile} setProfile={setProfile} onAddWeight={onAddWeight} onEditWeight={onEditWeight} />
      ) : workouts.length === 0 ? (
        <EmptyState title="Пока недостаточно данных" subtitle="Запиши первую тренировку, чтобы увидеть статистику." />
      ) : view === "overview" ? (
        <OverviewStats workouts={workouts} />
      ) : view === "muscles" ? (
        <MusclesStats muscleAggregate={muscleAggregate} thisWeekWorkouts={thisWeekWorkouts} />
      ) : view === "weekly" ? (
        <WeeklyReport muscleAggregate={muscleAggregate} workouts={workouts} profile={profile} />
      ) : (
        <RecordsStats records={allTimeRecords} />
      )}
    </div>
  );
}

function buildWeeklySeries(workouts, weeksBack = 8) {
  const result = [];
  for (let i = weeksBack - 1; i >= 0; i--) {
    const [start, end] = weekRange(-i);
    const wk = workouts.filter((w) => new Date(w.date) >= start && new Date(w.date) < end);
    const sets = wk.reduce((a, w) => a + w.exercises.reduce((b, e) => b + e.sets.length, 0), 0);
    const volume = wk.reduce((a, w) => a + w.exercises.reduce((b, e) => b + e.sets.reduce((c, s) => c + s.weight * s.reps, 0), 0), 0);
    const avgDuration = wk.length ? wk.reduce((a, w) => a + w.duration, 0) / wk.length / 60 : 0;
    result.push({ label: formatDateShort(start), workouts: wk.length, sets, volume: Math.round(volume), avgDuration: Math.round(avgDuration) });
  }
  return result;
}

function ChartCard({ title, data, dataKey, kind = "bar", suffix = "" }) {
  return (
    <Card>
      <p className="mb-2 text-sm font-semibold text-zinc-300">{title}</p>
      <div style={{ width: "100%", height: 140 }}>
        <ResponsiveContainer>
          {kind === "bar" ? (
            <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid stroke="#27272a" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, fontSize: 12 }} labelStyle={{ color: "#a1a1aa" }} formatter={(v) => [`${v}${suffix}`, ""]} />
              <Bar dataKey={dataKey} fill={BLUE} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={500} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid stroke="#27272a" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} width={30} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, fontSize: 12 }} labelStyle={{ color: "#a1a1aa" }} formatter={(v) => [`${v}${suffix}`, ""]} />
              <Line type="monotone" dataKey={dataKey} stroke={BLUE} strokeWidth={2.5} dot={false} isAnimationActive animationDuration={500} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function OverviewStats({ workouts }) {
  const series = useMemo(() => buildWeeklySeries(workouts), [workouts]);
  return (
    <div className="flex flex-col gap-3">
      <ChartCard title="Тренировки по неделям" data={series} dataKey="workouts" kind="bar" />
      <ChartCard title="Подходы по неделям" data={series} dataKey="sets" kind="bar" />
      <ChartCard title="Средняя продолжительность, мин" data={series} dataKey="avgDuration" kind="line" />
      <ChartCard title="Тренировочный объём, кг" data={series} dataKey="volume" kind="line" />
    </div>
  );
}

function MusclesStats({ muscleAggregate, thisWeekWorkouts }) {
  const weekAgg = useMemo(() => muscleAggregate(thisWeekWorkouts), [thisWeekWorkouts, muscleAggregate]);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-500">За текущую неделю</p>
      {MUSCLES.map((m) => {
        const a = weekAgg[m];
        if (!a) return null;
        return (
          <Card key={m}>
            <p className="mb-2 text-[15px] font-semibold uppercase tracking-wide text-white">{m}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-bold text-blue-400">{a.sets}</span> <span className="text-zinc-500">подходов</span></div>
              <div><span className="font-bold text-blue-400">{a.exerciseNames.size}</span> <span className="text-zinc-500">упражнений</span></div>
              <div><span className="font-bold text-blue-400">{a.workoutIds.size}</span> <span className="text-zinc-500">тренировки</span></div>
              <div><span className="font-bold text-blue-400">{fmtNum(a.volume)}</span> <span className="text-zinc-500">кг объём</span></div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function WeeklyReport({ muscleAggregate, workouts, profile }) {
  const [start, end] = weekRange(0);
  const [prevStart, prevEnd] = weekRange(-1);
  const wkWorkouts = workouts.filter((w) => new Date(w.date) >= start && new Date(w.date) < end);
  const prevWorkouts = workouts.filter((w) => new Date(w.date) >= prevStart && new Date(w.date) < prevEnd);
  const hasPriorWeek = profile.joinDate ? new Date(profile.joinDate) < prevEnd : false;

  const agg = muscleAggregate(wkWorkouts);
  const prevAgg = muscleAggregate(prevWorkouts);

  const totalSets = wkWorkouts.reduce((a, w) => a + w.exercises.reduce((b, e) => b + e.sets.length, 0), 0);
  const totalExercises = wkWorkouts.reduce((a, w) => a + w.exercises.length, 0);
  const totalDuration = wkWorkouts.reduce((a, w) => a + w.duration, 0);

  const activeMuscles = MUSCLES.filter((m) => agg[m].sets > 0 || prevAgg[m].sets > 0);

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-blue-900 bg-blue-950/20">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-blue-400">Твоя неделя</p>
        <p className="mt-0.5 text-sm text-zinc-500">{formatDateShort(start)} — {formatDateShort(addDays(end, -1))}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div><p className="text-2xl font-bold">{wkWorkouts.length}</p><p className="text-xs text-zinc-500">тренировки</p></div>
          <div><p className="text-2xl font-bold">{formatDuration(totalDuration)}</p><p className="text-xs text-zinc-500">в зале</p></div>
          <div><p className="text-2xl font-bold">{totalExercises}</p><p className="text-xs text-zinc-500">упражнений</p></div>
          <div><p className="text-2xl font-bold">{totalSets}</p><p className="text-xs text-zinc-500">подходов</p></div>
        </div>
      </Card>

      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-400">По группам мышц</p>
        <div className="flex flex-col gap-2">
          {activeMuscles.length === 0 && <p className="text-sm text-zinc-600">Пока нет данных за эту неделю</p>}
          {activeMuscles.map((m) => (
            <Card key={m}>
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-white">{m}</span>
                <div className="text-right">
                  <p className="font-semibold text-white">{agg[m].sets} подх.</p>
                  {hasPriorWeek ? <Delta value={agg[m].sets - prevAgg[m].sets} /> : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeightStats({ weightEntries, profile, setProfile, onAddWeight, onEditWeight }) {
  const current = weightEntries.length ? weightEntries[weightEntries.length - 1].weight : null;
  const weekAgoTarget = addDays(new Date(), -7);
  const monthAgoTarget = addDays(new Date(), -30);
  const weekAgo = [...weightEntries].reverse().find((e) => new Date(e.date) <= weekAgoTarget)?.weight;
  const monthAgo = [...weightEntries].reverse().find((e) => new Date(e.date) <= monthAgoTarget)?.weight;
  const min = weightEntries.length ? Math.min(...weightEntries.map((e) => e.weight)) : null;
  const max = weightEntries.length ? Math.max(...weightEntries.map((e) => e.weight)) : null;

  const chartData = weightEntries.slice(-30).map((e) => ({ label: formatDateShort(e.date), weight: e.weight }));
  const target = profile.targetWeight;
  const start = weightEntries.length ? weightEntries[0].weight : null;
  const progressPct =
    current != null && target != null && start != null
      ? start === target
        ? 100
        : Math.max(0, Math.min(100, ((start - current) / (start - target)) * 100))
      : 0;

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-zinc-500">Текущий вес</p>
            <p className="text-3xl font-bold">{current != null ? `${fmtWeight(current)} кг` : "Не указано"}</p>
          </div>
          <PrimaryButton onClick={onAddWeight} className="px-4 py-3 text-sm">Добавить</PrimaryButton>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-zinc-500">За неделю</p>{weekAgo != null && current != null ? <Delta value={Math.round((current - weekAgo) * 10) / 10} suffix=" кг" /> : <span className="text-zinc-600">—</span>}</div>
          <div><p className="text-zinc-500">За месяц</p>{monthAgo != null && current != null ? <Delta value={Math.round((current - monthAgo) * 10) / 10} suffix=" кг" /> : <span className="text-zinc-600">—</span>}</div>
          <div><p className="text-zinc-500">Минимум</p><p className="font-semibold">{min != null ? `${fmtWeight(min)} кг` : "—"}</p></div>
          <div><p className="text-zinc-500">Максимум</p><p className="font-semibold">{max != null ? `${fmtWeight(max)} кг` : "—"}</p></div>
        </div>
      </Card>

      {weightEntries.length >= 2 ? (
        <ChartCard title="Динамика веса, кг" data={chartData} dataKey="weight" kind="line" />
      ) : (
        <Card><p className="text-sm text-zinc-500">Записей пока мало, чтобы построить график. Добавляй вес регулярно — и он появится здесь.</p></Card>
      )}

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-300"><Target size={15} className="text-blue-500" /> Цель</p>
          <input
            type="number"
            value={target ?? ""}
            placeholder="Не указано"
            onChange={(e) => setProfile((p) => ({ ...p, targetWeight: e.target.value === "" ? null : parseFloat(e.target.value) }))}
            className="w-24 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-right text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-600"
          />
        </div>
        {target != null && current != null ? (
          <>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-900">
              <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="mt-2 text-xs text-zinc-500">Цель: {fmtWeight(target)} кг · прогресс {Math.round(progressPct)}%</p>
          </>
        ) : (
          <p className="text-xs text-zinc-500">Укажи текущий и целевой вес, чтобы видеть прогресс</p>
        )}
      </Card>

      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-400">История</p>
        <div className="flex flex-col gap-2">
          {weightEntries.length === 0 && <p className="text-sm text-zinc-600">Пока нет записей. Добавь свой первый вес.</p>}
          {[...weightEntries].reverse().slice(0, 14).map((e) => (
            <button key={e.id} onClick={() => onEditWeight(e)} className="flex items-center justify-between rounded-xl bg-zinc-900/60 px-3 py-2.5 text-left transition-transform duration-150 active:scale-[0.98]">
              <span className="text-sm text-zinc-400">{formatDateLong(e.date)}</span>
              <span className="text-sm font-semibold text-white">{fmtWeight(e.weight)} кг</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecordsStats({ records }) {
  const list = [...records.entries()].sort((a, b) => b[1].weight - a[1].weight);
  if (list.length === 0) return <EmptyState title="Рекордов пока нет" subtitle="Они появятся, как только ты начнёшь записывать тренировки" />;
  return (
    <div className="flex flex-col gap-2.5">
      {list.map(([name, r]) => (
        <Card key={name}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold text-white">{name}</p>
              <p className="text-xs text-zinc-500">{r.muscle} · {formatDateLong(r.date)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Award size={16} className="text-blue-500" />
              <p className="text-lg font-bold text-white">{fmtWeight(r.weight)} кг × {r.reps}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit profile sheet                                                  */
/* ------------------------------------------------------------------ */

function EditProfileSheet({ open, onClose, profile, currentWeight, onSave }) {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [target, setTarget] = useState("");
  const [height, setHeight] = useState("");
  const [goal, setGoal] = useState(null);
  const [experience, setExperience] = useState(null);

  useEffect(() => {
    if (open) {
      setName(profile.name || "");
      setWeight(currentWeight != null ? String(currentWeight) : "");
      setTarget(profile.targetWeight != null ? String(profile.targetWeight) : "");
      setHeight(profile.height != null ? String(profile.height) : "");
      setGoal(profile.goal);
      setExperience(profile.experience);
    }
  }, [open, profile, currentWeight]);

  function submit() {
    onSave({
      name: name.trim() || profile.name,
      weight: weight !== "" ? parseFloat(weight) : null,
      targetWeight: target !== "" ? parseFloat(target) : null,
      height: height !== "" ? parseFloat(height) : null,
      goal,
      experience,
    });
  }

  return (
    <Sheet open={open} onClose={onClose} title="Редактировать профиль">
      <label className="text-xs text-zinc-500">Имя</label>
      <input value={name} onChange={(e) => setName(e.target.value)} className="mb-4 mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-[15px] text-white outline-none focus:border-blue-600" />

      <label className="text-xs text-zinc-500">Текущий вес, кг</label>
      <input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Не указано" className="mb-4 mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-[15px] text-white placeholder-zinc-600 outline-none focus:border-blue-600" />
      <p className="-mt-3 mb-4 text-[11px] text-zinc-600">Изменение веса добавит новую запись в историю, а не сотрёт старые</p>

      <label className="text-xs text-zinc-500">Целевой вес, кг</label>
      <input type="number" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Не указано" className="mb-4 mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-[15px] text-white placeholder-zinc-600 outline-none focus:border-blue-600" />

      <label className="text-xs text-zinc-500">Рост, см</label>
      <input type="number" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Не указано" className="mb-4 mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-[15px] text-white placeholder-zinc-600 outline-none focus:border-blue-600" />

      <label className="text-xs text-zinc-500">Цель</label>
      <div className="mb-4 mt-2 flex flex-wrap gap-2">
        {GOALS.map((g) => (<Chip key={g} active={goal === g} onClick={() => setGoal(goal === g ? null : g)}>{g}</Chip>))}
      </div>

      <label className="text-xs text-zinc-500">Опыт тренировок</label>
      <div className="mb-5 mt-2 flex flex-wrap gap-2">
        {EXPERIENCE.map((ex) => (<Chip key={ex} active={experience === ex} onClick={() => setExperience(experience === ex ? null : ex)}>{ex}</Chip>))}
      </div>

      <PrimaryButton onClick={submit} className="w-full" shine>Сохранить</PrimaryButton>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile screen                                                      */
/* ------------------------------------------------------------------ */

function ProfileScreen({ profile, setProfile, workouts, currentWeight, muscleAggregate, smartHints, onEditProfile }) {
  const totalWorkouts = workouts.length;
  const totalTime = workouts.reduce((a, w) => a + w.duration, 0);
  const totalSets = workouts.reduce((a, w) => a + w.exercises.reduce((b, e) => b + e.sets.length, 0), 0);
  const totalVolume = workouts.reduce((a, w) => a + w.exercises.reduce((b, e) => b + e.sets.reduce((c, s) => c + s.weight * s.reps, 0), 0), 0);
  const uniqueExerciseNames = new Set();
  workouts.forEach((w) => w.exercises.forEach((e) => uniqueExerciseNames.add(e.name)));

  const allAgg = useMemo(() => muscleAggregate(workouts), [workouts, muscleAggregate]);
  const favorite = MUSCLES.reduce((best, m) => (allAgg[m].sets > (allAgg[best]?.sets || 0) ? m : best), null);
  const favoriteLabel = favorite && allAgg[favorite].sets > 0 ? favorite : "Не указано";

  const rows = [
    { label: "Тренировок всего", value: totalWorkouts },
    { label: "Время в зале", value: formatDuration(totalTime) },
    { label: "Любимая группа мышц", value: favoriteLabel },
    { label: "Упражнений использовано", value: uniqueExerciseNames.size },
    { label: "Подходов всего", value: totalSets },
    { label: "Общий объём", value: `${fmtNum(totalVolume)} кг` },
  ];

  const infoCards = [
    { label: "Текущий вес", value: currentWeight != null ? `${fmtWeight(currentWeight)} кг` : "Не указано" },
    { label: "Целевой вес", value: profile.targetWeight != null ? `${fmtWeight(profile.targetWeight)} кг` : "Не указано" },
    { label: "Рост", value: profile.height != null ? `${Math.round(profile.height)} см` : "Не указано" },
    { label: "Цель", value: profile.goal || "Не указано" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {profile.telegram?.photoUrl ? (
          <img src={profile.telegram.photoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover shadow-lg shadow-blue-950/40" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold shadow-lg shadow-blue-950/40">
            {(profile.name || "?").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-xl font-bold text-white">{profile.name}</p>
          {profile.telegram?.username && <p className="text-sm text-zinc-500">@{profile.telegram.username}</p>}
          <p className="mt-0.5 text-xs text-zinc-600">Участник LZWHUB с {profile.joinDate ? formatDateLong(profile.joinDate) : "—"}</p>
        </div>
      </div>

      <GhostButton onClick={onEditProfile} className="w-full">Редактировать профиль</GhostButton>

      <div className="grid grid-cols-2 gap-3">
        {infoCards.map((c) => (
          <Card key={c.label}>
            <p className="text-[13px] text-zinc-500">{c.label}</p>
            <p className="mt-1 text-lg font-bold text-white">{c.value}</p>
          </Card>
        ))}
        <Card className="col-span-2">
          <p className="text-[13px] text-zinc-500">Опыт тренировок</p>
          <p className="mt-1 text-lg font-bold text-white">{profile.experience || "Не указано"}</p>
        </Card>
      </div>

      <Card>
        {rows.map((r, i) => (
          <div key={r.label} className={`flex items-center justify-between py-3 ${i !== rows.length - 1 ? "border-b border-zinc-900" : ""}`}>
            <span className="text-sm text-zinc-500">{r.label}</span>
            <span className="text-[15px] font-semibold text-white">{r.value}</span>
          </div>
        ))}
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="pr-2">
            <p className="text-[15px] font-semibold text-white">💡 Умные подсказки</p>
            <p className="mt-0.5 text-xs text-zinc-500">LZWHUB анализирует твои тренировки и показывает полезные рекомендации.</p>
          </div>
          <button
            onClick={() => { haptic("light"); setProfile((p) => ({ ...p, hintsEnabled: !p.hintsEnabled })); }}
            aria-pressed={profile.hintsEnabled}
            className={`relative mt-0.5 shrink-0 overflow-hidden rounded-full transition-colors duration-300 active:scale-95 ${
              profile.hintsEnabled ? "bg-blue-600" : "bg-zinc-700"
            }`}
            style={{ width: 44, height: 26, transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
          >
            <span
              className="absolute rounded-full bg-white transition-transform duration-300"
              style={{
                width: 22,
                height: 22,
                top: 2,
                left: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
                transform: profile.hintsEnabled ? "translateX(18px)" : "translateX(0px)",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </button>
        </div>
        {profile.hintsEnabled && (
          <div className="mt-3 flex flex-col gap-2 border-t border-zinc-900 pt-3">
            {smartHints.length === 0 ? (
              <p className="text-xs text-zinc-500">После первой тренировки здесь появятся персональные рекомендации.</p>
            ) : (
              smartHints.map((h, i) => <p key={i} className="text-xs text-zinc-400">{h}</p>)
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
