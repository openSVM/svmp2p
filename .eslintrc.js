module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    "react/display-name": "off",
    "react/no-unescaped-entities": "off",
    "@next/next/no-img-element": "warn", // Changed to warn instead of error
    "react-hooks/exhaustive-deps": "warn" // Changed to warn instead of error
  }
};