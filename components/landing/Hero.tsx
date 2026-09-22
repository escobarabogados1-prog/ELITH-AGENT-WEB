import { Logo } from "../shared/Logo";

export function Hero() {
  return (
    <div className="flex flex-col items-center gap-4 pt-16 text-center">
      <Logo />
      <h1 className="max-w-xl text-3xl font-serif text-white sm:text-4xl">
        Asistente Jurídico y Comercial
      </h1>
      <p className="max-w-md text-navy-100/80">
        Cuéntanos brevemente qué necesitas resolver y te ayudaremos a
        identificar el área jurídica correspondiente.
      </p>
    </div>
  );
}
