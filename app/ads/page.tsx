import Link from "next/link";
import { AdsterraUnitCatalog } from "../adsincome/adsterra-unit-catalog";

type AdPlacement = {
    id: string;
    title: string;
    width: number;
    height: number;
    markup: string;
};

function bannerTag(key: string, width: number, height: number) {
    const options = JSON.stringify({ key, format: "iframe", height, width, params: {} });
    return `<script>var atOptions = ${options};</script><script src="https://bauval.org/22/${key}"></script>`;
}

function adDocument(markup: string) {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;min-height:100vh;display:grid;place-items:center">${markup}</body></html>`;
}

const placements: AdPlacement[] = [
    {
        id: "96771d31781cc5c793b53fcf9039883f",
        title: "ব্যানার · 728 × 90",
        width: 728,
        height: 90,
        markup: bannerTag("96771d31781cc5c793b53fcf9039883f", 728, 90),
    },
    {
        id: "e5416cf203af6091a4fc5a7b79ddb487",
        title: "ডিসপ্লে বিজ্ঞাপন",
        width: 300,
        height: 250,
        markup: '<script data-cfasync="false" src="https://abscloud.org/1/e5416cf203af6091a4fc5a7b79ddb487"></script>',
    },
    {
        id: "c65b80033da7f426f5dc669389b721d7",
        title: "নেটিভ ব্যানার",
        width: 300,
        height: 250,
        markup: '<script async="async" data-cfasync="false" src="https://bauval.org/21/c65b80033da7f426f5dc669389b721d7"></script><div id="container-c65b80033da7f426f5dc669389b721d7"></div>',
    },
    {
        id: "e7b0913c722796b0e4db2075f8790661",
        title: "ব্যানার · 160 × 600",
        width: 160,
        height: 600,
        markup: bannerTag("e7b0913c722796b0e4db2075f8790661", 160, 600),
    },
    {
        id: "47b942527bfc4640535938686f705abf",
        title: "ব্যানার · 300 × 250",
        width: 300,
        height: 250,
        markup: bannerTag("47b942527bfc4640535938686f705abf", 300, 250),
    },
    {
        id: "fd78d367dedf6971672434512d62ed32",
        title: "ব্যানার · 468 × 60",
        width: 468,
        height: 60,
        markup: bannerTag("fd78d367dedf6971672434512d62ed32", 468, 60),
    },
    {
        id: "abd86844ce9bb0ecac2125e6e7ecc5c8",
        title: "ব্যানার · 160 × 300",
        width: 160,
        height: 300,
        markup: bannerTag("abd86844ce9bb0ecac2125e6e7ecc5c8", 160, 300),
    },
    {
        id: "77bde3b98f87c3b3fde0f9e71e883e99",
        title: "ব্যানার · 320 × 50",
        width: 320,
        height: 50,
        markup: bannerTag("77bde3b98f87c3b3fde0f9e71e883e99", 320, 50),
    },
];

export default function AdsPage() {
    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-6 text-[#f1f4e9] sm:px-8 sm:py-10">
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                <Link href="/" className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-white">
                    <span className="grid size-8 place-items-center rounded-lg bg-[#c9f36a] text-xs font-black text-[#17210d]">T</span>taskmint
                </Link>
                <nav className="flex items-center gap-2 sm:gap-3">
                    <Link href="/adsincome" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] transition hover:bg-white/5 hover:text-white">কাজ খুঁজুন</Link>
                    <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-[#a9b5aa] transition hover:bg-white/5 hover:text-white">অ্যাকাউন্ট</Link>
                </nav>
            </header>

            <section>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c9f36a]">Adsterra · Sponsored</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">স্পন্সর বিজ্ঞাপন</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#9aa99f]">
                    এই পৃষ্ঠায় Adsterra-এর দেওয়া বিজ্ঞাপন ট্যাগগুলো আলাদা sandboxed frame-এ চলে। বিজ্ঞাপনের ক্লিক বা ইমপ্রেশনে TaskMint কাজের পুরস্কার দেয় না।
                </p>
            </section>

            <section aria-label="Adsterra banner placements" className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {placements.map((placement, index) => (
                    <article key={placement.id} className="min-w-0 border border-white/10 bg-[#111e19] p-4">
                        <h2 className="mb-3 text-xs font-semibold text-[#dbe4d7]">{placement.title}</h2>
                        <div className="max-w-full overflow-x-auto">
                            <iframe
                                title={`Adsterra ${placement.title}`}
                                srcDoc={adDocument(placement.markup)}
                                width={placement.width}
                                height={placement.height}
                                loading={index < 2 ? "eager" : "lazy"}
                                sandbox="allow-scripts allow-popups"
                                referrerPolicy="strict-origin-when-cross-origin"
                                className="mx-auto block border-0"
                            />
                        </div>
                    </article>
                ))}
            </section>

            <section className="mt-6 border border-white/10 bg-[#111e19] p-5 sm:p-6">
                <h2 className="text-sm font-semibold text-white">স্পন্সর অফার</h2>
                <p className="mt-2 text-xs leading-5 text-[#9aa99f]">এই লিংকটি Adsterra-তে নিয়ে যায়। এটি নতুন ট্যাবে খুলবে এবং TaskMint-এর কোনো পুরস্কার তৈরি করবে না।</p>
                <a
                    href="https://araplhn.org/4/e66f50293ab0fc019aa1d1cf818a44ab"
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#c9f36a] px-4 py-3 text-sm font-bold text-[#17210d] transition hover:bg-[#dcff86]"
                >
                    স্পন্সর অফার খুলুন <span aria-hidden="true">↗</span>
                </a>
            </section>

            <div className="mt-6">
                <AdsterraUnitCatalog />
            </div>
        </main>
    );
}
