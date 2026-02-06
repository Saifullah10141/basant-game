<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

$roomsDir = __DIR__ . '/../rooms/';
if (!is_dir($roomsDir)) {
    if (!mkdir($roomsDir, 0777, true)) {
        echo json_encode(['success' => false, 'message' => 'Could not create rooms directory.']);
        exit;
    }
}

$roomId = strtoupper(substr(md5(uniqid()), 0, 6));
$roomData = [
    'id' => $roomId,
    'status' => 'Lobby',
    'created_at' => time(),
    'players' => [],
    'last_update' => time()
];

if (file_put_contents($roomsDir . $roomId . '.json', json_encode($roomData))) {
    echo json_encode(['success' => true, 'room_id' => $roomId]);
} else {
    echo json_encode(['success' => false, 'message' => 'Could not save room file.']);
}
?>