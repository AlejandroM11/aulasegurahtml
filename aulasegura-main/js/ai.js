/* ai.js
 * Red neuronal simple con TensorFlow.js para entrenamiento progresivo.
 * Este módulo guarda ejemplos en localStorage y permite reentrenar
 * el modelo a partir de los datos almacenados.
 *
 * Uso básico desde otro archivo:
 *   await AI.init();
 *   AI.addTrainingExample('texto', 'correcto');
 *   await AI.train();
 *   const resultado = await AI.predict('texto');
 */

(function (window) {
  if (!window.tf) {
    console.warn('TensorFlow.js no está cargado. Asegúrate de incluir el script de tf.js antes de ai.js.');
  }

  const STORAGE_KEYS = {
    trainingData: 'aiTrainingData',
    vocab: 'aiTextVocab',
    labels: 'aiLabelMap',
  };

  const state = {
    vocabSize: 50,
    trainingData: [],
    vocab: {},
    labelMap: {},
    inverseLabelMap: {},
    model: null,
    initialized: false,
  };

  function safeJSONParse(value, fallback) {
    try {
      return JSON.parse(value || 'null') || fallback;
    } catch (err) {
      return fallback;
    }
  }

  function cleanText(text) {
    if (typeof text !== 'string') return '';
    return text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9ñáéíóúü\s]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  function buildVocabulary() {
    const frequency = {};
    state.trainingData.forEach(item => {
      const words = cleanText(item.text).split(' ').filter(Boolean);
      words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
      });
    });

    const sortedWords = Object.keys(frequency)
      .sort((a, b) => frequency[b] - frequency[a])
      .slice(0, state.vocabSize);

    state.vocab = {};
    sortedWords.forEach((word, index) => {
      state.vocab[word] = index;
    });
  }

  function encodeText(text) {
    const vector = Array(state.vocabSize).fill(0);
    const words = cleanText(text).split(' ').filter(Boolean);
    words.forEach(word => {
      const index = state.vocab[word];
      if (index !== undefined) {
        vector[index] += 1;
      }
    });
    const total = vector.reduce((sum, value) => sum + value, 0);
    return total > 0 ? vector.map(value => value / total) : vector;
  }

  function ensureLabelMaps() {
    const labels = Array.from(new Set(state.trainingData.map(item => item.label || 'sin-etiqueta')));
    state.labelMap = {};
    state.inverseLabelMap = {};
    labels.forEach((label, index) => {
      state.labelMap[label] = index;
      state.inverseLabelMap[index] = label;
    });
  }

  function createModel(numClasses) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [state.vocabSize], units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));

    model.compile({
      optimizer: tf.train.adam(),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  function saveStorage() {
    localStorage.setItem(STORAGE_KEYS.trainingData, JSON.stringify(state.trainingData));
    localStorage.setItem(STORAGE_KEYS.vocab, JSON.stringify(state.vocab));
    localStorage.setItem(STORAGE_KEYS.labels, JSON.stringify(state.labelMap));
  }

  function loadStorage() {
    state.trainingData = safeJSONParse(localStorage.getItem(STORAGE_KEYS.trainingData), []);
    state.vocab = safeJSONParse(localStorage.getItem(STORAGE_KEYS.vocab), {});
    state.labelMap = safeJSONParse(localStorage.getItem(STORAGE_KEYS.labels), {});
    state.inverseLabelMap = Object.entries(state.labelMap).reduce((acc, [label, index]) => {
      acc[index] = label;
      return acc;
    }, {});
  }

  const AI = {
    async init(options = {}) {
      state.vocabSize = options.vocabSize || state.vocabSize;
      loadStorage();
      if (state.trainingData.length > 0 && Object.keys(state.vocab).length === 0) {
        buildVocabulary();
      }
      ensureLabelMaps();
      state.initialized = true;
    },

    getTrainingData() {
      return [...state.trainingData];
    },

    addTrainingExample(text, label) {
      if (!text || typeof text !== 'string') {
        throw new Error('Texto de entrada inválido. Debe ser una cadena.');
      }
      if (!label || typeof label !== 'string') {
        throw new Error('Etiqueta inválida. Debe ser una cadena.');
      }
      state.trainingData.push({ text: text.trim(), label: label.trim() });
      saveStorage();
    },

    async train(options = {}) {
      if (!state.initialized) {
        await this.init(options);
      }
      if (state.trainingData.length === 0) {
        throw new Error('No hay datos de entrenamiento. Usa AI.addTrainingExample(...) primero.');
      }

      buildVocabulary();
      ensureLabelMaps();
      saveStorage();

      const numClasses = Object.keys(state.labelMap).length;
      const xs = state.trainingData.map(item => encodeText(item.text));
      const ys = state.trainingData.map(item => state.labelMap[item.label]);
      const xTensor = tf.tensor2d(xs);
      const yTensor = tf.oneHot(tf.tensor1d(ys, 'int32'), numClasses);

      if (state.model) {
        state.model.dispose();
        state.model = null;
      }
      state.model = createModel(numClasses);

      await state.model.fit(xTensor, yTensor, {
        epochs: options.epochs || 20,
        batchSize: options.batchSize || 8,
        shuffle: true,
      });

      xTensor.dispose();
      yTensor.dispose();
    },

    async predict(text) {
      if (!state.initialized) {
        await this.init();
      }
      if (!state.model) {
        throw new Error('El modelo no está entrenado. Ejecuta AI.train() antes de predecir.');
      }

      const vector = encodeText(text);
      const tensor = tf.tensor2d([vector]);
      const prediction = state.model.predict(tensor);
      const scores = prediction.dataSync();
      tensor.dispose();
      prediction.dispose();

      const formatted = Array.from(scores).map((score, index) => ({
        label: state.inverseLabelMap[index] || 'desconocido',
        score: Number(score.toFixed(4)),
      }));
      formatted.sort((a, b) => b.score - a.score);

      return {
        text,
        predictedLabel: formatted[0]?.label || null,
        scores: formatted,
      };
    },

    clearTrainingData() {
      state.trainingData = [];
      state.vocab = {};
      state.labelMap = {};
      state.inverseLabelMap = {};
      state.model = null;
      saveStorage();
    },
  };

  window.AI = AI;
})(window);
