"use client";

import { useState, useCallback } from "react";
import { validateField } from "./validation";

export function useFormValidation(validatorsMap) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = useCallback((name, value) => {
    const validators = validatorsMap[name];
    if (!validators) return null;
    const err = validateField(value, validators);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[name] = err;
      else delete next[name];
      return next;
    });
    return err;
  }, [validatorsMap]);

  const handleChange = useCallback((name, value) => {
    if (touched[name]) validate(name, value);
  }, [touched, validate]);

  const handleBlur = useCallback((name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    validate(name, value);
  }, [validate]);

  const validateAll = useCallback((values) => {
    const newErrors = {};
    let valid = true;
    for (const name of Object.keys(validatorsMap)) {
      const err = validateField(values[name], validatorsMap[name]);
      if (err) {
        newErrors[name] = err;
        valid = false;
      }
    }
    setErrors(newErrors);
    const allTouched = {};
    for (const name of Object.keys(validatorsMap)) allTouched[name] = true;
    setTouched(allTouched);
    return valid;
  }, [validatorsMap]);

  const clearErrors = useCallback(() => setErrors({}), []);

  const inputProps = useCallback((name) => ({
    onChange: (e) => handleChange(name, e.target.value),
    onBlur: (e) => handleBlur(name, e.target.value),
  }), [handleChange, handleBlur]);

  return { errors, touched, validate, handleChange, handleBlur, validateAll, clearErrors, inputProps };
}

export function inputClass(baseClass, errors, fieldName) {
  return `${baseClass} ${errors[fieldName] ? "border-red-400 bg-red-50" : ""}`;
}
