<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

$roomsDir = __DIR__ . '/../rooms/';
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['room_id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

$roomId = $data['room_id'];
$playerState = $data['player'] ?? null;
$roomFile = $roomsDir . $roomId . '.json';

if (!file_exists($roomFile)) {
    echo json_encode(['success' => false, 'message' => 'Room not found.']);
    exit;
}

$roomData = json_decode(file_get_contents($roomFile), true);

if ($playerState && isset($playerState['id'])) {
    $playerId = $playerState['id'];
    $playerState['last_seen'] = time();
    $roomData['players'][$playerId] = $playerState;
    $roomData['last_update'] = time();
}

// Player Cleanup (20s timeout)
$now = time();
foreach ($roomData['players'] as $id => $p) {
    if (isset($p['last_seen']) && ($now - $p['last_seen'] > 20)) {
        unset($roomData['players'][$id]);
    }
}

file_put_contents($roomFile, json_encode($roomData));

echo json_encode([
    'success' => true,
    'room' => $roomData
]);
?>