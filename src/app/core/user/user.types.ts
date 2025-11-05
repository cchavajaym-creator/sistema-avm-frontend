export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    status?: string;
}

export interface UsuarioLogueado {
    sub: number
    userId:number
    username: string
    rolId: number
    personaId: number
    estadoId: number
    iat: number
    exp: number
}
