document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(loginForm);
            const submitButton = loginForm.querySelector('button[type="submit"]');
            
            // Deshabilitar botón y mostrar loading
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Iniciando sesión...';
            
            // Enviar formulario con fetch
            fetch('/sgigesconnew/src/Auth/Interfaces/Controllers/AuthController.php', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Redirigir al dashboard
                    window.location.href = data.redirect;
                } else {
                    // Mostrar error
                    showError(data.message);
                    submitButton.disabled = false;
                    submitButton.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Iniciar Sesión';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Error de conexión. Por favor, intente nuevamente.');
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Iniciar Sesión';
            });
        });
    }
    
    function showError(message) {
        // Eliminar alertas anteriores
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        // Crear nueva alerta
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show';
        alertDiv.innerHTML = `
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insertar antes del formulario
        const loginForm = document.getElementById('loginForm');
        loginForm.parentNode.insertBefore(alertDiv, loginForm);
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
    
    // Validación en tiempo real
    const emailInput = document.getElementById('u_login');
    const passwordInput = document.getElementById('u_password');
    
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email && !emailRegex.test(email)) {
                this.classList.add('is-invalid');
                showFieldError(this, 'Por favor, ingrese un correo electrónico válido');
            } else {
                this.classList.remove('is-invalid');
                removeFieldError(this);
            }
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            
            if (password && password.length < 6) {
                this.classList.add('is-invalid');
                showFieldError(this, 'La contraseña debe tener al menos 6 caracteres');
            } else {
                this.classList.remove('is-invalid');
                removeFieldError(this);
            }
        });
    }
    
    function showFieldError(field, message) {
        removeFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        errorDiv.id = field.id + '-error';
        
        field.parentNode.appendChild(errorDiv);
    }
    
    function removeFieldError(field) {
        const errorDiv = document.getElementById(field.id + '-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
});
