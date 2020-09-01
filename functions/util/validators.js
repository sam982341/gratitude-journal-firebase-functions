// Check if email is valid
const isEmail = (email) => {
	const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (email.match(emailRegEx)) {
		return true;
	} else {
		return false;
	}
};

// String validation helper functions
const isEmpty = (string) => {
	if (string.trim() === '') {
		return true;
	} else {
		return false;
	}
};

exports.validateSignupData = (data) => {
	let errors = {};

	// Validate email
	if (isEmpty(data.email)) {
		errors.email = 'Must not be empty';
	} else if (!isEmail(data.email)) {
		errors.email = 'Email is not valid';
	}

	// Validate passwords
	if (isEmpty(data.password)) errors.password = 'Must not be empty';
	if (data.password !== data.confirmPassword)
		errors.confirmPassword = 'Passwords must match';

	// Validate handle
	if (isEmpty(data.handle)) errors.handle = 'Must not be empty';

	// Check if any errors in error object

	return {
		errors,
		valid: Object.keys(errors).length === 0 ? true : false,
	};
};

exports.validateLoginData = (data) => {
	let errors = {};

	if (isEmpty(data.email)) errors.email = 'Must not be empty';
	if (isEmpty(data.password)) errors.password = 'Must not be empty';

	return {
		errors,
		valid: Object.keys(errors).length === 0 ? true : false,
	};
};
