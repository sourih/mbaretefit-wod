# Arquitectura

## Principio

La lógica de negocio no sabe nada de React ni de dónde se guardan los datos. Las tres capas:

```
pages / components   ← React: sólo arma la pantalla
hooks                ← estado compartido y ruteo
services             ← motor de cálculo y persistencia (código puro)
```

Un componente nunca calcula una combinación de discos ni escribe en LocalStorage: pide el resultado
al motor y los datos al contexto.

## Pesos: enteros en miligramos

`src/types/index.ts` define `Mg = number`: todos los pesos son enteros en miligramos (1 kg =
1.000.000). 2,5 kg es `2_500_000`.

Esto elimina los errores de decimales de punto flotante. `src/utils/weight.ts` convierte en los
bordes:

- `parseKg('102,5')` → `102_500_000` (acepta coma o punto, hasta 2 decimales, sin pasar por float),
- `formatKg(27_500_000)` → `'27,5'` (exacto, recorta ceros, nunca redondea),
- `parsePercent` / `formatPercent` para porcentajes, que se guardan en **décimas**: 72,5 % = `725`.

`percentOf(referencia, porcentaje)` multiplica enteros y divide por 1000. Si el resultado no fuera
entero, lanza en vez de redondear en silencio.

## Motor de cálculo

`src/services/calc/`

- `percentage.ts` — carga objetivo a partir de la referencia y el porcentaje.
- `plates.ts` — el núcleo:
  - `stockFromInventory` convierte las unidades del box en **pares por lado**.
  - `findExactCombinations` busca por cantidad creciente de discos (1, 2, 3…) y, dentro de cada
    cantidad, prueba primero los discos más pesados. Poda con la suma máxima y mínima alcanzable, así
    que el resultado ya sale ordenado por preferencia y recortarlo nunca descarta la recomendada.
  - `reachablePerSideWeights` enumera todos los pesos por lado que el inventario puede armar; es lo
    que permite encontrar las cargas más cercanas por debajo y por encima.
  - `calculateLoad` devuelve un resultado de tres formas: `exact`, `approximate` o `invalid`. Los
    tres estados son explícitos en el tipo `LoadResult`, así que la interfaz no puede mostrar una
    aproximación como si fuera exacta.
- `strength.ts` — arma la tabla llamando al motor una vez por porcentaje.

## Persistencia

`src/services/storage/adapter.ts` define `StorageAdapter` (leer, escribir, borrar una clave). Hay
dos implementaciones: LocalStorage (con memoria como respaldo si el navegador la bloquea) y memoria
pura, que usan las pruebas.

`repositories.ts` construye tres repositorios sobre ese adaptador: configuración, historial y
borradores. Todo lo que entra se revisa campo por campo en `src/utils/validation.ts`, así que un
JSON corrupto o manipulado devuelve valores válidos en lugar de romper la app.

**Para pasar a Supabase o Firebase** alcanza con escribir repositorios equivalentes (asíncronos) y
cambiar su construcción en `AppDataProvider`. El motor de cálculo y las pantallas no se tocan.

## Estado y ruteo

`AppDataProvider` es el único lugar que habla con los repositorios y expone configuración,
inventario derivado (`stock`), historial y borradores por contexto.

Los borradores guardan lo último que se escribió en cada módulo, así que volver a una pantalla
devuelve el trabajo donde estaba.

El ruteo es por hash (`#rm`, `#strength`, …) con `useSyncExternalStore`: no necesita servidor ni
reglas de reescritura, y el build anda abierto desde el sistema de archivos.

## Interfaz

Mobile-first. En el celular la navegación vive en una barra inferior de cinco destinos; en
escritorio, en la cabecera.

La paleta es negro carbón con un solo acento naranja, reservado para el resultado y la selección
activa. Las tarjetas se separan por un paso de luminosidad, sin bordes ni sombras. Los números usan
cifras tabulares (`.num`) para que se puedan comparar de un vistazo.

Los discos se distinguen por alto, ancho, tono y etiqueta (`components/plates/plateLook.ts`), no por
un código de colores que varía de box en box. El dibujo de la barra refleja exactamente la
combinación calculada: mismo orden, mismos discos en ambos lados.

## Pruebas

`src/tests/`

- `plates.test.ts` — motor de combinaciones: simetría, inventario, orden de preferencia, duplicados,
  límite, cargas más cercanas, precisión decimal y una comparación contra fuerza bruta.
- `calc.test.ts` — porcentajes, formato de pesos y tabla de Strength.
- `storage.test.ts` — validaciones, repositorios y datos corruptos.
- `app.test.tsx` — recorridos de interfaz sobre los cuatro módulos con un adaptador en memoria.
