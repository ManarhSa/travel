<?php
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);
$index = isset($data['index']) ? intval($data['index']) : -1;
$day = isset($data['day']) ? intval($data['day']) : 0;

if ($index < 0 || $day <= 0) {
    echo json_encode(['success' => false, 'message' => 'بيانات غير صالحة']);
    exit;
}

$placesFile = __DIR__ . '/data/places.json';
$planFile = __DIR__ . '/data/plan.json';

// تأكد من وجود الملفين
if (!file_exists($placesFile) || !file_exists($planFile)) {
    echo json_encode(['success' => false, 'message' => 'ملف البيانات مفقود']);
    exit;
}

$places = json_decode(file_get_contents($placesFile), true);
$plans = json_decode(file_get_contents($planFile), true);

// تأكد أن المكان موجود
if (!isset($places[$index])) {
    echo json_encode(['success' => false, 'message' => 'المكان غير موجود']);
    exit;
}

// استخراج البيانات
$place = $places[$index];
$newEntry = [
    'day' => $day,
    'name' => $place['name'],
    'link' => $place['link'] ?? '',
    'note' => $place['note'] ?? '',         
    'rating' => $place['rating'] ?? 0,      
    'image' => $place['image'] ?? '',       
    'host' => $place['host'] ?? 'غير معروف',
    'timestamp' => time()
];

// إضافة للمخطط
$plans[] = $newEntry;

// حذف من places
array_splice($places, $index, 1);

// حفظ التحديثات
file_put_contents($placesFile, json_encode($places, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
file_put_contents($planFile, json_encode($plans, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

echo json_encode(['success' => true]);
