// TEMPORAL (pruebas): borra ventas, turnos, compras, gastos, producción, kárdex y auditoría.
// El servidor solo lo permite con APP_ENV=local y para el admin. Quitar antes de producción:
// este archivo, su uso en UnidadMedida.tsx y la ruta /admin/temporal/borrar-ventas de la API.
import { useState } from "react";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { mensajeError } from "../../utils/formato";

export default function BorrarVentasTemporal() {
    const { hasRole } = useAuth();
    const [borrando, setBorrando] = useState(false);

    if (!hasRole("admin")) return null;

    const borrar = async () => {
        if (!window.confirm("Se borrarán TODAS las ventas, turnos de caja, mesas, compras, gastos, producción, mermas, kárdex y auditoría. Las existencias quedan en 0. Se conservan productos, recetas, usuarios, clientes y proveedores. ¿Continuar?")) return;
        if (window.prompt('Para confirmar escribe BORRAR') !== "BORRAR") {
            toast("No se borró nada");
            return;
        }

        setBorrando(true);
        try {
            const { data } = await api.post("/admin/temporal/borrar-ventas");
            toast.success(data.message ?? "Ventas borradas");
        } catch (error) {
            toast.error(mensajeError(error, "No se pudieron borrar las ventas"));
        } finally {
            setBorrando(false);
        }
    };

    return (
        <button
            type="button"
            onClick={borrar}
            disabled={borrando}
            className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
        >
            {borrando ? "Borrando..." : "Borrar Ventas"}
        </button>
    );
}
