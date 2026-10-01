# -*- coding: utf-8 -*-
"""
Valida los bloques PL/pgSQL de una migracion sin tener que aplicarla.

    pip install pglast
    python scripts/validar-plpgsql.py supabase/migrations/117_la_copia_publicada.sql

HACE DOS COSAS, Y LA SEGUNDA ES LA QUE MAS FALTA HACIA
  1. SINTAXIS. Pasa cada cuerpo PL/pgSQL por el parser de verdad de Postgres
     (libpg_query, via pglast). Lo que el parser acepta aqui, Postgres lo acepta.

  2. CHOQUE DE NOMBRES. Una variable de un bloque PL/pgSQL que se llame igual que un
     alias de tabla gana la partida: `c.status` se resuelve contra la VARIABLE, no
     contra la tabla, y sale «record "c" has no field "status"» en ejecucion, no al
     crear la funcion. El parser no lo ve. Asi que se comprueba la regla:

         toda variable declarada empieza por v_, r_ o p_

     Ningun alias de tabla de este proyecto empieza asi, de modo que la regla hace el
     choque imposible en vez de pedir que nos acordemos. Las columnas que declara un
     `RETURNS TABLE (...)` son la excepcion —son los nombres de las columnas que
     devuelve la funcion y no se pueden prefijar—, asi que se listan aparte para
     revisarlas a mano: esas solo deben usarse sin cualificar.

La motivo un fallo real: la 117 declaraba `c record` en su autoprueba y mas abajo
usaba `FROM public.courses c`. La migracion se creo sin una queja y revento al
ejecutarse.
"""
import io
import re
import sys

try:
    import pglast
except ImportError:
    print("Falta pglast. Instalalo con:  pip install pglast")
    sys.exit(2)

PERMITIDO = re.compile(r"^(v_|r_|p_)")


def bloques(texto):
    """Cada cuerpo PL/pgSQL del fichero, con su etiqueta y la linea donde empieza.

    SOLO PL/pgSQL. Un $tag$...$tag$ puede ser tres cosas distintas en estas
    migraciones: el cuerpo de una funcion plpgsql, el cuerpo de una funcion
    `LANGUAGE sql`, o simplemente TEXTO —el contenido HTML de una leccion, por
    ejemplo—. Pasar los dos ultimos por el parser de plpgsql da errores que no
    existen, y un validador que se equivoca cincuenta veces no lo mira nadie. Asi que
    se mira lo que hay justo antes de la apertura:

      · `DO $tag$`                     -> bloque anonimo, es plpgsql
      · `LANGUAGE plpgsql ... AS $tag$` -> cuerpo de funcion plpgsql

    Cualquier otra cosa se deja en paz.
    """
    for m in re.finditer(r"\$([a-zA-Z_][a-zA-Z0-9_]*)\$(.*?)\$\1\$", texto, re.S):
        etiqueta, cuerpo = m.group(1), m.group(2)
        linea = texto[: m.start()].count("\n") + 1
        antes = texto[max(0, m.start() - 600) : m.start()]

        es_do = re.search(r"\bDO\s*$", antes, re.I) is not None
        # `LANGUAGE plpgsql` tiene que ser lo ultimo que se declaro antes del AS
        lenguajes = re.findall(r"\bLANGUAGE\s+(\w+)", antes, re.I)
        es_funcion = (
            bool(lenguajes)
            and lenguajes[-1].lower() == "plpgsql"
            and re.search(r"\bAS\s*$", antes, re.I) is not None
        )

        if not es_do and not es_funcion:
            continue

        nombre = "DO"
        f = re.findall(r"CREATE(?:\s+OR\s+REPLACE)?\s+FUNCTION\s+([\w.]+)\s*\(", antes)
        if f and es_funcion:
            nombre = f[-1]
        yield etiqueta, cuerpo, linea, nombre


def declaradas(cuerpo):
    """Los nombres declarados entre DECLARE y el primer BEGIN."""
    m = re.search(r"\bDECLARE\b(.*?)\bBEGIN\b", cuerpo, re.S | re.I)
    if not m:
        return []
    nombres = []
    for linea in m.group(1).split("\n"):
        linea = re.sub(r"--.*$", "", linea).strip()
        if not linea:
            continue
        d = re.match(r"([a-zA-Z_][a-zA-Z0-9_]*)\s+", linea)
        if d:
            nombres.append(d.group(1))
    return nombres


def clausula_returns(texto, inicio):
    """El RETURNS real de la funcion que precede al cuerpo.

    Hace falta para envolverlo igual que esta: con RETURNS void, un RETURN QUERY o un
    RETURN NEXT legitimos se rechazan, y eso seria un falso positivo que acabaria
    ensenando a no hacer caso del validador.
    """
    antes = texto[max(0, inicio - 800) : inicio]
    m = re.findall(
        r"RETURNS\s+(TABLE\s*\(.*?\)|trigger|void|\w+(?:\[\])?)\s*LANGUAGE",
        antes, re.S | re.I,
    )
    return m[-1] if m else "void"


def columnas_de_returns_table(texto, inicio):
    """Las columnas del RETURNS TABLE que precede a un cuerpo, si lo hay."""
    antes = texto[max(0, inicio - 600) : inicio]
    m = re.findall(r"RETURNS TABLE\s*\((.*?)\)\s*LANGUAGE", antes, re.S | re.I)
    if not m:
        return []
    return re.findall(r"([a-zA-Z_][a-zA-Z0-9_]*)\s+\w+", m[-1])


def alias_usados(cuerpo):
    """Alias de tabla del cuerpo: FROM x y / JOIN x y / UPDATE x y."""
    al = set()
    for m in re.finditer(
        r"\b(?:FROM|JOIN|UPDATE)\s+([\w.]+)\s+(?:AS\s+)?([a-zA-Z_][a-zA-Z0-9_]*)",
        cuerpo, re.I,
    ):
        candidato = m.group(2)
        if candidato.upper() in {
            "SET", "WHERE", "ON", "USING", "GROUP", "ORDER", "LIMIT", "INTO",
            "VALUES", "SELECT", "AND", "OR", "LOOP", "THEN", "IN", "IS", "NOT",
            "LEFT", "RIGHT", "INNER", "OUTER", "JOIN", "WITH", "RETURNING",
        }:
            continue
        al.add(candidato)
    return al


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)

    fallos = 0
    for ruta in sys.argv[1:]:
        texto = io.open(ruta, encoding="utf-8").read()
        print(f"\n=== {ruta}  ({texto.count(chr(10))} lineas) ===")

        total = 0
        for etiqueta, cuerpo, linea, nombre in bloques(texto):
            total += 1
            donde = f"{nombre} (${etiqueta}$, linea {linea})"

            # ── 1. Sintaxis, con el parser de PL/pgSQL de Postgres ───────────
            # Se envuelve en una funcion: es lo que espera el parser, y vale igual
            # para el cuerpo de un DO.
            devuelve = clausula_returns(texto, texto.find(cuerpo)) if nombre != "DO" else "void"
            cuerpo_a_validar = cuerpo
            nota = ""

            # pglast v8.4 NO sabe parsear un cuerpo de trigger: revienta con un
            # JSONDecodeError incluso con `BEGIN RETURN NULL; END`. Comprobado con un
            # caso minimo, asi que es cosa suya y no del SQL. Para no dejar el bloque
            # sin revisar, se valida como void quitandole el valor a los RETURN: se
            # comprueba todo lo demas, que es donde estan los errores de verdad.
            if devuelve.strip().lower() == "trigger":
                devuelve = "void"
                cuerpo_a_validar = re.sub(r"\bRETURN\s+(NEW|OLD|NULL)\s*;", "RETURN;",
                                          cuerpo, flags=re.I)
                nota = "  (como void: pglast no parsea cuerpos de trigger)"

            try:
                pglast.parse_plpgsql(
                    f"CREATE FUNCTION pg_temp.validando() RETURNS {devuelve} LANGUAGE plpgsql AS "
                    f"${etiqueta}${cuerpo_a_validar}${etiqueta}$;"
                )
                estado = "sintaxis OK" + nota
            except Exception as e:  # noqa: BLE001
                detalle = str(e).splitlines()[0]
                # Al validar un cuerpo de trigger como void, NEW, OLD y TG_OP dejan de
                # existir. Eso no es un fallo del SQL: es el limite de la envoltura.
                if nota and ("new." in detalle or "old." in detalle or "tg_op" in detalle.lower()):
                    estado = "no validado (cuerpo de trigger: pglast no los parsea)"
                else:
                    estado = f"*** SINTAXIS: {detalle[:90]}"
                    fallos += 1

            # ── 2. El choque de nombres ──────────────────────────────────────
            vars_ = declaradas(cuerpo)
            salida = columnas_de_returns_table(texto, texto.find(cuerpo))
            alias = alias_usados(cuerpo)

            malas = [v for v in vars_ if not PERMITIDO.match(v) and v not in salida]
            choques = [v for v in vars_ if v in alias]

            print(f"   {donde}")
            print(f"      {estado}   variables: {len(vars_)}   alias: {len(alias)}")
            if salida:
                print(f"      columnas de RETURNS TABLE (revisar a mano, sin cualificar): {', '.join(salida)}")
            if malas:
                fallos += 1
                print(f"      *** variables sin prefijo v_/r_/p_: {', '.join(malas)}")
            if choques:
                fallos += 1
                print(f"      *** CHOCAN con un alias de tabla del mismo bloque: {', '.join(choques)}")

        print(f"\n   {total} bloques PL/pgSQL revisados")

    print("\n" + ("   TODO CORRECTO\n" if fallos == 0 else f"   {fallos} problemas\n"))
    sys.exit(0 if fallos == 0 else 1)


if __name__ == "__main__":
    main()
