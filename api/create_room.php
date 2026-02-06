
<?php
session_start();
header('Content-Type: application/json');

$roomsDir = '../rooms/';
if (!is_dir($roomsDir)) mkdir($roomsDir);

$roomId = strtoupper(substr(md5(uniqid()), 0, 6));
$roomData = [
    'id' => $roomId,
    'status' => 'Lobby',
    'created_at' => time(),
    'players' => []
];

file_put_contents($roomsDir . $roomId . '.json', json_encode($roomData));

echo json_encode(['success' => true, 'room_id' => $roomId]);
?>
