import { Fragment, ReactNode, useEffect, useRef, useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import { getPreguntasSinRespuesta, MensajeAsistente, PreguntaSinRespuesta, preguntarAsistente, resolverPreguntaSinRespuesta } from "../../services/asistente";
import { fechaHora, mensajeError } from "../../utils/formato";

const SUGERENCIAS = [
    "¿Cómo van las ventas de esta semana comparadas con la anterior?",
    "¿Cuál fue la utilidad estimada de este mes y qué la afecta más?",
    "¿Qué productos tienen más mermas y cuánto dinero se perdió?",
    "¿A qué horas vendemos más y menos?",
    "¿Qué productos e insumos están bajo el mínimo?",
    "¿Hubo diferencias en los cierres de caja este mes?",
];

// **negrita** dentro de una línea
const enLinea = (texto: string): ReactNode[] =>
    texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
        parte.startsWith("**") && parte.endsWith("**") ? <strong key={i}>{parte.slice(2, -2)}</strong> : <Fragment key={i}>{parte}</Fragment>);

function TextoRespuesta({ texto }: { texto: string }) {
    return (
        <div className="space-y-1">
            {texto.split("\n").map((linea, i) => {
                const vineta = linea.match(/^\s*[-*•]\s+(.*)$/);
                if (vineta) return <div key={i} className="flex gap-2 pl-1"><span>•</span><span>{enLinea(vineta[1])}</span></div>;
                if (!linea.trim()) return <div key={i} className="h-2" />;
                return <p key={i}>{enLinea(linea.replace(/^#+\s*/, ""))}</p>;
            })}
        </div>
    );
}

// Preguntas que el asistente no pudo contestar: lo que falta agregarle
function SinRespuesta({ onCerrar }: { onCerrar: () => void }) {
    const [preguntas, setPreguntas] = useState<PreguntaSinRespuesta[] | null>(null);
    const [error, setError] = useState("");
    const [resolviendo, setResolviendo] = useState<number | null>(null);

    const resolver = async (id: number) => {
        setResolviendo(id);
        setError("");
        try {
            await resolverPreguntaSinRespuesta(id);
            setPreguntas(lista => lista?.filter(p => p.id !== id) ?? null);
        } catch (err) {
            setError(mensajeError(err, "No se pudo marcar como resuelta"));
        } finally {
            setResolviendo(null);
        }
    };

    useEffect(() => {
        getPreguntasSinRespuesta().then(setPreguntas).catch(err => setError(mensajeError(err, "No se pudieron cargar")));
    }, []);

    return (
        <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm text-gray-500">Preguntas que el asistente no pudo responder porque todavía no tiene esa consulta. Sirven para decidir qué agregarle.</p>
                <button type="button" onClick={onCerrar} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Volver al chat</button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!preguntas && !error && <p className="text-sm text-gray-500">Cargando…</p>}
            {preguntas?.length === 0 && <p className="py-6 text-center text-sm text-gray-500">No hay preguntas pendientes.</p>}
            {!!preguntas?.length && (
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-700">
                        <tr><th className="py-2 pr-3">Fecha</th><th className="py-2 pr-3">Usuario</th><th className="py-2 pr-3">Pregunta</th><th className="py-2 pr-3">Qué falta</th><th className="py-2" /></tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-gray-300">
                        {preguntas.map(p => (
                            <tr key={p.id} className="border-b border-gray-100 align-top dark:border-gray-800">
                                <td className="whitespace-nowrap py-2 pr-3">{fechaHora(p.fecha)}</td>
                                <td className="py-2 pr-3">{p.usuario ?? "—"}</td>
                                <td className="py-2 pr-3">{p.pregunta}</td>
                                <td className="py-2 pr-3 text-gray-500">{p.falta}</td>
                                <td className="py-2 text-right">
                                    <button type="button" onClick={() => resolver(p.id)} disabled={resolviendo !== null}
                                        className="whitespace-nowrap rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
                                        {resolviendo === p.id ? "Marcando…" : "Marcar como resuelta"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// Asistente: preguntas en lenguaje normal sobre ventas, utilidad, mermas, gastos...
// La IA solo lee los reportes del sistema a través de la API.
export default function Asistente() {
    const [mensajes, setMensajes] = useState<MensajeAsistente[]>([]);
    const [texto, setTexto] = useState("");
    const [pensando, setPensando] = useState(false);
    const [error, setError] = useState("");
    const [verSinRespuesta, setVerSinRespuesta] = useState(false);
    const fin = useRef<HTMLDivElement>(null);

    useEffect(() => { fin.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes, pensando]);

    const enviar = async (pregunta: string) => {
        const limpia = pregunta.trim();
        if (!limpia || pensando) return;
        const nuevos: MensajeAsistente[] = [...mensajes, { role: "user", content: limpia }];
        setMensajes(nuevos);
        setTexto("");
        setError("");
        setPensando(true);
        try {
            const r = await preguntarAsistente(nuevos);
            setMensajes([...nuevos, { role: "assistant", content: r.respuesta, anotada: r.sin_respuesta.length > 0 }]);
        } catch (err) {
            setError(mensajeError(err, "El asistente no respondió"));
            setMensajes(mensajes);   // se quita la pregunta para poder reenviarla
            setTexto(limpia);
        } finally {
            setPensando(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-80px)] flex-col p-6">
            <PageHeader title="Asistente" subtitle="Pregunta sobre ventas, utilidad, mermas, gastos, caja e inventario"
                actions={!verSinRespuesta && (
                    <>
                        <button type="button" onClick={() => setVerSinRespuesta(true)}
                            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
                            Preguntas sin respuesta
                        </button>
                        {mensajes.length > 0 && (
                            <button type="button" onClick={() => { setMensajes([]); setError(""); }} disabled={pensando}
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50">
                                Nueva conversación
                            </button>
                        )}
                    </>
                )} />

            {verSinRespuesta ? <SinRespuesta onCerrar={() => setVerSinRespuesta(false)} /> : <>

            <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                {mensajes.length === 0 && (
                    <div className="mx-auto max-w-2xl py-6 text-center">
                        <p className="mb-1 text-gray-700 dark:text-gray-300">Pregunta lo que quieras saber del negocio.</p>
                        <p className="mb-5 text-sm text-gray-500">El asistente solo consulta los reportes del sistema; no puede cambiar nada.</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {SUGERENCIAS.map(s => (
                                <button key={s} type="button" onClick={() => enviar(s)}
                                    className="rounded-lg border border-gray-200 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {mensajes.map((m, i) => (
                        <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user"
                                ? "bg-blue-600 text-white whitespace-pre-wrap"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"}`}>
                                {m.role === "user" ? m.content : <TextoRespuesta texto={m.content} />}
                                {m.anotada && (
                                    <p className="mt-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                                        Anotada en «Preguntas sin respuesta»
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                    {pensando && (
                        <div className="flex justify-start">
                            <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-500 dark:bg-gray-800">Revisando los reportes…</div>
                        </div>
                    )}
                    <div ref={fin} />
                </div>
            </div>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); enviar(texto); }}>
                <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={2} maxLength={2000}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(texto); } }}
                    placeholder="Ej.: ¿Cuánto vendimos ayer y qué fue lo más vendido?"
                    className="flex-1 resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
                <button type="submit" disabled={pensando || !texto.trim()}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                    Preguntar
                </button>
            </form>
            </>}
        </div>
    );
}
