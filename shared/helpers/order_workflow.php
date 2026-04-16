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

if (!function_exists('orderWorkflowNormalizeStatus')) {
    function orderWorkflowNormalizeStatus(string $status): string {
        $normalized = strtolower(trim($status));

        $aliases = [
            'out_for_delivery'  => 'to_be_delivered',
            'pending_payment'   => 'online_payment_requested',
            'payment_confirmed' => 'online_payment_processed',
            'cod_confirmed'     => 'cash_on_delivery_approved',
            'cod_requested'     => 'cash_on_delivery_requested',
        ];

        return $aliases[$normalized] ?? $normalized;
    }
}

if (!function_exists('orderWorkflowFormatStatusLabel')) {
    function orderWorkflowFormatStatusLabel(string $status): string {
        $normalized = orderWorkflowNormalizeStatus($status);

        $labels = [
            'online_payment_requested'   => 'Pending Payment',
            'online_payment_processed'   => 'Payment Confirmed',
            'cash_on_delivery_requested' => 'COD Requested',
            'cash_on_delivery_approved'  => 'COD Confirmed',
            'processing'                 => 'Processing',
            'waiting_for_courier'        => 'Waiting for Courier',
            'shipped'                    => 'Shipped',
            'to_be_delivered'            => 'Out for Delivery',
            'delivered'                  => 'Delivered',
            'cancelled'                  => 'Cancelled',
            'pending'                    => 'Pending Payment',
            'confirmed'                  => 'Payment Confirmed',
        ];

        return $labels[$normalized] ?? ucwords(str_replace('_', ' ', $normalized));
    }
}

if (!function_exists('orderWorkflowResolvePaymentMethod')) {
    function orderWorkflowResolvePaymentMethod(?string $rawMethod, ?string $rawStatus): string {
        $method = strtolower(trim((string) $rawMethod));
        if ($method !== '') {
            return $method;
        }

        $status = strtolower(trim((string) $rawStatus));
        if (strpos($status, 'cash_on_delivery') !== false) {
            return 'cod';
        }

        if (strpos($status, 'online_payment') !== false) {
            return 'online';
        }

        return '';
    }
}

if (!function_exists('orderWorkflowAllowedStatuses')) {
    function orderWorkflowAllowedStatuses(): array {
        return [
            'cash_on_delivery_requested',
            'online_payment_requested',
            'cash_on_delivery_approved',
            'online_payment_processed',
            'processing',
            'waiting_for_courier',
            'shipped',
            'to_be_delivered',
            'delivered',
            'cancelled',
            // Legacy values kept for compatibility with old records.
            'pending',
            'confirmed',
        ];
    }
}

if (!function_exists('orderWorkflowNextStatus')) {
    function orderWorkflowNextStatus(string $currentStatus, string $paymentMethod): ?string {
        $status = orderWorkflowNormalizeStatus($currentStatus);

        if ($status === 'online_payment_requested' || $status === 'pending') {
            return 'online_payment_processed';
        }

        if ($status === 'online_payment_processed' || ($status === 'confirmed' && $paymentMethod !== 'cod')) {
            return 'processing';
        }

        if ($status === 'cash_on_delivery_requested') {
            return 'cash_on_delivery_approved';
        }

        if ($status === 'cash_on_delivery_approved' || ($status === 'confirmed' && $paymentMethod === 'cod')) {
            return 'processing';
        }

        if ($status === 'processing') {
            return 'waiting_for_courier';
        }

        if ($status === 'waiting_for_courier') {
            return 'shipped';
        }

        if ($status === 'shipped') {
            return 'to_be_delivered';
        }

        if ($status === 'to_be_delivered') {
            return 'delivered';
        }

        return null;
    }
}

if (!function_exists('orderWorkflowAllowedTransitions')) {
    function orderWorkflowAllowedTransitions(string $currentStatus, string $paymentMethod): array {
        $status = orderWorkflowNormalizeStatus($currentStatus);

        if ($status === '') {
            return ['cancelled'];
        }

        if (in_array($status, ['delivered', 'cancelled'], true)) {
            return [$status];
        }

        $allowed = [$status];
        $next = orderWorkflowNextStatus($status, $paymentMethod);
        if ($next) {
            $allowed[] = $next;
        }

        $cannotCancelStatuses = ['shipped', 'to_be_delivered', 'delivered', 'cancelled'];
        if (!in_array($status, $cannotCancelStatuses, true)) {
            $allowed[] = 'cancelled';
        }

        return array_values(array_unique($allowed));
    }
}
