import TryOn from "@/components/TryOn";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-stone-500 uppercase">Renk analizi</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Hangi renkler seni aydınlatıyor?
          </h1>
        </div>
        <p className="max-w-md text-sm text-stone-600">
          Ten, saç ve göz rengini seç; mevsim paletlerindeki renkleri modelin üzerinde dene. Işık nötr gün ışığına
          ayarlı, böylece renkler olduğu gibi görünür.
        </p>
      </header>
      <TryOn />
    </main>
  );
}
