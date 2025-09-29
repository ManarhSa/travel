<?php
$uploadDir = __DIR__ . "/images/";
$response = ["status" => "error", "message" => ""];

function isValidImageSize($fileTmp) {
    $size = getimagesize($fileTmp);
    if (!$size) return false;
    return $size[0] <= 512 && $size[1] <= 512; // width and height ≤ 512
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $errors = [];

    if (isset($_FILES['sar']) && $_FILES['sar']['error'] === UPLOAD_ERR_OK) {
        if (!isValidImageSize($_FILES['sar']['tmp_name'])) {
            $errors[] = "صورة العملة الرئيسية (ريال) يجب ألا تتجاوز 512×512 بكسل.";
        } else {
            move_uploaded_file($_FILES['sar']['tmp_name'], $uploadDir . "sar.png");
        }
    }

    if (isset($_FILES['zar']) && $_FILES['zar']['error'] === UPLOAD_ERR_OK) {
        if (!isValidImageSize($_FILES['zar']['tmp_name'])) {
            $errors[] = "صورة العملة الأجنبية (راند) يجب ألا تتجاوز 512×512 بكسل.";
        } else {
            move_uploaded_file($_FILES['zar']['tmp_name'], $uploadDir . "zar.png");
        }
    }

    if (empty($errors)) {
        $response["status"] = "success";
        $response["message"] = "تم رفع الصور بنجاح.";
    } else {
        $response["message"] = implode(" ", $errors);
    }
}

header("Content-Type: application/json");
echo json_encode($response);
