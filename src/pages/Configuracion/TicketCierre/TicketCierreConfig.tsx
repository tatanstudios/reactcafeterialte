import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import LoadingModal from "../../../components/Loading/LoadingModal";
import PageHeader from "../../../components/common/PageHeader";
import { actualizarTicketCierre, getTicketCierre, type SeccionesCierre } from "../../../services/configuracion";
import { mensajeError } from "../../../utils/formato";

// Orden en que salen en el ticket, agrupadas como se leen en papel
const GRUPOS: { titulo: string; claves: string[] }[] = [
    { titulo: "Cuánto se vendió", claves: ["total_vendido", "movimientos", "por_metodo", "ventas_por_usuario"] },
    { titulo: "Detalle del turno", claves: ["gastos", "entradas", "productos"] },
    { titulo: "Cuadre de la caja", claves: ["efectivo", "conteo", "observaciones"] },
    { titulo: "Final del ticket", claves: ["por_comprar", "firmas"] },
];

// Ejemplo corto de lo que imprime cada sección
const EJEMPLOS: Record<string, string> = {
    total_vendido: "TOTAL VENDIDO $245.50 · Ventas realizadas 87",
    movimientos: "Fondo inicial, Ventas, Ingresos, Egresos",
    por_metodo: "Efectivo $180.00 · Tarjeta $65.50",
    ventas_por_usuario: "Ana (40) $120.00 · Luis (47) $125.50",
    gastos: "08:15 Verdulería · tomates $12.00",
    entradas: "Abono de Juan Pérez $10.00",
    productos: "120 x Pan francés $18.00",
    efectivo: "Debe haber en caja $203.50 · Contado · Faltante/Sobrante",
    conteo: "3 x $20.00 = $60.00",
    observaciones: "Obs.: lo que escribió quien cerró",
    por_comprar: "Concha · hay 0 u / mín 20",
    firmas: "Líneas para firma de Cajero y Supervisor",
};

export default function TicketCierreConfig() {
    const [valores, setValores] = useState<SeccionesCierre>({});
    const [nombres, setNombres] = useState<Record<string, string>>({});
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState<string | null>(null);

    useEffect(() => {
        getTicketCierre()
            .then((r) => { setValores(r.data); setNombres(r.secciones); })
            .catch((e) => toast.error(mensajeError(e, "No se pudo cargar la configuración")))
            .finally(() => setCargando(false));
    }, []);

    // Cada interruptor se guarda al tocarlo
    const cambiar = async (clave: string, valor: boolean) => {
        const antes = valores;
        setValores({ ...valores, [clave]: valor });
        setGuardando(clave);
        try {
            const r = await actualizarTicketCierre({ [clave]: valor });
            setValores(r.data);
            toast.success(valor ? "Se imprimirá en el cierre" : "Ya no se imprimirá");
        } catch (e) {
            setValores(antes);
            toast.error(mensajeError(e, "No se pudo guardar"));
        } finally {
            setGuardando(null);
        }
    };

    const encendidas = Object.values(valores).filter(Boolean).length;

    return (
        <>
            <LoadingModal isOpen={cargando} text="Cargando..." />
            <div className="p-6">
                <PageHeader
                    title="Ticket de cierre de turno"
                    subtitle="Elige qué imprime el ticket al cerrar el turno. Solo el administrador ve esta pantalla."
                />

                <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                    Los cambios se guardan solos y aplican al siguiente ticket que se imprima (también al reimprimir cierres anteriores).
                    La pantalla de cierre de caja sigue mostrando todo. {!cargando && <b>Se imprimen {encendidas} de {Object.keys(valores).length} secciones.</b>}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {GRUPOS.map((g) => (
                        <div key={g.titulo} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-800">{g.titulo}</h2>
                            <div className="space-y-3">
                                {g.claves.filter((c) => c in valores).map((c) => (
                                    <label key={c} className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50">
                                        <span>
                                            <span className="block text-sm font-medium text-gray-800">{nombres[c] ?? c}</span>
                                            <span className="block font-mono text-xs text-gray-500">{EJEMPLOS[c]}</span>
                                        </span>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={valores[c]}
                                            aria-label={nombres[c] ?? c}
                                            disabled={guardando !== null}
                                            onClick={() => cambiar(c, !valores[c])}
                                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-60 ${valores[c] ? "bg-blue-600" : "bg-gray-300"}`}
                                        >
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${valores[c] ? "translate-x-5" : "translate-x-0.5"}`} />
                                        </button>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
