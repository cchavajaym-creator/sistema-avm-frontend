export class AgregarUsuarioDTO {
  primerNombre: string;
  segundoNombre?: string;
  tercerNombre?: string | null;
  primerApellido: string;
  segundoApellido?: string | null;
  telefono?: string | null;
  genero: string; // 'M' | 'F' | 'O'
  correoElectronico: string;
  contrasena: string;
  rolId: number;
}
