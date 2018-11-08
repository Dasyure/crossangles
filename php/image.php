<?php
/* Proxy request to save timetable as image to PhantomJSCloud
 * This effectively takes a screenshot of the timetable
 */

$KEYS = json_decode(file_get_contents('config/keys.json'));
$KEY = $KEYS[array_rand($KEYS)];

$data = json_decode(file_get_contents('php://input'), true);
$width = min($data['width'], 900);
$height = min($data['height'], 1200);

$head = file_get_contents('head.html');
$html = $head . '<body>' .
        substr($data['timetable'], 0, 20000) .
        '</body></html>';

$url = "https://phantomjscloud.com/api/browser/v2/$KEY/";
$payload = array(
  'url' => 'about:blank',
  'content' => $html,
  'renderType' => 'png',
  'requestSettings' => array(
    // No JS/images/extra files should be loaded in normal operation
    'disableJavascript' => true,  // no need to run JS
    'ignoreImages' => true,       // no need to load any images
    'waitInterval' => 0,
    'webSecurityEnabled' => true,
    'resourceTimeout' => 3000,    // maximum wait for a resource
    'maxWait' => 5000,            // maximum wait for the whole page
    'resourceModifier' => array(
      // Blacklist all resources, except for what we explicitly allow later
      array(
        'regex' => '.*',
        'isBlacklisted' => true
      ),
      // Allow Roboto to load
      array(
        'regex' => '^https://fonts\.(googleapis|gstatic)\.com/.*$',
        'isBlacklisted' => false
      ),
      // Allow initial page request
      array(
        'regex' => '^https?://localhost/blank$',
        'isBlacklisted' => false
      )
    )
  ),
  'renderSettings' => array(
    'viewport' => array(
      'width' => $width,
      'height' => $height
    ),
    'clipRectangle' => array(
      'width' => $width,
      'height' => $height
    )
  ),
  'backend' => 'chrome'
);
$payloadLength = strlen(json_encode($payload));
$options = array(
  'http' => array(
    'header' => "Content-Type: application/json\r\nContent-Length: " . $payloadLength . "\r\n",
    'method' => 'POST',
    'content' => json_encode($payload)
  )
);

$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);

if ($result === false) {
  http_response_code(400);
} else {
  echo base64_encode($result);
}

?>
