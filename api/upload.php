<?php
/* ============================================
   SAMATVAM LIVING — File Upload Endpoint
   Receives files from admin panel and saves
   them to the appropriate folder on Hostinger.
   
   POST /api/upload.php
   - file: the uploaded file
   - folder: target subfolder (founders, stories, pillars, branding, courses, testimonials)
   - token: Supabase JWT for auth verification
   ============================================ */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ---- CONFIG ----
$SUPABASE_URL = 'https://mwiuckvmvyokiwmhpyfv.supabase.co';
$SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13aXVja3Ztdnlva2l3bWhweWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODQyMzAsImV4cCI6MjA4NjA2MDIzMH0.4wJAmCWWGmvlhdCy10sy7C5UTZZHXsPRbsmLsqu1CrI';

// Allowed folders and their base paths
$ALLOWED_FOLDERS = [
    'founders'     => '../images/founders/',
    'stories'      => '../images/stories/',
    'pillars'      => '../images/pillars/',
    'branding'     => '../images/branding/',
    'courses'      => '../videos/courses/',
    'testimonials' => '../videos/testimonials/',
    'general'      => '../images/',
];

// Max file sizes (bytes)
$MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10MB
$MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

// Allowed MIME types
$ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
$ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

// ---- AUTH: Verify Supabase JWT ----
$token = '';
if (isset($_POST['token'])) {
    $token = $_POST['token'];
} elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
}

if (empty($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'No auth token provided']);
    exit;
}

// Verify token with Supabase — check user is admin
$ch = curl_init($SUPABASE_URL . '/auth/v1/user');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
        'apikey: ' . $SUPABASE_ANON_KEY,
    ],
]);
$userResponse = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

$user = json_decode($userResponse, true);
$userId = $user['id'] ?? null;

if (!$userId) {
    http_response_code(401);
    echo json_encode(['error' => 'Could not identify user']);
    exit;
}

// Check admin role in profiles table
$ch = curl_init($SUPABASE_URL . '/rest/v1/profiles?id=eq.' . $userId . '&select=role');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
        'apikey: ' . $SUPABASE_ANON_KEY,
    ],
]);
$profileResponse = curl_exec($ch);
curl_close($ch);

$profiles = json_decode($profileResponse, true);
if (empty($profiles) || ($profiles[0]['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Admin access required']);
    exit;
}

// ---- VALIDATE UPLOAD ----
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $errorMsg = 'No file uploaded';
    if (isset($_FILES['file'])) {
        $uploadErrors = [
            UPLOAD_ERR_INI_SIZE   => 'File exceeds server max upload size',
            UPLOAD_ERR_FORM_SIZE  => 'File exceeds form max size',
            UPLOAD_ERR_PARTIAL    => 'File only partially uploaded',
            UPLOAD_ERR_NO_FILE    => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temp folder on server',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write to disk',
        ];
        $errorMsg = $uploadErrors[$_FILES['file']['error']] ?? 'Unknown upload error';
    }
    http_response_code(400);
    echo json_encode(['error' => $errorMsg]);
    exit;
}

$file = $_FILES['file'];
$folder = isset($_POST['folder']) && array_key_exists($_POST['folder'], $ALLOWED_FOLDERS)
    ? $_POST['folder']
    : 'general';

$mimeType = mime_content_type($file['tmp_name']);
$isVideo = in_array($mimeType, $ALLOWED_VIDEO_TYPES);
$isImage = in_array($mimeType, $ALLOWED_IMAGE_TYPES);

if (!$isVideo && !$isImage) {
    http_response_code(400);
    echo json_encode(['error' => 'File type not allowed: ' . $mimeType]);
    exit;
}

// Size check
$maxSize = $isVideo ? $MAX_VIDEO_SIZE : $MAX_IMAGE_SIZE;
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large. Max: ' . ($maxSize / 1024 / 1024) . 'MB']);
    exit;
}

// ---- SAVE FILE ----
$targetDir = $ALLOWED_FOLDERS[$folder];

// Create directory if it doesn't exist
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
}

// Generate safe filename: timestamp-sanitized_original_name
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo($file['name'], PATHINFO_FILENAME));
$filename = time() . '-' . $safeName . '.' . $ext;
$targetPath = $targetDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save file on server']);
    exit;
}

// Build public URL (relative to site root)
// Remove the leading '../' to get path relative to site root
$publicPath = str_replace('../', '', $targetDir) . $filename;

// Determine the base URL from the request
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$baseUrl = $protocol . '://' . $host;

echo json_encode([
    'success' => true,
    'url' => $baseUrl . '/' . $publicPath,
    'path' => $publicPath,
    'filename' => $filename,
    'size' => $file['size'],
    'type' => $mimeType,
]);
