<?php
header('Content-Type: application/json');

$index = isset($_POST['index']) ? intval($_POST['index']) : -1;
if ($index < 0) {
    echo json_encode(['success' => false, 'message' => 'رقم غير صالح']);
    exit;
}

$filename = __DIR__ . '/data/places.json';

// تأكد أن الملف موجود
if (!file_exists($filename)) {
    echo json_encode(['success' => false, 'message' => 'الملف غير موجود']);
    exit;
}

$places = json_decode(file_get_contents($filename), true);

// تأكد أن الفهرس موجود
if (!isset($places[$index])) {
    echo json_encode(['success' => false, 'message' => 'العنصر غير موجود']);
    exit;
}

// حذف العنصر
array_splice($places, $index, 1);

// حفظ التحديث
file_put_contents($filename, json_encode($places, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

echo json_encode(['success' => true]);
