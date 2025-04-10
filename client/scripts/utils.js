// A simple helper function to make building elements dynamically slightly more convenient and less verbose
export const elementBuilder = (element, args) => {
  const builtElement = document.createElement(element);

  if (!args) return builtElement;
  for (const [key, value] of Object.entries(args)) {
    if (["textContent", "innerHTML"].includes(key)) {
      builtElement[key] = value;
    } else {
      builtElement.setAttribute(key, value);
    };
  };

  return builtElement;
};

const basePath = `/${window.location.pathname.split('/')[1]}`;

export const routePatcher = (path) => `${basePath}/${path}`;