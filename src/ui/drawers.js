export function initDrawers(leftDrawer, bottomDrawer, notchLeft, notchBottom) {
  const toggleDrawer = (drawerToToggle) => {
    const isOpening = drawerToToggle.classList.contains('closed');

    if (isOpening) {
      drawerToToggle.classList.replace('closed', 'open');

      if (document.body.classList.contains('fullscreen-mode')) {
        const otherDrawer = drawerToToggle === leftDrawer ? bottomDrawer : leftDrawer;
        if (otherDrawer && otherDrawer.classList.contains('open')) {
          otherDrawer.classList.replace('open', 'closed');
        }
      }
    } else {
      drawerToToggle.classList.replace('open', 'closed');
    }
  };

  notchLeft.addEventListener('click', () => toggleDrawer(leftDrawer));
  notchBottom.addEventListener('click', () => toggleDrawer(bottomDrawer));
}
