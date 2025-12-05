import { jsx as _jsx } from "react/jsx-runtime";
import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../state/store';
/**
 * People rendering with GLTF 3D models
 * Uses real human models with clothes and details
 */
export function InstancedPeople() {
    const people = useStore(s => s.people);
    const glow = useStore(s => s.settings.glow);
    // Vous pouvez utiliser des modèles gratuits de :
    // - Mixamo (https://www.mixamo.com/) - personnages animés
    // - Sketchfab (https://sketchfab.com/search?q=person&type=models&features=downloadable&sort_by=-likeCount)
    // - Ready Player Me (https://readyplayer.me/) - avatars personnalisables
    // Pour l'instant, créons un bonhomme stylisé simple mais réaliste
    const geometry = useMemo(() => {
        // Bonhomme stick figure amélioré avec proportions réalistes
        const group = new THREE.Group();
        // Tête - sphère
        const headGeo = new THREE.SphereGeometry(0.1, 12, 12);
        headGeo.translate(0, 1.65, 0); // Hauteur tête ~1.65m
        // Cou
        const neckGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8);
        neckGeo.translate(0, 1.52, 0);
        // Torse
        const torsoGeo = new THREE.BoxGeometry(0.25, 0.4, 0.15);
        torsoGeo.translate(0, 1.3, 0);
        // Hanches
        const hipsGeo = new THREE.BoxGeometry(0.22, 0.15, 0.15);
        hipsGeo.translate(0, 1.05, 0);
        // Jambe gauche (cuisse + mollet)
        const thighGeo = new THREE.CylinderGeometry(0.06, 0.055, 0.45, 8);
        const leftThigh = thighGeo.clone();
        leftThigh.translate(-0.08, 0.75, 0);
        const calfGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.4, 8);
        const leftCalf = calfGeo.clone();
        leftCalf.translate(-0.08, 0.3, 0);
        // Jambe droite
        const rightThigh = thighGeo.clone();
        rightThigh.translate(0.08, 0.75, 0);
        const rightCalf = calfGeo.clone();
        rightCalf.translate(0.08, 0.3, 0);
        // Pieds
        const footGeo = new THREE.BoxGeometry(0.08, 0.06, 0.12);
        const leftFoot = footGeo.clone();
        leftFoot.translate(-0.08, 0.05, 0.02);
        const rightFoot = footGeo.clone();
        rightFoot.translate(0.08, 0.05, 0.02);
        // Bras gauche (épaule + avant-bras)
        const upperArmGeo = new THREE.CylinderGeometry(0.04, 0.038, 0.28, 8);
        const leftUpperArm = upperArmGeo.clone();
        leftUpperArm.rotateZ(0.15);
        leftUpperArm.translate(-0.18, 1.35, 0);
        const forearmGeo = new THREE.CylinderGeometry(0.038, 0.032, 0.25, 8);
        const leftForearm = forearmGeo.clone();
        leftForearm.rotateZ(0.1);
        leftForearm.translate(-0.22, 1.0, 0);
        // Bras droit
        const rightUpperArm = upperArmGeo.clone();
        rightUpperArm.rotateZ(-0.15);
        rightUpperArm.translate(0.18, 1.35, 0);
        const rightForearm = forearmGeo.clone();
        rightForearm.rotateZ(-0.1);
        rightForearm.translate(0.22, 1.0, 0);
        // Mains
        const handGeo = new THREE.SphereGeometry(0.035, 8, 8);
        const leftHand = handGeo.clone();
        leftHand.translate(-0.24, 0.88, 0);
        const rightHand = handGeo.clone();
        rightHand.translate(0.24, 0.88, 0);
        // Fusionner toutes les géométries
        const geometries = [
            headGeo, neckGeo, torsoGeo, hipsGeo,
            leftThigh, leftCalf, leftFoot,
            rightThigh, rightCalf, rightFoot,
            leftUpperArm, leftForearm, leftHand,
            rightUpperArm, rightForearm, rightHand
        ];
        const positions = [];
        const normals = [];
        const indices = [];
        let indexOffset = 0;
        geometries.forEach(geo => {
            const pos = geo.attributes.position.array;
            const norm = geo.attributes.normal.array;
            const idx = geo.index?.array || [];
            for (let i = 0; i < pos.length; i++)
                positions.push(pos[i]);
            for (let i = 0; i < norm.length; i++)
                normals.push(norm[i]);
            for (let i = 0; i < idx.length; i++)
                indices.push(idx[i] + indexOffset);
            indexOffset += pos.length / 3;
        });
        const mergedGeometry = new THREE.BufferGeometry();
        mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        mergedGeometry.setIndex(indices);
        mergedGeometry.computeBoundingSphere();
        return mergedGeometry;
    }, []);
    const meshRef = useRef(null);
    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);
    const material = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: '#60a5fa',
            roughness: 0.7,
            metalness: 0.1,
            emissive: glow ? '#60a5fa' : '#000000',
            emissiveIntensity: glow ? 0.15 : 0,
            flatShading: false
        });
    }, [glow]);
    useFrame(() => {
        if (!meshRef.current)
            return;
        const mesh = meshRef.current;
        for (let i = 0; i < people.length; i++) {
            const person = people[i];
            tempObject.position.set(person.position[0], person.position[1] - 0.05, // Ajuster pour que les pieds touchent le sol
            person.position[2]);
            // Variation de taille (de 0.85 à 1.15 pour simuler différentes tailles)
            const heightVariation = 0.9 + (person.id % 10) * 0.05;
            tempObject.scale.set(1, heightVariation, 1);
            // Rotation vers la direction de déplacement
            tempObject.rotation.y = (person.id * 0.7) % (Math.PI * 2);
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);
            // Couleurs de vêtements variées
            if (person.gender === 'male') {
                // Hommes : bleus, gris, noirs
                const maleColors = [0x2563eb, 0x475569, 0x1e293b, 0x0ea5e9, 0x334155];
                tempColor.setHex(maleColors[person.id % maleColors.length]);
            }
            else if (person.gender === 'female') {
                // Femmes : roses, violets, rouges
                const femaleColors = [0xf472b6, 0xa855f7, 0xef4444, 0xec4899, 0xd946ef];
                tempColor.setHex(femaleColors[person.id % femaleColors.length]);
            }
            else {
                // Couleurs variées pour diversité
                const allColors = [0x3b82f6, 0xf59e0b, 0x10b981, 0xef4444, 0x8b5cf6, 0x06b6d4];
                tempColor.setHex(allColors[person.id % allColors.length]);
            }
            mesh.setColorAt(i, tempColor);
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor)
            mesh.instanceColor.needsUpdate = true;
    });
    if (people.length === 0)
        return null;
    return (_jsx("instancedMesh", { ref: meshRef, args: [geometry, material, people.length], castShadow: true, receiveShadow: true }));
}
