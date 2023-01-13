
function main() {
  

  const sliderCenter = () => {
    const center = document.getElementById('center');
    const centerRect = center.getBoundingClientRect();
    const centerPos = [centerRect.x + centerRect.width / 2, centerRect.y + centerRect.height / 2];
    return centerPos;
  }

  slider.addEventListener('touchstart', (evt) => {});
  slider.addEventListener('touchmove', (evt) => {
    const sliderStart = sliderCenter();
    const touchPos = [evt.touches[0].clientX - sliderStart[0], evt.touches[0].clientY - sliderStart[1]];
    // console.log("touch", [evt.touches[0].pageX, evt.touches[0].pageY])
    // console.log("center", [sliderStart[0], sliderStart[1]])
    // console.log("radvec", [touchPos[0], touchPos[1]])
    let angle = Math.atan2(touchPos[1], touchPos[0]);
    angle = Math.round(angle/(Math.PI/32)) * (Math.PI/32)
    const newPos = [32 + Math.cos(angle) * 27.4, 32 + Math.sin(angle) * 27.4];
    const slider = document.getElementById('slider');
    slider.cx.baseVal.value = newPos[0];
    slider.cy.baseVal.value = newPos[1];
  });
  slider.addEventListener('touchend', (evt) => {
  });

  const setVisible = (selection) => {
    const elements = ['echoInside', 'xboxInside', 'vinylInside'];
    const hiddenOnes = elements.filter((element) => element !== selection);
    hiddenOnes.forEach((element) => {
      document.getElementById(element).setAttributeNS(null, "visibility", 'hidden');
    });
    document.getElementById(selection).setAttributeNS(null, "visibility", 'visible');
  }

  document.getElementById('echoOutside').addEventListener('click', () => {
    setVisible('echoInside');
  })
  document.getElementById('xboxOutside').addEventListener('click', () => {
    setVisible('xboxInside');
  })
  document.getElementById('vinylOutside').addEventListener('click', () => {
    setVisible('vinylInside');
  })
}

main();
