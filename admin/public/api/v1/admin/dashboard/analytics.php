<?php
// GET /api/v1/admin/dashboard/analytics?period=monthly
requireAuth();
$db     = getDB();
$period = getParam('period', 'monthly'); // daily | weekly | monthly

$format = match($period) {
    'daily'   => '%Y-%m-%d',
    'weekly'  => '%Y-%u',
    default   => '%Y-%m',
};

$rows = $db->prepare(
    "SELECT DATE_FORMAT(created_at, ?) AS period,
            COUNT(*) AS orders,
            COALESCE(SUM(total_amount), 0) AS revenue
     FROM orders
     WHERE status = 'delivered'
       AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
     GROUP BY period
     ORDER BY period ASC"
);
$rows->execute([$format]);

success($rows->fetchAll());
