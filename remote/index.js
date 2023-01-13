
function main() {
  
  
  const getCenter = (elem) => {
    const rect = elem.getBoundingClientRect();
    return  [rect.x + rect.width / 2, rect.y + rect.height / 2];
  }
  
  const $ = (id) => document.getElementById(id);

  const sliderCenter = () => getCenter($("center"));

  const sliderPos = () => getCenter($("slider"));

  const sliderPosition = {
    start: null,
    index: null,
    selection: 'xboxInside'
  };

  const computeAngle = (reference) => {
    const origin = sliderCenter();
    const vector = [reference[0] - origin[0], reference[1] - origin[1]];
    const angle =  Math.atan2(vector[1], vector[0]);
    const roundedAngle = Math.round(angle/(Math.PI/32)) * (Math.PI/32)
    return roundedAngle;
  }

  slider.addEventListener('touchstart', (evt) => {
    sliderPosition.start = computeAngle(sliderPos());
    sliderPosition.prev = sliderPosition.start;
    sliderPosition.diff = 0;
  });

  const displayDbLevel = () => {
    let dbLevel = '';
    if (sliderPosition.diff > 0) {
      dbLevel = '+' + sliderPosition.diff;
    } else if (sliderPosition.diff < 0) {
      dbLevel = sliderPosition.diff;
    } else {
      dbLevel = '0';
    }

    const text = $("volume");
    text.textContent = dbLevel;

    const outerBox = $("panel").getBBox();

    const bbox = text.getBBox();
    text.setAttributeNS(null, "x", 32 - 32 * bbox.width / outerBox.width);
    text.setAttributeNS(null, "y", 32 + 16 * bbox.height / outerBox.height);
    setVisible('volume');
  }

  slider.addEventListener('touchmove', (evt) => {
    const reference = [evt.touches[0].clientX, evt.touches[0].clientY];
    const angle = computeAngle(reference);
    let delta = angle - sliderPosition.prev;
    if (delta < -Math.PI) {
      delta += 2 * Math.PI;
    } else if (delta > Math.PI) {
      delta -= 2 * Math.PI;
    }
    const unitDelta = Math.round(delta/(Math.PI/32));
    console.log("units: ", unitDelta);
    sliderPosition.diff += unitDelta;
    sliderPosition.prev = angle;

    displayDbLevel();

    console.log("db Change: ", sliderPosition.diff);


    const newPos = [32 + Math.cos(angle) * 27.4, 32 + Math.sin(angle) * 27.4];
    const slider = document.getElementById('slider');
    slider.cx.baseVal.value = newPos[0];
    slider.cy.baseVal.value = newPos[1];
  });
  slider.addEventListener('touchend', (evt) => {
    setVisible(sliderPosition.selection);
  });

  const setVisible = (selection) => {
    const elements = ['echoInside', 'xboxInside', 'vinylInside', 'volume'];
    const hiddenOnes = elements.filter((element) => element !== selection);
    hiddenOnes.forEach((element) => {
      document.getElementById(element).setAttributeNS(null, "visibility", 'hidden');
    });
    document.getElementById(selection).setAttributeNS(null, "visibility", 'visible');
  }

  document.getElementById('echoOutside').addEventListener('click', () => {
    sliderPosition.selection = 'echoInside'
    setVisible('echoInside');
  })
  document.getElementById('xboxOutside').addEventListener('click', () => {
    sliderPosition.selection = 'xboxInside'
    setVisible('xboxInside');
  })
  document.getElementById('vinylOutside').addEventListener('click', () => {
    sliderPosition.selection = 'vinylInside'
    setVisible('vinylInside');
  })
}

main();
