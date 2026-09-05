import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildSimulatedRawNeuralFrame, sortSpatialSpikes} from '../../../prototype/lib/spike-sorter.mjs';
import {runPlaintextLinearClassifier} from '../../../prototype/lib/classifier.mjs';
const raw=buildSimulatedRawNeuralFrame();
const sorted=sortSpatialSpikes(raw);
const classified=runPlaintextLinearClassifier(sorted.eventWindow);
const sampleMap=new Map(raw.electrodeMap.map(x=>[x.electrodeId,x.unitId]));
const fixture={source:'existing repository deterministic raw fixture',
 samples:raw.rawNeuralSamples.map(x=>[sampleMap.get(x.electrodeId),x.timestampUs,x.amplitude]).sort((a,b)=>a[1]-b[1]),
 expected:sorted.eventWindow.values.flat(),scores:classified.scores};
const out=path.join(path.dirname(fileURLToPath(import.meta.url)),'../verification/repository_fixture.json');
fs.writeFileSync(out,JSON.stringify(fixture,null,2));
console.log(JSON.stringify({samples:fixture.samples.length,nonzero:fixture.expected.filter(x=>x>0).length,scores:fixture.scores}));
