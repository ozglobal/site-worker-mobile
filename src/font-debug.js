// Temporary debugging code to check fonts
const checkFont = () => {
  const element = document.querySelector('body');
  const computedStyle = window.getComputedStyle(element);
  const fontFamily = computedStyle.fontFamily;
  console.log('Current font-family:', fontFamily);

  // Also check a specific element like the nav text
  const navText = document.querySelector('nav span');
  if (navText) {
    const navFont = window.getComputedStyle(navText).fontFamily;
    console.log('Nav text font-family:', navFont);
  }
};

// Run on page load
checkFont();