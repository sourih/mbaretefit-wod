# MBARETEFIT WOD

**La fuerza está en vos.**

Calculadora de cargas para atletas y coaches de CrossFit: porcentajes de RM, tabla completa de
fuerza y qué discos poner en cada lado de la barra, usando el inventario real del box.

Funciona en el celular, sin conexión, y se puede instalar como app (PWA).

## Qué resuelve

Durante una clase no hay tiempo para hacer cuentas. La app responde en dos toques:

- cuánto es el 75 % de tu RM,
- cuánto pesa cada lado de la barra,
- qué discos poner, con los que de verdad hay en el box,
- y, cuando ese peso exacto no se puede armar, cuáles son las cargas más cercanas.

Nunca presenta una carga aproximada como si fuera exacta.

## Funcionalidades

**RM Calculator.** RM de referencia + porcentaje + barra → carga objetivo, peso de discos, peso por
lado, la barra dibujada y todas las combinaciones exactas ordenadas por preferencia.

**Strength.** Un peso de referencia genera la tabla completa de porcentajes. Cada fila muestra el
objetivo, el peso por lado, la combinación recomendada, cuántas alternativas hay y un aviso cuando
no existe combinación exacta. Al cambiar el peso o la barra, la tabla se recalcula entera. Los
porcentajes se agregan, se editan y se quitan.

**Plate Calculator.** Armá la barra a mano con los discos del box y mirá cuánto pesa.

**Configuración.** Inventario real de cada disco, barras disponibles, porcentajes predeterminados y
unidad de medida. Todo se guarda solo y se puede restaurar.

**Historial.** Los cálculos guardados, con filtro por módulo. Tocar uno lo vuelve a abrir en su
módulo con los datos cargados.

## Cómo calcula

- Todos los pesos se manejan como **enteros en miligramos**. Nada de decimales binarios: el 70 % de
  102,5 kg da 71,75 kg exactos, no 71,74999999999999.
- La carga siempre es simétrica: se calcula **un lado** y el otro es idéntico.
  `peso total = barra + 2 × peso por lado`.
- El motor solo usa **pares completos** de discos: un disco suelto no sirve, porque hace falta uno
  para cada lado.
- Entre las combinaciones exactas, prefiere la que usa **menos discos**; si empatan, la que usa los
  **discos más pesados**. No repite combinaciones.
- Si no hay combinación exacta, devuelve la carga armable más cercana **por debajo** y **por
  encima**, cada una con su diferencia en kg.

El motor (`src/services/calc/`) es código puro, sin React ni almacenamiento, y está cubierto por
pruebas unitarias, incluida una comparación contra una búsqueda por fuerza bruta.

## Requisitos

- Node.js 20.19 o superior (Vite 8).
- npm 10 o superior.

## Instalación

```bash
git clone https://github.com/<tu-usuario>/mbaretefit-wod.git
cd mbaretefit-wod
npm install
```

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm run build` | Compila TypeScript y genera `dist/` con el service worker |
| `npm run preview` | Sirve el build de producción |
| `npm run typecheck` | TypeScript sin emitir |
| `npm run lint` | ESLint |
| `npm test` | Pruebas con Vitest |
| `npm run check` | Tipos + lint + pruebas |

## Despliegue

`npm run build` deja todo en `dist/`. El build usa rutas relativas y navegación por hash, así que se
puede servir desde cualquier carpeta: GitHub Pages, Netlify, Vercel, Cloudflare Pages o un hosting
estático común.

```bash
npm run build
npx serve dist   # o subí dist/ a tu hosting
```

Para instalarla en el celular: abrir la URL en Chrome o Safari y elegir "Agregar a la pantalla de
inicio".

## Estructura

```
src/
  components/
    layout/      Marco de la app y cabecera de página
    ui/          Botón, panel, campo, stepper, píldora, diálogo
    calculator/  Selectores, resultado, alternativas, editor de porcentajes
    plates/      Barra dibujada, fichas de discos, aspecto de cada disco
    strength/    Tabla de porcentajes
  pages/         Home, RMCalculator, Strength, PlateCalculator, Settings, History
  hooks/         Ruteo por hash, estado compartido, medición de ancho
  services/
    calc/        Motor de cálculo (porcentajes, combinaciones, tabla)
    storage/     Adaptador de almacenamiento y repositorios
  utils/         Pesos y formato, validaciones, textos
  types/         Tipos de dominio
  data/          Inventario, barras y porcentajes predeterminados
  tests/         Pruebas unitarias y de interfaz
```

Más detalle en [`docs/arquitectura.md`](docs/arquitectura.md).

## Tecnologías

React 19, TypeScript, Vite 8, Tailwind CSS 4, lucide-react, Vitest + React Testing Library,
vite-plugin-pwa y LocalStorage.

## Roadmap

- Libras además de kilogramos.
- Inventario por estación (varias barras cargadas a la vez).
- Historial con nombre de atleta y exportación.
- Cuentas y sincronización entre dispositivos (Supabase o Firebase), sobre el mismo motor de cálculo.
- Compartir una tabla de Strength con la clase.

## Licencia

MIT. Ver [LICENSE](LICENSE).
