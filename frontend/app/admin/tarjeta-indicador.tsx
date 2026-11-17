type Props = {
  etiqueta: string;
  valor: number;
};

export default function TarjetaIndicador({ etiqueta, valor }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {etiqueta}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{valor}</p>
    </section>
  );
}