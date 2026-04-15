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

// DELETE /api/v1/admin/profile/sessions
$me = requireAuth();
$db = getDB();
logAudit($db, $me['admin_id'], 'Logout', 'System', 'Sessions', 'Admin revoked all sessions');
// JWT is stateless; instruct client to discard token
success(null, 'All sessions revoked. Please log in again.');
