
function main() {
  
  const state = {
    start: null,
    index: null,
    prev: null,
    diff: 0,
    startVolume: 0,
    volume: 0,
    reported: 0,
    selection: 'xboxInside',
    powerState: 'off',
    muteState: 'off',
  };

  const getCenter = (elem) => {
    const rect = elem.getBoundingClientRect();
    return  [rect.x + rect.width / 2, rect.y + rect.height / 2];
  }
  
  const $ = (id) => document.getElementById(id);
  const sliderCenter = () => getCenter($("center"));

  const sliderPos = () => getCenter($("slider"));

  const dbPerCircle = 32;
  const anglePerDB = Math.PI / (dbPerCircle/2);

  const computeAngle = (reference) => {
    const origin = sliderCenter();
    const vector = [reference[0] - origin[0], reference[1] - origin[1]];
    const angle =  Math.atan2(vector[1], vector[0]);
    const roundedAngle = Math.round(angle/anglePerDB) * anglePerDB
    return roundedAngle;
  }

  const initialAngle = computeAngle(sliderPos());

  slider.addEventListener('touchstart', (evt) => {
    state.start = computeAngle(sliderPos());
    state.prev = state.start;
    state.diff = 0;
    state.startVolume = state.volume;
    state.powerState = 'on';
    state.muteState = 'off';
    updatePowerColor();
    updateMuteColor();
    evt.preventDefault();
  });


  const displayDbLevel = () => {
    let dbLevel = '';
    if (state.diff > 0) {
      dbLevel = '+' + state.diff;
    } else if (state.diff < 0) {
      dbLevel = state.diff;
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

  const moveCircle = (elem, angle) => {
    const reportedPos =  [32 + Math.cos(angle) * 27.4, 32 + Math.sin(angle) * 27.4];
    elem.cx.baseVal.value = reportedPos[0];
    elem.cy.baseVal.value = reportedPos[1];
  }

  const recoverAngle = (volumeLevel) => {
    return initialAngle + anglePerDB * volumeLevel;
  }

  setInterval(() => {
    if (state.volume != state.reported) {
      if (state.volume > state.reported) {
        state.reported++;
      } else {
        state.reported--;
      }
      moveCircle($('lagged'), recoverAngle(state.reported))
    }
  }, 100);

  slider.addEventListener('touchmove', (evt) => {
    const reference = [evt.touches[0].clientX, evt.touches[0].clientY];
    const angle = computeAngle(reference);
    let delta = angle - state.prev;
    if (delta < -Math.PI) {
      delta += 2 * Math.PI;
    } else if (delta > Math.PI) {
      delta -= 2 * Math.PI;
    }
    const unitDelta = Math.round(delta/anglePerDB);
    state.diff += unitDelta;
    state.prev = angle;
    state.volume = state.startVolume + state.diff;

    displayDbLevel();

    moveCircle($('slider'), angle);

    evt.preventDefault();
  });
  slider.addEventListener('touchend', (evt) => {
    setVisible(state.selection);
    evt.preventDefault();
  });

  const setVisible = (selection) => {
    const elements = ['echoInside', 'xboxInside', 'vinylInside', 'volume', 'poweroff'];
    const hiddenOnes = elements.filter((element) => element !== selection);
    hiddenOnes.forEach((element) => {
      document.getElementById(element).setAttributeNS(null, "visibility", 'hidden');
    });
    document.getElementById(selection).setAttributeNS(null, "visibility", 'visible');
  }

  $('echoOutside').addEventListener('click', () => {
    state.selection = 'echoInside'
    state.powerState = 'on';
    updatePowerColor()
    setVisible(state.selection);
  })
  $('xboxOutside').addEventListener('click', () => {
    state.selection = 'xboxInside'
    state.powerState = 'on';
    updatePowerColor()
    setVisible(state.selection);
  })
  $('vinylOutside').addEventListener('click', () => {
    state.selection = 'vinylInside'
    state.powerState = 'on';
    updatePowerColor()
    setVisible(state.selection);
  })

  const updatePowerColor = () => {
    const p = $('power');
    if (state.powerState === 'on') {
      p.classList.remove('poweroff');
      p.classList.add('poweron');
      setVisible('xboxInside')
    } else {
      p.classList.remove('poweron');
      p.classList.add('poweroff');
      setVisible('poweroff')
    }
  }

  const stopVolumeUpdates = () => {
    if (state.reported != state.volume) {
      state.volume = state.reported;
      moveCircle($('slider'), recoverAngle(state.volume));
    }
  }

  $('power').addEventListener('click', () => {
    if (state.powerState === 'off') {
      state.powerState = 'on';
    } else {
      state.powerState = 'off';
      stopVolumeUpdates();
    }  
    updatePowerColor();
  });

  const updateMuteColor = () => {
    const m = $('mute');
    if (state.muteState === 'on') {
      m.classList.remove('muteoff');
      m.classList.add('muteon');
      stopVolumeUpdates();
    } else {
      m.classList.remove('muteon');
      m.classList.add('muteoff');
    }  
  };

  $('mute').addEventListener('click', () => {
    if (state.muteState === 'off') {
      state.muteState = 'on';
    } else {
      state.muteState = 'off';
    }  
    updateMuteColor();
  });
}

main();
