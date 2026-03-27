<?php
// Vista de Usuarios - Cargada via AJAX
?>

<div class="container mt-4">
    <div class="card shadow border-0">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h3 class="mb-0">Gestión de Usuarios</h3>
            <button 
                type="button" 
                class="btn btn-light btn-sm fw-bold" 
                onclick="cargarModalCrearUsuario()">
                <i class="bi bi-person-plus-fill"></i> Nuevo Usuario
            </button>
        </div>

        <div class="card-body bg-light">
            <!-- Tabla de usuarios -->
            <div class="table-responsive">
                <table id="datos_usuarios" class="table table-bordered table-striped align-middle mb-0">
                    <thead class="table-info text-center">
                        <tr>
                            <th>Nombre</th>
                            <th>Correo / Login</th>
                            <th>Rol / Perfil</th>
                            <th>Proyecto Asignado</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Modal Usuarios -->
<div class="modal fade" id="modalUsuarios" tabindex="-1" aria-labelledby="modalUsuariosLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content border-0 shadow">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title" id="modalUsuariosLabel">Crear Usuario</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body bg-light">
                <form id="formUsuarios">
                    <input type="hidden" name="u_id" id="u_id">

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="u_nombre" class="form-label fw-bold">Nombre:</label>
                            <input type="text" name="u_nombre" id="u_nombre" class="form-control" required placeholder="Nombre">
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="u_apellido" class="form-label fw-bold">Apellido:</label>
                            <input type="text" name="u_apellido" id="u_apellido" class="form-control" placeholder="Apellido">
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="u_login" class="form-label fw-bold">Correo (Login):</label>
                            <input type="email" name="u_login" id="u_login" class="form-control" required placeholder="correo@ejemplo.com">
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="u_password" class="form-label fw-bold">Contraseña:</label>
                            <input type="password" name="u_password" id="u_password" class="form-control" placeholder="Dejar en blanco para no cambiar">
                            <small class="text-muted" id="passwordNote">Mínimo 6 caracteres.</small>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="codigo_perfil" class="form-label fw-bold">Rol / Perfil:</label>
                            <select name="codigo_perfil" id="codigo_perfil" class="form-select" required>
                                <option value="">Seleccione un rol</option>
                            </select>
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="id_proyecto" class="form-label fw-bold">Asignar Proyecto:</label>
                            <select name="id_proyecto" id="id_proyecto" class="form-select">
                                <option value="">Sin Proyecto (General)</option>
                            </select>
                        </div>
                    </div>

                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="u_activo" name="u_activo" checked>
                            <label class="form-check-label fw-bold" for="u_activo">Usuario Activo</label>
                        </div>
                    </div>
                </form>
            </div>

            <div class="modal-footer bg-light">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" id="btnGuardarUsuario" onclick="guardarUsuario()">Guardar Usuario</button>
            </div>
        </div>
    </div>
</div>

<script>
    if (typeof API_USUARIOS === 'undefined') {
        var API_USUARIOS = '/sgigescon/src/Usuarios/Interfaces/UsuarioController.php';
    }
</script>
