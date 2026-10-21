let currentStep = 1;
const totalSteps = 3;

const slides = [
  document.getElementById("slide1"),
  document.getElementById("slide2"),
  document.getElementById("slide3"),
];

const dots = document.querySelectorAll(".dot");
const btnBack = document.getElementById("btnBack");
const btnNext = document.getElementById("btnNext");
const btnCloseOnboarding = document.getElementById("btnCloseOnboarding");

function updateStep(step) {
  currentStep = step;

  // Show active slide
  slides.forEach((slide, idx) => {
    if (idx === currentStep - 1) {
      slide.classList.add("active");
    } else {
      slide.classList.remove("active");
    }
  });

  // Update dots
  dots.forEach((dot, idx) => {
    if (idx === currentStep - 1) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });

  // Update Back button
  if (currentStep > 1) {
    btnBack.style.display = "inline-block";
  } else {
    btnBack.style.display = "none";
  }

  // Update Next button
  if (currentStep === totalSteps) {
    btnNext.textContent = "Start Using Peeky Task";
  } else {
    btnNext.textContent = "Next";
  }
}

let selectedEdge = "right";

const btnChooseRight = document.getElementById("btnChooseRight");
const btnChooseLeft = document.getElementById("btnChooseLeft");

if (btnChooseRight && btnChooseLeft) {
  btnChooseRight.addEventListener("click", () => {
    selectedEdge = "right";
    btnChooseRight.classList.add("active");
    btnChooseLeft.classList.remove("active");
  });

  btnChooseLeft.addEventListener("click", () => {
    selectedEdge = "left";
    btnChooseLeft.classList.add("active");
    btnChooseRight.classList.remove("active");
  });
}

async function finishOnboarding() {
  if (window.peekyApi && window.peekyApi.loadData && window.peekyApi.saveData) {
    try {
      const data = (await window.peekyApi.loadData()) || {};
      data.hasSeenOnboarding = true;
      data.edge = selectedEdge;
      await window.peekyApi.saveData(data);
    } catch (e) {
      console.warn("Could not save onboarding state:", e);
    }
  }

  // Launch sticky tasks on screen edge (default right)
  if (window.peekyApi && window.peekyApi.launchStickyTasks) {
    window.peekyApi.launchStickyTasks(selectedEdge);
  } else if (window.peekyApi && window.peekyApi.close) {
    window.peekyApi.close();
  } else {
    window.close();
  }
}

btnNext.addEventListener("click", () => {
  if (currentStep < totalSteps) {
    updateStep(currentStep + 1);
  } else {
    finishOnboarding();
  }
});

btnBack.addEventListener("click", () => {
  if (currentStep > 1) {
    updateStep(currentStep - 1);
  }
});

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    const step = parseInt(dot.dataset.slide, 10);
    if (step >= 1 && step <= totalSteps) {
      updateStep(step);
    }
  });
});

btnCloseOnboarding.addEventListener("click", () => {
  finishOnboarding();
});
