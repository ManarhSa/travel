<?php
$titleFile = __DIR__ . '/data/title.txt';
if (file_exists($titleFile)) {
    echo file_get_contents($titleFile);
} else {
    echo "جنوب أفريقيا";
}
?>
