const rollDie = (range) => {
  let x;
  const max = Math.floor(2**32/range) * range; 
  do {
    x = Math.floor(Math.random() * 2**32); 
  } while(x >= max); 
  return (x % range) + 1;
}

const averageRoll2 = (numRolls, dieSize) => {
  let arr = [];
  for (let i = numRolls; i > 0; i --) arr.push(rollDie(dieSize));
  return { average: arr.reduce((a,v) => a + v, 0)/numRolls, rolls: arr };
}
const averageRoll = async (numRolls, dieSize) => {
  let total = 0;
  for (let i = numRolls; i > 0; i --) total += rollDie(dieSize);
  return total/numRolls;
}

let counter = 0;
let minAvg = 20;
const target = 9.5;
let breakRoll = null;

const averageCluster = async (clusterSize, dieSize) => {
  const arr = Array(clusterSize).fill(averageRoll);
  let clusterMin = 20;
  await Promise.all(arr.map(async v => {
    const avg = await v(1000, dieSize);
    clusterMin = Math.min(avg,clusterMin);
  }));
  minAvg = Math.min(clusterMin, minAvg);
  if (minAvg <= target) breakRoll = breakRoll ?? minAvg;
  counter += clusterSize;
}

const asyncGo = async (clusterSize) => {
  const start = Date.now();
  do {
    await Promise.all([
      averageCluster(clusterSize,20),
      averageCluster(clusterSize,20),
      averageCluster(clusterSize,20),
      averageCluster(clusterSize,20),
      averageCluster(clusterSize,20),
      averageCluster(clusterSize,20),
      averageCluster(clusterSize,20),
      averageCluster(clusterSize,20),
      averageCluster(clusterSize,20),
      averageCluster(clusterSize,20),
    ]);
    console.log(`${counter.toLocaleString()} groups have been rolled.`);
    if (counter%100000===0) console.log(`${(Date.now() - start)}ms for the last 100,000 groups.`);
  } while(!breakRoll)
  console.log(`After ${counter.toLocaleString()} rolls of 1000d20, achieved an average of ${minAvg}`);
}

asyncGo(1000);