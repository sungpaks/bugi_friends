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
    parseInt(data.metadata.modifications.initialBreadcrumb.window.range) / 1000; // ms

  console.log(`Total Trace Time: ${totalTime.toLocaleString()} ms`);
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
