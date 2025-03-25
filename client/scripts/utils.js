export const elementBuilder = (element, args) => {
  const builtElement = document.createElement(element);

  for (const [key, value] of Object.entries(args)) {
    if (["textContent", "innerHTML"].includes(key)) {
      builtElement[key] = value;
    } else {
      builtElement.setAttribute(key, value);
    };
  };

  return builtElement;
};