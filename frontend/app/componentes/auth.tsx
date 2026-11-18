import type { ReactNode } from "react";

type TarjetaAuthProps = {
  titulo: string;
  children: ReactNode;
  pie?: ReactNode;
};

export function TarjetaAuth({ titulo, children, pie }: TarjetaAuthProps) {
  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-16 text-slate-900">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm sm:p-10">
        <div className="flex flex-col items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold tracking-tight text-white"
          >
            MP
          </span>
          <p className="text-xs font-medium tracking-wide text-slate-500">
            MatchPoint · Reservas deportivas
          </p>
        </div>

        <h1 className="mt-7 text-center text-2xl font-semibold tracking-tight text-slate-900">
          {titulo}
        </h1>

        <div className="mt-8">{children}</div>

        {pie ? <div className="mt-8 text-center text-sm text-slate-600">{pie}</div> : null}
      </div>
    </main>
  );
}

type AvisoProps = {
  tono: "error" | "exito";
  children: ReactNode;
};

export function Aviso({ tono, children }: AvisoProps) {
  const estilos =
    tono === "error"
      ? "border-red-200/80 bg-red-50 text-red-700"
      : "border-emerald-200/80 bg-emerald-50 text-emerald-800";

  return (
    <p role="alert" className={`rounded-xl border px-3.5 py-2.5 text-sm ${estilos}`}>
      {children}
    </p>
  );
}

type CampoProps = {
  id: string;
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  placeholder?: string;
  value: string;
  error?: string;
  onChange: (valor: string) => void;
};

export function Campo({
  id,
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  value,
  error,
  onChange,
}: CampoProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(evento) => onChange(evento.target.value)}
        className={`mt-1.5 block w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 ${
          error ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-white"
        }`}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
