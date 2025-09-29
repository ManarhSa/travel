<?php
if (!empty($_FILES['image']['name'])) {
    $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
    $name = uniqid("plan_") . "." . $ext;

    if (!is_dir("images")) {
        mkdir("images", 0777, true);
    }

    $originalPath = "images/$name";
    $thumbPath = "images/thumb_$name";

    if (move_uploaded_file($_FILES['image']['tmp_name'], $originalPath)) {
        createThumbnail($originalPath, $thumbPath, 200);

        echo $originalPath;
    } else {
        http_response_code(500);
        echo "فشل في رفع الصورة";
    }
} else {
    echo "لم يتم رفع صورة";
}
function createThumbnail($src, $dest, $newWidth) {
    $info = getimagesize($src);
    if (!$info) return;

    list($width, $height) = $info;

    $mime = $info['mime'];
    switch ($mime) {
        case 'image/jpeg': $srcImg = imagecreatefromjpeg($src); break;
        case 'image/png':  $srcImg = imagecreatefrompng($src); break;
        case 'image/gif':  $srcImg = imagecreatefromgif($src); break;
        default: return;
    }

    $ratio = $height / $width;
    $newHeight = $newWidth * $ratio;

    $thumb = imagecreatetruecolor($newWidth, $newHeight);
    imagecopyresampled($thumb, $srcImg, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

    switch ($mime) {
        case 'image/jpeg': imagejpeg($thumb, $dest, 85); break;
        case 'image/png':  imagepng($thumb, $dest); break;
        case 'image/gif':  imagegif($thumb, $dest); break;
    }

    imagedestroy($srcImg);
    imagedestroy($thumb);
}
