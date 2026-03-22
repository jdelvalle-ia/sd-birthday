<?php
/**
 * Puente API para extraer datos de la base de datos de manera segura.
 * Esquiva las restricciones de firewall en el puerto 3306.
 */

header('Content-Type: application/json');

// Leer datos enviados desde el agente en GitHub Actions
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['user']) || !isset($data['pass'])) {
    http_response_code(400);
    echo json_encode(["error" => "Payload inválido o credenciales faltantes."]);
    exit;
}

// Variables de conexión. Usualmente en Piensa Solutions es "localhost", aunque envíen otra cosa.
$host = 'localhost'; 
$user = $data['user'];
$pass = $data['pass'];
$name = $data['name'];
$table = $data['table'];
$action = isset($data['action']) ? $data['action'] : 'all';

// Conectar a MySQL vía conector local nativo de PHP
$conn = new mysqli($host, $user, $pass, $name);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión en el servidor web a la DB."]);
    exit;
}

$conn->set_charset("utf8mb4");

// Evitar inyecciones SQL en nombre de tablas invalidos
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

if (!$result) {
    http_response_code(500);
    echo json_encode(["error" => "Error en la consulta SQL."]);
    exit;
}

$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

$conn->close();

// Devolver la respuesta al agente en Github en formato JSON
echo json_encode($rows);
?>
