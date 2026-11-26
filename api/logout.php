<?php
// api/logout.php

require_once '../includes/cors.php';
require_once '../includes/auth.php';

session_destroy();
sendJsonResponse(['success' => true, 'message' => 'Logged out successfully']);
?>