
<?php
session_start();
header('Content-Type: application/json');

$roomId = $_GET['room_id'] ?? '';
$roomsDir = '../rooms/';
$roomFile = $roomsDir . $roomId . '.json';

if (!file_exists($roomFile)) {
    echo json_encode(['success' => false, 'message' => 'Room not found.']);
    exit;
}

$roomData = json_decode(file_get_contents($roomFile), true);

if (count($roomData['players']) >= 8) {
    echo json_encode(['success' => false, 'message' => 'Room is full.']);
    exit;
}

echo json_encode(['success' => true]);
?>
