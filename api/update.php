<?php
session_start();
header('Content-Type: application/json');

$roomsDir = '../rooms/';
$data = json_decode(file_get_contents('php://input'), true);

$roomId = $data['room_id'] ?? '';
$playerState = $data['player'] ?? null;
$roomFile = $roomsDir . $roomId . '.json';

if (!file_exists($roomFile)) {
    echo json_encode(['success' => false, 'message' => 'Room not found']);
    exit;
}

$roomData = json_decode(file_get_contents($roomFile), true);

// Update current player state
if ($playerState) {
    $playerId = $playerState['id'];
    $roomData['players'][$playerId] = $playerState;
    $roomData['last_update'] = time();
}

// Cleanup: remove players who haven't updated in 10 seconds
foreach ($roomData['players'] as $id => $p) {
    if (isset($p['last_seen']) && (time() - $p['last_seen'] > 10)) {
        unset($roomData['players'][$id]);
    }
}

file_put_contents($roomFile, json_encode($roomData));

echo json_encode([
    'success' => true,
    'room' => $roomData
]);
?>