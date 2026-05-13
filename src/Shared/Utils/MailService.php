<?php
namespace Src\Shared\Utils;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * Servicio para envío de correos electrónicos
 * Requiere instalar PHPMailer: composer require phpmailer/phpmailer
 */
class MailService {
    
    /**
     * Envía una notificación de orden de compra al proveedor
     */
    public static function enviarOrdenCompra($destinatario, $nombreProveedor, $numeroOrden, $productos, $total) {
        // Cargar configuración desde el entorno o dejar valores por defecto para completar
        $smtpHost = $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com';
        $smtpUser = $_ENV['SMTP_USER'] ?? ''; // EJ: tu-correo@gmail.com
        $smtpPass = $_ENV['SMTP_PASS'] ?? ''; // EJ: contraseña de aplicación de 16 dígitos
        $smtpPort = $_ENV['SMTP_PORT'] ?? 587;
        
        // Si no hay configuración mínima, abortamos silenciosamente registrando en el log
        if (empty($smtpUser) || empty($smtpPass)) {
            error_log("MAIL_SERVICE: Envío cancelado para OC $numeroOrden. Faltan credenciales SMTP en .env o MailService.php");
            return false;
        }

        // Verificar si PHPMailer está cargado
        if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
            error_log("MAIL_SERVICE: PHPMailer no está instalado. Ejecute 'composer require phpmailer/phpmailer'");
            return false;
        }

        $mail = new PHPMailer(true);

        try {
            // Configuración del servidor
            $mail->isSMTP();
            $mail->Host       = $smtpHost;
            $mail->SMTPAuth   = true;
            $mail->Username   = $smtpUser;
            $mail->Password   = $smtpPass;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = $smtpPort;
            $mail->CharSet    = 'UTF-8';

            // Destinatarios
            $mail->setFrom($smtpUser, 'Constructora - Gestión de Compras');
            $mail->addAddress($destinatario, $nombreProveedor);

            // Contenido
            $mail->isHTML(true);
            $mail->Subject = "ORDEN DE COMPRA: $numeroOrden";
            
            // Cuerpo del mensaje
            $body = "
            <div style='font-family: Arial, sans-serif; color: #333; max-width: 600px;'>
                <h2 style='color: #2c3e50;'>Nueva Orden de Compra</h2>
                <p>Estimado proveedor <b>$nombreProveedor</b>,</p>
                <p>Se ha generado formalmente la orden de compra <b>$numeroOrden</b>. A continuación los detalles:</p>
                
                <table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>
                    <thead>
                        <tr style='background-color: #f8f9fa;'>
                            <th style='border: 1px solid #dee2e6; padding: 8px; text-align: left;'>Descripción</th>
                            <th style='border: 1px solid #dee2e6; padding: 8px; text-align: center;'>Cant.</th>
                            <th style='border: 1px solid #dee2e6; padding: 8px; text-align: right;'>Vr. Unit</th>
                            <th style='border: 1px solid #dee2e6; padding: 8px; text-align: right;'>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>";
            
            foreach ($productos as $p) {
                $desc = htmlspecialchars($p['descripcion']);
                $cant = number_format($p['cantidad_comprar'], 2);
                $prec = number_format($p['precio_unitario'], 2);
                $subt = number_format($p['subtotal'], 2);
                
                $body .= "
                        <tr>
                            <td style='border: 1px solid #dee2e6; padding: 8px;'>$desc</td>
                            <td style='border: 1px solid #dee2e6; padding: 8px; text-align: center;'>$cant</td>
                            <td style='border: 1px solid #dee2e6; padding: 8px; text-align: right;'>$prec</td>
                            <td style='border: 1px solid #dee2e6; padding: 8px; text-align: right;'>$subt</td>
                        </tr>";
            }
            
            $body .= "
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan='3' style='border: 1px solid #dee2e6; padding: 8px; text-align: right;'><b>TOTAL</b></td>
                            <td style='border: 1px solid #dee2e6; padding: 8px; text-align: right; color: #27ae60;'><b>" . number_format($total, 2) . "</b></td>
                        </tr>
                    </tfoot>
                </table>
                
                <p>Por favor confirmar la recepción de este pedido y los tiempos de entrega.</p>
                <p style='color: #7f8c8d; font-size: 0.9em; margin-top: 30px;'>
                    Este es un correo automático, por favor no responder directamente a este mensaje.
                </p>
            </div>";

            $mail->Body = $body;
            $mail->AltBody = "Nueva Orden de Compra $numeroOrden para $nombreProveedor. Total: $total";

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("MAIL_SERVICE_ERROR: {$mail->ErrorInfo}");
            return false;
        }
    }
}
