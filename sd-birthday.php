<?php
/**
 * Puente API mejorado para la base de datos MySQL (con captura de errores y Hosts dinámicos)
 */

header('Content-Type: application/json');

// Obligar a que MySQLi emita excepciones en caso de fallo crítico en lugar de silencios
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['user']) || !isset($data['pass'])) {
    http_response_code(400);
    echo json_encode(["error" => "Payload inválido o credenciales faltantes."]);
    exit;
}

$host = isset($data['host']) && !empty($data['host']) ? $data['host'] : '127.0.0.1';
$user = $data['user'];
$pass = $data['pass'];
$name = $data['name'];
$table = $data['table'];
$action = isset($data['action']) ? $data['action'] : 'all';

try {
    $conn = new mysqli($host, $user, $pass, $name);
    $conn->set_charset("utf8mb4");

    $safe_table = preg_replace('/[^a-zA-Z0-9_]/', '', $table);

    $base_query = "
        SELECT documentacion, nombreyapellidos, fecha_nacimiento, email, ambito
        FROM `$safe_table`
        WHERE 
            (ambito = 'COIICV' AND estado_coiicv = 'activo') OR
            (ambito = 'COITICV' AND estado_coiticv = 'activo') OR
            (ambito = 'SOMDIGITALS' AND estado_somdigitals = 'activo')
    ";

    if ($action === 'today') {
        $query = $base_query . "
            AND DAY(fecha_nacimiento) = DAY(CURDATE())
            AND MONTH(fecha_nacimiento) = MONTH(CURDATE())
        ";
    } else {
        $query = $base_query;
    }

    $result = $conn->query($query);
    
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    $conn->close();

    echo json_encode($rows);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Error (" . get_class($e) . ") del servidor PHP al procesar MySQL: " . $e->getMessage(),
        "db_host_usado" => $host
    ]);
    exit;
}
?>
