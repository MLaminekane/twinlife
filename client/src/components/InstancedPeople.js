import { jsx as _jsx } from "react/jsx-runtime";
import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../state/store';
/**
 * Rendu optimisé des personnes avec InstancedMesh et modèles 3D humanoïdes
 * Affiche des silhouettes humaines réalistes avec des proportions correctes
 */
export function InstancedPeople() {
    const people = useStore(s => s.people);
    const glow = useStore(s => s.settings.glow);
    const meshRef = useRef(null);
    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);
    // Créer la géométrie humanoïde réaliste avec proportions correctes
    const geometry = useMemo(() => {
        // Bonhomme réduit (hauteur ~0.5m pour être à l'échelle des bâtiments)
        const scale = 0.3; // Facteur d'échelle pour réduire la taille
        // Tête - sphère
        const headGeo = new THREE.SphereGeometry(0.1 * scale, 12, 12);
        headGeo.translate(0, 1.65 * scale, 0);
        // Cou
        const neckGeo = new THREE.CylinderGeometry(0.04 * scale, 0.04 * scale, 0.08 * scale, 8);
        neckGeo.translate(0, 1.52 * scale, 0);
        // Torse (chemise/t-shirt)
        const torsoGeo = new THREE.BoxGeometry(0.25 * scale, 0.4 * scale, 0.15 * scale);
        torsoGeo.translate(0, 1.3 * scale, 0);
        // Hanches (pantalon)
        const hipsGeo = new THREE.BoxGeometry(0.22 * scale, 0.15 * scale, 0.15 * scale);
        hipsGeo.translate(0, 1.05 * scale, 0);
        // Jambes (cuisses + mollets)
        const thighGeo = new THREE.CylinderGeometry(0.06 * scale, 0.055 * scale, 0.45 * scale, 8);
        const leftThigh = thighGeo.clone();
        leftThigh.translate(-0.08 * scale, 0.75 * scale, 0);
        const rightThigh = thighGeo.clone();
        rightThigh.translate(0.08 * scale, 0.75 * scale, 0);
        const calfGeo = new THREE.CylinderGeometry(0.055 * scale, 0.045 * scale, 0.4 * scale, 8);
        const leftCalf = calfGeo.clone();
        leftCalf.translate(-0.08 * scale, 0.3 * scale, 0);
        const rightCalf = calfGeo.clone();
        rightCalf.translate(0.08 * scale, 0.3 * scale, 0);
        // Pieds (chaussures)
        const footGeo = new THREE.BoxGeometry(0.08 * scale, 0.06 * scale, 0.12 * scale);
        const leftFoot = footGeo.clone();
        leftFoot.translate(-0.08 * scale, 0.05 * scale, 0.02 * scale);
        const rightFoot = footGeo.clone();
        rightFoot.translate(0.08 * scale, 0.05 * scale, 0.02 * scale);
        // Bras (épaules + avant-bras)
        const upperArmGeo = new THREE.CylinderGeometry(0.04 * scale, 0.038 * scale, 0.28 * scale, 8);
        const leftUpperArm = upperArmGeo.clone();
        leftUpperArm.rotateZ(0.15);
        leftUpperArm.translate(-0.18 * scale, 1.35 * scale, 0);
        const rightUpperArm = upperArmGeo.clone();
        rightUpperArm.rotateZ(-0.15);
        rightUpperArm.translate(0.18 * scale, 1.35 * scale, 0);
        const forearmGeo = new THREE.CylinderGeometry(0.038 * scale, 0.032 * scale, 0.25 * scale, 8);
        const leftForearm = forearmGeo.clone();
        leftForearm.rotateZ(0.1);
        leftForearm.translate(-0.22 * scale, 1.0 * scale, 0);
        const rightForearm = forearmGeo.clone();
        rightForearm.rotateZ(-0.1);
        rightForearm.translate(0.22 * scale, 1.0 * scale, 0);
        // Mains (peau)
        const handGeo = new THREE.SphereGeometry(0.035 * scale, 8, 8);
        const leftHand = handGeo.clone();
        leftHand.translate(-0.24 * scale, 0.88 * scale, 0);
        const rightHand = handGeo.clone();
        rightHand.translate(0.24 * scale, 0.88 * scale, 0);
        // Grouper par matériau pour gérer les couleurs séparément
        // PEAU : tête + cou + mains
        const skinGeometries = [headGeo, neckGeo, leftHand, rightHand];
        // VÊTEMENTS HAUT : torse + bras
        const topGeometries = [torsoGeo, leftUpperArm, rightUpperArm, leftForearm, rightForearm];
        // VÊTEMENTS BAS : hanches + jambes + pieds
        const bottomGeometries = [hipsGeo, leftThigh, rightThigh, leftCalf, rightCalf, leftFoot, rightFoot];
        const allGeometries = [...skinGeometries, ...topGeometries, ...bottomGeometries];
        const positions = [];
        const normals = [];
        const indices = [];
        const colors = []; // Stocker les couleurs par vertex
        let indexOffset = 0;
        // Couleurs par défaut (seront modifiées par instance)
        const skinColor = new THREE.Color(0xffdbac); // Couleur de peau
        const topColor = new THREE.Color(0x3b82f6); // Bleu pour le haut (chemise/t-shirt)
        const bottomColor = new THREE.Color(0x1e293b); // Gris foncé pour le bas (pantalon)
        allGeometries.forEach((geo, idx) => {
            const pos = geo.attributes.position.array;
            const norm = geo.attributes.normal.array;
            const geoIndices = geo.index?.array || [];
            // Déterminer la couleur de base selon le groupe
            let baseColor;
            if (idx < skinGeometries.length) {
                baseColor = skinColor;
            }
            else if (idx < skinGeometries.length + topGeometries.length) {
                baseColor = topColor;
            }
            else {
                baseColor = bottomColor;
            }
            for (let i = 0; i < pos.length; i++)
                positions.push(pos[i]);
            for (let i = 0; i < norm.length; i++)
                normals.push(norm[i]);
            // Ajouter les couleurs pour chaque vertex
            for (let i = 0; i < pos.length / 3; i++) {
                colors.push(baseColor.r, baseColor.g, baseColor.b);
            }
            for (let i = 0; i < geoIndices.length; i++) {
                indices.push(geoIndices[i] + indexOffset);
            }
            indexOffset += pos.length / 3;
        });
        const mergedGeometry = new THREE.BufferGeometry();
        mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        mergedGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        mergedGeometry.setIndex(indices);
        mergedGeometry.computeBoundingSphere();
        return mergedGeometry;
    }, []);
    // Créer le matériau avec couleurs de vertices pour la peau et les vêtements
    const material = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            vertexColors: true, // Utiliser les couleurs des vertices
            roughness: 0.8,
            metalness: 0.0,
            emissive: glow ? '#60a5fa' : '#000000',
            emissiveIntensity: glow ? 0.1 : 0,
            flatShading: false
        });
    }, [glow]);
    // Mettre à jour le matériau quand le paramètre glow change
    useFrame(() => {
        if (meshRef.current) {
            const mat = meshRef.current.material;
            if (glow) {
                mat.emissive.setHex(0x60a5fa);
                mat.emissiveIntensity = 0.3;
                mat.opacity = 0.95;
            }
            else {
                mat.emissive.setHex(0x000000);
                mat.emissiveIntensity = 0;
                mat.opacity = 0.85;
            }
        }
    });
    // Mettre à jour les matrices d'instance à chaque frame selon les positions des personnes
    useFrame(() => {
        if (!meshRef.current)
            return;
        const mesh = meshRef.current;
        for (let i = 0; i < people.length; i++) {
            const person = people[i];
            // Position (pieds au niveau du sol)
            tempObject.position.set(person.position[0], person.position[1], person.position[2]);
            // Variation de taille réaliste (déjà réduits, juste une petite variation)
            const heightVariation = 0.95 + (person.id % 10) * 0.02;
            tempObject.scale.set(1, heightVariation, 1);
            // Rotation aléatoire
            tempObject.rotation.y = (person.id * 0.7) % (Math.PI * 2);
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
    });
    // Ne rien afficher s'il n'y a personne
    if (people.length === 0)
        return null;
    return (_jsx("instancedMesh", { ref: meshRef, args: [geometry, material, people.length], castShadow: true, receiveShadow: true }));
}
