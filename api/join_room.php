<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

$roomId = $_GET['room_id'] ?? '';
$roomsDir = __DIR__ . '/../rooms/';
$roomFile = $roomsDir . $roomId . '.json';

if (empty($roomId) || !file_exists($roomFile)) {
    echo json_encode(['success' => false, 'message' => 'Room ' . $roomId . ' not found.']);
    exit;
}

$roomData = json_decode(file_get_contents($roomFile), true);
if (!$roomData) {
    echo json_encode(['success' => false, 'message' => 'Room data corrupted.']);
    exit;
}

if (count($roomData['players']) >= 12) {
    echo json_encode(['success' => false, 'message' => 'Room is full.']);
    exit;
}

echo json_encode(['success' => true]);
?>