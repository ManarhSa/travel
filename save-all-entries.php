<?php
$dataFile = __DIR__ . '/data/entries.json';
$raw = file_get_contents("php://input");
$entries = json_decode($raw, true);

if (!is_array($entries)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'بيانات غير صالحة']);
    exit;
}

file_put_contents($dataFile, json_encode($entries, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
echo json_encode(['status' => 'success']);
