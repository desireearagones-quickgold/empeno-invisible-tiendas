import Image from "next/image";

/**
 * Hay dos ficheros: la versión blanca (fondo oscuro, login) y la versión a
 * color azul marino + dorado (fondo claro, documentos tipo contrato/crema).
 */
export default function LogoQuickgold({
  sobreClaro = false,
  width = 100,
  className = "",
}: {
  sobreClaro?: boolean;
  width?: number;
  className?: string;
}) {
  const height = Math.round((width * 21) / 120);
  return (
    <Image
      src={sobreClaro ? "/logo-quickgold-color.png" : "/logo-quickgold.png"}
      alt="Quickgold"
      width={width}
      height={height}
      className={className}
      priority
      unoptimized
    />
  );
}
