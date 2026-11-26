// Asistente (IA): la conversación vive aquí y se manda completa en cada pregunta
import { api } from "./api";

export interface MensajeAsistente {
    role: "user" | "assistant";
    content: string;
    /** El asistente no tenía ese dato y la pregunta quedó anotada */
    anotada?: boolean;
}

export interface RespuestaAsistente {
    respuesta: string;
    consultas: { herramienta: string; argumentos: Record<string, unknown> }[];
    sin_respuesta: { pregunta: string; falta: string }[];
    tokens: number;
}

export interface PreguntaSinRespuesta {
    id: number;
    fecha: string;
    usuario: string | null;
    pregunta: string;
    falta: string;
}

export const preguntarAsistente = async (mensajes: MensajeAsistente[]) => {
    const { data } = await api.post<RespuestaAsistente>("/asistente/chat",
        { mensajes: mensajes.slice(-20).map(m => ({ role: m.role, content: m.content })) }, { timeout: 180000 });
    return data;
};

export const getPreguntasSinRespuesta = async () => {
    const { data } = await api.get<{ preguntas: PreguntaSinRespuesta[] }>("/asistente/sin-respuesta");
    return data.preguntas;
};

export const resolverPreguntaSinRespuesta = async (id: number) => {
    await api.post(`/asistente/sin-respuesta/${id}/resolver`);
};
