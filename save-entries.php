<?php
// استقبال البيانات كـ JSON
$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "بيانات غير صالحة"]);
    exit;
}

file_put_contents(__DIR__ . "/data/entries.json", json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

echo json_encode(["status" => "success"]);
?>
