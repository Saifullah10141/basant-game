<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

$roomId = $_GET['room_id'] ?? '';
$playerId = $_GET['player_id'] ?? '';
$roomsDir = __DIR__ . '/../rooms/';
$roomFile = $roomsDir . $roomId . '.json';

if (file_exists($roomFile)) {
    $roomData = json_decode(file_get_contents($roomFile), true);
    if (isset($roomData['players'][$playerId])) {
        unset($roomData['players'][$playerId]);
        
        if (empty($roomData['players'])) {
            unlink($roomFile);
        } else {
            file_put_contents($roomFile, json_encode($roomData));
        }
    }
}

echo json_encode(['success' => true]);
?>