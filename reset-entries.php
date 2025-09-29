<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(403);
    exit("Access denied.");
}
$file = __DIR__ . "/data/entries.json";
file_put_contents($file, json_encode([], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
echo json_encode(["status" => "success"]);
?>
