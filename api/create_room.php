<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Basic error handling for pure JSON output
error_reporting(0);
ini_set('display_errors', 0);

$roomsDir = __DIR__ . '/rooms/';
if (!is_dir($roomsDir)) {
    if (!mkdir($roomsDir, 0755, true)) {
        echo json_encode(['success' => false, 'message' => 'Directory creation failed. Check folder permissions.']);
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

$filePath = $roomsDir . $roomId . '.json';
if (file_put_contents($filePath, json_encode($roomData))) {
    echo json_encode(['success' => true, 'room_id' => $roomId]);
} else {
    echo json_encode(['success' => false, 'message' => 'Write failed. Ensure api/rooms/ is writable.']);
}
?>