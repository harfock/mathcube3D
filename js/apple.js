import { THREE, scene } from './three-setup.js';
import { progress } from './progress.js';
import { dom } from './dom.js';
let appleGeo=null,appleMat=null,stemGeo=null,stemMat=null,leafGeo=null,leafMat=null;
export function initAppleAssets(){
    if(appleGeo)return;
    const prof=[[0.02,-0.52],[0.16,-0.60],[0.34,-0.66],[0.62,-0.58],[0.92,-0.36],
        [1.10,-0.08],[1.12,0.10],[1.00,0.32],[0.78,0.50],[0.52,0.62],
        [0.38,0.60],[0.24,0.46],[0.10,0.32],[0.02,0.30]];
    const v3=prof.map(p=>new THREE.Vector3(p[0],p[1],0));
    const curve=new THREE.CatmullRomCurve3(v3,false,'centripetal');
    const pts=[];
    for(let i=0;i<=72;i++){const p=curve.getPoint(i/72);pts.push(new THREE.Vector2(Math.max(0.001,p.x),p.y));}
    appleGeo=new THREE.LatheGeometry(pts,48);
    appleMat=new THREE.MeshPhysicalMaterial({color:0xffd700,metalness:.55,roughness:.22,
        clearcoat:1,clearcoatRoughness:.1,emissive:0xb08000,emissiveIntensity:.9});
    stemGeo=new THREE.CylinderGeometry(0.045,0.075,0.62,10);
    stemMat=new THREE.MeshStandardMaterial({color:0x5c4033,roughness:.85});
    leafGeo=new THREE.SphereGeometry(0.3,12,8);
    leafMat=new THREE.MeshStandardMaterial({color:0x4c9a2a,roughness:.55});
}
export function getAppleMat(){return appleMat;}
export function createApple(){
    initAppleAssets();
    const g=new THREE.Group();
    const body=new THREE.Mesh(appleGeo,appleMat);
    body.scale.set(0.80,1.05,0.80);body.castShadow=true;g.add(body);
    const stem=new THREE.Mesh(stemGeo,stemMat);
    stem.position.set(0.02,0.60,0);stem.rotation.z=0.14;stem.castShadow=true;g.add(stem);
    const leaf=new THREE.Mesh(leafGeo,leafMat);
    leaf.scale.set(1,0.14,0.48);
    leaf.position.set(0.30,0.92,0);leaf.rotation.z=-0.55;leaf.rotation.y=0.35;
    leaf.castShadow=true;g.add(leaf);
    return g;
}
export let orchard=null,orchardLight=null;
export function clearOrchard(){
    if(orchard){scene.remove(orchard);orchard=null;}
    if(orchardLight){scene.remove(orchardLight);orchardLight=null;}
}
export function fitOrchard(){
    if(!orchard)return;
    orchard.scale.setScalar(1);orchard.rotation.y=0;orchard.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(orchard);
    const h=Math.max(0.1,box.max.y-box.min.y);
    const w=Math.max(0.1,box.max.x-box.min.x);
    const portrait=innerHeight>innerWidth;
    const sc=Math.min(1,(portrait?2.1:5.2)/h,(portrait?4.3:7.5)/w);
    orchard.scale.setScalar(sc);
    orchard.position.set(portrait?0:-2.2,(portrait?2.25:-2.75)-box.min.y*sc,portrait?0:0.8);
    if(orchardLight)orchardLight.position.set(portrait?1.4:-1.0,orchard.position.y+2.4,3.0);
}
export function buildOrchard(){
    clearOrchard();
    initAppleAssets();
    const wins=progress.wins||0;
    dom.appleCountEl.textContent=wins;
    appleMat.emissiveIntensity=0.9;
    orchard=new THREE.Group();
    let s=1;while(s*(s+1)*(2*s+1)/6<Math.max(1,wins))s++;
    const sc=0.40,sp=0.84;
    let remaining=wins,y=0.45;
    for(let L=s;L>=1&&remaining>0;L--){
        const cnt=Math.min(remaining,L*L);let placed=0;
        for(let r=0;r<L&&placed<cnt;r++){
            for(let c=0;c<L&&placed<cnt;c++){
                const a=createApple();a.scale.setScalar(sc);
                a.position.set((c-(L-1)/2)*sp+(Math.random()-.5)*0.06,y,(r-(L-1)/2)*sp+(Math.random()-.5)*0.06);
                a.rotation.y=Math.random()*Math.PI*2;
                orchard.add(a);placed++;remaining--;
            }
        }
        y+=0.36;
    }
    const half=(s-1)/2*sp+0.8;
    const plat=new THREE.Mesh(new THREE.CylinderGeometry(half,half+0.25,0.2,40),
        new THREE.MeshStandardMaterial({color:0x3a3a62,roughness:.85,metalness:.1}));
    plat.position.y=0.08;plat.receiveShadow=true;
    orchard.add(plat);
    scene.add(orchard);
    orchardLight=new THREE.PointLight(0xffe9a0,60,0,2);
    scene.add(orchardLight);
    fitOrchard();
}
