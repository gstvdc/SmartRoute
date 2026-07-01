export function initTimelineScroll(slider) {
  if (!slider) return;

  let isDown = false;
  let startX;
  let scrollLeft;
  let velX = 0;
  let momentumID;

  slider.addEventListener('mousedown', (e) => {
    isDown = true;
    slider.style.cursor = 'grabbing';
    slider.style.userSelect = 'none';
    startX = e.clientX;
    scrollLeft = slider.scrollLeft;
    cancelAnimationFrame(momentumID);
    velX = 0;
  });

  const endDrag = () => {
    if (!isDown) return;
    isDown = false;
    slider.style.cursor = '';
    slider.style.userSelect = '';
    beginMomentum();
  };

  slider.addEventListener('mouseleave', endDrag);
  slider.addEventListener('mouseup', endDrag);

  let prevScrollLeft;

  slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.clientX;
    const walk = (x - startX) * 2;

    prevScrollLeft = slider.scrollLeft;
    slider.scrollLeft = scrollLeft - walk;
    velX = slider.scrollLeft - prevScrollLeft;
  });

  function beginMomentum() {
    function loop() {
      if (Math.abs(velX) > 0.5) {
        slider.scrollLeft += velX;
        velX *= 0.95;
        momentumID = requestAnimationFrame(loop);
      }
    }
    momentumID = requestAnimationFrame(loop);
  }

  slider.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      slider.scrollLeft += e.deltaY * 3;
    }
  });
}
