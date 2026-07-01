export function initAutocomplete(inp, arr) {
  let currentFocus = -1;
  const clearButton = inp.parentNode.querySelector(".clear-input");

  function updateClearButton() {
    if (!clearButton) return;
    clearButton.classList.toggle("visible", Boolean(inp.value.trim()));
  }

  function normalizeText(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  }

  function dispatchSelectionChange() {
    inp.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function buildList(val = "", shouldFilter = true) {
    let a, b, i;
    closeAllLists();
    currentFocus = -1;

    a = document.createElement("DIV");
    a.setAttribute("id", inp.id + "autocomplete-list");
    a.setAttribute("class", "custom-autocomplete-list show");

    inp.parentNode.appendChild(a);

    const normalizedVal = shouldFilter ? normalizeText(val.trim()) : "";
    const selectedInOtherInputs = new Set(
      Array.from(document.querySelectorAll(".autocomplete-input"))
        .filter(input => input !== inp)
        .map(input => input.value.trim())
        .filter(Boolean)
    );

    for (i = 0; i < arr.length; i++) {
      const normalizedItem = normalizeText(arr[i]);
      const isCurrentSelection = arr[i] === inp.value.trim();

      if (selectedInOtherInputs.has(arr[i]) && !isCurrentSelection) {
        continue;
      }

      if (!normalizedVal || normalizedItem.includes(normalizedVal)) {
        b = document.createElement("DIV");
        b.setAttribute("class", "autocomplete-item");
        b.textContent = arr[i];

        b.addEventListener("click", function(e) {
          inp.value = this.textContent;
          closeAllLists();
          dispatchSelectionChange();
        });
        a.appendChild(b);
      }
    }

    if (!a.children.length) {
      closeAllLists();
    }
  }

  inp.addEventListener("input", function() {
    updateClearButton();
    buildList(this.value);
  });

  inp.addEventListener("change", updateClearButton);

  inp.addEventListener("focus", function() {
    buildList("", false);
  });

  inp.addEventListener("click", function() {
    buildList("", false);
  });

  inp.addEventListener("keydown", function(e) {
      let x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByClassName("autocomplete-item");
      if (e.keyCode == 40) {
        e.preventDefault();
        currentFocus++;
        addActive(x);
      } else if (e.keyCode == 38) {
        e.preventDefault();
        currentFocus--;
        addActive(x);
      } else if (e.keyCode == 13) {
        e.preventDefault();
        if (currentFocus > -1) {
          if (x) x[currentFocus].click();
        }
      }
  });

  function addActive(x) {
    if (!x) return false;
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    x[currentFocus].classList.add("active");
  }

  function removeActive(x) {
    for (let i = 0; i < x.length; i++) {
      x[i].classList.remove("active");
    }
  }

  function closeAllLists(elmnt) {
    let x = document.getElementsByClassName("custom-autocomplete-list");
    for (let i = 0; i < x.length; i++) {
      if (!elmnt || !x[i].parentNode.contains(elmnt)) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }

  document.addEventListener("click", function (e) {
      closeAllLists(e.target);
  });

  updateClearButton();
}
