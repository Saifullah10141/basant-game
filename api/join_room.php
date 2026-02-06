<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

error_reporting(0);
ini_set('display_errors', 0);

$roomId = $_GET['room_id'] ?? '';
$roomsDir = __DIR__ . '/rooms/';
$roomFile = $roomsDir . $roomId . '.json';

if (empty($roomId) || !file_exists($roomFile)) {
    echo json_encode(['success' => false, 'message' => "Room $roomId not found."]);
    exit;
}

$roomData = json_decode(file_get_contents($roomFile), true);
if (!$roomData) {
    echo json_encode(['success' => false, 'message' => 'Corrupted room data.']);
    exit;
}

if (count($roomData['players']) >= 8) {
    echo json_encode(['success' => false, 'message' => 'Room is full (max 8).']);
    exit;
}

echo json_encode(['success' => true]);
?>