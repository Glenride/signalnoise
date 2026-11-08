import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import type { SharedData } from '@/types';

/* ───────── icons (inline SVGs) ───────── */
const SignalIcon = ({ className = 'size-6' }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" fill="currentColor" />
        <path
            d="M8.46 8.46a4.5 4.5 0 0 0 0 7.08"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
        />
        <path
            d="M15.54 8.46a4.5 4.5 0 0 1 0 7.08"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
        />
        <path
            d="M5.63 5.63a9 9 0 0 0 0 12.74"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
        />
        <path
            d="M18.37 5.63a9 9 0 0 1 0 12.74"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
        />
    </svg>
);

const RssIcon = () => (
    <svg
        className="size-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
    >
        <circle cx="6.5" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
        <path d="M5 12.5a6.5 6.5 0 0 1 6.5 6.5" strokeLinecap="round" />
        <path d="M5 7.5A11.5 11.5 0 0 1 16.5 19" strokeLinecap="round" />
    </svg>
);

const BrainIcon = () => (
    <svg
        className="size-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
    >
        <path
            d="M12 2a7 7 0 0 0-5 2.1A5.5 5.5 0 0 0 4 9.5c0 1.5.5 2.8 1.3 3.8A6 6 0 0 0 6 18h2v3h8v-3h2a6 6 0 0 0 .7-4.7A5.5 5.5 0 0 0 20 9.5a5.5 5.5 0 0 0-3-4.9A7 7 0 0 0 12 2z"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path d="M12 8v5m-2-3h4" strokeLinecap="round" />
    </svg>
);

const LinkIcon = () => (
    <svg
        className="size-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
    >
        <path
            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const MonitorIcon = () => (
    <svg
        className="size-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
    >
        <path
            d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const DuplicateIcon = () => (
    <svg
        className="size-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
    >
        <path
            d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m0 0a2.625 2.625 0 115.25 0"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const BoltIcon = () => (
    <svg
        className="size-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
    >
        <path
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const CheckCircle = () => (
    <svg
        className="size-5 text-[#2DD4A8]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const ArrowRight = ({ className = 'size-4' }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

/* ───────── Landing Page ───────── */

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="SignalDeck — Your News Engine, Automated">
                <meta
                    name="description"
                    content="SignalDeck automates the lifecycle of analyst-style news videos. Aggregate RSS feeds, generate AI scripts, and present sources in Studio Mode for seamless one-take recording."
                />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin=""
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-white text-[#1b1b18]">
                {/* ━━━ NAVBAR ━━━ */}
                <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                        <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-[#1b1b18] text-[#2DD4A8]">
                                <SignalIcon className="size-5" />
                            </div>
                            <span className="text-lg font-bold tracking-tight">
                                SignalDeck
                            </span>
                        </div>

                        <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
                            <a
                                href="#features"
                                className="transition-colors hover:text-[#1b1b18]"
                            >
                                Features
                            </a>
                            <a
                                href="#workflow"
                                className="transition-colors hover:text-[#1b1b18]"
                            >
                                How It Works
                            </a>
                            <a
                                href="#testimonial"
                                className="transition-colors hover:text-[#1b1b18]"
                            >
                                Testimonials
                            </a>
                        </div>

                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex items-center gap-2 rounded-full bg-[#1b1b18] px-5 py-2 text-sm font-medium text-white transition-all hover:bg-black"
                                >
                                    Dashboard
                                    <ArrowRight />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="hidden rounded-full px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-[#1b1b18] sm:inline-block"
                                    >
                                        Log in
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="inline-flex items-center gap-2 rounded-full bg-[#2DD4A8] px-5 py-2 text-sm font-semibold text-[#1b1b18] transition-all hover:bg-[#1AAD87] hover:text-white"
                                        >
                                            Get Started
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* ━━━ HERO ━━━ */}
                <section className="relative overflow-hidden">
                    <div className="mx-auto max-w-7xl px-6 pt-16 pb-20 lg:px-8 lg:pt-24">
                        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                            {/* Left text */}
                            <div className="animate-fade-in-up">
                                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#2DD4A8]/30 bg-[#2DD4A8]/10 px-4 py-1.5 text-xs font-semibold text-[#0f766e]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#2DD4A8]" />
                                    #1 Content Engine for News Creators
                                </span>
                                <h1 className="mt-4 text-5xl leading-[1.1] font-extrabold tracking-tight text-[#1b1b18] lg:text-6xl">
                                    Your News Engine,{' '}
                                    <span className="bg-gradient-to-r from-[#2DD4A8] to-[#0f766e] bg-clip-text text-transparent">
                                        Automated
                                    </span>
                                </h1>
                                <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-600">
                                    Aggregate 50+ RSS feeds, generate AI-powered
                                    scripts, and present sources in Studio Mode
                                    for seamless one-take video recording.
                                </p>
                                <div className="mt-8 flex flex-wrap items-center gap-4">
                                    {canRegister && !auth.user && (
                                        <Link
                                            href={register()}
                                            className="group inline-flex items-center gap-2 rounded-full bg-[#1b1b18] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-all hover:bg-black hover:shadow-xl hover:shadow-black/30"
                                        >
                                            Start For Free
                                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                                        </Link>
                                    )}
                                    <a
                                        href="#workflow"
                                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-7 py-3.5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
                                    >
                                        <svg
                                            className="size-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        Watch Demo
                                    </a>
                                </div>
                            </div>

                            {/* Right — Hero visual */}
                            <div className="animate-fade-in-up-delay-2 relative">
                                <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-black/20">
                                    {/* Dashboard mockup */}
                                    <div className="hero-gradient aspect-[4/3] w-full p-6">
                                        {/* Fake dashboard UI */}
                                        <div className="flex h-full flex-col gap-3">
                                            {/* Top bar */}
                                            <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                                                <div className="h-2.5 w-2.5 rounded-full bg-[#2DD4A8]" />
                                                <div className="h-2 w-24 rounded-full bg-white/20" />
                                                <div className="ml-auto flex gap-2">
                                                    <div className="h-2 w-16 rounded-full bg-white/15" />
                                                    <div className="h-2 w-16 rounded-full bg-white/15" />
                                                </div>
                                            </div>
                                            {/* Content area */}
                                            <div className="flex flex-1 gap-3">
                                                {/* Sidebar */}
                                                <div className="hidden w-1/4 flex-col gap-2 rounded-lg bg-white/5 p-3 sm:flex">
                                                    {[
                                                        'Politics',
                                                        'Tech',
                                                        'Finance',
                                                        'World',
                                                    ].map((cat) => (
                                                        <div
                                                            key={cat}
                                                            className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2"
                                                        >
                                                            <div className="h-1.5 w-1.5 rounded-full bg-[#2DD4A8]/60" />
                                                            <span className="text-[10px] text-white/50">
                                                                {cat}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Cards */}
                                                <div className="flex-1 space-y-2">
                                                    {[1, 2, 3].map((i) => (
                                                        <div
                                                            key={i}
                                                            className="rounded-lg bg-white/8 p-3 backdrop-blur-sm"
                                                        >
                                                            <div className="mb-2 flex items-center gap-2">
                                                                <div className="h-2 w-2 rounded-full bg-[#2DD4A8]" />
                                                                <div
                                                                    className={`h-2 rounded-full bg-white/25 ${i === 1 ? 'w-3/4' : i === 2 ? 'w-1/2' : 'w-2/3'}`}
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <div className="h-1.5 w-full rounded-full bg-white/10" />
                                                                <div className="h-1.5 w-4/5 rounded-full bg-white/10" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Decorative gradient blob */}
                                <div className="absolute -top-10 -right-10 -z-10 h-72 w-72 rounded-full bg-[#2DD4A8]/20 blur-3xl" />
                                <div className="absolute -bottom-10 -left-10 -z-10 h-56 w-56 rounded-full bg-[#0f766e]/15 blur-3xl" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ━━━ STATS BAR ━━━ */}
                <section className="border-y border-gray-100 bg-gray-50/60">
                    <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-gray-200 px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-8">
                        {[
                            {
                                value: '50+',
                                label: 'RSS news sources aggregated in real-time',
                            },
                            {
                                value: '5 min',
                                label: 'Average time from discovery to finished script',
                            },
                            {
                                value: 'One‑Take',
                                label: 'Record full videos without stopping',
                            },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className={`animate-fade-in-up-delay-${i + 1} px-6 py-10 text-center sm:py-12`}
                            >
                                <span className="text-4xl font-extrabold tracking-tight text-[#1b1b18]">
                                    {stat.value}
                                </span>
                                <p className="mt-2 text-sm text-gray-500">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ━━━ WORKFLOW PILLS ━━━ */}
                <section id="workflow" className="py-20 lg:py-28">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-extrabold tracking-tight text-[#1b1b18] lg:text-4xl">
                                Focusing on speed,{' '}
                                <span className="text-gray-400">
                                    we automate your workflow
                                </span>
                            </h2>
                            <p className="mt-4 text-gray-500">
                                From headline discovery to finished recording —
                                every step is optimized for the faceless news
                                creator.
                            </p>
                        </div>

                        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
                            {[
                                { icon: '📡', label: 'Ingest', active: true },
                                { icon: '🎯', label: 'Curate', active: false },
                                { icon: '✍️', label: 'Script', active: false },
                                { icon: '🎬', label: 'Present', active: false },
                                { icon: '📊', label: 'Analyze', active: false },
                            ].map((step) => (
                                <button
                                    key={step.label}
                                    className={`flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-medium transition-all ${
                                        step.active
                                            ? 'bg-[#1b1b18] text-white shadow-lg shadow-black/15'
                                            : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="text-base">
                                        {step.icon}
                                    </span>
                                    {step.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ━━━ FEATURES GRID ━━━ */}
                <section
                    id="features"
                    className="border-t border-gray-100 bg-gray-50/40 py-20 lg:py-28"
                >
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-extrabold tracking-tight text-[#1b1b18] lg:text-4xl">
                                We offer quality,{' '}
                                <span className="text-gray-400">
                                    with the best tools &amp; automation
                                </span>
                            </h2>
                            <p className="mt-4 text-gray-500">
                                Every feature is purpose-built to eliminate the
                                friction between finding news and recording it.
                            </p>
                        </div>

                        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    icon: <RssIcon />,
                                    title: 'RSS Aggregation',
                                    description:
                                        'Pull headlines from 50+ configurable RSS feeds in real-time. Never miss a breaking story.',
                                },
                                {
                                    icon: <BrainIcon />,
                                    title: 'AI Scriptwriter',
                                    description:
                                        'GPT-4o or Gemini generates broadcast-ready scripts with intro, body, and outro — in your chosen tone.',
                                },
                                {
                                    icon: <LinkIcon />,
                                    title: 'Source Mapping',
                                    description:
                                        'AI inserts [TAB 1], [TAB 2] markers so you know exactly when to show each source on screen.',
                                },
                                {
                                    icon: <MonitorIcon />,
                                    title: 'Studio Mode',
                                    description:
                                        'Split-screen teleprompter + live source viewer, designed specifically for OBS capture.',
                                },
                                {
                                    icon: <DuplicateIcon />,
                                    title: 'Smart Deduplication',
                                    description:
                                        "Groups similar stories together so you don't waste time covering something CNN and BBC both reported.",
                                },
                                {
                                    icon: <BoltIcon />,
                                    title: 'Signal Score',
                                    description:
                                        'AI-powered headline analysis flags "Viral" or "High Impact" stories with keywords like Fraud, Crash, Leak.',
                                },
                            ].map((feature) => (
                                <div
                                    key={feature.title}
                                    className="group rounded-2xl border border-gray-100 bg-white p-8 transition-all hover:border-[#2DD4A8]/30 hover:shadow-lg hover:shadow-[#2DD4A8]/5"
                                >
                                    <div className="flex size-12 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition-colors group-hover:bg-[#2DD4A8]/10 group-hover:text-[#0f766e]">
                                        {feature.icon}
                                    </div>
                                    <h3 className="mt-5 text-lg font-semibold text-[#1b1b18]">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ━━━ TRUSTED SERVICE (Split) ━━━ */}
                <section className="py-20 lg:py-28">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                            {/* Left text */}
                            <div>
                                <h2 className="text-3xl font-extrabold tracking-tight text-[#1b1b18] lg:text-4xl">
                                    Built for OSINT analysts,{' '}
                                    <span className="text-gray-400">
                                        faceless news channels
                                    </span>
                                </h2>
                                <p className="mt-4 text-gray-500">
                                    Whether you're covering politics, finance,
                                    or breaking tech news — SignalDeck
                                    streamlines your entire production pipeline.
                                </p>

                                <div className="mt-10 space-y-5">
                                    {[
                                        {
                                            label: 'RSS feeds for politics, tech, finance & world news',
                                        },
                                        {
                                            label: 'Analyst or Hype tone — match your channel style',
                                        },
                                        {
                                            label: 'Hotkey-driven source switching for live recording',
                                        },
                                        {
                                            label: 'Reader View strips ads for clean OBS capture',
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex items-start gap-3"
                                        >
                                            <CheckCircle />
                                            <span className="text-sm text-gray-600">
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-10 flex flex-wrap gap-6">
                                    {[
                                        {
                                            value: '60→5',
                                            unit: 'min',
                                            label: 'Script time reduction',
                                        },
                                        {
                                            value: '0',
                                            unit: 'stops',
                                            label: 'During recording',
                                        },
                                    ].map((metric) => (
                                        <div key={metric.label}>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-extrabold text-[#1b1b18]">
                                                    {metric.value}
                                                </span>
                                                <span className="text-sm font-medium text-[#2DD4A8]">
                                                    {metric.unit}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {metric.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right — visual */}
                            <div className="relative">
                                <div className="overflow-hidden rounded-2xl">
                                    {/* Studio Mode mockup */}
                                    <div className="aspect-[4/3] w-full bg-[#121212] p-5">
                                        <div className="flex h-full gap-3">
                                            {/* Teleprompter panel */}
                                            <div className="flex w-1/3 flex-col rounded-lg border border-white/10 bg-white/5 p-4">
                                                <div className="mb-3 flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-[#2DD4A8]" />
                                                    <span className="text-[10px] font-medium text-white/60">
                                                        TELEPROMPTER
                                                    </span>
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <div className="rounded border-l-2 border-[#2DD4A8] bg-[#2DD4A8]/20 p-2">
                                                        <div className="space-y-1.5">
                                                            <div className="h-1.5 w-full rounded-full bg-white/40" />
                                                            <div className="h-1.5 w-4/5 rounded-full bg-white/40" />
                                                            <div className="h-1.5 w-3/5 rounded-full bg-white/40" />
                                                        </div>
                                                    </div>
                                                    <div className="p-2">
                                                        <div className="space-y-1.5">
                                                            <div className="h-1.5 w-full rounded-full bg-white/15" />
                                                            <div className="h-1.5 w-3/4 rounded-full bg-white/15" />
                                                        </div>
                                                    </div>
                                                    <div className="p-2">
                                                        <div className="space-y-1.5">
                                                            <div className="h-1.5 w-full rounded-full bg-white/15" />
                                                            <div className="h-1.5 w-2/3 rounded-full bg-white/15" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Source viewer panel */}
                                            <div className="flex flex-1 flex-col rounded-lg border border-white/10 bg-white/5 p-4">
                                                <div className="mb-3 flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-blue-400" />
                                                    <span className="text-[10px] font-medium text-white/60">
                                                        SOURCE VIEWER
                                                    </span>
                                                    <div className="ml-auto rounded bg-white/10 px-2 py-0.5">
                                                        <span className="text-[8px] text-white/40">
                                                            TAB 1
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-3 rounded bg-white/[0.03] p-3">
                                                    <div className="h-2.5 w-2/3 rounded bg-white/20" />
                                                    <div className="space-y-1.5">
                                                        <div className="h-1.5 w-full rounded-full bg-white/10" />
                                                        <div className="h-1.5 w-full rounded-full bg-white/10" />
                                                        <div className="h-1.5 w-4/5 rounded-full bg-white/10" />
                                                    </div>
                                                    <div className="h-20 w-full rounded bg-white/[0.06]" />
                                                    <div className="space-y-1.5">
                                                        <div className="h-1.5 w-full rounded-full bg-white/10" />
                                                        <div className="h-1.5 w-3/4 rounded-full bg-white/10" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -right-8 -bottom-8 -z-10 h-56 w-56 rounded-full bg-[#2DD4A8]/15 blur-3xl" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ━━━ TESTIMONIAL ━━━ */}
                <section
                    id="testimonial"
                    className="border-t border-gray-100 bg-gray-50/40 py-20 lg:py-28"
                >
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <h2 className="text-3xl font-extrabold tracking-tight text-[#1b1b18] lg:text-4xl">
                                See how creators solve problems,{' '}
                                <span className="text-gray-400">
                                    right on target
                                </span>
                            </h2>
                        </div>

                        <div className="mx-auto mt-16 max-w-2xl">
                            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm lg:p-10">
                                <div className="mb-6 inline-flex rounded-full bg-[#2DD4A8]/10 px-4 py-1 text-xs font-semibold text-[#0f766e]">
                                    Early Access User
                                </div>
                                <blockquote className="text-lg leading-relaxed text-gray-700 italic">
                                    "We track over 30 RSS feeds across politics
                                    and finance. Before SignalDeck, it took us
                                    an hour to compile sources and write a
                                    script. Now it's done in 5 minutes and the
                                    AI even marks where to show each source. The
                                    studio mode is a game-changer for our daily
                                    live shows."
                                </blockquote>
                                <div className="mt-8 flex items-center gap-4">
                                    <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#2DD4A8] to-[#0f766e] text-lg font-bold text-white">
                                        SN
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[#1b1b18]">
                                            Signal Noise
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            OSINT Content Creator
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
                            {[
                                {
                                    label: 'Faster editorial loop',
                                    desc: 'Pre-configured RSS pipelines',
                                },
                                {
                                    label: 'Rehearsal-free recording',
                                    desc: 'Teleprompter + source sync',
                                },
                                {
                                    label: 'No editing needed',
                                    desc: 'One-take, front to back',
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-xl border border-gray-100 bg-white p-5 text-center"
                                >
                                    <p className="text-sm font-semibold text-[#1b1b18]">
                                        {item.label}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ━━━ DARK CTA BANNER ━━━ */}
                <section className="relative overflow-hidden bg-[#1b1b18] py-20 lg:py-24">
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-0 -left-20 h-96 w-96 rounded-full bg-[#2DD4A8]/20 blur-3xl" />
                        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-[#0f766e]/30 blur-3xl" />
                    </div>
                    <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid items-center gap-10 lg:grid-cols-2">
                            <div>
                                <h2 className="text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
                                    It's time to automate your pipeline,{' '}
                                    <span className="text-[#2DD4A8]">
                                        with intelligent tools
                                    </span>
                                </h2>
                                <p className="mt-4 max-w-md text-gray-400">
                                    By automating the discovery, scripting, and
                                    presentation workflow, SignalDeck transforms
                                    how analyst-style news content is produced.
                                </p>
                            </div>
                            <div className="flex flex-col items-start gap-4 lg:items-end">
                                {canRegister && !auth.user ? (
                                    <Link
                                        href={register()}
                                        className="inline-flex items-center gap-2 rounded-full bg-[#2DD4A8] px-8 py-4 text-sm font-bold text-[#1b1b18] shadow-lg shadow-[#2DD4A8]/20 transition-all hover:bg-[#5EEDC6] hover:shadow-xl hover:shadow-[#2DD4A8]/30"
                                    >
                                        Get Started — It's Free
                                        <ArrowRight />
                                    </Link>
                                ) : auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex items-center gap-2 rounded-full bg-[#2DD4A8] px-8 py-4 text-sm font-bold text-[#1b1b18] shadow-lg shadow-[#2DD4A8]/20 transition-all hover:bg-[#5EEDC6]"
                                    >
                                        Go to Dashboard
                                        <ArrowRight />
                                    </Link>
                                ) : null}
                                <div className="flex items-center gap-6 text-xs text-gray-500">
                                    <span className="flex items-center gap-1.5">
                                        <CheckCircle /> Free during beta
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <CheckCircle /> No credit card required
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ━━━ FOOTER ━━━ */}
                <footer className="border-t border-gray-100 bg-white py-12">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-[#1b1b18] text-[#2DD4A8]">
                                    <SignalIcon className="size-4" />
                                </div>
                                <span className="text-sm font-bold">
                                    SignalDeck
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
                                <a
                                    href="#features"
                                    className="transition-colors hover:text-gray-600"
                                >
                                    Features
                                </a>
                                <a
                                    href="#workflow"
                                    className="transition-colors hover:text-gray-600"
                                >
                                    How It Works
                                </a>
                                <a
                                    href="#testimonial"
                                    className="transition-colors hover:text-gray-600"
                                >
                                    Testimonials
                                </a>
                            </div>

                            <p className="text-xs text-gray-400">
                                &copy; {new Date().getFullYear()} SignalDeck.
                                All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
