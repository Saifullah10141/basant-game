<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

error_reporting(0);
ini_set('display_errors', 0);

$roomsDir = __DIR__ . '/rooms/';
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['room_id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid data.']);
    exit;
}

$roomId = $data['room_id'];
$playerState = $data['player'] ?? null;
$roomFile = $roomsDir . $roomId . '.json';

if (!file_exists($roomFile)) {
    echo json_encode(['success' => false, 'message' => 'Room closed.']);
    exit;
}

$roomData = json_decode(file_get_contents($roomFile), true);

if ($playerState && isset($playerState['id'])) {
    $playerId = $playerState['id'];
    $playerState['last_seen'] = time();
    $roomData['players'][$playerId] = $playerState;
}

// Cleanup inactive players (10s timeout)
$now = time();
$active = [];
foreach ($roomData['players'] as $id => $p) {
    if (isset($p['last_seen']) && ($now - $p['last_seen'] < 10)) {
        $active[$id] = $p;
    }
}
$roomData['players'] = $active;
$roomData['last_update'] = $now;

file_put_contents($roomFile, json_encode($roomData));
echo json_encode(['success' => true, 'room' => $roomData]);
?>