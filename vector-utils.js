function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}
function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}
function mul(a, s) {
  return { x: a.x * s, y: a.y * s };
}
function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}
function norm(a) {
  return Math.hypot(a.x, a.y);
}

function performCollision(c1x, c1y, c2x, c2y, v1x, v1y, v2x, v2y) {
  const c1 = { x: c1x, y: c1y };
  const c2 = { x: c2x, y: c2y };
  const v1 = { x: v1x, y: v1y };
  const v2 = { x: v2x, y: v2y };

  const d = sub(c1, c2);
  const normalVectorLength = norm(d);
  const unitNormalVector = {
    x: d.x / normalVectorLength,
    y: d.y / normalVectorLength,
  };

  const relativeVelocity = sub(v1, v2);
  const relativeVelocityAlongNormal = dot(relativeVelocity, unitNormalVector);

  const newV1 = sub(v1, mul(unitNormalVector, relativeVelocityAlongNormal));
  const newV2 = add(v2, mul(unitNormalVector, relativeVelocityAlongNormal));

  return { v1x: newV1.x, v1y: newV1.y, v2x: newV2.x, v2y: newV2.y };
}

function checkCollision(c1x, c1y, c2x, c2y, r1, r2) {
  const d = Math.hypot(c2x - c1x, c2y - c1y);
  return d <= r1 + r2;
}
