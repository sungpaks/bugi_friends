const fs = require('fs');

// trace.json 읽기
const traceDataBefore = JSON.parse(
  fs.readFileSync('./Trace_Before.json', 'utf8'),
);

// 특정 이벤트 분석 함수
function analyzeTrace(data) {
  const events = data.traceEvents;

  // 관심 있는 이벤트 필터링 (예: Layout, Paint)
  const layoutEvents = events.filter(
    (event) => event.name === 'Layout' && event.ph === 'X',
  );
  const paintEvents = events.filter(
    (event) => event.name === 'Paint' && event.ph === 'X',
  );

  console.log(`Layout events: ${layoutEvents.length}`);
  console.log(`Paint events: ${paintEvents.length}`);

  // 평균 소요 시간 계산
  const layoutDuration =
    layoutEvents.reduce((sum, event) => sum + (event.dur || 0), 0) / 1000; // ms
  const paintDuration =
    paintEvents.reduce((sum, event) => sum + (event.dur || 0), 0) / 1000; // ms

  console.log(`Total Layout Duration: ${layoutDuration.toFixed(2)} ms`);
  console.log(`Total Paint Duration: ${paintDuration.toFixed(2)} ms`);

  // 전체 실행 시간 계산
  const totalTime =
    (events.reduce(
      (max, event) => Math.max(max, event.ts + (event.dur || 0)),
      0,
    ) -
      events.reduce((min, event) => Math.min(min, event.ts), Infinity)) /
    1000; // ms

  console.log(`Total Trace Time: ${(totalTime * 1000).toLocaleString()} ms`);

  // 단위시간당 이벤트 수 계산
  const layoutEventsPerSecond = layoutEvents.length / (totalTime / 1000);
  const paintEventsPerSecond = paintEvents.length / (totalTime / 1000);
  const layoutDurationPerSecond = layoutDuration / (totalTime / 1000);
  const paintDurationPerSecond = paintDuration / (totalTime / 1000);

  console.log(
    `Layout Events per second: ${layoutEventsPerSecond.toFixed(5)} events/s`,
  );
  console.log(
    `Paint Events per second: ${paintEventsPerSecond.toFixed(5)} events/s`,
  );
  console.log(
    `Average Layout Time per second: ${layoutDurationPerSecond.toFixed(5)} ms/s`,
  );
  console.log(
    `Average Paint Time per second: ${paintDurationPerSecond.toFixed(5)} ms/s`,
  );
}

// 분석 실행
console.log('--------------Before Start----------------');
analyzeTrace(traceDataBefore);
console.log('--------------Before End----------------');

const traceDataAfter = JSON.parse(
  fs.readFileSync('./Trace_After.json', 'utf8'),
);
console.log('--------------After Start----------------');
analyzeTrace(traceDataAfter);
console.log('--------------After End----------------');
