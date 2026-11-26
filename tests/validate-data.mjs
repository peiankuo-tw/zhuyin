import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const dataDir = path.resolve(process.cwd(), 'data');
const indexPath = path.join(dataDir, 'index.json');

assert.ok(fs.existsSync(indexPath), 'data/index.json must exist');
const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

assert.ok(Array.isArray(indexData.publishers), 'publishers must be an array');
assert.equal(indexData.publishers.length, 3, 'must have exactly 3 publishers');

const expectedIds = ['kangxuan', 'nanyi', 'hanlin'];
const cjkRegex = /^[\u4E00-\u9FFF]+$/;
let totalLessons = 0;
let totalChars = 0;

for (const pubId of expectedIds) {
  const pub = indexData.publishers.find((p) => p.id === pubId);
  assert.ok(pub, `missing publisher ${pubId}`);
  assert.deepEqual(pub.grades, [1, 2, 3, 4, 5, 6], `${pubId} must have grades 1..6`);

  for (const grade of pub.grades) {
    const filePath = path.join(dataDir, `${pubId}-${grade}.json`);
    assert.ok(fs.existsSync(filePath), `missing ${pubId}-${grade}.json`);
    const gradeData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    assert.equal(gradeData.publisher, pubId);
    assert.equal(gradeData.grade, grade);
    assert.ok(gradeData.semesters && typeof gradeData.semesters === 'object');

    for (const sem of ['1', '2']) {
      const lessons = gradeData.semesters[sem];
      assert.ok(Array.isArray(lessons) && lessons.length >= 6, `${pubId}-${grade} sem ${sem} must have at least 6 lessons`);
      for (const lesson of lessons) {
        assert.equal(typeof lesson.lesson, 'number');
        assert.ok(typeof lesson.title === 'string' && lesson.title.trim().length > 0);
        assert.ok(typeof lesson.chars === 'string' && lesson.chars.length >= 6, `${pubId}-${grade} S${sem} L${lesson.lesson} chars too short`);
        assert.match(lesson.chars, cjkRegex, `${pubId}-${grade} S${sem} L${lesson.lesson} contains non-CJK chars: ${lesson.chars}`);
        totalLessons++;
        totalChars += lesson.chars.length;
      }
    }
  }
}

console.log(`PASS: Verified 3 publishers × 6 grades (18 files), ${totalLessons} lessons, ${totalChars} character entries.`);
