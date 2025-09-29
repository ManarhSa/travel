<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(403);
    exit("Access denied.");
}

// استقبال البيانات كـ JSON
$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !is_array($data)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "بيانات غير صالحة"]);
    exit;
}

// حفظ الملف
file_put_contents(__DIR__ . "/data/users.json", json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

echo json_encode(["status" => "success"]);
