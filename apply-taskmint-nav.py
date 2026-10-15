from pathlib import Path

replacements = {
    Path("app/dashboard/page.tsx"): (
        '{isAdmin ? <Link href="/admin/campaigns" className="rounded-lg border border-[#c9f36a]/25 px-3 py-2 text-sm font-semibold text-[#d6f5a4] hover:bg-[#c9f36a]/10">Campaign ops</Link> : null}',
        '{isAdmin ? <Link href="/admin/campaigns" className="rounded-lg border border-[#c9f36a]/25 px-3 py-2 text-sm font-semibold text-[#d6f5a4] hover:bg-[#c9f36a]/10">Campaign ops</Link> : null}\n                    <Link href="/wallet" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-[#bdc9be] hover:border-white/30 hover:bg-white/4 hover:text-white">Wallet</Link>',
    ),
    Path("app/admin/campaigns/page.tsx"): (
        '<nav className="flex gap-2"><Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">Workspace</Link><Link href="/adsincome" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">Earn tasks</Link></nav>',
        '<nav className="flex gap-2"><Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">Workspace</Link><Link href="/adsincome" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">Earn tasks</Link><Link href="/admin/withdrawals" className="rounded-lg px-3 py-2 text-sm text-[#a9b5aa] hover:bg-white/5 hover:text-white">Withdrawals</Link></nav>',
    ),
}

# Validate all source markers before changing either file, so partial edits are avoided.
plans = []
for path, (old, new) in replacements.items():
    if not path.exists():
        raise SystemExit(f"Missing expected file: {path}. Run this script from the TaskMint repository root.")
    content = path.read_text(encoding="utf-8")
    if new in content:
        plans.append((path, content, None))
        continue
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"Expected exactly one insertion point in {path}, found {count}. No files were modified.")
    plans.append((path, content, content.replace(old, new, 1)))

for path, original, updated in plans:
    if updated is None:
        print(f"Already patched: {path}")
    else:
        path.write_text(updated, encoding="utf-8")
        print(f"Added navigation link: {path}")

print("Navigation updated. Review git diff before committing.")
