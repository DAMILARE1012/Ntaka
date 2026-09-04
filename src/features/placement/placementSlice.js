import { createSlice } from '@reduxjs/toolkit';

/**
 * Wizard state for the free placement check.
 *
 * Stage order:
 *   language -> background -> quiz -> writing -> speaking -> self -> result
 *
 * Speaking and writing may be skipped: a learner on a locked-down machine with no
 * microphone must still be able to finish, and a partial result with a stated confidence
 * is worth more than no result at all.
 */
const initialState = {
  stage: 'language',
  languageId: '',
  cursor: 0, // index within the current stage's list
  background: {},
  answers: {},
  writingResponse: '',
  /** promptId -> { promptId, durationMs, url, size } */
  recordings: {},
  skipped: [],
  selfChecked: [],
  result: null,
};

const placementSlice = createSlice({
  name: 'placement',
  initialState,
  reducers: {
    chooseLanguage(state, { payload }) {
      state.languageId = payload;
      state.stage = 'background';
      state.cursor = 0;
      state.background = {};
      state.answers = {};
      state.writingResponse = '';
      state.recordings = {};
      state.skipped = [];
      state.selfChecked = [];
      state.result = null;
    },
    answerBackground(state, { payload: { questionId, optionId } }) {
      state.background[questionId] = optionId;
    },
    answerQuestion(state, { payload: { questionId, optionId } }) {
      state.answers[questionId] = optionId;
    },
    setWriting(state, { payload }) {
      state.writingResponse = payload;
    },
    setRecording(state, { payload: { promptId, recording } }) {
      if (recording) state.recordings[promptId] = recording;
      else delete state.recordings[promptId];
    },
    skipTask(state, { payload }) {
      if (!state.skipped.includes(payload)) state.skipped.push(payload);
    },
    toggleSelfStatement(state, { payload }) {
      state.selfChecked = state.selfChecked.includes(payload)
        ? state.selfChecked.filter((l) => l !== payload)
        : [...state.selfChecked, payload];
    },
    goToStage(state, { payload }) {
      state.stage = payload;
      state.cursor = 0;
    },
    next(state) {
      state.cursor += 1;
    },
    back(state) {
      state.cursor = Math.max(0, state.cursor - 1);
    },
    setCursor(state, { payload }) {
      state.cursor = payload;
    },
    setResult(state, { payload }) {
      state.result = payload;
      state.stage = 'result';
    },
    restart() {
      return initialState;
    },
  },
});

export const {
  chooseLanguage,
  answerBackground,
  answerQuestion,
  setWriting,
  setRecording,
  skipTask,
  toggleSelfStatement,
  goToStage,
  next,
  back,
  setCursor,
  setResult,
  restart,
} = placementSlice.actions;

export const selectPlacement = (state) => state.placement;

export default placementSlice.reducer;
