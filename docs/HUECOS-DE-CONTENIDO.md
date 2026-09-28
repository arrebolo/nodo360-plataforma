# Huecos de contenido

**29/09/2026.** Candidatos para el plan de contenidos, encontrados al enlazar el
blog y el glosario con los cursos. No son opiniones: cada cifra sale de
`npx tsx scripts/validar-enlazado.ts` o del inventario de la base.

---

## 1. DeFi: 11 términos, 2 artículos, **0 cursos**

Es el hueco más grande, y el más raro: **DeFi es la categoría con más términos
del glosario y con dos artículos propios, y no tiene ni un curso publicado.**

| | |
|---|---|
| términos del glosario en la categoría `defi` | **11** |
| artículos del blog | **2** (`defi-para-principiantes`, `staking-criptomonedas-guia`) |
| cursos publicados sobre DeFi | **0** |

### Qué consecuencia tiene hoy

Siete de esos once términos —`defi`, `amm`, `dex`, `liquidity-pool`,
`yield-farming`, `impermanent-loss`, `tvl`— **no tienen ninguna lección que los
explique** en todo el catálogo. Su bloque del glosario dice «Relacionado con
este curso» y lleva a *Ethereum y contratos inteligentes*, que es lo más cercano
que hay, no una equivalencia.

Y el artículo `defi-para-principiantes` lleva un bloque final que dice, literal:
**«Todavía no tenemos un curso sobre DeFi»**. Es lo honesto, pero es una frase
que conviene no tener que escribir mucho tiempo.

### Lo que sí está cubierto

- **Staking** tiene el fondo resuelto: la lección `otras-formas-de-consenso` de
  *Blockchain: lo que Bitcoin no es* explica la prueba de participación, que es
  de donde sale la recompensa. Su artículo lo dice así, sin fingir que hay un
  curso de staking.
- **Contratos inteligentes, gas y las formas de perder fondos en un contrato**
  están en *Ethereum y contratos inteligentes*, que es la base técnica sobre la
  que se construye todo DeFi.

### Por dónde empezaría

Un curso de DeFi tiene ya escritos sus prerrequisitos (*Ethereum y contratos
inteligentes*) y su vocabulario (los 11 términos). Lo que falta es el contenido
de las lecciones: los seis o siete conceptos que hoy no tienen dónde explicarse.

---

## 2. Gobernanza descentralizada: 1 artículo, 0 cursos

`dao-organizaciones-descentralizadas` tampoco tiene curso del tema. Su bloque
final también lo dice de frente y lleva a *Qué es Web3 y qué no*, cuya lección
`como-mirar-un-proyecto` cubre la parte de criterio.

Menos urgente que DeFi: un artículo y tres términos (`dao`,
`governance-token`, más `ballena` de refilón), no once.

---

## 3. Treinta términos que el propio glosario da por existentes

Al validar el enlazado aparecieron **51 referencias** en `relatedTerms` que
apuntaban a términos **que no existen**. `getRelatedTerms()` las filtraba en
silencio, así que la sección «términos relacionados» venía saliendo más corta de
lo que sus autores creían, sin que nada avisara.

Las 51 referencias muertas se retiraron. Pero la lista de lo que falta es en sí
un plan de trabajo, ordenada por cuántas veces se la esperaba:

| término que falta | referencias |
|---|---:|
| `transaccion` | 6 |
| `ethereum` | 6 |
| `seguridad` | 5 |
| `validador`, `scam`, `liquidez`, `kyc`, `firma-digital`, `escalabilidad`, `comisiones` | 2 cada uno |
| `uniswap`, `trading`, `spread`, `slippage`, `segwit`, `rollup`, `riesgo`, `realidad-virtual`, `metamask`, `ledger`, `governance`, `fomo`, `escasez`, `erc-20`, `direccion`, `decentraland`, `dca`, `censura`, `arte-digital`, `apy` | 1 cada uno |

**`transaccion` y `ethereum` con seis referencias cada uno** son los dos que más
se echan en falta, y los dos son conceptos de primer nivel. `seguridad` con
cinco probablemente no deba ser un término sino una categoría, que ya existe.

---

## 4. Once términos sin lección que los explique

Además de los siete de DeFi:

- **`fork`, `hard-fork`, `soft-fork`**: ninguna lección entra en las
  bifurcaciones. Caben en *Blockchain: lo que Bitcoin no es*.
- **`metaverso`**: ninguna lección lo menciona. Es el único término del glosario
  al que no llega ningún enlace desde ningún artículo, porque **ningún artículo
  lo nombra**; hoy recibe enlace solo desde `nft`, `web3` y `token`.

---

## 5. Contexto: 10 cursos publicados de 15

Cinco están archivados: `bitcoin-como-sistema-monetario`,
`custodia-y-proteccion-de-tus-fondos`,
`custodia-y-proteccion-practica-de-criptomonedas`, `ecosistema-web3-explicado` y
`gestion-del-riesgo-y-mentalidad-en-trading`.

Importa para el enlazado porque **un curso archivado no se puede enlazar**:
`lib/enlazado/cursos-publicados.ts` solo contiene los publicados, y los tipos
impiden apuntar a los otros. Si alguno vuelve, hay que regenerar ese fichero:

```bash
npm run generar:cursos
```

---

## Cómo se comprueba todo esto

```bash
npx tsx scripts/validar-enlazado.ts
```

Corre también en cada build (hook `prebuild`) y **para el build** si algún
enlace interno apunta a algo que no existe.
