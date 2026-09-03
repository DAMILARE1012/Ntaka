import { createSlice } from '@reduxjs/toolkit';

/**
 * Wizard state for the free placement check.
 * Stage order: language -> background -> questions (quiz or self-assessment) -> result.
 */
const initialState = {
  stage: 'language',
  languageId: '',
  cursor: 0, // index within the current stage's question list
  background: {},
  answers: {},
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
      state.selfChecked = [];
      state.result = null;
    },
    answerBackground(state, { payload: { questionId, optionId } }) {
      state.background[questionId] = optionId;
    },
    answerQuestion(state, { payload: { questionId, optionId } }) {
      state.answers[questionId] = optionId;
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
