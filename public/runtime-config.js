// SouCul runtime configuration for production hosting.
//
// Edit these values on the server without rebuilding frontend assets.
// Example for Hostinger subdomains:
// window.__SOUCUL_CONFIG__.adminApiBaseUrl = "https://api-admin.yourdomain.com";
// window.__SOUCUL_CONFIG__.customerApiBaseUrl = "https://api-customer.yourdomain.com";

(function initSouculRuntimeConfig() {
	const config = window.__SOUCUL_CONFIG__ || {};
	const hostname = String(window.location.hostname || "");
	const protocol = String(window.location.protocol || "https:");
	const isLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(hostname);
	const isIpHost = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
	const isHostingerPreviewDomain = /\.hostingersite\.com$/i.test(hostname);

	const normalizeUrl = (value) => String(value || "").replace(/\/+$/, "");

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

	config.adminApiBaseUrl = normalizeUrl(config.adminApiBaseUrl || inferredAdmin);
	config.customerApiBaseUrl = normalizeUrl(config.customerApiBaseUrl || inferredCustomer);

	window.__SOUCUL_CONFIG__ = config;
})();
