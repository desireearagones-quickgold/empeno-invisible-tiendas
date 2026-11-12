export const CAMPOS_FICHA: Record<
  1 | 2 | 3,
  { clave: string; etiqueta: string; ayuda: string; placeholder: string }[]
> = {
  1: [
    {
      clave: "pieza",
      etiqueta: "Pieza",
      ayuda: "Descríbete con un apodo, sin decir tu nombre",
      placeholder: "compañera de tienda",
    },
    {
      clave: "quilataje",
      etiqueta: "Quilataje",
      ayuda: "Dos cualidades tuyas, en plan tasación",
      placeholder: "18k de paciencia, 6k de puntualidad",
    },
    {
      clave: "sello",
      etiqueta: "Sello de la casa",
      ayuda: "Algo que haces siempre, muy tuyo",
      placeholder: "saluda a todo el mundo al llegar",
    },
    {
      clave: "valorReventa",
      etiqueta: "Valor de reventa",
      ayuda: "Una pulla cariñosa sobre ti mismo/a",
      placeholder: "bajo antes del primer café",
    },
  ],
  2: [
    {
      clave: "brillo",
      etiqueta: "Brillo",
      ayuda: "Algo que te hace ilusión últimamente",
      placeholder: "le brillan los ojos cuando hay un viaje a la vista",
    },
    {
      clave: "garantia",
      etiqueta: "Garantía",
      ayuda: "Algo para lo que siempre se puede contar contigo",
      placeholder: "nunca falla con una buena recomendación de series",
    },
    {
      clave: "origen",
      etiqueta: "Origen",
      ayuda: "De dónde eres o algo de tu pasado",
      placeholder: "ha pasado por tres ciudades antes de llegar a esta tienda",
    },
    {
      clave: "observaciones",
      etiqueta: "Observaciones del tasador",
      ayuda: "Lo que te apetezca contar de ti",
      placeholder: "siempre lleva una taza distinta",
    },
  ],
  3: [
    {
      clave: "ubicacion",
      etiqueta: "Ubicación habitual",
      ayuda: "Dónde se te suele ver en la tienda",
      placeholder: "zona ventana, segunda mesa",
    },
    {
      clave: "accesorio",
      etiqueta: "Accesorio característico",
      ayuda: "Algo que llevas o usas siempre",
      placeholder: "auriculares naranjas",
    },
    {
      clave: "ruido",
      etiqueta: "Ruido que emite",
      ayuda: "Una pista sonora tuya, en broma",
      placeholder: "teclea muy fuerte cuando tiene prisa",
    },
    {
      clave: "ultimaPista",
      etiqueta: "Última pista",
      ayuda: "La pista definitiva sobre ti, para que no falle",
      placeholder: "siempre pide el café sin azúcar",
    },
  ],
};

export const MAX_CARACTERES_CAMPO = 120;

export function contieneNombre(texto: string, nombre: string): boolean {
  const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return normalizar(texto).includes(normalizar(nombre));
}
