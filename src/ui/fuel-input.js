export function initFuelInput(fuelInput) {
  fuelInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      e.target.value = '';
      return;
    }
    value = Number(value).toString();
    value = value.padStart(3, '0');
    const formatted = value.slice(0, -2) + ',' + value.slice(-2);
    e.target.value = formatted;
  });
}
