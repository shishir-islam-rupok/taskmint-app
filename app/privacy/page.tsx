import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "গোপনীয়তা | TaskMint",
    description: "TaskMint অ্যাকাউন্ট, কাজ এবং স্পন্সর অফার সংক্রান্ত গোপনীয়তার তথ্য।",
};

export default function PrivacyPage() {
    return (
        <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-10 text-[#f1f4e9] sm:px-8 sm:py-16">
            <Link href="/" className="text-sm font-semibold text-[#c9f36a] hover:text-[#dcff86]">TaskMint</Link>
            <p className="mt-12 text-xs font-semibold uppercase tracking-[0.14em] text-[#c9f36a]">গোপনীয়তার তথ্য</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">আপনার তথ্য ও স্পন্সর অফার</h1>
            <div className="mt-8 space-y-7 text-sm leading-7 text-[#b8c5b9]">
                <section>
                    <h2 className="text-base font-semibold text-white">TaskMint অ্যাকাউন্ট ও কার্যক্রম</h2>
                    <p className="mt-2">সেবা পরিচালনার জন্য TaskMint অ্যাকাউন্ট যাচাই এবং প্রয়োজনীয় অ্যাকাউন্ট, ক্যাম্পেইনে জমা কাজ ও ওয়ালেটের তথ্য সংরক্ষণে Supabase ব্যবহার করে। আপনার সেশন সুরক্ষিত রাখতে অথেনটিকেশন কুকি ব্যবহার করা হয়।</p>
                </section>
                <section>
                    <h2 className="text-base font-semibold text-white">ঐচ্ছিক Adsterra Smartlink</h2>
                    <p className="mt-2">আপনি “স্পন্সর অফার দেখুন” নির্বাচন করলেই কেবল Adsterra অফারটি নতুন ট্যাবে খোলে। Adsterra তাদের নীতি অনুযায়ী প্রযুক্তিগত তথ্য, ট্রাফিকের উৎস এবং ব্যবহারকারীর কার্যক্রম প্রক্রিয়া করতে পারে। এই Smartlink থেকে TaskMint কাজ সম্পন্নের যাচাইকৃত তথ্য পায় না এবং বিজ্ঞাপনে ক্লিক, দেখা বা কনভার্সনের জন্য পুরস্কার দেয় না।</p>
                    <p className="mt-2"><a href="https://adsterra.com/privacy-policy-managed/" target="_blank" rel="noopener noreferrer" className="text-[#d6f5a4] underline decoration-[#c9f36a]/40 underline-offset-4">Adsterra গোপনীয়তা নীতি</a> · <a href="https://adsterra.com/publishers-terms-managed/" target="_blank" rel="noopener noreferrer" className="text-[#d6f5a4] underline decoration-[#c9f36a]/40 underline-offset-4">Adsterra প্রকাশক নীতিমালা</a></p>
                </section>
                <section>
                    <h2 className="text-base font-semibold text-white">বিজ্ঞাপনের ট্যাগ</h2>
                    <p className="mt-2">TaskMint বর্তমানে Adsterra ব্যানার, নেটিভ, Social Bar বা Popunder ট্যাগ লোড করে না। অনুমোদিত Adsterra অ্যাকাউন্ট থেকে পাওয়া আসল অপরিবর্তিত প্রকাশক ট্যাগ কনফিগার না করা পর্যন্ত এগুলো বন্ধ থাকবে। এই পেজে বিজ্ঞাপন নেটওয়ার্কের কোনো ট্র্যাকিং স্ক্রিপ্ট লোড হয় না।</p>
                </section>
            </div>
            <Link href="/adsincome" className="mt-10 inline-flex rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/4">স্পন্সর করা কাজে ফিরুন</Link>
        </main>
    );
}
