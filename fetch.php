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


$data = file_get_contents("http://opentransat.com/data.php?pathid=0&_=1473926642087");
$json = json_decode($data,true);
$prev = null;
$first = null;
unset($json['comments']);
foreach ($json as $key => $item) {
	if ($first === null) {
		$first = $item;
	}
	if ($prev === null) {
		$prev = $item;
		continue;
	}
	$json[$key]['distance-diff'] = getDistance($prev, $item);
	$json[$key]['distance-total'] = $prev['distance-total']+$json[$key]['distance-diff'];
	$json[$key]['distance-air'] = getDistance($first, $item);
	$json[$key]['speed'] = getSpeed($prev, $json[$key]);
	$json[$key]['travel-time'] = strtotime($item['transmit_time']) - strtotime($first['transmit_time']);
	$prev = $json[$key];
}

//var_dump($json);
$result = json_encode($json);
file_put_contents('web/data.json', $result);

?>
