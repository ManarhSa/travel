<?php
header('Content-Type: application/json');

$planFile = 'data/plan.json';
$successPlan = false;

if (file_exists($planFile)) {
    file_put_contents($planFile, json_encode([]));
    $successPlan = true;
}

$imageDir = __DIR__ . '/images';
$deletedImages = 0;

if (is_dir($imageDir)) {
    $files = scandir($imageDir);
    foreach ($files as $file) {
        if (preg_match('/^(thumb_)?plan_/', $file)) {
            $fullPath = $imageDir . '/' . $file;
            if (is_file($fullPath)) {
                unlink($fullPath);
                $deletedImages++;
            }
        }
    }
}

if ($successPlan) {
    echo json_encode(['success' => true, 'deleted_images' => $deletedImages]);
} else {
    echo json_encode(['success' => false, 'error' => 'فشل في حذف بيانات المخطط']);
}
