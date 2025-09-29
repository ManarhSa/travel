<?php
// استقبال البيانات من JavaScript
$data = json_decode(file_get_contents("php://input"), true);

// التحقق من صحة البيانات
if (!is_array($data)) {
    http_response_code(400);
    echo "البيانات غير صالحة";
    exit;
}

// حفظ البيانات داخل مجلد data/plan.json
file_put_contents(__DIR__ . "/data/plan.json", json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// تأكيد النجاح
echo "تم الحفظ";
