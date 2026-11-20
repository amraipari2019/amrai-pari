import Image from "next/image";

export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sky p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="bands-thin" aria-hidden />
        <div className="p-8">
          <div className="mb-6 flex items-center gap-3">
            <Image src="/brand/logo-192.png" alt="" width={44} height={44} />
            <div className="leading-tight">
              <p className="font-bold text-primary">Amrai Pari Foundation</p>
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
