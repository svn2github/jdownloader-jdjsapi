define("coreRequest", ["coreCrypto", "coreCryptoUtils"], function(CryptoJS, CryptoUtils) {

	/**
	 * Static variables and functions
	 */
	var requestCount = 0;

	var processOptions = function(options) {
		// SERVER_CALL
		// if URL params are included build querystring with
		// sessiontoken and signature
		if (options.jdParams) {
			var queryString = "/my/" + options.jdAction + "?sessiontoken=" + options.sessiontoken + "&" + $
				.param(options.jdParams);
			queryString += "&signature=" + CryptoJS
				.HmacSHA256(CryptoJS.enc.Utf8.parse(queryString), options.serverEncryptionToken)
				.toString(options.TRANSFER_ENCODING);
			options.url = options.API_ROOT + queryString;
			// DEVICE_CALL
		} else {
			options.data = CryptoUtils.encryptJSON(options.deviceEncryptionToken, options.jdData);
			options.contentType = "json";
			options.url = options.API_ROOT + "/t_" + options.sessiontoken + "_" + options.deviceId + options.jdAction;
		}
	};

	/**
	 * Constructor for new JDAPIRequest Object
	 */
	var JDAPIRequest = function(options) {
		// console.log("REQUEST_NUMBER: " + requestCount++);
		// console.log("REQUEST_ACTION: " + options.jdAction);
		// console.log("REQUEST_PARAMS: " + options.jdParams);

		// options.jdParams = options.jdParams || {};
		if (options.jdParams) options.jdParams.rid = options.rid;
		if (options.data) options.data.rid = options.rid;
		var self = this;
		/*
		 * processes the options object e.g. encrypting everything
		 * with the required secrets
		 */
		processOptions(options);
		this.options = options;
	};
	$.extend(JDAPIRequest.prototype, {
		send: function() {
			var filter = $.Deferred();
			var self = this;
			var apiRequest = $.ajax(this.options);

			apiRequest.done(function(response) {
				/*
				 * DEBUG: Trigger random reconnects
				 */
				// if (Math.random() < 0.2) {
				// 	console.log("DEBUG FAKE RECONNECT!");
				// 	filter.reject({
				// 		type: "TOKEN_INVALID"
				// 	});
				// 	return filter;
				// } else {
				filter.resolve(response);
				// }
			});
			apiRequest.fail(function(error) {
				if (error.responseText) {
					filter.reject(JSON.parse(error.responseText));
				} else {
					filter.reject({
						type: "UNKNOWN_ERROR"
					});
				}
			});
			return filter;
		}
	});
	return JDAPIRequest;
});