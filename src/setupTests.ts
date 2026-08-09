import "@testing-library/jest-dom";

// jsdom does not implement scrollIntoView
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = function() {};
}
