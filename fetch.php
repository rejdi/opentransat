<?php

function toRadians($num) {
	return $num * pi() / 180.0;
}

//http://www.movable-type.co.uk/scripts/latlong.html
function getDistance($pos1, $pos2) {
    $R = 6371000.0; // metres
    $p1 = toRadians($pos1['gps_lat']);
    $p2 = toRadians($pos2['gps_lat']);
    $p3 = toRadians($pos1['gps_lat']-$pos2['gps_lat']);
    $p4 = toRadians($pos1['gps_lng']-$pos2['gps_lng']);

    $a = sin($p3/2) * sin($p3/2) +
            cos($p1) * cos($p2) *
            sin($p4/2) * sin($p4/2);

  	if ($a < 0) $a = 0; //shouldn't happen
  	if ($a > 1) $a = 1; //shouldn't happen
    $c = 2 * atan2(sqrt($a), sqrt(1-$a));

    $d = $R * $c;
    return abs($d);
}

function getSpeed($pos1, $pos2) {
	$t1 = strtotime($pos1['transmit_time']);
	$t2 = strtotime($pos2['transmit_time']);
	//workaround - ak mame 2 merania, ktore su tesne za sebou, velmi sa prejavi chyba merania.
	//dame min rozdiel merani 5min
	if ($t2-$t1 < 300) {
		return $pos1['speed'];
	}
	$dt = abs($t2-$t1) / 3600.0;
	$d = $pos2['distance-diff'] / 1000.0;

	return $d/$dt;
}

$data = @file_get_contents("http://track.opentransat.com/data.php?pathid=0&_=1473926642087");
$json = json_decode($data,true);
if ($json === null) {
	//neplatne data
	exit(1);
}
$prev = null;
$first = null;
foreach ($json as $key => $item) {
	if ($key == 'comments') {
		foreach ($item as $index => $comment) {
			$json[$key][$index] = fixLinks($comment);
		}
		continue;
	}
	if ($first === null) {
		$first = $item;
	}
	if ($prev === null) {
		$json[$key]['distance-total'] = 0.0;
		$json[$key]['speed'] = 0.0;
		$json[$key]['travel-time'] = 0;
		$json[$key]['distance-air'] = 0.0;
		$json[$key]['distance-diff'] = 0.0;
		$prev = $json[$key];
		continue;
	}
	$json[$key]['distance-diff'] = getDistance($prev, $item);
	$json[$key]['distance-total'] = $prev['distance-total']+$json[$key]['distance-diff'];
	$json[$key]['distance-air'] = getDistance($first, $item);
	$json[$key]['speed'] = getSpeed($prev, $json[$key]);
	$json[$key]['travel-time'] = strtotime($item['transmit_time']) - strtotime($first['transmit_time']);
	$prev = $json[$key];
}

function fixLinks($comment) {
	$comment[3] = str_replace('src=\'img/', 'src=\'http://track.opentransat.com/img/', $comment[3]);
	return $comment;
}

//var_dump($json);
$result = json_encode($json);
file_put_contents('web/data.json', $result);

?>
