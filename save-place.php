<?php
header('Content-Type: application/json');

// استقبال البيانات من الطلب
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['name']) || !$data['name']) {
    echo json_encode(['success' => false, 'message' => 'بيانات غير صالحة']);
    exit;
}

$filename = __DIR__ . '/data/places.json';

// إنشاء الملف إذا ما كان موجود
if (!file_exists($filename)) {
    file_put_contents($filename, '[]');
}

// قراءة البيانات الحالية
$existing = json_decode(file_get_contents($filename), true);

// إضافة المضيف (من localStorage)
$data['host'] = $data['host'] ?? 'غير معروف';
$data['city'] = $data['city'] ?? '';
$data['note'] = $data['note'] ?? '';
$data['rating'] = intval($data['rating'] ?? 0);
$data['image'] = $data['image'] ?? '';
$data['timestamp'] = time();

$existing[] = $data;

// حفظ البيانات
file_put_contents($filename, json_encode($existing, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

echo json_encode(['success' => true]);
