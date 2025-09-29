<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(403);
    exit("Access denied.");
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data["config"])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "بيانات غير صالحة"]);
    exit;
}

// استخراج العنوان (title) وحفظه
$title = $data["title"] ?? "جنوب أفريقيا";
file_put_contents(__DIR__ . "/data/title.txt", $title);

// استخراج config من داخل الكائن
$config = $data["config"];

// حفظ الملف config.json
file_put_contents(__DIR__ . "/data/config.json", json_encode($config, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

echo json_encode(["status" => "success"]);
