// utils/auth.ts

export interface User {
  id: number;
  nombre: string;
  email: string;
  roles: string[];        // 👈 Agregar roles
  permissions: string[];  // 👈 Agregar permissions
  // Sin «caja.elegir_caja» (meseros) se trabaja solo en la caja asignada por el administrador
  elige_caja?: boolean;
  caja_id?: number | null;
  caja_nombre?: string | null;
}

export interface AuthData {
  token: string;
  tokenType: string;
  user: User;
}

export const getAuth = (): AuthData | null => {
  const raw = localStorage.getItem("auth");
  return raw ? JSON.parse(raw) as AuthData : null;
};

export const setAuth = (
    token: string,
    tokenType: string,
    user: User
): void => {
  localStorage.setItem(
      "auth",
      JSON.stringify({
        token,
        tokenType,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          roles: user.roles,           // 👈 Guardar roles
          permissions: user.permissions // 👈 Guardar permissions
        }
      })
  );

  // También guardar el token por separado (para mantener compatibilidad)
  localStorage.setItem("token", token);
};

export const clearAuth = (): void => {
  localStorage.removeItem("auth");
  localStorage.removeItem("token"); // 👈 Limpiar también el token
};

// Funciones auxiliares
export const getToken = (): string | null => {
  const auth = getAuth();
  return auth?.token ?? null;
};

export const getUser = (): User | null => {
  const auth = getAuth();
  return auth?.user ?? null;
};

// 👇 Nueva función para obtener permisos
export const getUserPermissions = (): string[] => {
  const user = getUser();
  return user?.permissions ?? [];
};

// 👇 Nueva función para obtener roles
export const getUserRoles = (): string[] => {
  const user = getUser();
  return user?.roles ?? [];
};