<?php

$host = "localhost";
$dbname = "eduprojecthub";
$username = "eduproject";
$password = "your_password";

$conn = new PDO(
    "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
    $username,
    $password
);
?>