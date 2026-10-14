type Props = {
  etiqueta: string;
  valor: number;
};

export default function TarjetaIndicador({ etiqueta, valor }: Props) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {etiqueta}
      </p>
      <p className="mt-2 text-3xl font-bold text-neutral-900">{valor}</p>
    </section>
  );
}