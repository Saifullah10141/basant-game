
<?php
session_start();
header('Content-Type: application/json');

$roomId = $_GET['room_id'] ?? '';
$playerName = $_GET['name'] ?? 'Player';
$roomsDir = '../rooms/';
$roomFile = $roomsDir . $roomId . '.json';

if (!file_exists($roomFile)) {
    echo json_encode(['success' => false, 'message' => 'Room not found']);
    exit;
}

$roomData = json_decode(file_get_contents($roomFile), true);

if (count($roomData['players']) >= 4) {
    echo json_encode(['success' => false, 'message' => 'Room full']);
    exit;
}

$playerId = session_id();
$roomData['players'][$playerId] = [
    'id' => $playerId,
    'name' => $playerName,
    'joined_at' => time()
];

file_put_contents($roomFile, json_encode($roomData));

echo json_encode(['success' => true, 'player_id' => $playerId]);
?>
