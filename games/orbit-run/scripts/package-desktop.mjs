import {packager} from '@electron/packager';
import {readFile} from 'node:fs/promises';
const packageInfo=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const windows=process.argv.includes('--win');
const paths=await packager({dir:'.',out:'releases',name:'Orbit Run',appBundleId:'com.orbitrun.expedition',platform:windows?'win32':process.platform,arch:windows?'x64':process.arch,electronVersion:packageInfo.devDependencies.electron,overwrite:true,asar:true,prune:true,
  ignore:[/^\/releases(?:\/|$)/,/^\/tests(?:\/|$)/,/^\/docs(?:\/|$)/,/^\/scripts(?:\/|$)/,/^\/dev_server\.py$/,/^\/README\.md$/],
  win32metadata:{CompanyName:'Orbit Run',FileDescription:'Orbit Run — The Third Ring',ProductName:'Orbit Run'}});
console.log(paths.join('\n'));
