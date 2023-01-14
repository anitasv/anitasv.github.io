
const $ = (id) => document.getElementById(id);

const getCenter = (elem) => {
  const rect = elem.getBoundingClientRect();
  return  [rect.x + rect.width / 2, rect.y + rect.height / 2];
}

const dbPerCircle = 32;

const anglePerDB = Math.PI / (dbPerCircle / 2);

const computeAngle = (reference, origin) => {
  const vector = [reference[0] - origin[0], reference[1] - origin[1]];
  const angle =  Math.atan2(vector[1], vector[0]);
  const roundedAngle = Math.round(angle/anglePerDB) * anglePerDB
  return roundedAngle;
}


function updateUi(once, state, changedKeys) {

  const sliderCenter = once(() => getCenter($("center")));

  const sliderPos = once(() => getCenter($("slider")));

  const initialAngle = once(() => computeAngle(sliderPos, sliderCenter));

  const updateVolume = (diff) => {
    const dbLevel = diff == 0 ? '0' : (diff > 0 ? '+' + diff : diff);
    const text = $("volume");
    text.textContent = dbLevel;
    const outerBox = $("panel").getBBox();
    const bbox = text.getBBox();
    text.setAttributeNS(null, "x", 32 - 32 * bbox.width / outerBox.width);
    text.setAttributeNS(null, "y", 32 + 16 * bbox.height / outerBox.height);
  }

  const recoverAngle = (volumeLevel) => {
    return initialAngle + anglePerDB * volumeLevel;
  }

  const moveCircle = (elem, angle) => {
    const reportedPos =  [32 + Math.cos(angle) * 27.4, 32 + Math.sin(angle) * 27.4];
    elem.cx.baseVal.value = reportedPos[0];
    elem.cy.baseVal.value = reportedPos[1];
  }

  const updateSlider = (volume) => {
    moveCircle($('slider'), recoverAngle(volume));
  }

  const updateLagged = (reported) => {
    moveCircle($('lagged'), recoverAngle(reported));
  }

  const updatePowerColor = (powerState) => {
    const p = $('power');
    if (powerState === 'on') {
      p.classList.remove('poweroff');
      p.classList.add('poweron');
      setVisible('xboxInside')
    } else {
      p.classList.remove('poweron');
      p.classList.add('poweroff');
      setVisible('poweroff')
    }
  }

  const updateMuteColor = (muteState) => {
    const m = $('mute');
    if (muteState === 'on') {
      m.classList.remove('muteoff');
      m.classList.add('muteon');
    } else {
      m.classList.remove('muteon');
      m.classList.add('muteoff');
    }  
  };

  const setVisible = (visible) => {
    const elements = ['echoInside', 'xboxInside', 'vinylInside', 'volume', 'poweroff'];
    const hiddenOnes = elements.filter((element) => element !== visible);
    hiddenOnes.forEach((element) => {
      document.getElementById(element).setAttributeNS(null, "visibility", 'hidden');
    });
    document.getElementById(visible).setAttributeNS(null, "visibility", 'visible');
  }


  if (changedKeys.has("powerState")) {
    updatePowerColor(state.powerState);
  }
  if (changedKeys.has("muteState")) {
    updateMuteColor(state.muteState);
  }
  if (changedKeys.has("volume")) {
    updateSlider(state.volume);
  }
  if (changedKeys.has("reported")) {
    updateLagged(state.reported);
  }
  if (changedKeys.has("diff")) {
    updateVolume(state.diff);
  }
  if (changedKeys.has("visible")) {
    setVisible(state.visible);
  }
}

const radioEvents = [];

const callRadio = (command) => {
  console.log({command});
}

const updateRadio = (dispatch) => {
  setInterval(() => {
    dispatch((state) => {
      if (state.powerState !== state.reportedPower) {
        callRadio(state.powerState === 'on' ? 'poweron' : 'poweroff');
        return {
          reportedPower: state.powerState,
        }
      } else if (state.muteState !== state.reportedMute) {
        callRadio(state.muteState === 'on' ? 'muteon' : 'muteoff');
        return {
          reportedMute: state.muteState,
        }
      } else if (state.selection !== state.reportedSource) {
        callRadio('line_' + state.selection);
        return {
          reportedSource: state.selection,
        }
      } else if (state.volume != state.reported) {
        const diff = state.volume > state.reported ? 1 : -1;
        callRadio(diff == 1 ? 'volumeup' : 'volumedown');
        return {
          reported: state.reported + diff,
        }
      } else {
        return {};
      }
    })
  }, 100)
}

function handleEvents(dispatch) {
  const sliderCenter = () => getCenter($("center"));
  const sliderPos = () => getCenter($("slider"));

  $('slider').addEventListener('touchstart', (evt) => {
    dispatch((state) => {
      const startAngle = computeAngle(sliderPos(), sliderCenter());
      return {
        prev: startAngle,
        diff: 0,
        startVolume: state.volume,
        powerState: 'on',
        muteState: 'off',
        visible: 'volume'
      }
    })
    evt.preventDefault();
  });

  $('slider').addEventListener('touchmove', (evt) => {
    dispatch((state) => {
      const reference = [evt.touches[0].clientX, evt.touches[0].clientY];
      const angle = computeAngle(reference, sliderCenter());
      let delta = angle - state.prev;
      if (delta < -Math.PI) {
        delta += 2 * Math.PI;
      } else if (delta > Math.PI) {
        delta -= 2 * Math.PI;
      }
      const unitDelta = Math.round(delta/anglePerDB);
      const diff = state.diff + unitDelta;

      return {
        diff,
        prev: angle,
        volume: state.startVolume + diff,
        visible: 'volume'
      }
    })
    evt.preventDefault();
  });

  $('slider').addEventListener('touchend', (evt) => {
    dispatch((state) => {
      return {
        visible: state.selection + 'Inside'
      }
    });
    evt.preventDefault();
  });


  const selectInput = (source) => {
    dispatch((state) => {
      if (state.powerState === 'off') {
        // Turn on power.
        return {
          selection: source,
          powerState: 'on',
          muteState: 'off',
          visible: source + 'Inside'
        }
      } else {
        // Don't change mute state.
        return {
          selection: source,
          visible: source + 'Inside'
        }
      }
    });
  }

  $('echoOutside').addEventListener('click', () => {
    selectInput('echo');
  })
  $('xboxOutside').addEventListener('click', () => {
    selectInput('xbox');
  })
  $('vinylOutside').addEventListener('click', () => {
    selectInput('vinyl');
  })

  $('power').addEventListener('click', () => {
    dispatch((state) => ({ 
      powerState: state.powerState === 'off' ? 'on' : 'off',
      volume: state.reported,
      visible: state.powerState === 'off' ? state.selection + 'Inside' : 'poweroff'
    }))
  });

  $('mute').addEventListener('click', () => {
    dispatch((state) => ({
      volume: state.reported,
      muteState: state.muteState === 'off' ? 'on' : 'off'
    }))
  });
}

function main() {
  
  const state = {
    start: null,
    index: null,
    prev: null,
    diff: 0,
    startVolume: 0,
    volume: 0,
    reported: 0,
    selection: 'xbox',
    powerState: 'off',
    muteState: 'off',
    visible: 'poweroff'
  };

  const onceLexical = {
    state: [],
    index: 0
  };

  const firstOnce = (initFn) => {
    const result = initFn();
    onceLexical.state.push(result);
    return result;
  }

  updateUi(firstOnce, state, new Set(Object.keys(state)));

  const dispatch = (handler) => {
    const newState = handler(state)
    const changedKeys = new Set();
    for (const key in newState) {
      if (state[key] !== newState[key]) {
        changedKeys.add(key);
        state[key] = newState[key];
      }
    }

    let index = 0;
    const memoOnce = (ignore) => {
      return onceLexical.state[index++];
    }
    updateUi(memoOnce, state, changedKeys);
    onceLexical.initialized = true;
  }

  handleEvents(dispatch);
  updateRadio(dispatch);
}

main();
