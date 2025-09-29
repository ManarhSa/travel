<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(403);
    exit("Access denied.");
}

$dataFile = __DIR__ . '/data/entries.json';

// تحقق من الحقول الأساسية
if (empty($_POST['payer']) || empty($_POST['amount']) || empty($_POST['category'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'الرجاء تعبئة جميع الحقول المطلوبة']);
    exit;
}

if (!is_numeric($_POST['amount'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'المبلغ غير صالح']);
    exit;
}

// قراءة الملف
$entries = file_exists($dataFile) ? json_decode(file_get_contents($dataFile), true) : [];

// إنشاء الإدخال الجديد
$newEntry = [
    'payer' => trim($_POST['payer']),
    'amount' => floatval($_POST['amount']),
    'currency' => $_POST['currency'] ?? 'sar',
    'category' => trim($_POST['category']),
    'notes' => trim($_POST['notes'] ?? ''),
    'host' => trim($_POST['host'] ?? ''), // ✅ اسم المستخدم الحالي
    'timestamp' => date('Y-m-d H:i:s')
];

// إضافة الإدخال
$entries[] = $newEntry;

// حفظ الملف
file_put_contents($dataFile, json_encode($entries, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

// رد
echo json_encode(['status' => 'success']);
?>
