"use strict";

module.exports = {
	slow: 9999,
	spec: "test/?-*.js",
	require: [
		"chai/register-expect",
		"mocha-when/register",
	],
};
