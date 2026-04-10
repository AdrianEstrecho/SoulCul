// SouCul runtime configuration for production hosting.
//
// Edit these values on the server without rebuilding frontend assets.
// Example for Hostinger subdomains:
window.__SOUCUL_CONFIG__.adminApiBaseUrl = "https://api-admin.soucul.store";
window.__SOUCUL_CONFIG__.customerApiBaseUrl = "https://api-customer.soucul.store";
//
// Example for single-domain fallback (no subdomains):
window.__SOUCUL_CONFIG__.adminApiBaseUrl = "";
window.__SOUCUL_CONFIG__.customerApiBaseUrl = "";

(function initSouculRuntimeConfig() {
	const config = window.__SOUCUL_CONFIG__ || {};
	const hostname = String(window.location.hostname || "");
	const protocol = String(window.location.protocol || "https:");
	const isLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(hostname);
	const isIpHost = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
	const isHostingerPreviewDomain = /\.hostingersite\.com$/i.test(hostname);

	const normalizeUrl = (value) => String(value || "").replace(/\/+$/, "");

	const isInvalidPreviewApiUrl = (value, serviceName) => {
		const normalized = normalizeUrl(value);
		if (!normalized) {
			return false;
		}

		try {
			const parsed = new URL(normalized);
			const host = String(parsed.hostname || "").toLowerCase();
			return /\.hostingersite\.com$/i.test(host) && host.startsWith(`api-${serviceName}.`);
		} catch {
			return false;
		}
	};

	const inferSubdomainBaseUrl = (serviceName) => {
		if (!hostname || isLocalHost || isIpHost) {
			return "";
		}

		const expectedPrefix = `api-${serviceName}.`;
		if (hostname.startsWith(expectedPrefix)) {
			return normalizeUrl(window.location.origin);
		}

		return normalizeUrl(`${protocol}//${expectedPrefix}${hostname}`);
	};

	const inferredAdmin = isHostingerPreviewDomain ? "" : inferSubdomainBaseUrl("admin");
	const inferredCustomer = isHostingerPreviewDomain ? "" : inferSubdomainBaseUrl("customer");

	const resolveConfiguredBaseUrl = (key, inferredValue) => {
		const hasExplicitValue = Object.prototype.hasOwnProperty.call(config, key);
		if (hasExplicitValue) {
			return normalizeUrl(config[key]);
		}
		return normalizeUrl(inferredValue);
	};

	config.adminApiBaseUrl = resolveConfiguredBaseUrl("adminApiBaseUrl", inferredAdmin);
	config.customerApiBaseUrl = resolveConfiguredBaseUrl("customerApiBaseUrl", inferredCustomer);

	if (isHostingerPreviewDomain && isInvalidPreviewApiUrl(config.adminApiBaseUrl, "admin")) {
		config.adminApiBaseUrl = "";
	}

	if (isHostingerPreviewDomain && isInvalidPreviewApiUrl(config.customerApiBaseUrl, "customer")) {
		config.customerApiBaseUrl = "";
	}

	window.__SOUCUL_CONFIG__ = config;
})();
