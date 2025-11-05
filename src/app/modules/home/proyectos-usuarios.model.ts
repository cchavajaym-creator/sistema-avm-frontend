import { Proyecto } from "../proyectos/models/proyecto.model"

export interface ProyectosUserDTO {
  usuarioId: number
  totalProyectos: number
  totalBeneficiarios: number
  proyectos: Proyecto[]
}
