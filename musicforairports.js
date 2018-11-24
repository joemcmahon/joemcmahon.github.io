'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var SAMPLE_LIBRARY = {
  'Grand Piano': [{ note: 'A', octave: 4, file: 'Samples/Grand Piano/piano-f-a4.wav' }, { note: 'A', octave: 5, file: 'Samples/Grand Piano/piano-f-a5.wav' }, { note: 'A', octave: 6, file: 'Samples/Grand Piano/piano-f-a6.wav' }, { note: 'C', octave: 4, file: 'Samples/Grand Piano/piano-f-c4.wav' }, { note: 'C', octave: 5, file: 'Samples/Grand Piano/piano-f-c5.wav' }, { note: 'C', octave: 6, file: 'Samples/Grand Piano/piano-f-c6.wav' }, { note: 'D#', octave: 4, file: 'Samples/Grand Piano/piano-f-d#4.wav' }, { note: 'D#', octave: 5, file: 'Samples/Grand Piano/piano-f-d#5.wav' }, { note: 'D#', octave: 6, file: 'Samples/Grand Piano/piano-f-d#6.wav' }, { note: 'F#', octave: 4, file: 'Samples/Grand Piano/piano-f-f#4.wav' }, { note: 'F#', octave: 5, file: 'Samples/Grand Piano/piano-f-f#5.wav' }, { note: 'F#', octave: 6, file: 'Samples/Grand Piano/piano-f-f#6.wav' }]
};

var OCTAVE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

var LOOPS = [{ instrument: 'Grand Piano', note: 'Bb1', duration: 20.0, delay: 10.0 }, { instrument: 'Grand Piano', note: 'Db2', duration: 20.0, delay: 0.0 }, { instrument: 'Grand Piano', note: 'F3', duration: 24.1, delay: 3.1 }, { instrument: 'Grand Piano', note: 'Ab3', duration: 25.0, delay: 1.2 }, { instrument: 'Grand Piano', note: 'Bb3', duration: 20.9, delay: 13.7 }, { instrument: 'Grand Piano', note: 'C4', duration: 17.4, delay: 8.1 }, { instrument: 'Grand Piano', note: 'F4', duration: 19.7, delay: 4 }, { instrument: 'Grand Piano', note: 'Gb4', duration: 20.9, delay: 13.1 }, { instrument: 'Grand Piano', note: 'Ab4', duration: 17.8, delay: 8.1 }, { instrument: 'Grand Piano', note: 'C5', duration: 21.3, delay: 5.6 }, { instrument: 'Grand Piano', note: 'Db5', duration: 18.5, delay: 12.6 }, { instrument: 'Grand Piano', note: 'Eb5', duration: 20.0, delay: 9.2 }, { instrument: 'Grand Piano', note: 'F5', duration: 20.0, delay: 14.1 }, { instrument: 'Grand Piano', note: 'Ab5', duration: 17.7, delay: 3.1 }, { instrument: 'Grand Piano', note: 'Bb5', duration: 22.7, delay: 9.1 }];

var LANE_COLOR = 'rgba(0, 0, 0, 0.3)';

function trackColor(min, max, val) {
  var minHue = 359,
      maxHue = 0;
  var curPercent = (val - min) / (max - min);
  var colString = "hsla(" + (curPercent * (maxHue - minHue) + minHue) + ",100%,60%, 1.0)";
  return colString;
}

var sampleCache = {};
var audioContext = new AudioContext();

function fetchSample(path) {
  sampleCache[path] = sampleCache[path] || fetch(encodeURIComponent(path)).then(function (response) {
    return response.arrayBuffer();
  }).then(function (arrayBuffer) {
    return audioContext.decodeAudioData(arrayBuffer);
  });
  return sampleCache[path];
}

function noteValue(note, octave) {
  return octave * 12 + OCTAVE.indexOf(note);
}

function getNoteDistance(note1, octave1, note2, octave2) {
  return noteValue(note1, octave1) - noteValue(note2, octave2);
}

function getNearestSample(sampleBank, note, octave) {
  var sortedBank = sampleBank.slice().sort(function (sampleA, sampleB) {
    var distanceToA = Math.abs(getNoteDistance(note, octave, sampleA.note, sampleA.octave));
    var distanceToB = Math.abs(getNoteDistance(note, octave, sampleB.note, sampleB.octave));
    return distanceToA - distanceToB;
  });
  return sortedBank[0];
}

function flatToSharp(note) {
  switch (note) {
    case 'Bb':
      return 'A#';
    case 'Db':
      return 'C#';
    case 'Eb':
      return 'D#';
    case 'Gb':
      return 'F#';
    case 'Ab':
      return 'G#';
    default:
      return note;
  }
}

function getSample(instrument, noteAndOctave) {
  var _$exec = /^(\w[b\#]?)(\d)$/.exec(noteAndOctave),
      _$exec2 = _slicedToArray(_$exec, 3),
      requestedNote = _$exec2[1],
      requestedOctave = _$exec2[2];

  requestedOctave = parseInt(requestedOctave, 10);
  requestedNote = flatToSharp(requestedNote);
  var sampleBank = SAMPLE_LIBRARY[instrument];
  var nearestSample = getNearestSample(sampleBank, requestedNote, requestedOctave);
  return fetchSample(nearestSample.file).then(function (audioBuffer) {
    return {
      audioBuffer: audioBuffer,
      distance: getNoteDistance(requestedNote, requestedOctave, nearestSample.note, nearestSample.octave)
    };
  });
}

function playSample(instrument, note, destination) {
  var delaySeconds = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

  getSample(instrument, note).then(function (_ref) {
    var audioBuffer = _ref.audioBuffer,
        distance = _ref.distance;

    var playbackRate = Math.pow(2, distance / 12);
    var bufferSource = audioContext.createBufferSource();

    bufferSource.buffer = audioBuffer;
    bufferSource.playbackRate.value = playbackRate;

    bufferSource.connect(destination);
    bufferSource.start(audioContext.currentTime + delaySeconds);
  });
}

function startLoop(_ref2, scaling, nextNode) {
  var instrument = _ref2.instrument,
      note = _ref2.note,
      duration = _ref2.duration,
      delay = _ref2.delay;

  playSample(instrument, note, nextNode, delay * scaling);
  return setInterval(function () {
    return playSample(instrument, note, nextNode, delay * scaling);
  }, duration * 1000 * scaling);
}
function airport(config) {
  function render() {
    context.clearRect(0, 0, 2000, 2000);

    context.strokeStyle = '#888';
    context.lineWidth = 5;
    context.moveTo(1000, 1000);
    context.lineTo(2000, 1000);
    context.stroke();

    context.lineCap = 'round';
    var reduction = Math.floor(980 / LOOPS.length);
    context.lineWidth = reduction - 10;
    var radius = reduction * LOOPS.length;
    var i = LOOPS.length;
    var baseColor = 255;
    var colorOffset = Math.floor(255 / LOOPS.length);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = LOOPS[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _step$value = _step.value,
            duration = _step$value.duration,
            delay = _step$value.delay;

        var size = Math.PI * 2 / duration;
        var offset = (playingSince ? audioContext.currentTime - playingSince : 0) / config.scaling;
        var startAt = (delay - offset) * size;
        var endAt = (delay + 0.01 - offset) * size;

        context.strokeStyle = LANE_COLOR;
        context.beginPath();
        context.arc(1000, 1000, radius, 0, 2 * Math.PI);
        context.stroke();

        context.strokeStyle = trackColor(0, LOOPS.length, i);
        context.beginPath();
        context.arc(1000, 1000, radius, startAt, endAt);
        context.stroke();

        radius -= reduction;
        i -= 1;
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    if (playingSince) {
      requestAnimationFrame(render);
    } else {
      context.fillStyle = 'rgba(0, 0, 0, 0.3)';
      context.strokeStyle = 'rgba(0, 0, 0, 0)';
      context.beginPath();
      context.moveTo(800, 800);
      context.lineTo(800, 1200);
      context.lineTo(1300, 1000);
      context.lineTo(800, 800);
      context.fill();
    }
  }

  // Control variable, set to start time when playing begins
  var playingSince = null;

  var canvas = document.getElementById(config.canvasName);
  var context = canvas.getContext('2d');

  fetchSample('Samples/balance-mastering-teufelsberg-IR-06-norm-2x-44100-24bit.wav').then(function (convolverBuffer) {

    var convolver = void 0,
        runningLoops = void 0;
    var gainNode = audioContext.createGain();

    canvas.addEventListener('click', function () {
      if (playingSince) {
        gainNode.gain.value = 0;
        convolver.disconnect();
        runningLoops.forEach(function (l) {
          return clearInterval(l);
        });
        playingSince = null;
      } else {
        convolver = audioContext.createConvolver();
        convolver.buffer = convolverBuffer;
        convolver.connect(gainNode);
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = 0.1;
        playingSince = audioContext.currentTime;
        runningLoops = LOOPS.map(function (loop) {
          return startLoop(loop, config.scaling, convolver);
        });
      }
      render();
    });

    render();
  });
}

airport({ canvasName: 'music-for-airports', scaling: 1.5 });