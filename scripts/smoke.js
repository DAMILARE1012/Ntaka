import * as db from '@/services/mock/db';
import { QUESTION_BANKS, buildTest } from '@/services/mock/placement';
import { LANGUAGES_FULL } from '@/services/mock/catalog';

const stats = db.readPlatformStats();
console.log('stats', stats);

const t = db.listTeachers({ pageSize: 3 });
console.log('teachers total', t.total, '| first', t.items[0].name, t.items[0].languageName, t.items[0].rating, t.items[0].nextAvailable);

console.log('filter 72h+instant ->', db.listTeachers({ availableWithin72h: true, instantLesson: true }).total);
console.log('filter yoruba B1 ->', db.listTeachers({ languageId: 'yoruba', level: 'B1' }).total);

const c = db.listClasses({ pageSize: 2 });
console.log('classes total', c.total, '| first', c.items[0].title, c.items[0].level, c.items[0].seatsLeft, !!c.items[0].teacher);

const v = db.listVideos({ pageSize: 2 });
console.log('courses total', v.total, '| first', v.items[0].title, v.items[0].lessonCount, v.items[0].totalMinutes);

// every language must resolve and have a bench
for (const l of LANGUAGES_FULL) {
  const full = db.readLanguage(l.id);
  if (!full || full.teacherCount === 0 || full.courseCount === 0) {
    throw new Error(`language ${l.id} incomplete: teachers=${full?.teacherCount} courses=${full?.courseCount}`);
  }
}
console.log('all', LANGUAGES_FULL.length, 'languages have teachers + courses');

// detail readers
console.log('readTeacher', !!db.readTeacher(t.items[0].id), 'readClass', !!db.readClass(c.items[0].id), 'readVideo', !!db.readVideo(v.items[0].id));
console.log('missing id returns null ->', db.readTeacher('nope'), db.readLanguage('nope'));

// placement: perfect score and zero score for every authored bank
for (const [langId, bank] of Object.entries(QUESTION_BANKS)) {
  const perfect = Object.fromEntries(bank.map((q) => [q.id, q.answerId]));
  const wrong = Object.fromEntries(bank.map((q) => [q.id, q.options.find((o) => o.id !== q.answerId).id]));
  const hi = db.submitPlacement({ languageId: langId, answers: perfect, selfChecked: ['A1','A2','B1','B2','C1','C2'] });
  const lo = db.submitPlacement({ languageId: langId, answers: wrong, selfChecked: [] });
  console.log(`${langId.padEnd(9)} perfect=${hi.level} (${hi.score}/${hi.maxScore}) zero=${lo.level} (${lo.score}/${lo.maxScore}) recs=${hi.recommendedTeachers.length}/${hi.recommendedClasses.length}/${hi.recommendedCourses.length}`);
  if (hi.level !== 'C2' || lo.level !== 'A1') throw new Error(`scoring out of range for ${langId}`);
}

// self-assessment route
const selfTest = buildTest('lingala');
const selfResult = db.submitPlacement({ languageId: 'lingala', selfChecked: ['A1','A2','B1'] });
console.log('lingala mode', selfTest.mode, '-> level', selfResult.level, 'recs', selfResult.recommendedTeachers.length);
if (selfTest.mode !== 'self' || selfResult.level !== 'B1') throw new Error('self-assessment route wrong');

// heritage-speaker adjustment: weak quiz + strong self-check nudges up one level
const adj = db.submitPlacement({
  languageId: 'igbo',
  answers: Object.fromEntries(QUESTION_BANKS.igbo.slice(0, 2).map((q) => [q.id, q.answerId])),
  selfChecked: ['A1','A2','B1','B2'],
});
console.log('heritage adjust: quiz', adj.quizLevel, '-> final', adj.level, `(${adj.confidence})`);

console.log('\nSMOKE OK');
