// Servicios nuevos: el token lo agrega el interceptor de api.ts

import { api } from "./api";
import { ConfiguracionFelFormInterface, ConfiguracionFelInterface, ConfiguracionNegocioInterface, FelCatalogos } from "../types/interfaces";

// ************************  SECCION - CONFIGURACIÓN DEL NEGOCIO  ******************

export const getConfiguracionNegocio = async (): Promise<ConfiguracionNegocioInterface> => {
    const { data } = await api.get("/configuracion/negocio");
    return data.data;
};

export const actualizarConfiguracionNegocio = async (formData: FormData) => {
    const { data } = await api.post("/configuracion/negocio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data as { success: number; message: string; data: ConfiguracionNegocioInterface };
};

// ************************  SECCION - TICKET DE CIERRE (solo admin)  ******************

/** clave de sección → si se imprime */
export type SeccionesCierre = Record<string, boolean>;

export const getTicketCierre = async () => {
    const { data } = await api.get("/configuracion/ticket-cierre");
    return data as { data: SeccionesCierre; secciones: Record<string, string> };
};

export const actualizarTicketCierre = async (payload: SeccionesCierre) => {
    const { data } = await api.put("/configuracion/ticket-cierre", payload);
    return data as { success: number; message: string; data: SeccionesCierre };
};

// ************************  SECCION - FACTURACIÓN ELECTRÓNICA  ******************

export const getConfiguracionFel = async () => {
    const { data } = await api.get("/configuracion/fel");
    return data as { data: ConfiguracionFelInterface; catalogos: FelCatalogos };
};

export const actualizarConfiguracionFel = async (payload: ConfiguracionFelFormInterface) => {
    const { data } = await api.put("/configuracion/fel", payload);
    return data as { success: number; message: string; data: ConfiguracionFelInterface };
};

export const probarConexionFel = async () => {
    const { data } = await api.post("/configuracion/fel/probar");
    return data as { success: number; message: string; data: ConfiguracionFelInterface };
};
