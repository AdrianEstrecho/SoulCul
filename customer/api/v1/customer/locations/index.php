<?php

/*
Estrecho, Adrian M.
Mansilla, Rhangel R.
Romualdo, Jervin Paul C.
Sostea, Joana Marie A.
Torres, Ceazarion Sean Nicholas M.
Tupaen, Arianne Kaye E.

BSIT/IT22S1
*/

$db = getDB();

$stmt = $db->prepare(
    "
    SELECT
        id,
        name,
        slug,
        region,
        province,
        display_order
    FROM locations
    WHERE is_active = 1
    ORDER BY display_order ASC, name ASC
    "
);

$stmt->execute();
$locations = $stmt->fetchAll();

success($locations, 'Locations retrieved successfully');
