const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_NG_RE = /^(\+234|234|0)[789][01]\d{8}$/;
const CAC_RC_RE = /^RC\d{6,}$/i;
const PASSWORD_MIN = 8;

export function required(value, label = "This field") {
  if (value === undefined || value === null) return `${label} is required`;
  if (typeof value === "string" && value.trim() === "") return `${label} is required`;
  return null;
}

export function email(value) {
  if (!value) return null;
  if (!EMAIL_RE.test(value)) return "Enter a valid email address";
  return null;
}

export function phoneNg(value) {
  if (!value) return null;
  const stripped = value.replace(/[\s\-()]/g, "");
  if (!PHONE_NG_RE.test(stripped)) return "Enter a valid Nigerian phone number (e.g. 08031234567)";
  return null;
}

export function minLength(min, label) {
  return (value) => {
    if (!value) return null;
    if (value.length < min) return `${label} must be at least ${min} characters`;
    return null;
  };
}

export function maxLength(max, label) {
  return (value) => {
    if (!value) return null;
    if (value.length > max) return `${label} must be at most ${max} characters`;
    return null;
  };
}

export function passwordStrength(value) {
  if (!value) return null;
  if (value.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters`;
  if (!/[A-Z]/.test(value)) return "Password must contain an uppercase letter";
  if (!/[a-z]/.test(value)) return "Password must contain a lowercase letter";
  if (!/[0-9]/.test(value)) return "Password must contain a number";
  return null;
}

export function passwordMatch(password, confirm) {
  if (!confirm) return null;
  if (password !== confirm) return "Passwords do not match";
  return null;
}

export function minValue(min, label = "Value") {
  return (value) => {
    if (value === undefined || value === null || value === "") return null;
    const num = Number(value);
    if (isNaN(num)) return `${label} must be a number`;
    if (num < min) return `${label} must be at least ${min}`;
    return null;
  };
}

export function maxValue(max, label = "Value") {
  return (value) => {
    if (value === undefined || value === null || value === "") return null;
    const num = Number(value);
    if (isNaN(num)) return `${label} must be a number`;
    if (num > max) return `${label} must be at most ${max}`;
    return null;
  };
}

export function yearRange(minYear = 1990, maxYear = new Date().getFullYear() + 1) {
  return (value) => {
    if (!value) return null;
    const num = Number(value);
    if (isNaN(num) || num < minYear || num > maxYear) return `Enter a year between ${minYear} and ${maxYear}`;
    return null;
  };
}

export function fileSize(maxBytes, label = "File") {
  return (file) => {
    if (!file) return null;
    if (file.size > maxBytes) return `${label} must be under ${Math.round(maxBytes / 1024 / 1024)}MB`;
    return null;
  };
}

export function fileType(allowed, label = "File") {
  return (file) => {
    if (!file) return null;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) return `${label} must be ${allowed.join(", ")}`;
    return null;
  };
}

export function dateNotBefore(startDate, startLabel = "Start date", endLabel = "End date") {
  return (endValue) => {
    if (!startDate || !endValue) return null;
    if (new Date(endValue) < new Date(startDate)) return `${endLabel} must be after ${startLabel}`;
    return null;
  };
}

export function validateField(value, validators) {
  for (const v of validators) {
    const err = v(value);
    if (err) return err;
  }
  return null;
}

export function validateForm(fields) {
  const errors = {};
  let valid = true;
  for (const [key, { value, validators }] of Object.entries(fields)) {
    const err = validateField(value, validators);
    if (err) {
      errors[key] = err;
      valid = false;
    }
  }
  return { valid, errors };
}
