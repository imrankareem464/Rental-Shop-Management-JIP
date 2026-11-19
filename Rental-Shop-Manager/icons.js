'use strict';

// SVG icon paths used by the UI.

const iconPaths={
  shop:'M3 10h18L19 3H5l-2 7Zm1 0v11h16V10M9 21v-7h6v7M3 10c0 3 4 3 4 0 0 3 5 3 5 0 0 3 5 3 5 0 0 3 4 3 4 0',home:'m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9',users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-7a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87',file:'M14 2H5v20h14V7l-5-5ZM14 2v6h5M8 12h8M8 16h8',money:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3 6h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9M12 6v12',receipt:'M5 2h14v20l-3-2-4 2-4-2-3 2V2Zm3 5h8M8 11h8M8 15h4',alert:'m12 3 10 18H2L12 3ZM12 9v5M12 17h.01',bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',calendar:'M4 4h16v17H4V4Zm3-2v5M17 2v5M4 9h16M8 13h1M13 13h1M8 17h1',wrench:'M14 4a6 6 0 0 0-7 8L2 17a3 3 0 0 0 5 5l6-7a6 6 0 0 0 8-7l-5 3-3-3 3-4Z',bolt:'m13 2-9 12h7l-1 8 10-13h-8l1-7Z',chart:'M4 21v-7h3v7M11 21V8h3v13M18 21V3h3v18',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3Z',pin:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',send:'m22 2-7 20-4-9-9-4 20-7ZM11 13 22 2',mail:'M3 5h18v14H3V5Zm0 0 9 8 9-8'
};

const icon=(name)=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${iconPaths[name]||iconPaths.file}"/></svg>`;
